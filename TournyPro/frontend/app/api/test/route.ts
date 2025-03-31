import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export async function GET() {
  try {
    const dbConnected = await testConnection()

    return NextResponse.json({
      success: true,
      message: "API is working",
      environment: process.env.NODE_ENV,
      database: {
        connected: dbConnected,
        host: process.env.DB_HOST || "localhost",
        name: process.env.DB_NAME || "tournament_db",
      },
    })
  } catch (error) {
    console.error("Test route error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

