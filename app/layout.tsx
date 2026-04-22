import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Belanosima } from "./fonts"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { QueryProvider } from "@/lib/providers/query-provider"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { LanguageProvider } from "@/lib/i18n/context"
import "./globals.css"

// Get base URL for SEO
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://12skins.com"

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "12SKINS診断サイト　理想の美しさへの扉",
    template: "%s | 12SKINS診断サイト"
  },
  description: "Your Skin,Your Story　心身ともに美しい人生を実現しましょう。",
  keywords: [
    "12SKINS",
    "肌診断",
    "スキン診断",
    "生年月日診断",
    "美肌",
    "スキンケア",
    "肌タイプ",
    "美容診断",
    "肌質診断",
    "12肌タイプ",
    "理想の美しさ",
    "Your Skin Your Story"
  ],
  authors: [{ name: "12SKINS" }],
  creator: "12SKINS",
  publisher: "12SKINS",
  generator: "Next.js",
  applicationName: "12SKINS診断サイト",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: baseUrl,
    siteName: "12SKINS診断サイト",
    title: "12SKINS診断サイト　理想の美しさへの扉",
    description: "Your Skin,Your Story　心身ともに美しい人生を実現しましょう。",
    images: [
      {
        url: "/brand.png",
        width: 1200,
        height: 630,
        alt: "12SKINS診断サイト",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "12SKINS診断サイト　理想の美しさへの扉",
    description: "Your Skin,Your Story　心身ともに美しい人生を実現しましょう。",
    images: ["/brand.png"],
    creator: "@12skins", // Update with your Twitter handle if available
  },
  alternates: {
    canonical: baseUrl,
  },
  category: "美容・スキンケア",
  classification: "美容診断サービス",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "12SKINS診断サイト",
    alternateName: "12SKINS",
    url: baseUrl,
    description: "Your Skin,Your Story　心身ともに美しい人生を実現しましょう。",
    inLanguage: "ja-JP",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/diagnosis?name={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "12SKINS",
    url: baseUrl,
    logo: `${baseUrl}/brand.png`,
    description: "Your Skin,Your Story　心身ともに美しい人生を実現しましょう。",
    sameAs: [
      // Add your social media URLs here when available
      // "https://twitter.com/12skins",
      // "https://www.facebook.com/12skins",
      // "https://www.instagram.com/12skins",
    ],
  }

  const serviceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "美容診断サービス",
    provider: {
      "@type": "Organization",
      name: "12SKINS",
    },
    areaServed: {
      "@type": "Country",
      name: "JP",
    },
    description: "生年月日から12肌診断を受けることができます。理想の美しさへの扉を開きましょう。",
  }

  return (
    <html lang="ja">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${Belanosima.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceData) }}
        />
        <LanguageProvider>
          <QueryProvider>
            <AuthProvider>
              <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
              <Analytics />
            </AuthProvider>
          </QueryProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
