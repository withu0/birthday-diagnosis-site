"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth/auth-button"

const PLANS = [
  {
    type: "basic",
    name: "ベーシックプラン",
    description: "12SKINS利用料",
    amount: 50000,
    taxExcluded: true,
    features: [
      "12SKINS診断機能",
      "基本的な診断結果",
      "6ヶ月間のアクセス権限",
    ],
  },
  {
    type: "standard",
    name: "スタンダードプラン",
    description: "12SKINS利用料",
    amount: 80000,
    taxExcluded: true,
    features: [
      "12SKINS診断機能",
      "詳細な診断結果",
      "6ヶ月間のアクセス権限",
      "優先サポート",
    ],
  },
  {
    type: "premium",
    name: "プレミアムプラン",
    description: "12SKINS利用料",
    amount: 100000,
    taxExcluded: true,
    features: [
      "12SKINS診断機能",
      "完全な診断結果",
      "6ヶ月間のアクセス権限",
      "優先サポート",
      "追加機能へのアクセス",
    ],
  },
] as const

const TAX_RATE = 0.1 // 10% 消費税

export default function PricingPage() {
  const router = useRouter()

  const handleSelectPlan = (planType: string) => {
    // Use dynamic route for cleaner URLs
    router.push(`/payment/${planType}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/brand.avif"
                alt="12 SKINS"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                トップページ
              </Link>
              <AuthButton />
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            プラン選択
          </h1>
          <p className="text-lg text-gray-600">
            お客様に最適なプランをお選びください
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const taxAmount = Math.floor(plan.amount * TAX_RATE)
            const totalAmount = plan.amount + taxAmount

            return (
              <Card
                key={plan.type}
                className="flex flex-col shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-2xl text-center mb-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      ¥{plan.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">税別</div>
                    <div className="text-lg font-semibold text-gray-700 mt-2">
                      税込: ¥{totalAmount.toLocaleString()}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.type)}
                    className="w-full bg-gray-700 hover:bg-gray-800 text-white py-6 text-lg"
                  >
                    このプランを選択
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            ご不明な点がございましたら、お気軽にお問い合わせください。
          </p>
        </div>
      </main>

      <footer className="border-t bg-gray-50 mt-12">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 text-sm">
            Copyright © 株式会社美容総研 All Rights Reserved. Powered by MyASP (マイスピー)
          </p>
        </div>
      </footer>
    </div>
  )
}

