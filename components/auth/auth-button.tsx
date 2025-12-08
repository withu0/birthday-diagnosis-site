"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/lib/contexts/auth-context"

export function AuthButton() {
  const router = useRouter()
  const { user, logout } = useAuthContext()

  const handleLogout = async () => {
    try {
      logout()
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-silver-dark font-medium">{user.name} さん</span>
        <Button variant="outline" onClick={handleLogout} className="border-gold text-gold hover:bg-gold hover:text-white">
          ログアウト
        </Button>
      </div>
    )
  }

  return (
    <Link href="/login">
      <Button className="gradient-bg-gold text-white hover:opacity-90 border-0">
        ログイン
      </Button>
    </Link>
  )
}
