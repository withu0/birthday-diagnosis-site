"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AdminRoute } from "@/components/auth/admin-route"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useAuthContext } from "@/lib/contexts/auth-context"

interface DashboardStats {
  totalUsers: number
  totalPayments: number
  totalMemberships: number
  activeMemberships: number
  revenueLast30Days: number
  paymentCountLast30Days: number
}

interface PaymentStat {
  status: string
  count: number
}

interface PlanStat {
  planType: string
  count: number
  totalAmount: number
}

interface RecentPayment {
  id: string
  customerName: string
  planType: string
  totalAmount: string
  status: string
  createdAt: string
}

interface ExpiringMembership {
  id: string
  username: string
  accessExpiresAt: string
  isActive: boolean
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [paymentStats, setPaymentStats] = useState<PaymentStat[]>([])
  const [planStats, setPlanStats] = useState<PlanStat[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [expiringMemberships, setExpiringMemberships] = useState<ExpiringMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/dashboard")

      if (response.status === 403) {
        setError("管理者権限が必要です")
        router.push("/")
        return
      }

      if (!response.ok) {
        throw new Error("ダッシュボード情報の取得に失敗しました")
      }

      const data = await response.json()
      setStats(data.stats)
      setPaymentStats(data.paymentStats || [])
      setPlanStats(data.planStats || [])
      setRecentPayments(data.recentPayments || [])
      setExpiringMemberships(data.expiringMemberships || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return num.toLocaleString("ja-JP") + "円"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP")
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "処理中", className: "bg-yellow-100 text-yellow-800" },
      completed: { label: "完了", className: "bg-green-100 text-green-800" },
      failed: { label: "失敗", className: "bg-red-100 text-red-800" },
      cancelled: { label: "キャンセル", className: "bg-gray-100 text-gray-800" },
    }

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" }

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getPlanTypeLabel = (planType: string) => {
    const planMap: Record<string, string> = {
      basic: "ベーシック",
      standard: "スタンダード",
      premium: "プレミアム",
    }
    return planMap[planType] || planType
  }

  return (
    <AdminRoute>
      <AdminLayout>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchDashboardData} className="bg-blue-600 hover:bg-blue-700">
                再試行
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 統計カード */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-100">総ユーザー数</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-4xl font-bold">{stats?.totalUsers || 0}</CardTitle>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-green-100">総支払い数</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-4xl font-bold">{stats?.totalPayments || 0}</CardTitle>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-purple-100">アクティブ会員</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-4xl font-bold">
                      {stats?.activeMemberships || 0} / {stats?.totalMemberships || 0}
                    </CardTitle>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-orange-100">過去30日の売上</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-3xl font-bold">
                      {formatCurrency(stats?.revenueLast30Days || 0)}
                    </CardTitle>
                    <p className="text-orange-100 text-sm mt-1">
                      {stats?.paymentCountLast30Days || 0}件の取引
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* グラフと詳細情報 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 支払いステータス */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>支払いステータス</CardTitle>
                    <CardDescription>支払いの状態別集計</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paymentStats.map((stat) => (
                        <div key={stat.status} className="flex items-center justify-between">
                          <span className="text-gray-600 capitalize">{stat.status}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(stat.count / (stats?.totalPayments || 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-gray-800 font-semibold w-12 text-right">
                              {stat.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* プラン別売上 */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>プラン別売上</CardTitle>
                    <CardDescription>完了した支払いのプラン別集計</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {planStats.map((stat) => (
                        <div key={stat.planType} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">
                              {getPlanTypeLabel(stat.planType)}
                            </span>
                            <span className="text-gray-800 font-bold">
                              {formatCurrency(stat.totalAmount)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {stat.count}件の取引
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 最近の支払いと期限切れ間近の会員 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 最近の支払い */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>最近の支払い</CardTitle>
                    <CardDescription>最新10件の支払い履歴</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentPayments.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">支払い履歴がありません</p>
                      ) : (
                        recentPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{payment.customerName}</p>
                              <p className="text-sm text-gray-500">
                                {getPlanTypeLabel(payment.planType)} • {formatDate(payment.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800">
                                {formatCurrency(payment.totalAmount)}
                              </p>
                              {getStatusBadge(payment.status)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 期限切れ間近の会員 */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>期限切れ間近の会員</CardTitle>
                    <CardDescription>30日以内に期限切れになる会員</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {expiringMemberships.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">期限切れ間近の会員はありません</p>
                      ) : (
                        expiringMemberships.map((membership) => (
                          <div
                            key={membership.id}
                            className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{membership.username}</p>
                              <p className="text-sm text-gray-500">
                                期限: {formatDate(membership.accessExpiresAt)}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                              期限切れ間近
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
      </AdminLayout>
    </AdminRoute>
  )
}

