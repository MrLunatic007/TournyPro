"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import { tournamentAPI } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/custom-select"

export default function CreateTournamentPage() {
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [participantCount, setParticipantCount] = useState<string>("8")
  const [participants, setParticipants] = useState<string[]>(Array(8).fill(""))
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleParticipantCountChange = (value: string) => {
    setParticipantCount(value)
    const count = Number.parseInt(value)
    setParticipants(Array(count).fill(""))
  }

  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...participants]
    newParticipants[index] = value
    setParticipants(newParticipants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all participants are filled
    if (participants.some((p) => !p.trim())) {
      toast({
        title: "Missing participants",
        description: "Please fill in all participant names.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await tournamentAPI.create({
        name,
        date,
        participantCount: Number.parseInt(participantCount),
        participants,
      })

      toast({
        title: "Tournament created",
        description: "Your tournament has been created successfully.",
      })

      router.push("/tournaments")
    } catch (error) {
      toast({
        title: "Failed to create tournament",
        description: error instanceof Error ? error.message : "There was a problem creating your tournament.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Create Tournament</h1>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
              <CardDescription>Enter the details for your new tournament.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  placeholder="Summer Chess Championship"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tournament Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant-count">Number of Participants</Label>
                <Select value={participantCount} onValueChange={handleParticipantCountChange}>
                  <SelectTrigger id="participant-count">
                    <SelectValue placeholder="Select number of participants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Participants</SelectItem>
                    <SelectItem value="4">4 Participants</SelectItem>
                    <SelectItem value="8">8 Participants</SelectItem>
                    <SelectItem value="16">16 Participants</SelectItem>
                    <SelectItem value="32">32 Participants</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Participants</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {participants.map((participant, index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`participant-${index}`}>Participant {index + 1}</Label>
                      <Input
                        id={`participant-${index}`}
                        placeholder={`Participant ${index + 1}`}
                        value={participant}
                        onChange={(e) => handleParticipantChange(index, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating tournament..." : "Create Tournament"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}

