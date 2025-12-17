"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/lib/contexts/auth-context"

export function useAdmin() {
  const { user, isLoading: authLoading } = useAuthContext()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setIsChecking(false)
        return
      }

      try {
        const response = await fetch("/api/admin/check")
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin === true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
      } finally {
        setIsChecking(false)
      }
    }

    if (!authLoading) {
      checkAdminStatus()
    }
  }, [user, authLoading])

  return {
    isAdmin,
    isLoading: authLoading || isChecking,
  }
}

