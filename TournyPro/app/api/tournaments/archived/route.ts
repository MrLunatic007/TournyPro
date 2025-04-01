import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

interface ArchivedTournament {
  id: string
  name: string
  date: string
  participants: number
  winner: string | null
  runner_up: string | null
}

interface FormattedArchivedTournament {
  id: string
  name: string
  date: string
  participants: number
  winner: string
  runnerUp: string
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

    // Modified query to correctly fetch completed tournaments
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
      [userId],
    )

    // Format for frontend
    const archivedTournaments = (tournaments as ArchivedTournament[]).map(
      (t: ArchivedTournament): FormattedArchivedTournament => ({
        id: t.id,
        name: t.name,
        date: t.date,
        participants: t.participants,
        winner: t.winner || "Unknown",
        runnerUp: t.runner_up || "Unknown",
      }),
    )

    return NextResponse.json({ success: true, archivedTournaments })
  } catch (error) {
    console.error("Error fetching archived tournaments:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch archived tournaments",
      },
      { status: 500 },
    )
  }
}

