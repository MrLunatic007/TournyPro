const express = require("express")
const cors = require("cors")
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tournament_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token is required" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret", (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" })
    }
    req.user = user
    next()
  })
}

// Routes

// User Registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" })
    }

    // Check if user already exists
    const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: "User with this email already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user into database
    const [result] = await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
      name,
      email,
      hashedPassword,
    ])

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.insertId,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ success: false, message: "Server error during registration" })
  }
})

// User Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" })
    }

    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    const user = users[0]

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "24h" },
    )

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ success: false, message: "Server error during login" })
  }
})

// Get user profile
app.get("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const [users] = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = ?", [userId])

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    res.json({
      success: true,
      user: users[0],
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Create Tournament
app.post("/api/tournaments", authenticateToken, async (req, res) => {
  try {
    const { name, date, participantCount, participants } = req.body
    const userId = req.user.id

    // Validate input
    if (!name || !date || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ success: false, message: "Invalid tournament data" })
    }

    // Start a transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Create tournament
      const [tournamentResult] = await connection.query(
        "INSERT INTO tournaments (name, date, status, created_by) VALUES (?, ?, ?, ?)",
        [name, date, "upcoming", userId],
      )

      const tournamentId = tournamentResult.insertId

      // Add participants
      for (const participant of participants) {
        await connection.query("INSERT INTO participants (name, tournament_id) VALUES (?, ?)", [
          participant,
          tournamentId,
        ])
      }

      // Generate matches based on participant count
      await generateBracket(connection, tournamentId, participants.length)

      // Commit transaction
      await connection.commit()

      res.status(201).json({
        success: true,
        message: "Tournament created successfully",
        tournamentId,
      })
    } catch (error) {
      // Rollback on error
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error creating tournament:", error)
    res.status(500).json({ success: false, message: "Server error creating tournament" })
  }
})

// Helper function to generate tournament bracket
async function generateBracket(connection, tournamentId, participantCount) {
  // Get all participants for this tournament
  const [participants] = await connection.query(
    "SELECT id, name FROM participants WHERE tournament_id = ? ORDER BY id",
    [tournamentId],
  )

  // Calculate number of rounds
  const rounds = Math.ceil(Math.log2(participantCount))

  // Generate first round matches
  for (let i = 0; i < Math.floor(participantCount / 2); i++) {
    const participant1Id = participants[i * 2]?.id || null
    const participant2Id = participants[i * 2 + 1]?.id || null

    await connection.query(
      "INSERT INTO matches (tournament_id, round, position, participant1_id, participant2_id) VALUES (?, ?, ?, ?, ?)",
      [tournamentId, 1, i + 1, participant1Id, participant2Id],
    )
  }

  // Generate subsequent rounds (empty matches)
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.floor(participantCount / Math.pow(2, round))

    for (let i = 0; i < matchesInRound; i++) {
      await connection.query("INSERT INTO matches (tournament_id, round, position) VALUES (?, ?, ?)", [
        tournamentId,
        round,
        i + 1,
      ])
    }
  }
}

// Get all tournaments
app.get("/api/tournaments", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const [tournaments] = await pool.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM participants WHERE tournament_id = t.id) as participant_count
      FROM tournaments t
      WHERE t.created_by = ?
      ORDER BY t.date DESC`,
      [userId],
    )

    res.json({ success: true, tournaments })
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    res.status(500).json({ success: false, message: "Server error fetching tournaments" })
  }
})

// Get tournament by ID
app.get("/api/tournaments/:id", authenticateToken, async (req, res) => {
  try {
    const tournamentId = req.params.id
    const userId = req.user.id

    // Get tournament details
    const [tournaments] = await pool.query("SELECT * FROM tournaments WHERE id = ? AND created_by = ?", [
      tournamentId,
      userId,
    ])

    if (tournaments.length === 0) {
      return res.status(404).json({ success: false, message: "Tournament not found" })
    }

    const tournament = tournaments[0]

    // Get participants
    const [participants] = await pool.query("SELECT id, name FROM participants WHERE tournament_id = ?", [tournamentId])

    // Get matches
    const [matches] = await pool.query(
      `SELECT m.id, m.round, m.position, m.winner_id,
        p1.id as participant1_id, p1.name as participant1_name,
        p2.id as participant2_id, p2.name as participant2_name
      FROM matches m
      LEFT JOIN participants p1 ON m.participant1_id = p1.id
      LEFT JOIN participants p2 ON m.participant2_id = p2.id
      WHERE m.tournament_id = ?
      ORDER BY m.round, m.position`,
      [tournamentId],
    )

    // Format matches for frontend
    const formattedMatches = matches.map((match) => ({
      id: match.id,
      round: match.round,
      position: match.position,
      participant1: match.participant1_id
        ? {
            id: match.participant1_id,
            name: match.participant1_name,
          }
        : undefined,
      participant2: match.participant2_id
        ? {
            id: match.participant2_id,
            name: match.participant2_name,
          }
        : undefined,
      winner: match.winner_id
        ? match.winner_id === match.participant1_id
          ? {
              id: match.participant1_id,
              name: match.participant1_name,
            }
          : {
              id: match.participant2_id,
              name: match.participant2_name,
            }
        : undefined,
    }))

    res.json({
      success: true,
      tournament: {
        ...tournament,
        participants,
        matches: formattedMatches,
      },
    })
  } catch (error) {
    console.error("Error fetching tournament:", error)
    res.status(500).json({ success: false, message: "Server error fetching tournament" })
  }
})

// Update match result
app.put("/api/tournaments/:id/matches/:matchId", authenticateToken, async (req, res) => {
  try {
    const { id: tournamentId, matchId } = req.params
    const { winnerId } = req.body
    const userId = req.user.id

    // Verify tournament ownership
    const [tournaments] = await pool.query("SELECT * FROM tournaments WHERE id = ? AND created_by = ?", [
      tournamentId,
      userId,
    ])

    if (tournaments.length === 0) {
      return res.status(404).json({ success: false, message: "Tournament not found" })
    }

    // Start a transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Update match with winner
      const [updateResult] = await connection.query(
        "UPDATE matches SET winner_id = ? WHERE id = ? AND tournament_id = ?",
        [winnerId, matchId, tournamentId],
      )

      if (updateResult.affectedRows === 0) {
        await connection.rollback()
        return res.status(404).json({ success: false, message: "Match not found" })
      }

      // Get updated match info
      const [matches] = await connection.query(
        `SELECT id, round, position, participant1_id, participant2_id, winner_id 
        FROM matches WHERE id = ?`,
        [matchId],
      )

      if (matches.length === 0) {
        await connection.rollback()
        return res.status(404).json({ success: false, message: "Match not found after update" })
      }

      const match = matches[0]

      // Find the next match where this winner should advance
      const nextRound = match.round + 1
      const nextPosition = Math.ceil(match.position / 2)

      // Check if there's a next match
      const [nextMatches] = await connection.query(
        `SELECT id FROM matches 
        WHERE tournament_id = ? AND round = ? AND position = ?`,
        [tournamentId, nextRound, nextPosition],
      )

      if (nextMatches.length > 0) {
        const nextMatchId = nextMatches[0].id

        // Determine if this winner should be participant1 or participant2
        if (match.position % 2 === 1) {
          // Odd positions go to participant1
          await connection.query("UPDATE matches SET participant1_id = ? WHERE id = ?", [winnerId, nextMatchId])
        } else {
          // Even positions go to participant2
          await connection.query("UPDATE matches SET participant2_id = ? WHERE id = ?", [winnerId, nextMatchId])
        }
      }

      // If this was the final match, update tournament status
      if (match.round === Math.ceil(Math.log2(tournaments[0].participant_count)) && winnerId) {
        await connection.query("UPDATE tournaments SET status = ? WHERE id = ?", ["completed", tournamentId])

        // Update player stats
        await updatePlayerStats(connection, winnerId)
      }

      // Commit transaction
      await connection.commit()

      res.json({
        success: true,
        message: "Match updated successfully",
      })
    } catch (error) {
      // Rollback on error
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error updating match:", error)
    res.status(500).json({ success: false, message: "Server error updating match" })
  }
})

// Helper function to update player stats
async function updatePlayerStats(connection, winnerId) {
  // In a real application, you would update player statistics here
  // For example, increment wins count, update tournament wins, etc.
  console.log(`Updating stats for player ${winnerId}`)
}

// Get leaderboard
app.get("/api/leaderboard", authenticateToken, async (req, res) => {
  try {
    // In a real application, you would calculate this from match results
    // For now, we'll return mock data
    const [participants] = await pool.query(
      `SELECT p.id, p.name,
        COUNT(DISTINCT t.id) as tournaments_played,
        SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) as wins,
        COUNT(m.id) - SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN m.round = (SELECT MAX(round) FROM matches WHERE tournament_id = t.id) 
                AND m.winner_id = p.id THEN 1 ELSE 0 END) as tournaments_won
      FROM participants p
      JOIN tournaments t ON p.tournament_id = t.id
      LEFT JOIN matches m ON (m.participant1_id = p.id OR m.participant2_id = p.id) AND m.tournament_id = t.id
      WHERE t.created_by = ?
      GROUP BY p.id
      ORDER BY wins DESC, tournaments_won DESC
      LIMIT 10`,
      [req.user.id],
    )

    // Format for frontend
    const leaderboard = participants.map((p, index) => ({
      id: p.id,
      rank: index + 1,
      name: p.name,
      wins: p.wins || 0,
      losses: p.losses || 0,
      tournamentsPlayed: p.tournaments_played || 0,
      tournamentsWon: p.tournaments_won || 0,
    }))

    res.json({ success: true, leaderboard })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    res.status(500).json({ success: false, message: "Server error fetching leaderboard" })
  }
})

// Get archived tournaments
app.get("/api/tournaments/archived", authenticateToken, async (req, res) => {
  try {
    const [tournaments] = await pool.query(
      `SELECT t.id, t.name, t.date, 
        (SELECT COUNT(*) FROM participants WHERE tournament_id = t.id) as participants,
        (SELECT p.name FROM participants p 
          JOIN matches m ON (m.winner_id = p.id) 
          WHERE m.tournament_id = t.id 
          AND m.round = (SELECT MAX(round) FROM matches WHERE tournament_id = t.id)
          LIMIT 1) as winner,
        (SELECT p.name FROM participants p 
          JOIN matches m ON ((m.participant1_id = p.id OR m.participant2_id = p.id) AND p.id != m.winner_id) 
          WHERE m.tournament_id = t.id 
          AND m.round = (SELECT MAX(round) FROM matches WHERE tournament_id = t.id)
          LIMIT 1) as runner_up
      FROM tournaments t
      WHERE t.status = 'completed' AND t.created_by = ?
      ORDER BY t.date DESC`,
      [req.user.id],
    )

    // Format for frontend
    const archivedTournaments = tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      date: t.date,
      participants: t.participants,
      winner: t.winner || "Unknown",
      runnerUp: t.runner_up || "Unknown",
    }))

    res.json({ success: true, archivedTournaments })
  } catch (error) {
    console.error("Error fetching archived tournaments:", error)
    res.status(500).json({ success: false, message: "Server error fetching archived tournaments" })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

