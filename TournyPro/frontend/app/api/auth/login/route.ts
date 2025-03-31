import { type NextRequest, NextResponse } from "next/server"
import { pool, testConnection } from "@/lib/db"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

interface User {
  id: string | number
  name: string
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("Login API route called")

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("Received login request for email:", body.email)
    } catch (error) {
      console.error("Failed to parse request body:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 },
      )
    }

    const { email, password } = body

    // Validate input
    if (!email || !password) {
      console.log("Missing email or password")
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Test database connection first
    console.log("Testing database connection...")
    const connectionTest = await testConnection()
    if (!connectionTest.success) {
      console.error("Database connection test failed:", connectionTest.error)
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          details: connectionTest.error,
          dbConfig: {
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            database: process.env.DB_NAME || "tournament_db",
            hasPassword: !!process.env.DB_PASSWORD,
          },
        },
        { status: 500 },
      )
    }

    // Find user
    console.log("Querying database for user with email:", email)
    let users: User[] = []
    try {
      const [result] = await pool.query("SELECT * FROM users WHERE email = ?", [email])
      users = result as User[]
      console.log("Database query result:", users ? `Found ${users.length} users` : "No result")
    } catch (dbError) {
      console.error("Database error during login:", dbError)
      return NextResponse.json(
        {
          success: false,
          message: "Database error during login",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
          dbConfig: {
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            database: process.env.DB_NAME || "tournament_db",
            hasPassword: !!process.env.DB_PASSWORD,
          },
        },
        { status: 500 },
      )
    }

    if (!users || users.length === 0) {
      console.log("No user found with email:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      )
    }

    const user = users[0]

    // Check password
    console.log("Comparing passwords")
    let passwordMatch
    try {
      passwordMatch = await bcrypt.compare(password, user.password)
      console.log("Password match result:", passwordMatch)
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError)
      return NextResponse.json(
        {
          success: false,
          message: "Error verifying password",
          details: bcryptError instanceof Error ? bcryptError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    if (!passwordMatch) {
      console.log("Password does not match")
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      )
    }

    // Generate JWT token
    console.log("Generating JWT token")
    let token
    try {
      token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "24h" },
      )
      console.log("Token generated successfully")
    } catch (jwtError) {
      console.error("JWT error:", jwtError)
      return NextResponse.json(
        {
          success: false,
          message: "Error generating authentication token",
          details: jwtError instanceof Error ? jwtError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    console.log("Login successful for user:", user.email)
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Unhandled login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

