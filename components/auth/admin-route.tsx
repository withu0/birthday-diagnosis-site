"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/contexts/auth-context"

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuthContext()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setIsAdmin(false)
        setCheckingAdmin(false)
        return
      }

      try {
        // Check if user is admin by calling a lightweight admin check endpoint
        const response = await fetch("/api/admin/check")
        if (response.status === 403) {
          setIsAdmin(false)
        } else if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin === true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error checking admin access:", error)
        setIsAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    if (!isLoading) {
      checkAdminAccess()
    }
  }, [user, isLoading])

  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      router.push("/")
    }
  }, [isAdmin, checkingAdmin, router])

  // Show loading state while checking auth and admin status
  if (isLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-silver-vertical flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-silver-dark">読み込み中...</p>
        </div>
      </div>
    )
  }

  // If not admin, don't render children (redirect will happen)
  if (!isAdmin) {
    return null
  }

  // User is admin, render children
  return <>{children}</>
}

