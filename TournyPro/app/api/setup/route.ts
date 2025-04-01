import { type NextRequest, NextResponse } from "next/server"
import { testConnection, initializeDatabase } from "@/lib/db"
import bcrypt from "bcrypt"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const connectionTest = await testConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          error: connectionTest.error,
          config: {
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            database: process.env.DB_NAME || "tournament_db",
            hasPassword: !!process.env.DB_PASSWORD,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      tables: connectionTest.tables,
    })
  } catch (error) {
    console.error("Setup route error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Setup failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    const initResult = await initializeDatabase()

    if (!initResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Database initialization failed",
          error: initResult.error,
        },
        { status: 500 },
      )
    }

    // Create test user if requested
    const body = await request.json()
    const createTestUser = body.createTestUser as boolean

    if (createTestUser) {
      try {
        // Check if test user already exists
        const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", ["admin@example.com"])

        if ((existingUsers as any[]).length === 0) {
          // Create test user
          const hashedPassword = await bcrypt.hash("password123", 10)
          await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
            "Admin User",
            "admin@example.com",
            hashedPassword,
          ])

          return NextResponse.json({
            success: true,
            message: "Database initialized and test user created",
            testUser: {
              email: "admin@example.com",
              password: "password123",
            },
          })
        } else {
          return NextResponse.json({
            success: true,
            message: "Database initialized, test user already exists",
            testUser: {
              email: "admin@example.com",
              password: "password123 (if unchanged)",
            },
          })
        }
      } catch (userError) {
        console.error("Error creating test user:", userError)
        return NextResponse.json(
          {
            success: false,
            message: "Database initialized but failed to create test user",
            error: userError instanceof Error ? userError.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    })
  } catch (error) {
    console.error("Setup route error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Setup failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

