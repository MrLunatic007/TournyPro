import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

interface User {
  id: string
  name: string
  email: string
}

interface AuthResult {
  success: boolean
  message: string
  status: number
  user?: User
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const token = getTokenFromRequest(request)

  if (!token) {
    return {
      success: false,
      message: "Unauthorized",
      status: 401,
    }
  }

  try {
    const user = verifyToken(token)

    if (!user) {
      return {
        success: false,
        message: "Invalid token",
        status: 401,
      }
    }

    return {
      success: true,
      message: "Authorized",
      status: 200,
      user,
    }
  } catch (error) {
    return {
      success: false,
      message: "Invalid token",
      status: 401,
    }
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  return authHeader.substring(7)
}

function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret") as any

    if (!decoded || !decoded.id || !decoded.email || !decoded.name) {
      return null
    }

    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    }
  } catch (error) {
    return null
  }
}

