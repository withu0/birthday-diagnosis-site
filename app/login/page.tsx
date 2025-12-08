"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: mode === "register" ? name : undefined,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "エラーが発生しました")
        setIsLoading(false)
        return
      }

      // Success - invalidate auth cache and redirect to home page
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      router.push("/")
      router.refresh()
    } catch (err) {
      setError("ネットワークエラーが発生しました")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-silver-vertical flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text-gold mb-2">
            誕生日診断サイト
          </h1>
        </div>

        {/* Auth Card */}
        <Card className="border-gold/30 bg-gradient-to-br from-white to-gold-light/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center gradient-text-gold">
              {mode === "login" ? "ログイン" : "新規登録"}
            </CardTitle>
            <CardDescription className="text-center text-silver-dark">
              {mode === "login"
                ? "アカウントにログインしてください"
                : "新しいアカウントを作成してください"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-silver-dark">お名前</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="お名前を入力"
                    required
                    disabled={isLoading}
                    className="border-gold/30 focus:border-gold"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-silver-dark">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  disabled={isLoading}
                  className="border-gold/30 focus:border-gold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-silver-dark">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "パスワード" : "6文字以上"}
                  required
                  minLength={mode === "register" ? 6 : undefined}
                  disabled={isLoading}
                  className="border-gold/30 focus:border-gold"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full gradient-bg-gold text-white hover:opacity-90 border-0" 
                disabled={isLoading}
              >
                {isLoading
                  ? "処理中..."
                  : mode === "login"
                    ? "ログイン"
                    : "登録"}
              </Button>
              <div className="text-center text-sm text-silver-dark">
                {mode === "login" ? (
                  <>
                    アカウントをお持ちでない方は{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register")
                        setError("")
                      }}
                      className="text-gold hover:underline font-medium"
                    >
                      新規登録
                    </button>
                  </>
                ) : (
                  <>
                    既にアカウントをお持ちの方は{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login")
                        setError("")
                      }}
                      className="text-gold hover:underline font-medium"
                    >
                      ログイン
                    </button>
                </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back to home link */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-gold hover:underline font-medium text-sm"
          >
            ← トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
