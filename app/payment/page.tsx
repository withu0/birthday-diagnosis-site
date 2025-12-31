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

  const [selectedPlan] = useState<string>(validPlan || "basic")
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card")
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
        allowCardInstallments: true,        // Enable installment payment options (支払い回数選択)
        // cardInstallmentOptions: [1, 3, 5, 6, 10, 12, 15, 18, 20, 24],  // Available installment options
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

      // For bank transfer and direct debit, redirect to check email page
      if (paymentMethod === "bank_transfer" || paymentMethod === "direct_debit") {
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

        // Redirect to check email page for bank transfer and direct debit
        router.push(`/payment/check-email?paymentId=${data.paymentId}`)
        return
      }

      // For other payment methods (should not reach here, but keeping for safety)
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
        // Other payment methods
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
            </div>
          </CardContent>
        </Card>

        {/* {!validPlan && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-yellow-800">
                プランが選択されていません。URLに?plan=basic、?plan=standard、または?plan=premiumを追加してください。
              </p>
            </CardContent>
          </Card>
        )} */}

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
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                        {`このサイト利用規約（以下「本規約」という。）は、株式会社美容総研（以下「当社」という。）が運営するサイト「12SKINS」（以下「本サービス」という。）に関し、その利用者及び利用希望者との間で本サービスの利用及び諸手続きについて適用されるものとします。

本規約を十分お読みいただき、ご理解いただいた上でお申込みください。 お申込みいただいた時点で、本規約に同意したものとします。

 

第1条【利用申込み】

１．当社が別途定める所定の方法に従って行っていただきます。申込み及び当社の承諾の後、受講料の決済が完了した時点で当社と利用希望者との間で利用契約（以下「本契約」という。）が成立するものとします。

決済完了時点は支払方法により異なります。

　(1)銀行振込の場合は当社が指定する銀行口座に指定の金額全額入金した時点

　(2)クレジットカードの場合は申込フォームに必要情報を入力し、決済完了画面が表示された時点

　(3)分割払いの場合はショッピングクレジットに審査通過した時点

２．未成年者が本サービスの登録をする場合には、法定代理人の同意を得た上で登録を申請するものとします。未成年者が登録を申請した時点で、本サービスの登録、本規約への同意及び本利用契約の締結について、法定代理人の同意があったものとみなします。本規約の同意時に未成年であった利用者が成年に達した後に本サービスを利用した場合、当該利用者は、本サービスに関する一切の法律行為を追認したとみなされます。

第2条【利用承諾】

１．当社は希望者より本サイト上に掲載する手続、又は当社が定める他の手続によって受講申込みを受けた時、利用希望者に対して受講を承諾する旨を電子メール、電話、チャット又はその他当社が適切と判断する方法にて通知するものとします。

２．当社は利用希望者が以下の各号のいずれかに該当する場合、希望者からの申込みを拒否できるものとし、その理由を回答する義務を負わないものとします。

　(1) 利用希望者が過去において当社が提供するサービスに関する利用規約違反などにより、利用取り消しが行われている場合

　(2) 利用希望者が過去において当社が提供するサービスに関する返金の申し出により、返金を受領している場合

　(3) 申込内容に虚偽の情報を記載する等の不正行為があった場合

　(4) 未成年者であり、法定代理人の同意等を得ていなかった場合

　(5) その他、当社が希望者を利用者とすることを不適切と判断した場合

３．当社と利用者間の本サービスの提供に関わる本契約は、利用料金を第１条のいずれかの方法で決済が完了したときに有効に成立し、 利用希望者は、本規約の定めに従い利用者たる資格を取得するものとします。

４．当社は利用申込みの承諾後であっても、当社が承諾した利用者が、本条第２項各号のいずれかに該当すると判明した場合又は本規約に違反した場合は、当該利用者に対する通知をもって申込みの承諾を取り消すことができるものとします。

 

第3条【決済方法】

本サイトの利用料の決済方法は次に定める通りとします。

（１）銀行振込（一括払い）

（２）クレジットカード（一括または分割払い）

（３）ショッピングクレジット（分割払い）

当社が別途定める決済期日までに、当社が別途指定する銀行口座への振込若しくはクレジットカード決済システムによる支払い手続き若しくはショッピングクレジット（分割払い）へのお申込みをもって、利用料をお支払いください。(※銀行振込手数料は利用者が負担するものとします。（３）のご利用には別途分割手数料が発生します。)

 

第4条【キャンセルポリシー】

１．（キャンセル可能期間）

利用希望者又は利用者（以下総称して「利用希望者等」という。）は、本サービスの利用申込みの撤回（キャンセル）を希望する場合、本サイト利用前まで（以下、「キャンセル可能期間」という。）に限り、キャンセルを申請することができます。ただし、利用希望者等が本サービスへのログイン情報を入手した後は、キャンセルを申請することはできません。

２．（キャンセル時の受講料の返金）

受講希望者等は、前項のキャンセル可能期間までに、当社においてキャンセルの処理が完了することを条件として、振込手数料、クレジットカード決済手数料（利用料のお支払い時にクレジットカード決済をご利用された場合）を差し引いた利用料の返金を受けることができます。

３．（キャンセル可能期間経過後の取扱い）

本規約に明示する場合を除き、キャンセル可能期間の経過後において、本契約の解約を希望する場合、既に当社に対して支払済みの利用料に対応する本サービスの利用期間中は、本契約は終了せず、当該利用期間が終了した時点で本契約解約の効力が発生し、本契約が終了するものとします。当社の故意又は重過失に起因する場合を除き、当該支払い済みの利用料に対応する利用期間中は、本サービスは終了せず、当該期間にかかる利用料の返金は一切行いません。

 

第5条【提供サービス】

１．（サイト利用期間）

本サービス（提供内容は次項各号のとおりです。）における利用期間は、

利用開始日を第１日目として起算した180日目を本サービス利用の終了日とします。

２（重要事項説明の確認）

利用者は、本サービスの利用を開始する前に、当社所定の方式に従い、サイト利用における重要事項説明を受けるものとし、

本条各項の内容を含む重要事項説明を必ず確認及び理解した上で、本サービスの利用を開始するものとします。

第6条【本サービスに関する禁止行為及び違約金】

１．当社は、利用者に対し、利用者が、本サービスを受けるにあたり、以下の各号の行為を行うことを禁じます。

　(1) 利用中や利用の前後に関わらず、他の利用者、講師、スタッフ、当社にかかる全ての関係者への批判、誹謗中傷その他名誉若しくは信用を傷つける行為、迷惑行為及び本サービス進行を妨げる行為

　(2) 当社の事前の承諾を得ずに行う、本サービスを通じ、又は本サービスに関連した営利を目的とする行為及びそれに準ずる行為

(ネットワークビジネス、宗教などの勧誘、その他当社がそれに準ずると判断する行為) 若しくはそれらの準備行為

　(3) 法律に違反する、又は違反するおそれのある行為

　(4) その他、当社が不適切と判断した行為

　(5) 他人に対し、本サービスに関する自己の ID、パスワード等を譲渡、貸与、利用させる等の行為

２．当社は、利用者が前項各号に記載されている禁止事項、本規約、利用者との間で個別に規定した特約その他本契約で定める事項に違反する行為を

行い又は行うおそれがあるものと当社が判断した場合は、当該利用者に対する本サービスの提供、当社サービスの利用等の一切をさせないことができます。

3．前項の規定により利用者が本サービスを利用できない場合であっても、既に支払った利用料に対応する利用期間にかかる利用料の返金は一切行いません。

4．利用者は、本条第１項５号に違反して、本サービスに関する自己の ID、パスワード等を他人に対し譲渡、貸与、利用させる等の行為をした場合、当社に対して、

違約金 3００万円を支払う義務を負います。ただし、利用者による違約金の支払いは、当社の受講者に対する損害賠償請求を妨げません。

第7条【著作物等に関する禁止行為及び違約金】

１．当社は、利用者との間で、本サービスの利用において、利用者が受領したテキスト等の著作物等（本サービスに関するノウハウ等の無体財産権を含め、

以下「本著作物等」という。）に関する著作権(著作権法第２７条及び第２８条に定める権利を含む。)その他の知的財産権（以下「著作権等」という。）は

全て当社に帰属することを確認し、利用者が当社の事前の承諾を得ずに、当該著作権等を侵害する行為（次の各号に掲げる行為を含むが、これらに限らない。）を行うことを禁じます。

　(1) 本著作物等の内容を、自己又は第三者の名前若しくは匿名等名義の如何に関わらず、ウェブサイトに掲載する等インターネットを通じて公衆に送信する行為

　(2) 本著作物等の内容を、引用の範囲を超えて自己又は第三者の著作物に掲載する行為

　(3) 私的利用の範囲を超えて、本著作物等を複製・改変等をして第三者に配布する行為

２．前項１号から３号の禁止規定に違反する行為又は当社の著作権等を侵害する行為があった場合、利用者は、当社に対し、

違約金 3００万円を支払う義務を負います。ただし、利用者による違約金の支払いは、当社の利用者に対する損害賠償請求を妨げません。

第8条【利用停止、退会処分】

１．当社は、利用者が次の各号のいずれかに該当し、又はそのおそれがあると当社が判断した場合、当該利用者に対して、

本サービスの利用の一時停止又は退会の処分を行うことができるものとします。その場合の措置に関する質問・苦情は一切受け付けておりません。

また、当社は、本条に基づき当社が行った措置に関連して受講者に損害が生じたとしても一切の責任を負いません。

　(1)第６条、第７条に定める禁止行為を行った場合

　(2)本規約の各規定に違反した場合

　(3)本サービスの利用に関し当社又は当社講師からの指示等に従わなかった場合

　(4)その他当社が利用者による本サービスの利用を不適切と判断した場合

２．利用者が前項に基づき当社から一時停止の処分を受けた場合であっても、当該利用者の利用期間の延長及び利用料金の返金はいたしません。

また、退会の処分を行った場合、当該利用者に対して利用料金の返金を一切行わないものとします。利用者は予めこれらの取り扱いに同意した上で本サービスを利用するものとします。

第9条【利用者の責任】

１．（必要な機器の準備等）

本サービスの提供を受けるために必要な、コンピュータ、Webカメラ、マイク、スマートフォンその他の機器、

ソフトウェア、通信回線その他の通信環境等は、受講者の費用と責任において準備し維持するものとします。当社は、本サービスがあらゆる機器等に適合することを保証するものではありません。

２．（自己の責任による利用）

利用者は、自らの責任において本サービスを利用するものとし、本サービスにおいて行った一切の行為及びその結果について一切の責任を負うものとします。

３．（第三者との紛争）

本サービスに関連して利用者と第三者との間において生じた紛争等については利用者の責任において解決するものとし、当社はかかる紛争等について一切責任を負いません。

第10条【非保証及び損害賠償】

１．当社は、本規約に明示するものを除き、 本サービスにつき如何なる保証も行うものでもなく、本サービスに事実上又は法律上の不適合がないことを保証するものではありません。

２．利用者は、本サービスを利用したことに関連して、当社が直接的若しくは間接的に何らかの損害

（逸失利益及び弁護士費用の負担を含みます。）を被った場合（当社が利用者による本サービスの利用を原因とする請求等を第三者より受けた場合を含みます。）、

当社の請求に従って直ちにこれを賠償するものとします。

３．当社は、当社による本サービスの提供の停止、終了又は変更、退会処分、本サービスの利用によるデータの消失又は機器の故障等、

その他本サービスに関連して受講者が被った損害につき、当社の故意又は重過失に起因する場合を除き、賠償する責任を一切負わないものとします。

第11条【サービスの変更又は譲渡等】

１．（本サービスの変更）

当社は、当社が必要と判断し、かつ本サービスの変更が利用者の利益に資する場合、あらかじめ利用者に通知することなく、いつでも、本サービスの全部又は一部の内容を変更することができるものとします。

２．（本サービスの終了）

当社は、当社の都合により、本サービスの提供を終了することができます。この場合、当社は利用者に事前に通知するものとします。

３．（利用者の限定）

当社は、本サービスの全部又は一部を、年齢、本人確認の有無その他の当社所定の条件を満たした利用者に限定して提供することができるものとします。

４．（事業譲渡等）

当社が本サービスにかかる事業について、第三者に譲渡等をする場合（事業譲渡、会社分割その他本サービスにかかる契約上の地位が

移転する一切の場合を含む。）には、当該事業の譲渡等に伴い、受講者の本規約に基づく契約上の地位、本規約に基づく権利・

義務及び受講者登録に伴い登録された情報その他の情報を、当社は当該事業の譲受人等に移転させることができるものとし、受講者は、かかる譲渡等につき予め承諾するものとします。

第12条【秘密保持】

当社は、利用者に対し、本サービスを利用するにあたり、当社によって開示された当社固有の技術上、

営業上その他事業上の秘密に関わる情報並びに他の利用者により開示されたそのプライバシーに関わる情報を秘密として扱うものとし、

これらの情報を使用し、又は第三者に開示することを禁じます。

第13条【免責事項】

本サービス及び当社で提供している全てのコンテンツは、作成時点で得られる情報を元に、

細心の注意を払って作成しておりますが、その内容の目的適合性、正確性及び安全性を保証するものではありません。

当該情報に基づいて被ったいかなる損害についても、情報提供者及び当社は故意又は重過失に起因する場合を除き、

一切の責任を負うことはありませんので、ご了承ください。

第13条【個人情報の利用について】

１．当社では、本契約の遂行において取得した個人情報を、本契約の遂行、料金のご請求に関する業務、

本サービス及びその他当社サービスに関するご案内、お問い合わせ等への対応、アフターサービス対応、ご意見・ご感想の依頼やアンケート調査のために使用します。

また、法令の規定等による場合を除き、利用者等の同意を得ずに第三者に提供することはございません。

２．前項の利用目的達成の範囲内にて業務委託する際には、選定基準に基づき個人情報を安全に管理できる委託先を選定した上で当該委託先を適切に監督いたします。

３．個人情報の提供については、利用者等の自由なご判断にお任せいたしますが、必要事項の中でご提供いただけない個人情報の開示・追加・削除・利用又は提供を

拒否される場合については、下記の当社お問い合わせ先までご連絡ください。

第14条【本サービスの提供の停止等】

当社は、次の各号のいずれかの事由があると判断した場合、受講者に事前に通知することなく本サービスの全部又は

一部の提供を停止又は中断することができるものとします。また、特段の事情がない限り、その賠償の責任を負いません。

（1）本サービスにかかるコンピュータシステムの保守点検又は更新を行う場合

（2）地震、落雷、火災、停電又は天災などの不可抗力により、本サービスの提供が困難となった場合

（3）アクセス過多、その他予期せぬ要因でシステムに負荷が集中した場合

（4）コンピュータ又は通信回線等が事故により停止した場合

（5）法令又はこれらに基づく措置により本サービスの運営が不能となった場合

（6）その他、当社が本サービスの提供が困難と判断した場合

第15条【分離可能性】

１．本規約のいずれかの条項又はその一部が無効又は執行不能と判断された場合であっても、本規約の残りの規定

（無効又は執行不能と判断された規定以外の条項及び又は条項の部分）は影響を受けず、その後も有効なものとして存続するものとします。

２．前項の場合、当社及び利用者は、当該無効若しくは執行不能の規定の条項又は部分を適法とし、

執行力を持たせるために必要な範囲で修正し、当該条項又は部分の趣旨並びに法律的及び経済的効果を確保できるように努めるものとします。

第16条【変更権】

１．当社は、以下各号の場合には、本規約を変更することができます。

(1) 本規約の変更が、利用者等に一般の利益に適合するとき

(2) 本規約の変更が、本契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性、その他の事情に照らして合理的なものであるとき

２．前項に従い本規約を変更する場合、当社は、その効力発生時期を定め、かつ本規約を変更する旨及び変更後の本規約の内容並びにその効力発生時期を当社ホームページ上において公開いたします。

第21条【準拠法及び管轄裁判所】

本契約の準拠法は日本法とし、本契約に起因し又は関連する一切の紛争については、当社の本店所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。

【株式会社美容総研】

〒104-0061

東京都中央区銀座７丁目１３ー２１銀座新六洲ビル２階

お問合せメールアドレスbiyosoken@gmail.com`}
                      </div>
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

