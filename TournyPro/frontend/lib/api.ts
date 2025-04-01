// API client for interacting with the backend

// Helper function for making authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      throw new Error("No authentication token found. Please log in again.")
    }

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }

    const response = await fetch(`/api${url}`, {
      ...options,
      headers,
    })

    // Handle common HTTP errors
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      throw new Error("Your session has expired. Please log in again.")
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: "An unknown error occurred" }))
      throw new Error(data.message || `Request failed with status ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`API Error (${url}):`, error)
    throw error
  }
}

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    try {
      console.log("Sending registration request for:", email)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()
      console.log("Registration response:", { success: data.success, message: data.message })

      if (!response.ok) {
        throw new Error(data.message || `Registration failed with status ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  },

  login: async (email: string, password: string) => {
    // For login, we don't use authFetch because we don't have a token yet
    try {
      console.log("Attempting login with:", { email, password: "***" })

      // First try the regular login endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)

      // Parse the response data
      let data
      try {
        data = await response.json()
        console.log("Login response data:", {
          ...data,
          token: data.token ? "[REDACTED]" : "none",
        })
      } catch (parseError) {
        console.error("Error parsing login response:", parseError)
        throw new Error("Failed to parse server response")
      }

      // Check for errors
      if (!response.ok) {
        // If we're in development and there's a database error, try the dev login
        if (process.env.NODE_ENV !== "production" && (data.message?.includes("Database") || response.status === 500)) {
          console.log("Database error in development, trying dev login...")
          return authAPI.devLogin(email, "Development User")
        }

        throw new Error(data.message || `Login failed with status ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  },

  // Development-only login that doesn't require database
  devLogin: async (email: string, name: string) => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Dev login not available in production")
    }

    try {
      console.log("Attempting dev login with:", { email, name })

      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "Dev login failed" }))
        throw new Error(data.message || `Dev login failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("Dev login successful:", { ...data, token: "[REDACTED]" })
      return data
    } catch (error) {
      console.error("Dev login error:", error)
      throw error
    }
  },

  getProfile: async () => {
    return authFetch("/users/profile")
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },
}

// Tournament API
export const tournamentAPI = {
  getAll: async () => {
    return authFetch("/tournaments")
  },

  getById: async (id: string) => {
    return authFetch(`/tournaments/${id}`)
  },

  create: async (tournamentData: {
    name: string
    date: string
    participantCount: number
    participants: string[]
  }) => {
    return authFetch("/tournaments", {
      method: "POST",
      body: JSON.stringify(tournamentData),
    })
  },

  updateMatch: async (tournamentId: string, matchId: string, winnerId: string) => {
    return authFetch(`/tournaments/${tournamentId}/matches/${matchId}`, {
      method: "PUT",
      body: JSON.stringify({ winnerId }),
    })
  },

  getLeaderboard: async () => {
    return authFetch("/leaderboard")
  },

  getArchived: async () => {
    return authFetch("/tournaments/archived")
  },
}

