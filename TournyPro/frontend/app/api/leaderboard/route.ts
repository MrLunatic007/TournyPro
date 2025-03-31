import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Define the interface for the participant row from the database query
interface ParticipantRow {
  id: string
  name: string
  tournaments_played: number | null
  wins: number | null
  losses: number | null
  tournaments_won: number | null
}

// Define the interface for the formatted leaderboard entry
interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  wins: number
  losses: number
  tournamentsPlayed: number
  tournamentsWon: number
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

    // Modified query to correctly count tournaments played
    const [participants] = await pool.query(
      `SELECT 
        p.id, 
        p.name,
        COUNT(DISTINCT t.id) as tournaments_played,
        SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN (m.participant1_id = p.id OR m.participant2_id = p.id) AND 
                     (m.winner_id IS NOT NULL AND m.winner_id != p.id) 
                THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN m.round = (SELECT MAX(round) FROM matches WHERE tournament_id = t.id) 
                AND m.winner_id = p.id THEN 1 ELSE 0 END) as tournaments_won
      FROM participants p
      JOIN tournaments t ON p.tournament_id = t.id
      LEFT JOIN matches m ON (m.participant1_id = p.id OR m.participant2_id = p.id) AND m.tournament_id = t.id
      WHERE t.created_by = ?
      GROUP BY p.id, p.name
      ORDER BY wins DESC, tournaments_won DESC
      LIMIT 10`,
      [userId],
    )

    // Format for frontend
    const leaderboard = (participants as ParticipantRow[]).map(
      (p: ParticipantRow, index: number): LeaderboardEntry => ({
        id: p.id,
        rank: index + 1,
        name: p.name,
        wins: p.wins || 0,
        losses: p.losses || 0,
        tournamentsPlayed: p.tournaments_played || 0,
        tournamentsWon: p.tournaments_won || 0,
      }),
    )

    return NextResponse.json({ success: true, leaderboard })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leaderboard",
      },
      { status: 500 },
    )
  }
}

