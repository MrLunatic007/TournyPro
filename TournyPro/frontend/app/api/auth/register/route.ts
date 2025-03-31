import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

    if (!users || (users as any[]).length === 0) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    const user = (users as any[])[0]

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "24h" },
    )

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
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Authentication failed",
      },
      { status: 500 },
    )
  }
}

