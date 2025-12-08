"use client"

import { createContext, useContext, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"

interface AuthContextType {
  user: { id: string; email: string; name: string } | null
  isLoading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const protectedRoutes = ["/diagnosis"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) {
      hasRedirected.current = false
      return
    }

    // Prevent multiple redirects
    if (hasRedirected.current) return

    // If user is logged in and on login page, redirect to home
    if (user && pathname === "/login") {
      hasRedirected.current = true
      router.push("/")
      return
    }

    // If user is not logged in and on protected pages, redirect to login
    if (!user && protectedRoutes.includes(pathname)) {
      hasRedirected.current = true
      router.push("/login")
      return
    }

    // Reset redirect flag when pathname changes (but not due to our redirect)
    hasRedirected.current = false
  }, [user, isLoading, pathname, router])

  // Show full-page loading overlay while checking auth
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-silver-vertical flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold border-t-transparent mx-auto mb-4"></div>
          <p className="text-silver-dark text-lg font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
