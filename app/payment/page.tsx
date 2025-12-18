"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Script from "next/script"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth/auth-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

const PLANS = [
  { type: "basic", name: "12SKINS利用料", amount: 50000, taxExcluded: true },
  { type: "standard", name: "12SKINS利用料", amount: 80000, taxExcluded: true },
  { type: "premium", name: "12SKINS利用料", amount: 100000, taxExcluded: true },
] as const

const TAX_RATE = 0.1 // 10% 消費税

// UnivaPay configuration
const APP_ID = process.env.NEXT_PUBLIC_UNIVAPAY_APP_ID || ''
const RETURN_URL = process.env.NEXT_PUBLIC_UNIVAPAY_RETURN_URL || `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/return`

// Extend Window interface for UnivaPay widget
declare global {
  interface Window {
    UnivapayCheckout?: {
      create: (config: any) => {
        open: () => void
        close: () => void
      }
    }
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get plan from URL query parameter
  const planParam = searchParams.get("plan")
  const validPlan = planParam && ["basic", "standard", "premium"].includes(planParam) 
    ? planParam 
    : null
  
  // Redirect to pricing if no valid plan
  useEffect(() => {
    if (!validPlan) {
      router.push("/pricing")
    }
  }, [validPlan, router])

  const [selectedPlan] = useState<string>(validPlan || "basic")
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer")
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    phoneNumber: "",
    postalCode: "",
    address: "",
    gender: "",
    birthYear: "2000",
    birthMonth: "12",
    birthDay: "31",
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [widgetReady, setWidgetReady] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  const currentPlan = PLANS.find((p) => p.type === selectedPlan) || PLANS[0]
  const taxAmount = Math.floor(currentPlan.amount * TAX_RATE)
  const totalAmount = currentPlan.amount + taxAmount

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle credit card payment with UnivaPay widget
  const handleCreditCardPayment = useCallback(async (paymentId: string) => {
    if (!APP_ID) {
      alert("UnivaPay設定が不完全です。NEXT_PUBLIC_UNIVAPAY_APP_IDを設定してください。")
      setIsSubmitting(false)
      return
    }

    if (typeof window === 'undefined' || !window.UnivapayCheckout) {
      alert("UnivaPayウィジェットが読み込まれていません。しばらく待ってから再度お試しください。")
      setIsSubmitting(false)
      return
    }

    try {
      const checkout = window.UnivapayCheckout.create({
        appId: APP_ID,
        checkout: 'token',         // tokenization flow
        tokenType: 'one_time',     // create a one-time token
        cvvAuthorize: true,
        redirect: RETURN_URL || undefined,
        paymentMethods: ['card'],

        onTokenCreated: async (token: string | { id?: string; tokenId?: string; token?: string } | any) => {
          try {
            // Extract token ID - handle both string and object formats
            let tokenId: string
            if (typeof token === 'string') {
              tokenId = token
            } else if (token && typeof token === 'object') {
              tokenId = token.id || token.tokenId || token.token || String(token)
            } else {
              throw new Error("Invalid token format received from UnivaPay")
            }
            
            if (!tokenId || typeof tokenId !== 'string') {
              throw new Error("Invalid token format received from UnivaPay")
            }
            
            console.log("Token received from UnivaPay:", token, "Extracted tokenId:", tokenId)

            // Send token to backend to create charge
            const response = await fetch("/api/payment/checkout/charge", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentId,
                transaction_token_id: tokenId,
                amount: totalAmount,
                redirect_endpoint: RETURN_URL || undefined,
              }),
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || "決済処理に失敗しました")
            }

            // If UnivaPay instructs a redirect (e.g., 3DS), follow it
            const redirectInfo = data?.univapay?.redirect
            if (redirectInfo?.endpoint) {
              window.location.href = redirectInfo.endpoint
              return
            }

            // Check payment status and redirect accordingly
            const paymentStatus = data?.payment?.status || data?.univapay?.status
            if (paymentStatus === "completed" || paymentStatus === "successful") {
              // Payment succeeded immediately (no 3DS)
              router.push(`/payment/success?paymentId=${paymentId}`)
            } else if (paymentStatus === "failed" || paymentStatus === "cancelled") {
              // Payment failed
              router.push(`/payment/cancel?paymentId=${paymentId}`)
            } else {
              // Still pending, redirect to success page (will check status there)
              router.push(`/payment/success?paymentId=${paymentId}`)
            }
          } catch (err) {
            console.error("Charge creation error:", err)
            const errorMessage = err instanceof Error ? err.message : "決済処理中にエラーが発生しました"
            alert(errorMessage)
            
            // If we have paymentId, redirect to cancel page
            if (paymentId) {
              router.push(`/payment/cancel?paymentId=${paymentId}`)
            } else {
              setIsSubmitting(false)
            }
          }
        },

        onClose: () => {
          if (isSubmitting) setIsSubmitting(false)
        },

        onError: (err: any) => {
          alert(typeof err === 'string' ? err : (err?.message || 'ウィジェットエラー'))
          setIsSubmitting(false)
        },
      })

      checkout.open()
    } catch (err) {
      console.error("Widget error:", err)
      alert(err instanceof Error ? err.message : "ウィジェットの起動に失敗しました")
      setIsSubmitting(false)
    }
  }, [totalAmount, RETURN_URL, router, isSubmitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agreedToTerms) {
      alert("利用規約に同意してください")
      return
    }

    if (!formData.name || !formData.email || !formData.phoneNumber || 
        !formData.postalCode || !formData.address || !formData.gender) {
      alert("必須項目をすべて入力してください")
      return
    }

    setIsSubmitting(true)

    try {
      // For credit card, we need to create payment first, then open widget
      if (paymentMethod === "credit_card") {
        // Create payment record first
        const response = await fetch("/api/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planType: selectedPlan,
            paymentMethod,
            ...formData,
            amount: currentPlan.amount,
            taxAmount,
            totalAmount,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "支払い処理に失敗しました")
        }

        // Store payment ID and open UnivaPay widget
        setPaymentId(data.paymentId)
        await handleCreditCardPayment(data.paymentId)
        return
      }

      // For bank transfer, use existing flow
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: selectedPlan,
          paymentMethod,
          ...formData,
          amount: currentPlan.amount,
          taxAmount,
          totalAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "支払い処理に失敗しました")
      }

      if (data.email && data.password) {
        // 決済完了の場合
        // 開発モード: アカウント情報を表示
        const credentialsMessage = `決済が完了しました！\n\n以下の認証情報でログインできます：\n\nメールアドレス: ${data.email}\nパスワード: ${data.password}\n\n※この情報は画面に表示されるだけです。必ずメモを取ってください。`
        alert(credentialsMessage)
        
        // 成功ページにリダイレクト（認証情報をクエリパラメータで渡す）
        router.push(`/payment/success?paymentId=${data.paymentId}&email=${encodeURIComponent(data.email)}&password=${encodeURIComponent(data.password)}`)
      } else if (data.message) {
        // 銀行振込などの場合
        alert(data.message)
        router.push(`/payment/success?paymentId=${data.paymentId}`)
      } else {
        console.error("No payment URL received:", data)
        throw new Error("決済URLを取得できませんでした")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert(error instanceof Error ? error.message : "支払い処理中にエラーが発生しました")
      setIsSubmitting(false)
    }
  }

  // 年、月、日の選択肢を生成
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Load UnivaPay widget script */}
      <Script
        src="https://widget.univapay.com/client/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setWidgetReady(true)}
      />

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

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Plan Summary Card */}
        <Card className="mb-8 shadow-lg border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">選択中のプラン</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedPlan === "basic" ? "ベーシック" : selectedPlan === "standard" ? "スタンダード" : "プレミアム"}プラン
                </div>
                <div className="text-sm text-gray-600">
                  {currentPlan.amount.toLocaleString()}円（税別） / 税込: <span className="font-semibold text-lg">{totalAmount.toLocaleString()}円</span>
                </div>
              </div>
              <Link 
                href="/pricing"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                プランを変更 →
              </Link>
            </div>
          </CardContent>
        </Card>

        {!validPlan && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-yellow-800">
                プランが選択されていません。プラン選択ページにリダイレクトします...
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-xl font-semibold">お客様情報</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Payment Method */}
                  <div className="pb-6 border-b">
                    <Label className="text-base font-semibold mb-4 block">お支払い方法</Label>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("bank_transfer")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "bank_transfer"
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "bank_transfer" ? "border-blue-500" : "border-gray-300"
                            }`}>
                              {paymentMethod === "bank_transfer" && (
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">銀行振込</div>
                              <div className="text-sm text-gray-500">入金確認後に処理されます</div>
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("credit_card")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "credit_card"
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "credit_card" ? "border-blue-500" : "border-gray-300"
                            }`}>
                              {paymentMethod === "credit_card" && (
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">クレジットカード決済</div>
                              <div className="text-sm text-gray-500">分割払いも可能です</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-8 h-5 bg-gray-200 rounded"></div>
                            <div className="w-8 h-5 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("direct_debit")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "direct_debit"
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "direct_debit" ? "border-blue-500" : "border-gray-300"
                            }`}>
                              {paymentMethod === "direct_debit" && (
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">口座引き落とし分割払い</div>
                              <div className="text-sm text-gray-500">別途審査が必要です</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 mb-2 block">
                        会社名 <span className="text-gray-400 font-normal">(任意)</span>
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        placeholder="株式会社○○"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                        氏名 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="山田 太郎"
                        required
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                          メールアドレス <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="example@email.com"
                          required
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                          電話番号 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                          placeholder="090-1234-5678"
                          required
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 mb-2 block">
                        郵便番号 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        placeholder="123-4567"
                        required
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-2 block">
                        住所 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="東京都渋谷区..."
                        required
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                          性別 <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => handleInputChange("gender", "male")}
                            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                              formData.gender === "male"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="font-medium">男性</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange("gender", "female")}
                            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                              formData.gender === "female"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="font-medium">女性</div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                          生年月日 <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Select value={formData.birthYear} onValueChange={(value) => handleInputChange("birthYear", value)}>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                              <SelectValue placeholder="年" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}年
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={formData.birthMonth} onValueChange={(value) => handleInputChange("birthMonth", value)}>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                              <SelectValue placeholder="月" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month} value={month.toString()}>
                                  {month}月
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={formData.birthDay} onValueChange={(value) => handleInputChange("birthDay", value)}>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                              <SelectValue placeholder="日" />
                            </SelectTrigger>
                            <SelectContent>
                              {days.map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}日
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="pt-6 border-t">
                    <Label className="text-base font-semibold mb-3 block">利用規約</Label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <Textarea
                        readOnly
                        value={`[サイト利用規約]

この利用規約（以下「本規約」といいます）は、12SKINSサイト（以下「本サイト」といいます）の利用条件を定めるものです。本サイトをご利用いただく前に、必ず本規約をお読みいただき、内容をご理解の上、ご利用ください。

1. お申し込みについて
本サイトへのお申し込みは、本規約に同意いただいた上で行ってください。

2. お支払いについて
(1) 銀行振込の場合：指定銀行口座への入金が確認できた時点で、お支払い完了となります。
(2) クレジットカード決済の場合：お申し込みフォームに必要な情報を入力し、決済完了画面が表示された時点で、お支払い完了となります。
(3) 口座引き落とし分割払いの場合：別途審査が必要となります。審査完了後、初回引き落としが完了した時点で、お支払い完了となります。

3. 会員権限について
お支払い完了後、会員サイトへのアクセス用IDとパスワードをメールにてお送りいたします。
会員権限は、お支払い完了日から6ヶ月間有効です。

4. その他
本規約に定めのない事項については、当社の定める利用規約に従います。`}
                        className="h-auto min-h-[120px] bg-transparent border-0 text-sm text-gray-700 resize-none"
                      />
                    </div>
                    <div className="flex items-start gap-3 mt-4 p-4 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="terms" className="cursor-pointer text-sm text-gray-700 leading-relaxed">
                        利用規約の内容を確認し、同意いたします <span className="text-red-500">*</span>
                      </Label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting || (paymentMethod === "credit_card" && !widgetReady)}
                      className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      {isSubmitting 
                        ? "処理中..." 
                        : paymentMethod === "credit_card" && !widgetReady
                        ? "読み込み中..."
                        : "確認して決済に進む"}
                    </Button>
                    {paymentMethod === "credit_card" && !APP_ID && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        UnivaPay設定が不完全です。NEXT_PUBLIC_UNIVAPAY_APP_IDを設定してください。
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-lg font-semibold">注文内容</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">プラン</div>
                    <div className="font-semibold text-gray-900">
                      {selectedPlan === "basic" ? "ベーシック" : selectedPlan === "standard" ? "スタンダード" : "プレミアム"}プラン
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">小計（税別）</span>
                      <span className="text-gray-900">{currentPlan.amount.toLocaleString()}円</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">消費税（10%）</span>
                      <span className="text-gray-900">{taxAmount.toLocaleString()}円</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">合計金額</span>
                      <span className="text-2xl font-bold text-gray-900">{totalAmount.toLocaleString()}円</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">税込価格</div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>SSL暗号化通信で安全に決済</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>6ヶ月間のアクセス権限</span>
                      </div>
                    </div>
                  </div>
                </div>
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

