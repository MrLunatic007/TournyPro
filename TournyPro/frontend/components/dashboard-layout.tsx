"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Trophy, Home, Calendar, Award, Archive, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { authAPI } from "@/lib/api"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    // Get user data from localStorage first for quick rendering
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }

    // Then fetch fresh user data from API
    const fetchUserProfile = async () => {
      try {
        const response = await authAPI.getProfile()
        setUser(response.user)
        localStorage.setItem("user", JSON.stringify(response.user))
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
        // If API call fails due to invalid token, redirect to login
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        handleLogout()
      }
    }

    fetchUserProfile()
  }, [router, toast])

  const handleLogout = () => {
    authAPI.logout()

    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })

    router.push("/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Tournaments", href: "/tournaments", icon: Calendar },
    { name: "Leaderboard", href: "/leaderboard", icon: Award },
    { name: "Archive", href: "/archive", icon: Archive },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 bg-background border-r">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TourneyPro</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start mt-4 text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
                Log out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Trophy className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">TourneyPro</span>
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto pt-5 pb-4">
                <nav className="flex-1 px-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon
                          className={`mr-3 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-4 text-muted-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
                    Log out
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 h-16 bg-background border-b md:hidden">
          <div className="flex-1 flex justify-center px-4">
            <div className="flex-1 flex items-center justify-center">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">TourneyPro</span>
              </Link>
            </div>
          </div>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

