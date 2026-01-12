"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n/hooks"

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
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
        setError(data.error || t("common.error"))
        setIsLoading(false)
        return
      }

      // Success - invalidate auth cache and redirect to home page
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      router.push("/")
      router.refresh()
    } catch (err) {
      setError(t("common.networkError"))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-silver-vertical flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text-gold mb-2">
            {t("login.siteTitle")}
          </h1>
        </div>

        {/* Auth Card */}
        <Card className="border-gold/30 bg-gradient-to-br from-white to-gold-light/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center gradient-text-gold">
              {mode === "login" ? t("login.login") : t("login.register")}
            </CardTitle>
            <CardDescription className="text-center text-silver-dark">
              {mode === "login"
                ? t("login.loginDescription")
                : t("login.registerDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-silver-dark">{t("login.name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("login.namePlaceholder")}
                    required
                    disabled={isLoading}
                    className="border-gold/30 focus:border-gold"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-silver-dark">{t("login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  required
                  disabled={isLoading}
                  className="border-gold/30 focus:border-gold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-silver-dark">{t("login.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? t("login.passwordPlaceholder") : t("login.passwordPlaceholderRegister")}
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
                  ? t("login.processing")
                  : mode === "login"
                    ? t("login.login")
                    : t("login.register")}
              </Button>
              <div className="text-center text-sm text-silver-dark">
                {mode === "login" ? (
                  <>
                    {t("login.noAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register")
                        setError("")
                      }}
                      className="text-gold hover:underline font-medium"
                    >
                      {t("login.register")}
                    </button>
                  </>
                ) : (
                  <>
                    {t("login.hasAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login")
                        setError("")
                      }}
                      className="text-gold hover:underline font-medium"
                    >
                      {t("login.login")}
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
            {t("login.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  )
}
