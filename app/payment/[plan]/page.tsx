"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthButton } from "@/components/auth/auth-button"
import { Badge } from "@/components/ui/badge"

const PLANS = {
  basic: { name: "ベーシックプラン", amount: 50000 },
  standard: { name: "スタンダードプラン", amount: 80000 },
  premium: { name: "プレミアムプラン", amount: 100000 },
} as const

const TAX_RATE = 0.1

interface PaymentInfo {
  id: string
  planType: string
  amount: string
  taxAmount: string
  totalAmount: string
  paymentMethod: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function PlanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const plan = params?.plan as string
  const [payments, setPayments] = useState<PaymentInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (plan && ["basic", "standard", "premium"].includes(plan)) {
      fetchPayments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan])

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/payment/plan/${plan}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      completed: { label: "完了", variant: "default" },
      pending: { label: "処理中", variant: "secondary" },
      failed: { label: "失敗", variant: "destructive" },
      cancelled: { label: "キャンセル", variant: "outline" },
    }
    return statusMap[status] || { label: status, variant: "outline" }
  }

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      bank_transfer: "銀行振込",
      credit_card: "クレジットカード",
      direct_debit: "口座引き落とし",
    }
    return methodMap[method] || method
  }

  if (!plan || !["basic", "standard", "premium"].includes(plan)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">無効なプランです</p>
            <Link href="/" className="text-blue-600 hover:underline">
              トップページへ戻る
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const planInfo = PLANS[plan as keyof typeof PLANS]
  const taxAmount = Math.floor(planInfo.amount * TAX_RATE)
  const totalAmount = planInfo.amount + taxAmount

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{planInfo.name}</h1>
          <p className="text-gray-600">プラン詳細と支払い情報</p>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>プラン情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">プラン名</div>
                <div className="text-lg font-semibold text-gray-900">{planInfo.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">金額（税別）</div>
                  <div className="text-lg font-semibold text-gray-900">¥{planInfo.amount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">消費税（10%）</div>
                  <div className="text-lg font-semibold text-gray-900">¥{taxAmount.toLocaleString()}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-1">合計金額（税込）</div>
                <div className="text-2xl font-bold text-gray-900">¥{totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>支払い履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-gray-600 mx-auto mb-4"></div>
                <p className="text-gray-600">読み込み中...</p>
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => {
                  const statusInfo = getStatusBadge(payment.status)
                  return (
                    <div
                      key={payment.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">
                            支払いID: {payment.id.substring(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            作成日時: {formatDate(payment.createdAt)}
                          </div>
                          {payment.updatedAt !== payment.createdAt && (
                            <div className="text-sm text-gray-500">
                              更新日時: {formatDate(payment.updatedAt)}
                            </div>
                          )}
                        </div>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">支払い方法</div>
                          <div className="text-sm font-medium text-gray-900">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">支払い金額</div>
                          <div className="text-sm font-medium text-gray-900">
                            ¥{parseFloat(payment.totalAmount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                このプランの支払い履歴がありません
              </div>
            )}
          </CardContent>
        </Card>
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

