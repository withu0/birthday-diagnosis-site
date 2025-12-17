"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get("paymentId")
  const email = searchParams.get("email")
  const password = searchParams.get("password")
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (paymentId) {
      // 決済完了を確認
      fetch(`/api/payment/verify?paymentId=${paymentId}`)
        .then((res) => res.json())
        .then((data) => {
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Payment verification error:", error)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [paymentId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center text-green-600">
              お支払いが完了しました
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-center">処理中...</p>
            ) : email && password ? (
              <>
                <p className="text-center mb-6">
                  お支払いありがとうございます。
                  <br />
                  以下の認証情報でログインできます。
                </p>
                
                <div className="space-y-4 bg-gray-50 p-6 rounded-lg border-2 border-blue-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      メールアドレス
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={email}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(email)}
                        className="whitespace-nowrap"
                      >
                        {copied ? "コピー済み" : "コピー"}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      パスワード
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={password}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(password)}
                        className="whitespace-nowrap"
                      >
                        {copied ? "コピー済み" : "コピー"}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 重要: この認証情報は画面に表示されるだけです。
                    <br />
                    必ずメモを取るか、コピーして安全な場所に保存してください。
                    <br />
                    このページを閉じると、パスワードを再度確認することはできません。
                  </p>
                </div>
                
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    ログインページへ
                  </Button>
                  <Button
                    onClick={() => router.push("/")}
                    variant="outline"
                    className="w-full"
                  >
                    トップページに戻る
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-center">
                  お支払いありがとうございます。
                  <br />
                  会員サイトへのアクセス情報をメールにてお送りいたしました。
                </p>
                <p className="text-center text-sm text-gray-600">
                  メールが届かない場合は、迷惑メールフォルダもご確認ください。
                </p>
                <div className="pt-4">
                  <Button
                    onClick={() => router.push("/")}
                    className="w-full"
                  >
                    トップページに戻る
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

