import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

interface Tournament {
  id: string
  name: string
  date: string
  status: string
  participant_count: number
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: authResult.message || "Unauthorized" },
        { status: authResult.status || 401 },
      )
    }

    const userId = authResult.user.id

    const [tournaments] = await pool.query(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM participants WHERE tournament_id = t.id) as participant_count
      FROM tournaments t
      WHERE t.created_by = ?
      ORDER BY t.date DESC`,
      [userId],
    )

    return NextResponse.json({ success: true, tournaments })
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tournaments",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: authResult.message || "Unauthorized" },
        { status: authResult.status || 401 },
      )
    }

    const userId = authResult.user.id
    const { name, date, participantCount, participants } = await request.json()

    // Validate input
    if (!name || !date || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ success: false, message: "Invalid tournament data" }, { status: 400 })
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

      const tournamentId = (tournamentResult as any).insertId

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

      return NextResponse.json(
        {
          success: true,
          message: "Tournament created successfully",
          tournamentId,
        },
        { status: 201 },
      )
    } catch (error) {
      // Rollback on error
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Server error creating tournament",
      },
      { status: 500 },
    )
  }
}

// Helper function to generate tournament bracket
async function generateBracket(connection: any, tournamentId: number, participantCount: number) {
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

