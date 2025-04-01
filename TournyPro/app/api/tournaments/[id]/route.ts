import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Define the interface for the match object from the database query
interface MatchRow {
  id: string
  round: number
  position: number
  winner_id: string | null
  participant1_id: string | null
  participant1_name: string | null
  participant2_id: string | null
  participant2_name: string | null
}

// Define the interface for the formatted match
interface FormattedMatch {
  id: string
  round: number
  position: number
  participant1?: {
    id: string
    name: string
  }
  participant2?: {
    id: string
    name: string
  }
  winner?: {
    id: string
    name: string
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    const tournamentId = params.id

    // Get tournament details
    const [tournaments] = await pool.query("SELECT * FROM tournaments WHERE id = ? AND created_by = ?", [
      tournamentId,
      userId,
    ])

    if ((tournaments as any[]).length === 0) {
      return NextResponse.json({ success: false, message: "Tournament not found" }, { status: 404 })
    }

    const tournament = (tournaments as any[])[0]

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
    const formattedMatches = (matches as MatchRow[]).map(
      (match: MatchRow): FormattedMatch => ({
        id: match.id,
        round: match.round,
        position: match.position,
        participant1: match.participant1_id
          ? {
              id: match.participant1_id,
              name: match.participant1_name!,
            }
          : undefined,
        participant2: match.participant2_id
          ? {
              id: match.participant2_id,
              name: match.participant2_name!,
            }
          : undefined,
        winner: match.winner_id
          ? match.winner_id === match.participant1_id
            ? {
                id: match.participant1_id,
                name: match.participant1_name!,
              }
            : {
                id: match.participant2_id!,
                name: match.participant2_name!,
              }
          : undefined,
      }),
    )

    return NextResponse.json({
      success: true,
      tournament: {
        ...tournament,
        participants,
        matches: formattedMatches,
      },
    })
  } catch (error) {
    console.error(`Error fetching tournament ${params.id}:`, error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tournament",
      },
      { status: 500 },
    )
  }
}

