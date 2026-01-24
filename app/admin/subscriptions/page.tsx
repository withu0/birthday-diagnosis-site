"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminRoute } from "@/components/auth/admin-route"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Pagination } from "@/components/ui/pagination"

interface Subscription {
  paymentId: string
  planType: string
  amount: string
  taxAmount: string
  totalAmount: string
  paymentMethod: string
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  seller: string | null
  univapayOrderId: string | null
  univapayTransactionId: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    name: string
  } | null
  membership: {
    id: string
    username: string
    isActive: boolean
    accessGrantedAt: string
    accessExpiresAt: string
    credentialsSentAt: string | null
  } | null
}

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20
  const [filters, setFilters] = useState({
    status: "",
    planType: "",
    search: "",
    seller: "",
  })

  useEffect(() => {
    fetchSubscriptions()
  }, [currentPage])

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append("status", filters.status)
      if (filters.planType) params.append("planType", filters.planType)
      if (filters.search) params.append("search", filters.search)
      if (filters.seller) params.append("seller", filters.seller)
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())

      const response = await fetch(`/api/admin/subscriptions?${params.toString()}`)

      if (response.status === 403) {
        setError("管理者権限が必要です")
        return
      }

      if (!response.ok) {
        throw new Error("サブスクリプション一覧の取得に失敗しました")
      }

      const data = await response.json()
      setSubscriptions(data.subscriptions || [])
      setTotalCount(data.totalCount || 0)
      setTotalPages(data.totalPages || 1)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    setCurrentPage(1) // Reset to first page when applying filters
    fetchSubscriptions()
  }

  const handleResetFilters = () => {
    setFilters({ status: "", planType: "", search: "", seller: "" })
    setCurrentPage(1) // Reset to first page when resetting filters
    setTimeout(() => fetchSubscriptions(), 100)
  }

  const handleToggleMembership = async (paymentId: string, currentStatus: boolean) => {
    if (!confirm(`会員権限を${currentStatus ? "無効化" : "有効化"}してもよろしいですか？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/subscriptions/${paymentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "更新に失敗しました")
      }

      fetchSubscriptions()
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新に失敗しました")
    }
  }

  const handleCreateAccount = async (paymentId: string, customerName: string) => {
    if (!confirm(`${customerName}様のアカウントと会員権限を作成してもよろしいですか？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/subscriptions/${paymentId}/create-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "アカウント作成に失敗しました")
      }

      const data = await response.json()
      
      // Show credentials to admin
      const credentialsMessage = `アカウントを作成しました！\n\nログイン情報:\nメールアドレス: ${data.user.email}\nパスワード: ${data.user.password}\n\n会員サイト情報:\nユーザー名: ${data.membership.username}\nパスワード: ${data.membership.password}\n\n※この情報は画面に表示されるだけです。必ずメモを取ってください。`
      alert(credentialsMessage)

      fetchSubscriptions()
    } catch (err) {
      alert(err instanceof Error ? err.message : "アカウント作成に失敗しました")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP")
  }

  const formatCurrency = (amount: string) => {
    return parseInt(amount).toLocaleString("ja-JP") + "円"
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
      basic: "ベーシック (50,000円)",
      standard: "スタンダード (80,000円)",
      premium: "プレミアム (100,000円)",
    }
    return planMap[planType] || planType
  }

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      bank_transfer: "銀行振込",
      credit_card: "クレジットカード",
      direct_debit: "口座引き落とし",
    }
    return methodMap[method] || method
  }

  return (
    <AdminRoute>
      <AdminLayout>
          <Card className="shadow-lg border-gold/30 bg-gradient-to-br from-white to-gold-light/10">
            <CardHeader>
              <CardTitle className="text-3xl text-gold text-center">
                💳 サブスクリプション管理
              </CardTitle>
              <CardDescription className="text-center text-silver-dark">
                支払い履歴と会員権限の管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* フィルター */}
              <div className="mb-6 p-4 bg-gold-light/10 rounded-lg border border-gold/20">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="status">ステータス</Label>
                    <Select
                      value={filters.status || undefined}
                      onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="すべて" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="pending">処理中</SelectItem>
                        <SelectItem value="completed">完了</SelectItem>
                        <SelectItem value="failed">失敗</SelectItem>
                        <SelectItem value="cancelled">キャンセル</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="planType">プラン</Label>
                    <Select
                      value={filters.planType || undefined}
                      onValueChange={(value) => handleFilterChange("planType", value === "all" ? "" : value)}
                    >
                      <SelectTrigger id="planType">
                        <SelectValue placeholder="すべて" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="basic">ベーシック</SelectItem>
                        <SelectItem value="standard">スタンダード</SelectItem>
                        <SelectItem value="premium">プレミアム</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="search">検索</Label>
                    <Input
                      id="search"
                      placeholder="名前、メール、電話番号"
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="seller">販売者</Label>
                    <Input
                      id="seller"
                      placeholder="販売者名"
                      value={filters.seller}
                      onChange={(e) => handleFilterChange("seller", e.target.value)}
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <Button
                      onClick={handleApplyFilters}
                      className="flex-1 gradient-bg-gold text-white hover:opacity-90"
                    >
                      適用
                    </Button>
                    <Button
                      onClick={handleResetFilters}
                      variant="outline"
                      className="border-gold text-gold hover:bg-gold hover:text-white"
                    >
                      リセット
                    </Button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gold mx-auto mb-4"></div>
                  <p className="text-silver-dark">読み込み中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button
                    onClick={fetchSubscriptions}
                    className="gradient-bg-gold text-white hover:opacity-90"
                  >
                    再試行
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-silver-dark">
                      合計 {totalCount} 件のサブスクリプション
                    </p>
                    <Button
                      onClick={fetchSubscriptions}
                      variant="outline"
                      className="border-gold text-gold hover:bg-gold hover:text-white"
                    >
                      更新
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gold-light/20 border-b border-gold/30">
                          <th className="p-3 text-left text-gold font-bold">顧客名</th>
                          <th className="p-3 text-left text-gold font-bold">プラン</th>
                          <th className="p-3 text-left text-gold font-bold">金額</th>
                          <th className="p-3 text-left text-gold font-bold">支払い方法</th>
                          <th className="p-3 text-left text-gold font-bold">ステータス</th>
                          <th className="p-3 text-left text-gold font-bold">販売者</th>
                          <th className="p-3 text-left text-gold font-bold">会員権限</th>
                          <th className="p-3 text-left text-gold font-bold">有効期限</th>
                          <th className="p-3 text-left text-gold font-bold">作成日時</th>
                          <th className="p-3 text-center text-gold font-bold">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub) => (
                          <tr
                            key={sub.paymentId}
                            className="border-b border-silver/20 hover:bg-gold-light/5"
                          >
                            <td className="p-3">
                              <div className="text-silver-dark">
                                <div className="font-medium">{sub.customerName}</div>
                                <div className="text-xs text-silver-dark/70">{sub.customerEmail}</div>
                              </div>
                            </td>
                            <td className="p-3 text-silver-dark">
                              {getPlanTypeLabel(sub.planType)}
                            </td>
                            <td className="p-3 text-silver-dark">
                              {formatCurrency(sub.totalAmount)}
                            </td>
                            <td className="p-3 text-silver-dark">
                              {getPaymentMethodLabel(sub.paymentMethod)}
                            </td>
                            <td className="p-3">{getStatusBadge(sub.status)}</td>
                            <td className="p-3 text-silver-dark">
                              {sub.seller || <span className="text-silver-dark/50">-</span>}
                            </td>
                            <td className="p-3">
                              {sub.membership ? (
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    sub.membership.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {sub.membership.isActive ? "有効" : "無効"}
                                </span>
                              ) : (
                                <span className="text-silver-dark/50 text-xs">未作成</span>
                              )}
                            </td>
                            <td className="p-3 text-sm text-silver-dark">
                              {sub.membership
                                ? formatDate(sub.membership.accessExpiresAt)
                                : "-"}
                            </td>
                            <td className="p-3 text-sm text-silver-dark">
                              {formatDate(sub.createdAt)}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                {!sub.membership && (sub.paymentMethod === "bank_transfer" || sub.paymentMethod === "direct_debit") && sub.status === "pending" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreateAccount(sub.paymentId, sub.customerName)}
                                    className="bg-blue-500 text-white hover:bg-blue-600"
                                  >
                                    アカウント作成
                                  </Button>
                                )}
                                {sub.membership && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleToggleMembership(
                                        sub.paymentId,
                                        sub.membership!.isActive
                                      )
                                    }
                                    className={`${
                                      sub.membership.isActive
                                        ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                        : "border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                    }`}
                                  >
                                    {sub.membership.isActive ? "無効化" : "有効化"}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {subscriptions.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-silver-dark">サブスクリプションが見つかりません</p>
                    </div>
                  )}

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalCount}
                  />
                </div>
              )}
            </CardContent>
          </Card>
      </AdminLayout>
    </AdminRoute>
  )
}

