import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// WARNING: This is only for development purposes
// This endpoint allows login without database access for testing
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "Dev login not available in production",
      },
      { status: 403 },
    )
  }

  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and name are required",
        },
        { status: 400 },
      )
    }

    // Generate a token with a fake user ID
    const token = jwt.sign({ id: "dev-user-123", email, name }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "24h",
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: "dev-user-123",
        name,
        email,
      },
      message: "Development login successful",
    })
  } catch (error) {
    console.error("Dev login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Dev login failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

