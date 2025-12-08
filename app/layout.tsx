import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { QueryProvider } from "@/lib/providers/query-provider"
import { AuthProvider } from "@/lib/contexts/auth-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "誕生日診断 - あなたの運命を知る",
  description: "生年月日から性格と運勢を診断する日本語サイト",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <QueryProvider>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            <Analytics />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
