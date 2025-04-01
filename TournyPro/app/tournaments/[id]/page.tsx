"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import TournamentBracket from "@/components/tournament-bracket"
import { tournamentAPI } from "@/lib/api"

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

interface Tournament {
  id: string
  name: string
  date: string
  status: "upcoming" | "in-progress" | "completed"
  participants: Participant[]
  matches: Match[]
}

export default function TournamentPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchTournament = async () => {
      try {
        const response = await tournamentAPI.getById(tournamentId)
        setTournament(response.tournament)
      } catch (error) {
        console.error("Failed to fetch tournament:", error)
        toast({
          title: "Error",
          description: "Failed to load tournament data.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTournament()
  }, [tournamentId, router, toast])

  const handleUpdateMatch = async (matchId: string, winnerId: string) => {
    if (!tournament) return

    try {
      await tournamentAPI.updateMatch(tournamentId, matchId, winnerId)

      // Show notification
      toast({
        title: "Match updated",
        description: "The participant has advanced to the next round.",
      })

      // Refresh tournament data
      const response = await tournamentAPI.getById(tournamentId)
      setTournament(response.tournament)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update match result.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-32 bg-muted rounded animate-pulse mx-auto mb-4" />
            <div className="h-64 w-full max-w-3xl bg-muted rounded animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!tournament) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Tournament not found</h2>
            <p className="text-muted-foreground mb-4">
              The tournament you're looking for doesn't exist or you don't have access.
            </p>
            <Button onClick={() => router.push("/tournaments")}>Back to Tournaments</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
          <p className="text-muted-foreground">
            {new Date(tournament.date).toLocaleDateString()} • {tournament.participants.length} participants
          </p>
        </div>
        <div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold 
            ${
              tournament.status === "upcoming"
                ? "bg-blue-100 text-blue-800"
                : tournament.status === "in-progress"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
            }`}
          >
            {tournament.status === "upcoming"
              ? "Upcoming"
              : tournament.status === "in-progress"
                ? "In Progress"
                : "Completed"}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <TournamentBracket
          matches={tournament.matches}
          onUpdateMatch={tournament.status !== "completed" ? handleUpdateMatch : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>List of all participants in this tournament.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tournament.participants.map((participant) => (
              <div key={participant.id} className="flex items-center p-3 rounded-md border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  {participant.name.charAt(0)}
                </div>
                <span>{participant.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

