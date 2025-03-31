"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trophy, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { authAPI } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDatabaseHelp, setShowDatabaseHelp] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setShowDatabaseHelp(false)

    try {
      // Clear any existing tokens
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      const response = await authAPI.login(email, password)

      if (!response || !response.success) {
        throw new Error("Login failed: Invalid response from server")
      }

      if (!response.token) {
        throw new Error("Login failed: No token received from server")
      }

      // Store token and user data
      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))

      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      })

      router.push("/dashboard")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please check your credentials and try again."
      setError(errorMessage)

      // Check if it's a database error
      if (errorMessage.includes("Database")) {
        setShowDatabaseHelp(true)
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TourneyPro</span>
          </div>
          <CardTitle className="text-2xl">Login to your account</CardTitle>
          <CardDescription>Enter your email and password to login to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showDatabaseHelp && (
              <Alert>
                <AlertTitle>Database Connection Issue</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">There seems to be a problem connecting to the database. Please check:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Your MySQL server is running</li>
                    <li>Database credentials in .env file are correct</li>
                    <li>The tournament_db database exists</li>
                  </ul>
                  <div className="mt-2">
                    <Link href="/setup" className="text-primary hover:underline">
                      Go to Setup Page
                    </Link>{" "}
                    to diagnose and fix database issues.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

