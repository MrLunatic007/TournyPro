// Helper functions for tournament management

interface Participant {
  id: string
  name: string
}

interface Match {
  id: string
  round: number
  position: number
  participant1?: Participant
  participant2?: Participant
  winner?: Participant
}

// Generate bracket matches for a tournament
export function generateBracket(participants: Participant[]): Match[] {
  const matches: Match[] = []
  const participantCount = participants.length

  // Validate participant count (must be a power of 2)
  if (participantCount & (participantCount - 1)) {
    throw new Error("Participant count must be a power of 2 (2, 4, 8, 16, etc.)")
  }

  // Calculate number of rounds
  const rounds = Math.log2(participantCount)

  // Generate first round matches
  for (let i = 0; i < participantCount / 2; i++) {
    matches.push({
      id: `m${matches.length + 1}`,
      round: 1,
      position: i + 1,
      participant1: participants[i * 2],
      participant2: participants[i * 2 + 1],
    })
  }

  // Generate subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = participantCount / Math.pow(2, round)

    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `m${matches.length + 1}`,
        round,
        position: i + 1,
      })
    }
  }

  return matches
}

// Update bracket after a match result
export function updateBracket(matches: Match[], matchId: string, winnerId: string): Match[] {
  const updatedMatches = [...matches]

  // Find the match to update
  const matchIndex = updatedMatches.findIndex((m) => m.id === matchId)

  if (matchIndex === -1) {
    throw new Error("Match not found")
  }

  const match = updatedMatches[matchIndex]

  // Find the winner
  const winner =
    match.participant1?.id === winnerId
      ? match.participant1
      : match.participant2?.id === winnerId
        ? match.participant2
        : undefined

  if (!winner) {
    throw new Error("Winner not found among match participants")
  }

  // Update the match with the winner
  updatedMatches[matchIndex] = {
    ...match,
    winner,
  }

  // Find the next match where this winner should advance
  const nextRound = match.round + 1
  const nextPosition = Math.ceil(match.position / 2)

  const nextMatchIndex = updatedMatches.findIndex((m) => m.round === nextRound && m.position === nextPosition)

  if (nextMatchIndex !== -1) {
    const nextMatch = updatedMatches[nextMatchIndex]

    // Determine if this winner should be participant1 or participant2
    if (match.position % 2 === 1) {
      // Odd positions go to participant1
      updatedMatches[nextMatchIndex] = {
        ...nextMatch,
        participant1: winner,
      }
    } else {
      // Even positions go to participant2
      updatedMatches[nextMatchIndex] = {
        ...nextMatch,
        participant2: winner,
      }
    }
  }

  return updatedMatches
}

