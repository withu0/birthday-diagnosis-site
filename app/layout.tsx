import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Belanosima } from "./fonts"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { QueryProvider } from "@/lib/providers/query-provider"
import { AuthProvider } from "@/lib/contexts/auth-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "12SKINS",
  description: "生年月日から12肌診断を受けることができます",
  generator: "WITHU",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${Belanosima.variable}`}>
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
