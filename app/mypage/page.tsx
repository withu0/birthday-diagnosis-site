"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthButton } from "@/components/auth/auth-button"

interface UserProfile {
  user: {
    id: string
    email: string
    name: string
    createdAt: string
  }
  membership: {
    id: string
    username: string
    accessGrantedAt: string
    accessExpiresAt: string
    isActive: boolean
    credentialsSentAt: string | null
  } | null
  payment: {
    id: string
    planType: string
    amount: string
    taxAmount: string
    totalAmount: string
    paymentMethod: string
    status: string
    createdAt: string
  } | null
  allPayments: Array<{
    id: string
    planType: string
    amount: string
    taxAmount: string
    totalAmount: string
    paymentMethod: string
    status: string
    createdAt: string
  }>
}

const getPlanLabel = (planType: string) => {
  const planMap: Record<string, string> = {
    basic: "ベーシックプラン",
    standard: "スタンダードプラン",
    premium: "プレミアムプラン",
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

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    completed: { label: "完了", variant: "default" },
    pending: { label: "処理中", variant: "secondary" },
    failed: { label: "失敗", variant: "destructive" },
    cancelled: { label: "キャンセル", variant: "outline" },
  }
  return statusMap[status] || { label: status, variant: "outline" }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getDaysUntilExpiration = (expiresAt: string) => {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default function MyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          throw new Error("Failed to fetch profile")
        }
        const data = await response.json()
        setProfile(data)
      } catch (err) {
        console.error("Profile fetch error:", err)
        setError("プロフィールの取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditing && profile) {
      setEditName(profile.user.name)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setSaveError(null)
      setSaveSuccess(false)
    }
  }, [isEditing, profile])

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaveError(null)
    setSaveSuccess(false)

    // Validate password if new password is provided
    if (newPassword) {
      if (newPassword.length < 6) {
        setSaveError("パスワードは6文字以上で入力してください")
        return
      }
      if (newPassword !== confirmPassword) {
        setSaveError("新しいパスワードと確認用パスワードが一致しません")
        return
      }
      if (!currentPassword) {
        setSaveError("パスワードを変更する場合は、現在のパスワードを入力してください")
        return
      }
    }

    setIsSaving(true)

    try {
      const updateData: {
        name?: string
        currentPassword?: string
        newPassword?: string
      } = {}

      if (editName !== profile.user.name) {
        updateData.name = editName
      }

      if (newPassword) {
        updateData.currentPassword = currentPassword
        updateData.newPassword = newPassword
      }

      // Only send request if there are changes
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false)
        setIsSaving(false)
        return
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "更新に失敗しました")
      }

      setSaveSuccess(true)
      
      // Refresh profile data
      const profileResponse = await fetch("/api/user/profile")
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfile(profileData)
      }

      // Reset form and exit edit mode after a short delay
      setTimeout(() => {
        setIsEditing(false)
        setSaveSuccess(false)
      }, 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "更新に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setSaveError(null)
    setSaveSuccess(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || "プロフィールが見つかりませんでした"}</p>
            <Button onClick={() => router.push("/login")}>ログインページへ</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { user, membership, payment, allPayments } = profile
  const daysUntilExpiration = membership ? getDaysUntilExpiration(membership.accessExpiresAt) : null
  const isExpired = membership ? new Date(membership.accessExpiresAt) < new Date() : false
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration > 0 && daysUntilExpiration <= 30

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
              <Link
                href="/pricing"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                プラン選択
              </Link>
              <AuthButton />
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">マイページ</h1>
          <p className="text-gray-600">アカウント情報と会員権限の確認</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>アカウント情報</CardTitle>
                    <CardDescription>基本情報</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      編集
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">お名前</Label>
                        <Input
                          id="edit-name"
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="お名前を入力"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-display">メールアドレス</Label>
                        <Input
                          id="email-display"
                          type="email"
                          value={user.email}
                          disabled
                          className="bg-gray-100 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500">メールアドレスは変更できません</p>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">アカウント作成日</div>
                        <div className="text-gray-900">{formatDate(user.createdAt)}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">パスワードを変更</h3>
                      <p className="text-sm text-gray-600">
                        パスワードを変更する場合のみ、以下を入力してください。
                      </p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">現在のパスワード</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="現在のパスワードを入力"
                            disabled={isSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">新しいパスワード</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="新しいパスワード（6文字以上）"
                            disabled={isSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="新しいパスワードを再入力"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>

                    {saveError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{saveError}</p>
                      </div>
                    )}

                    {saveSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-600">プロフィールを更新しました</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? "保存中..." : "保存"}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        disabled={isSaving}
                        className="flex-1"
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">お名前</div>
                      <div className="text-lg font-semibold text-gray-900">{user.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">メールアドレス</div>
                      <div className="text-lg font-semibold text-gray-900">{user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">アカウント作成日</div>
                      <div className="text-gray-900">{formatDate(user.createdAt)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Status */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>会員権限</CardTitle>
                <CardDescription>アクセス権限の状態</CardDescription>
              </CardHeader>
              <CardContent>
                {membership ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      isExpired
                        ? "border-red-200 bg-red-50"
                        : isExpiringSoon
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-green-200 bg-green-50"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-lg">
                          {isExpired ? "❌ 期限切れ" : isExpiringSoon ? "⚠️ まもなく期限切れ" : "✅ アクティブ"}
                        </div>
                        <Badge variant={membership.isActive && !isExpired ? "default" : "destructive"}>
                          {membership.isActive && !isExpired ? "有効" : "無効"}
                        </Badge>
                      </div>
                      {!isExpired && daysUntilExpiration !== null && (
                        <div className="text-sm text-gray-600">
                          残り {daysUntilExpiration} 日
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">会員ID</div>
                        <div className="font-mono text-gray-900">{membership.username}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">権限付与日</div>
                        <div className="text-gray-900">{formatDate(membership.accessGrantedAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">有効期限</div>
                        <div className={`font-semibold ${
                          isExpired ? "text-red-600" : isExpiringSoon ? "text-yellow-600" : "text-gray-900"
                        }`}>
                          {formatDate(membership.accessExpiresAt)}
                        </div>
                      </div>
                      {membership.credentialsSentAt && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">認証情報送信日</div>
                          <div className="text-gray-900">{formatDateTime(membership.credentialsSentAt)}</div>
                        </div>
                      )}
                    </div>

                    {isExpired && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">
                          会員権限の有効期限が切れています。新しいプランをお申し込みください。
                        </p>
                        <Button
                          onClick={() => router.push("/pricing")}
                          className="w-full sm:w-auto"
                        >
                          プランを選択
                        </Button>
                      </div>
                    )}

                    {isExpiringSoon && !isExpired && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 mb-2">
                          会員権限の有効期限がまもなく切れます。継続をご希望の場合は、新しいプランをお申し込みください。
                        </p>
                        <Button
                          onClick={() => router.push("/pricing")}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          プランを選択
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">会員権限がありません</p>
                    <Button onClick={() => router.push("/pricing")}>
                      プランを選択
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>支払い履歴</CardTitle>
                <CardDescription>過去の決済情報</CardDescription>
              </CardHeader>
              <CardContent>
                {allPayments.length > 0 ? (
                  <div className="space-y-4">
                    {allPayments.map((pay) => {
                      const statusInfo = getStatusBadge(pay.status)
                      return (
                        <div
                          key={pay.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">
                                {getPlanLabel(pay.planType)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDateTime(pay.createdAt)}
                              </div>
                            </div>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                            <div>
                              <div className="text-xs text-gray-500">支払い方法</div>
                              <div className="text-sm font-medium text-gray-900">
                                {getPaymentMethodLabel(pay.paymentMethod)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">金額</div>
                              <div className="text-sm font-medium text-gray-900">
                                ¥{parseFloat(pay.totalAmount).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    支払い履歴がありません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push("/pricing")}
                  className="w-full"
                  variant="outline"
                >
                  プランを選択
                </Button>
                <Button
                  onClick={() => router.push("/")}
                  className="w-full"
                  variant="outline"
                >
                  トップページへ
                </Button>
                <Separator />
                <Button
                  onClick={() => router.push("/diagnosis")}
                  className="w-full"
                  variant="outline"
                >
                  診断を開始
                </Button>
              </CardContent>
            </Card>
          </div>
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

