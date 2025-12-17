"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/lib/contexts/auth-context"
import { useAdmin } from "@/lib/hooks/use-admin"
import { User, LogOut, Settings, CreditCard, ChevronDown } from "lucide-react"

export function AuthButton() {
  const router = useRouter()
  const { user, logout } = useAuthContext()
  const { isAdmin } = useAdmin()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleLogout = async () => {
    try {
      logout()
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  if (user) {
    return (
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="outline"
          className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
            {user.name.charAt(0)}
          </div>
          <span className="hidden sm:inline-block text-sm font-medium text-gray-700">
            {user.name}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg z-[9999] overflow-hidden"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 mt-1">{user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/mypage"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>マイページ</span>
              </Link>
              <Link
                href="/pricing"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>プラン選択</span>
              </Link>
              {isAdmin && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <Link
                    href="/admin"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>管理画面</span>
                  </Link>
                </>
              )}
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link href="/login">
      <Button className="bg-gray-900 hover:bg-gray-800 text-white">
        ログイン
      </Button>
    </Link>
  )
}
