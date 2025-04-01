"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import { tournamentAPI } from "@/lib/api"

interface ArchivedTournament {
  id: string
  name: string
  date: string
  participants: number
  winner: string
  runnerUp: string
}

export default function ArchivePage() {
  const [tournaments, setTournaments] = useState<ArchivedTournament[]>([])
  const [filteredTournaments, setFilteredTournaments] = useState<ArchivedTournament[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchArchivedTournaments = async () => {
      try {
        setError(null)
        const response = await tournamentAPI.getArchived()
        setTournaments(response.archivedTournaments)
        setFilteredTournaments(response.archivedTournaments)
      } catch (error) {
        console.error("Failed to fetch archived tournaments:", error)
        setError(error instanceof Error ? error.message : "Failed to load archived tournaments")
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load archived tournaments",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchArchivedTournaments()
  }, [router, toast])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTournaments(tournaments)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = tournaments.filter(
        (tournament) =>
          tournament.name.toLowerCase().includes(query) ||
          tournament.winner.toLowerCase().includes(query) ||
          tournament.runnerUp.toLowerCase().includes(query),
      )
      setFilteredTournaments(filtered)
    }
  }, [searchQuery, tournaments])

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Tournament Archive</h1>

      <Card>
        <CardHeader>
          <CardTitle>Past Tournaments</CardTitle>
          <CardDescription>Browse through all completed tournaments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tournaments..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-red-500">Error loading tournaments</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
              <Button onClick={() => router.refresh()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredTournaments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Participants</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Runner-up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTournaments.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell className="font-medium">{tournament.name}</TableCell>
                    <TableCell>{new Date(tournament.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{tournament.participants}</TableCell>
                    <TableCell>{tournament.winner}</TableCell>
                    <TableCell>{tournament.runnerUp}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/tournaments/${tournament.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No completed tournaments found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? "Try adjusting your search query" : "Complete some tournaments to see them here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

