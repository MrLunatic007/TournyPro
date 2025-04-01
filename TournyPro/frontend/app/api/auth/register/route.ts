import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import bcrypt from "bcrypt"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    console.log("Processing registration for:", email)

    // Validate input
    if (!name || !email || !password) {
      console.log("Registration failed: Missing required fields")
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    try {
      const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

      if (existingUsers && (existingUsers as any[]).length > 0) {
        console.log("Registration failed: Email already exists:", email)
        return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 409 })
      }
    } catch (dbError) {
      console.error("Database error checking existing user:", dbError)
      return NextResponse.json(
        {
          success: false,
          message: "Database error during registration",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("Password hashed successfully")

    // Insert user into database
    try {
      const [result] = await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
        name,
        email,
        hashedPassword,
      ])

      console.log("User registered successfully:", { email, userId: (result as any).insertId })

      return NextResponse.json(
        {
          success: true,
          message: "User registered successfully",
          userId: (result as any).insertId,
        },
        { status: 201 },
      )
    } catch (insertError) {
      console.error("Database error inserting new user:", insertError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create user account",
          details: insertError instanceof Error ? insertError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Registration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

