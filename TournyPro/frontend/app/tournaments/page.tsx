"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Calendar, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import DashboardLayout from "@/components/dashboard-layout"
import { tournamentAPI } from "@/lib/api"

interface Tournament {
  id: string
  name: string
  date: string
  participant_count: number
  status: "upcoming" | "in-progress" | "completed"
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchTournaments = async () => {
      try {
        const response = await tournamentAPI.getAll()
        setTournaments(response.tournaments)
        setFilteredTournaments(response.tournaments)
      } catch (error) {
        console.error("Failed to fetch tournaments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTournaments()
  }, [router])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTournaments(tournaments)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = tournaments.filter((tournament) => tournament.name.toLowerCase().includes(query))
      setFilteredTournaments(filtered)
    }
  }, [searchQuery, tournaments])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
        <Link href="/tournaments/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Tournament
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search tournaments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
          <div className="h-20 rounded-lg bg-muted animate-pulse" />
        </div>
      ) : filteredTournaments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
              <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{tournament.name}</CardTitle>
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
                  <CardDescription>{new Date(tournament.date).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>{tournament.participant_count} participants</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No tournaments found</CardTitle>
            <CardDescription>
              {searchQuery ? "Try adjusting your search query" : "Create your first tournament to get started"}
            </CardDescription>
            {!searchQuery && (
              <Link href="/tournaments/create" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tournament
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}

