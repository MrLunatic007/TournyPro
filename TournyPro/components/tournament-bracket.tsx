"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  name: string
  points?: number
}

interface Match {
  id: string
  round: number
  position: number
  participant1?: Participant
  participant2?: Participant
  winner?: Participant
}

interface TournamentBracketProps {
  matches: Match[]
  onUpdateMatch?: (matchId: string, winnerId: string) => void
}

export default function TournamentBracket({ matches, onUpdateMatch }: TournamentBracketProps) {
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null)
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<Participant[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Group matches by round
  const roundMatches: Record<number, Match[]> = {}
  let maxRound = 0

  matches.forEach((match) => {
    if (!roundMatches[match.round]) {
      roundMatches[match.round] = []
    }
    roundMatches[match.round].push(match)
    maxRound = Math.max(maxRound, match.round)
  })

  // Sort matches within each round by position
  Object.keys(roundMatches).forEach((roundKey) => {
    const round = Number.parseInt(roundKey)
    roundMatches[round].sort((a, b) => a.position - b.position)
  })

  // Calculate points for each participant
  useEffect(() => {
    const participantsMap = new Map<string, Participant>()

    matches.forEach((match) => {
      if (match.participant1) {
        const participant = participantsMap.get(match.participant1.id) || {
          ...match.participant1,
          points: 0,
        }
        participantsMap.set(match.participant1.id, participant)
      }

      if (match.participant2) {
        const participant = participantsMap.get(match.participant2.id) || {
          ...match.participant2,
          points: 0,
        }
        participantsMap.set(match.participant2.id, participant)
      }

      if (match.winner) {
        const participant = participantsMap.get(match.winner.id) || {
          ...match.winner,
          points: 0,
        }
        // Award 100 points per win
        participant.points = (participant.points || 0) + 100
        participantsMap.set(match.winner.id, participant)
      }
    })

    // Convert map to array and sort by points
    const leaderboardArray = Array.from(participantsMap.values()).sort((a, b) => (b.points || 0) - (a.points || 0))

    setLeaderboard(leaderboardArray)
  }, [matches])

  const handleSelectWinner = (matchId: string, participantId: string) => {
    if (onUpdateMatch) {
      onUpdateMatch(matchId, participantId)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 overflow-x-auto bg-black p-6 rounded-lg">
        <div className="flex min-w-[800px]">
          {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => (
            <div key={round} className={cn("flex-1 flex flex-col", round < maxRound && "mr-8")}>
              <div className="text-center font-medium mb-4 text-white">
                {round === 1 ? "First Round" : round === maxRound ? "Final" : `Round ${round}`}
              </div>
              <div className="flex-1 flex flex-col justify-around">
                {roundMatches[round]?.map((match) => {
                  const isMatchHovered = hoveredMatch === match.id
                  const canSelectWinner = !!onUpdateMatch && match.participant1 && match.participant2

                  return (
                    <div
                      key={match.id}
                      className={cn("relative mb-8 last:mb-0", round > 1 && "mt-16 first:mt-0")}
                      onMouseEnter={() => setHoveredMatch(match.id)}
                      onMouseLeave={() => setHoveredMatch(null)}
                    >
                      <Card className="p-3 border bg-gray-800 border-gray-700 relative">
                        <div className="flex flex-col space-y-2">
                          <div
                            className={cn(
                              "flex justify-between items-center p-2 rounded transition-all",
                              match.winner?.id === match.participant1?.id && "bg-gray-700",
                              canSelectWinner && "cursor-pointer hover:bg-gray-700",
                              hoveredParticipant === match.participant1?.id && "bg-gray-700",
                            )}
                            onMouseEnter={() => setHoveredParticipant(match.participant1?.id || null)}
                            onMouseLeave={() => setHoveredParticipant(null)}
                            onClick={() =>
                              match.participant1 &&
                              canSelectWinner &&
                              handleSelectWinner(match.id, match.participant1.id)
                            }
                          >
                            <div className="flex flex-col">
                              <span
                                className={cn(
                                  "font-medium text-white",
                                  match.winner?.id === match.participant1?.id && "font-bold",
                                )}
                              >
                                {match.participant1?.name || "TBD"}
                              </span>
                              {match.participant1?.points && (
                                <span className="text-xs text-gray-400">{match.participant1.points} pts</span>
                              )}
                            </div>

                            {hoveredParticipant === match.participant1?.id && canSelectWinner && match.participant1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs bg-transparent border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (match.participant1) {
                                    handleSelectWinner(match.id, match.participant1.id)
                                  }
                                }}
                              >
                                Advance
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center">
                            <div className="flex-1 border-t border-dashed border-gray-600"></div>
                            <span
                              className={cn(
                                "px-2 text-xs",
                                round === maxRound ? "text-red-500 font-bold" : "text-gray-400",
                              )}
                            >
                              {round === maxRound ? "VS" : "vs"}
                            </span>
                            <div className="flex-1 border-t border-dashed border-gray-600"></div>
                          </div>

                          <div
                            className={cn(
                              "flex justify-between items-center p-2 rounded transition-all",
                              match.winner?.id === match.participant2?.id && "bg-gray-700",
                              canSelectWinner && "cursor-pointer hover:bg-gray-700",
                              hoveredParticipant === match.participant2?.id && "bg-gray-700",
                            )}
                            onMouseEnter={() => setHoveredParticipant(match.participant2?.id || null)}
                            onMouseLeave={() => setHoveredParticipant(null)}
                            onClick={() =>
                              match.participant2 &&
                              canSelectWinner &&
                              handleSelectWinner(match.id, match.participant2.id)
                            }
                          >
                            <div className="flex flex-col">
                              <span
                                className={cn(
                                  "font-medium text-white",
                                  match.winner?.id === match.participant2?.id && "font-bold",
                                )}
                              >
                                {match.participant2?.name || "TBD"}
                              </span>
                              {match.participant2?.points && (
                                <span className="text-xs text-gray-400">{match.participant2.points} pts</span>
                              )}
                            </div>

                            {hoveredParticipant === match.participant2?.id && canSelectWinner && match.participant2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs bg-transparent border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (match.participant2) {
                                    handleSelectWinner(match.id, match.participant2.id)
                                  }
                                }}
                              >
                                Advance
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>

                      {/* Connector lines for next round */}
                      {round < maxRound && (
                        <div className="absolute top-1/2 right-0 w-8 h-px bg-gray-600 -translate-y-1/2"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="lg:w-80">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Leaderboard</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="lg:hidden"
            >
              {showLeaderboard ? "Hide" : "Show"}
            </Button>
          </div>

          <div className={cn("space-y-2", !showLeaderboard && "hidden lg:block")}>
            {leaderboard.length > 0 ? (
              leaderboard.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded"
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span>{participant.name}</span>
                  </div>
                  <span className="font-bold">{participant.points || 0}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">No participants yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

