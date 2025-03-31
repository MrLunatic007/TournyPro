"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Trophy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DashboardLayout from "@/components/dashboard-layout"
import { tournamentAPI } from "@/lib/api"

interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  wins: number
  losses: number
  tournamentsPlayed: number
  tournamentsWon: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchLeaderboard = async () => {
      try {
        const response = await tournamentAPI.getLeaderboard()
        setLeaderboard(response.leaderboard)
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [router])

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Leaderboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
          <CardDescription>Players ranked by tournament performance and win rate.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          ) : leaderboard.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Losses</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Tournaments Played</TableHead>
                  <TableHead className="text-right">Tournaments Won</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.rank === 1 ? (
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                          {entry.rank}
                        </div>
                      ) : entry.rank === 2 ? (
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-gray-400 mr-1" />
                          {entry.rank}
                        </div>
                      ) : entry.rank === 3 ? (
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-amber-700 mr-1" />
                          {entry.rank}
                        </div>
                      ) : (
                        entry.rank
                      )}
                    </TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell className="text-right">{entry.wins}</TableCell>
                    <TableCell className="text-right">{entry.losses}</TableCell>
                    <TableCell className="text-right">
                      {entry.wins + entry.losses > 0 ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100) : 0}
                      %
                    </TableCell>
                    <TableCell className="text-right">{entry.tournamentsPlayed}</TableCell>
                    <TableCell className="text-right">{entry.tournamentsWon}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No leaderboard data yet</h3>
              <p className="text-muted-foreground mt-1">Complete some tournaments to see player rankings.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

