"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
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

export default function PaymentPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>("basic")
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

  const currentPlan = PLANS.find((p) => p.type === selectedPlan) || PLANS[0]
  const taxAmount = Math.floor(currentPlan.amount * TAX_RATE)
  const totalAmount = currentPlan.amount + taxAmount

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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

      // UnivaPay決済ページへリダイレクト
      if (data.paymentUrl) {
        console.log("Redirecting to UnivaPay:", data.paymentUrl)
        // 絶対URLの場合はそのまま、相対URLの場合は完全なURLに変換
        if (data.paymentUrl.startsWith("http://") || data.paymentUrl.startsWith("https://")) {
          window.location.href = data.paymentUrl
        } else {
          window.location.href = data.paymentUrl
        }
      } else if (data.email && data.password) {
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
      {/* ヘッダー */}
      <header className="border-b border-blue-200 bg-blue-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image
                src="/brand.avif"
                alt="12 SKINS"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {currentPlan.name}：{currentPlan.amount.toLocaleString()}円（税別）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* プラン選択 */}
            <div className="mb-6">
              <Label className="text-base font-semibold mb-3 block">プランを選択</Label>
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                {PLANS.map((plan) => (
                  <div key={plan.type} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={plan.type} id={plan.type} />
                    <Label htmlFor={plan.type} className="cursor-pointer">
                      {plan.name}：{plan.amount.toLocaleString()}円（税別）
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 支払い方法 */}
              <div>
                <Label className="text-base font-semibold mb-3 block">お支払い方法</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="cursor-pointer">
                      銀行振込
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card" className="cursor-pointer">
                      クレジットカード決済（分割払いも含む）
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct_debit" id="direct_debit" />
                    <Label htmlFor="direct_debit" className="cursor-pointer">
                      口座引き落とし分割払い（別途審査がございます）
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* ユーザー情報 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">会社名</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="bg-pink-50"
                  />
                </div>

                <div>
                  <Label htmlFor="name">
                    氏名 <span className="text-red-500">必須</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="bg-pink-50"
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    メールアドレス <span className="text-red-500">必須</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="bg-pink-50"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">
                    電話番号 <span className="text-red-500">必須</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    required
                    className="bg-pink-50"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">
                    郵便番号 <span className="text-red-500">必須</span>
                  </Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    required
                    className="bg-pink-50"
                  />
                </div>

                <div>
                  <Label htmlFor="address">
                    住所 <span className="text-red-500">必須</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                    className="bg-pink-50"
                  />
                </div>

                <div>
                  <Label>
                    性別 <span className="text-red-500">必須</span>
                  </Label>
                  <RadioGroup value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <div className="flex items-center space-x-2 mt-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="cursor-pointer">男性</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="cursor-pointer">女性</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>
                    生年月日 <span className="text-red-500">必須</span>
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Select value={formData.birthYear} onValueChange={(value) => handleInputChange("birthYear", value)}>
                      <SelectTrigger className="bg-pink-50">
                        <SelectValue />
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
                      <SelectTrigger className="bg-pink-50">
                        <SelectValue />
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
                      <SelectTrigger className="bg-pink-50">
                        <SelectValue />
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

              {/* 利用規約 */}
              <div>
                <Label className="text-base font-semibold mb-3 block">利用規約</Label>
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
                  className="h-48 bg-gray-50 text-sm"
                />
                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="cursor-pointer">
                    利用規約に同意する <span className="text-red-500">必須</span>
                  </Label>
                </div>
              </div>

              {/* 支払金額 */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">支払金額（税込）</span>
                  <span className="text-2xl font-bold">{totalAmount.toLocaleString()}円</span>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-700 hover:bg-gray-800 text-white py-6 text-lg"
                >
                  {isSubmitting ? "処理中..." : "確認する"}
                </Button>
              </div>
            </form>
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

