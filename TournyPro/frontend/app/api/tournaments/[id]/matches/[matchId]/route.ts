import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string; matchId: string } }) {
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
    const { id: tournamentId, matchId } = params
    const { winnerId } = await request.json()

    // Verify tournament ownership
    const [tournaments] = await pool.query("SELECT * FROM tournaments WHERE id = ? AND created_by = ?", [
      tournamentId,
      userId,
    ])

    if ((tournaments as any[]).length === 0) {
      return NextResponse.json({ success: false, message: "Tournament not found" }, { status: 404 })
    }

    const tournament = (tournaments as any[])[0]

    // Start a transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Update match with winner
      const [updateResult] = await connection.query(
        "UPDATE matches SET winner_id = ? WHERE id = ? AND tournament_id = ?",
        [winnerId, matchId, tournamentId],
      )

      if ((updateResult as any).affectedRows === 0) {
        await connection.rollback()
        return NextResponse.json({ success: false, message: "Match not found" }, { status: 404 })
      }

      // Get updated match info
      const [matches] = await connection.query(
        `SELECT id, round, position, participant1_id, participant2_id, winner_id 
        FROM matches WHERE id = ?`,
        [matchId],
      )

      if ((matches as any[]).length === 0) {
        await connection.rollback()
        return NextResponse.json({ success: false, message: "Match not found after update" }, { status: 404 })
      }

      const match = (matches as any[])[0]

      // Find the next match where this winner should advance
      const nextRound = match.round + 1
      const nextPosition = Math.ceil(match.position / 2)

      // Check if there's a next match
      const [nextMatches] = await connection.query(
        `SELECT id FROM matches 
        WHERE tournament_id = ? AND round = ? AND position = ?`,
        [tournamentId, nextRound, nextPosition],
      )

      if ((nextMatches as any[]).length > 0) {
        const nextMatchId = (nextMatches as any[])[0].id

        // Determine if this winner should be participant1 or participant2
        if (match.position % 2 === 1) {
          // Odd positions go to participant1
          await connection.query("UPDATE matches SET participant1_id = ? WHERE id = ?", [winnerId, nextMatchId])
        } else {
          // Even positions go to participant2
          await connection.query("UPDATE matches SET participant2_id = ? WHERE id = ?", [winnerId, nextMatchId])
        }
      }

      // Get the maximum round number for this tournament
      const [maxRoundResult] = await connection.query(
        "SELECT MAX(round) as max_round FROM matches WHERE tournament_id = ?",
        [tournamentId],
      )
      const maxRound = (maxRoundResult as any[])[0].max_round

      // Update tournament status
      if (tournament.status === "upcoming") {
        // Set to in-progress when first match is updated
        await connection.query("UPDATE tournaments SET status = ? WHERE id = ?", ["in-progress", tournamentId])
      } else if (match.round === maxRound && winnerId) {
        // Set to completed when final match has a winner
        await connection.query("UPDATE tournaments SET status = ? WHERE id = ?", ["completed", tournamentId])
      }

      // Commit transaction
      await connection.commit()

      return NextResponse.json({
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
    console.error(`Error updating match ${params.matchId}:`, error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update match",
      },
      { status: 500 },
    )
  }
}

