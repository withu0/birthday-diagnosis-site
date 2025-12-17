"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AuthButton } from "@/components/auth/auth-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Menu,
  X,
  Home,
  FileText,
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  {
    title: "ダッシュボード",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "ユーザー管理",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "サブスクリプション",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "診断ログ",
    href: "/admin/diagnosis",
    icon: FileText,
  },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-0 overflow-hidden"
        )}
      >
        <div className={cn(
          "flex flex-col h-full transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0"
        )}>
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 min-w-[16rem]">
            <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">管理画面</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-w-[16rem]">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false)
                    }
                  }}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200 min-w-[16rem]">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              <span>トップページ</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-64" : "md:ml-0"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:flex"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
                {menuItems.find((item) => item.href === pathname)?.title || "管理画面"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <AuthButton />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 min-w-0">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

