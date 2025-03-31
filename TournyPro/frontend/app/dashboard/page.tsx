"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trophy, Plus, Users, Calendar, Award, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "@/components/dashboard-layout"
import { tournamentAPI } from "@/lib/api"

interface Tournament {
  id: string
  name: string
  date: string
  participant_count: number
  status: "upcoming" | "in-progress" | "completed"
}

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    // Fetch tournaments
    const fetchTournaments = async () => {
      try {
        const response = await tournamentAPI.getAll()
        setTournaments(response.tournaments)
      } catch (error) {
        console.error("Failed to fetch tournaments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTournaments()
  }, [router])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/tournaments/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Tournament
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournaments.length}</div>
            <p className="text-xs text-muted-foreground">
              {tournaments.length > 0 ? `${tournaments.length} total tournaments` : "No tournaments yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tournaments.reduce((sum, t) => sum + (t.participant_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all tournaments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournaments.filter((t) => t.status === "upcoming").length}</div>
            <p className="text-xs text-muted-foreground">
              {tournaments.filter((t) => t.status === "upcoming").length > 0 ? "Ready to start" : "No upcoming events"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Events</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournaments.filter((t) => t.status === "completed").length}</div>
            <p className="text-xs text-muted-foreground">
              {tournaments.filter((t) => t.status === "completed").length > 0
                ? "Tournaments completed"
                : "No completed events"}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Your Tournaments</h2>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
        </div>
      ) : tournaments.length > 0 ? (
        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{tournament.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{new Date(tournament.date).toLocaleDateString()}</span>
                      <span>{tournament.participant_count} participants</span>
                    </div>
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No tournaments yet</CardTitle>
            <CardDescription>Create your first tournament to get started.</CardDescription>
            <Link href="/tournaments/create" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tournament
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}

