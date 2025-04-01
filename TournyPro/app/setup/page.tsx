"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, User } from "lucide-react"

interface DbTable {
  [key: string]: string
}

interface DbStatus {
  success: boolean
  message: string
  error?: string
  tables?: DbTable[]
  config?: {
    host: string
    user: string
    database: string
    hasPassword: boolean
  }
}

interface SetupResult {
  success: boolean
  message: string
  error?: string
  testUser?: {
    email: string
    password: string
  }
}

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null)

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/setup")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({
        success: false,
        message: "Failed to check database status",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupDatabase = async (createTestUser: boolean) => {
    setIsCreatingUser(true)
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ createTestUser }),
      })
      const data = await response.json()
      setSetupResult(data)

      // Refresh database status
      checkDatabaseStatus()
    } catch (error) {
      setSetupResult({
        success: false,
        message: "Setup failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Database Setup</CardTitle>
          <CardDescription>Check and configure your database connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-medium">Database Connection</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Checking connection..." : dbStatus?.message}
                </p>
              </div>
            </div>
            {!isLoading && (
              <div>
                {dbStatus?.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
            )}
          </div>

          {dbStatus && !dbStatus.success && (
            <Alert variant="destructive">
              <AlertTitle>Database Connection Failed</AlertTitle>
              <AlertDescription>
                <p className="mb-2">{dbStatus.error}</p>
                {dbStatus.config && (
                  <div className="text-xs mt-2 p-2 bg-muted rounded">
                    <p>Host: {dbStatus.config.host}</p>
                    <p>User: {dbStatus.config.user}</p>
                    <p>Database: {dbStatus.config.database}</p>
                    <p>Password: {dbStatus.config.hasPassword ? "Provided" : "Not provided"}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {dbStatus && dbStatus.success && (
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Database Tables</h3>
              <div className="text-sm">
                {dbStatus.tables && dbStatus.tables.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {dbStatus.tables.map((table, index) => (
                      <li key={index}>{String(Object.values(table)[0])}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No tables found in the database.</p>
                )}
              </div>
            </div>
          )}

          {setupResult && (
            <Alert variant={setupResult.success ? "default" : "destructive"}>
              <AlertTitle>{setupResult.success ? "Setup Successful" : "Setup Failed"}</AlertTitle>
              <AlertDescription>
                <p>{setupResult.message}</p>
                {setupResult.testUser && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p>Test User Created:</p>
                    <p>Email: {setupResult.testUser.email}</p>
                    <p>Password: {setupResult.testUser.password}</p>
                  </div>
                )}
                {setupResult.error && <p className="text-red-500 mt-2">{setupResult.error}</p>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex gap-2 w-full">
            <Button onClick={() => checkDatabaseStatus()} variant="outline" className="flex-1" disabled={isLoading}>
              Refresh Status
            </Button>
            <Button onClick={() => setupDatabase(false)} className="flex-1" disabled={isLoading || isCreatingUser}>
              Initialize Database
            </Button>
          </div>
          <Button
            onClick={() => setupDatabase(true)}
            variant="secondary"
            className="w-full"
            disabled={isLoading || isCreatingUser}
          >
            <User className="mr-2 h-4 w-4" />
            Create Test User
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

