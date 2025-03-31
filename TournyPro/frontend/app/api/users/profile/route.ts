import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: authResult.message || "Unauthorized" },
        { status: authResult.status || 401 },
      )
    }

    const userId = authResult.user.id

    const [users] = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = ?", [userId])

    if ((users as any[]).length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: (users as any[])[0],
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 },
    )
  }
}

