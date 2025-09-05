"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const calculateAge = (birthDate: string) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Helper functions to convert codes to Japanese names
const getColorName = (code: string): string => {
  const colorMap: { [key: string]: string } = {
    "R": "レッド",
    "O": "オレンジ", 
    "Y": "イエロー",
    "YG": "イエローグリーン",
    "G": "グリーン",
    "BG": "ブルーグリーン",
    "B": "ブルー",
    "P": "パープル",
    "W": "ホワイト",
    "K": "ブラック",
    "GY": "グレー"
  }
  return colorMap[code] || code
}

const getCoreName = (code: string): string => {
  const coreMap: { [key: string]: string } = {
    "S+": "ストレート",
    "S-": "ソフト",
    "T+": "ストレート",
    "T-": "ソフト",
    "C+": "カール",
    "C-": "ウェーブ"
  }
  return coreMap[code] || code
}

const BirthdayDiagnosis = () => {
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentThoughts, setCurrentThoughts] = useState("")
  const [futureGoals, setFutureGoals] = useState("")

  const handleDiagnosis = async () => {
    if (!birthDate || !name) return

    // Validate birth date
    const date = new Date(birthDate)
    const today = new Date()
    if (isNaN(date.getTime())) {
      alert("有効な生年月日を入力してください")
      return
    }
    if (date > today) {
      alert("未来の日付は入力できません")
      return
    }
    if (date.getFullYear() < 1900) {
      alert("1900年以降の生年月日を入力してください")
      return
    }

    setIsLoading(true)

    try {
      console.log("[v0] Starting diagnosis for:", name, birthDate)

      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ birthDate }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API request failed: ${response.status}`)
      }

      const diagnosisData = await response.json()
      console.log("[v0] Received diagnosis data:", diagnosisData)

      // Validate the response data
      if (!diagnosisData.snowColor || !diagnosisData.peachCore || !diagnosisData.surfaceColor || !diagnosisData.hideCore) {
        throw new Error("Invalid response data from API")
      }

      const date = new Date(birthDate)
      const age = calculateAge(birthDate)

      setResult({
        name,
        age,
        birthDate: date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }),
        snowColor: {
          code: diagnosisData.snowColor,
          name: getColorName(diagnosisData.snowColor),
        },
        peachCore: {
          code: diagnosisData.peachCore,
          name: getCoreName(diagnosisData.peachCore),
        },
        surfaceColor: {
          code: diagnosisData.surfaceColor,
          name: getColorName(diagnosisData.surfaceColor),
        },
        hideCore: {
          code: diagnosisData.hideCore,
          name: getCoreName(diagnosisData.hideCore),
        },
        currentYearRhythm: "#N/A",
        nextYearRhythm: "#N/A",
        todayRhythm: "#N/A",
        supportColor: "",
      })
    } catch (error) {
      console.error("[v0] Diagnosis error:", error)
      alert(`診断中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)

      const date = new Date(birthDate)
      const age = calculateAge(birthDate)

      setResult({
        name,
        age,
        birthDate: date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }),
        snowColor: { code: "YG", name: "イエローグリーン" },
        peachCore: { code: "T+", name: "ストレート" },
        surfaceColor: { code: "B", name: "ブルー" },
        hideCore: { code: "T-", name: "ソフト" },
        currentYearRhythm: "#N/A",
        nextYearRhythm: "#N/A",
        todayRhythm: "#N/A",
        supportColor: "",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              {["人", "人", "人", "人", "人"].map((icon, i) => (
                <span
                  key={i}
                  className={`text-2xl font-bold ${
                    i === 0
                      ? "text-red-600"
                      : i === 1
                        ? "text-orange-600"
                        : i === 2
                          ? "text-yellow-600"
                          : i === 3
                            ? "text-green-600"
                            : "text-blue-600"
                  }`}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-primary">あなたに必要なカラーを診断します</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 入力セクション */}
        <Card className="mb-8 shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">お名前と生年月日を入力してください</CardTitle>
            <CardDescription>正確な診断のため、お名前と生年月日を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">
                本人氏名
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="お名前を入力してください"
                className="text-lg p-3 border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthdate" className="text-base font-medium">
                生年月日
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="text-lg p-3 border-primary/30 focus:border-primary"
              />
            </div>
            <button
              onClick={handleDiagnosis}
              disabled={!birthDate || !name || isLoading}
              className="w-full text-lg py-6 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              style={{
                backgroundColor: !birthDate || !name || isLoading ? "#9ca3af" : "#2563eb",
                color: "#ffffff",
                border: "none",
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  診断中...
                </div>
              ) : (
                "診断する"
              )}
            </button>
          </CardContent>
        </Card>

        {/* 結果表示 */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-700">
            {/* Your Birthday Section */}
            <Card className="shadow-lg border-accent/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-pink-500 mb-2">Your Birthday</h2>
                  <div className="text-xl font-semibold border-b-2 border-black inline-block pb-1">
                    {result.birthDate}
                  </div>
                  <div className="mt-4 text-lg">
                    <span className="font-semibold">{result.name}</span> さん（{result.age}歳）
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Heart Diagram Section */}
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="relative flex justify-center items-center min-h-[300px]">
                  {/* Heart Shape */}
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full relative">
                      <div className="absolute inset-4 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full">
                        <div className="absolute inset-4 bg-black rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Labels with Arrows */}
                  <div className="absolute top-0 left-1/4 text-center">
                    <div className="text-pink-500 font-semibold">スノウカラー</div>
                    <div className="text-sm text-gray-600">（本質の色）</div>
                    <div className="text-xs text-gray-500">あなたの考え方</div>
                    <div className="text-xs text-gray-500">一人の時のあなた</div>
                  </div>

                  <div className="absolute top-0 right-1/4 text-center">
                    <div className="text-blue-500 font-semibold">ピーチコア</div>
                    <div className="text-sm text-gray-600">（本質の核）</div>
                    <div className="text-xs text-gray-500">心の奥の部分の個性</div>
                  </div>

                  <div className="absolute bottom-0 left-1/4 text-center">
                    <div className="text-pink-500 font-semibold">サーフェイスカラー</div>
                    <div className="text-sm text-gray-600">（表面の色）</div>
                    <div className="text-xs text-gray-500">行動パターン</div>
                    <div className="text-xs text-gray-500">大勢の時のあなた</div>
                  </div>

                  <div className="absolute bottom-0 right-1/4 text-center">
                    <div className="text-blue-500 font-semibold">ハイドコア</div>
                    <div className="text-sm text-gray-600">（隠れた核）</div>
                    <div className="text-xs text-gray-500">心の奥さらに奥の個性</div>
                    <div className="text-xs text-gray-500">強いストレス時や</div>
                    <div className="text-xs text-gray-500">表面時に出やすい</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-4 gap-4">
              <Card className="text-center p-4">
                <div className="font-semibold mb-2">スノウカラー</div>
                <div className="text-3xl font-bold text-green-500 bg-gray-100 p-4 rounded">{result.snowColor.code}</div>
                <div className="text-sm mt-2">（{result.snowColor.name}）</div>
              </Card>

              <Card className="text-center p-4">
                <div className="font-semibold mb-2">ピーチコア</div>
                <div className="text-3xl font-bold text-orange-600 bg-gray-100 p-4 rounded">
                  {result.peachCore.code}
                </div>
                <div className="text-sm mt-2">（{result.peachCore.name}）</div>
              </Card>

              <Card className="text-center p-4">
                <div className="font-semibold mb-2">2025年</div>
                <div className="text-sm mb-1">今年のリズム</div>
                <div className="text-lg font-bold bg-gray-100 p-4 rounded">{result.currentYearRhythm || "#N/A"}</div>
                <div className="text-sm mt-2">#N/A</div>
              </Card>

              <Card className="text-center p-4">
                <div className="font-semibold mb-2">2026年</div>
                <div className="text-sm mb-1">来年のリズム</div>
                <div className="text-lg font-bold bg-gray-100 p-4 rounded">{result.nextYearRhythm || "#N/A"}</div>
                <div className="text-sm mt-2">#N/A</div>
              </Card>

              <Card className="text-center p-4">
                <div className="font-semibold mb-2">サーフェイスカラー</div>
                <div className="text-3xl font-bold text-blue-500 bg-gray-100 p-4 rounded">
                  {result.surfaceColor.code}
                </div>
                <div className="text-sm mt-2">（{result.surfaceColor.name}）</div>
              </Card>

              <Card className="text-center p-4">
                <div className="font-semibold mb-2">ハイドコア</div>
                <div className="text-3xl font-bold text-orange-600 bg-gray-100 p-4 rounded">{result.hideCore.code}</div>
                <div className="text-sm mt-2">（{result.hideCore.name}）</div>
              </Card>

              <Card className="text-center p-4">
                <div className="font-semibold mb-2">今日のリズム</div>
                <div className="text-lg font-bold bg-gray-100 p-4 rounded">{result.todayRhythm || "#N/A"}</div>
                <div className="text-sm mt-2">#N/A</div>
              </Card>

              <Card className="text-center p-4 border-blue-500 border-2">
                <div className="font-semibold mb-2 text-blue-500">サポートカラー</div>
                <div className="bg-gray-100 p-4 rounded h-16">{result.supportColor}</div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-pink-500">💖</span>
                  <span className="font-semibold">今の自分で変えたいところはどこですか</span>
                </div>
                <Textarea
                  value={currentThoughts}
                  onChange={(e) => setCurrentThoughts(e.target.value)}
                  className="min-h-[80px] resize-none"
                  placeholder="ここに入力してください..."
                />
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-pink-500">💖</span>
                  <span className="font-semibold">将来どんな自分になりたいですか</span>
                </div>
                <Textarea
                  value={futureGoals}
                  onChange={(e) => setFutureGoals(e.target.value)}
                  className="min-h-[80px] resize-none"
                  placeholder="ここに入力してください..."
                />
              </Card>
            </div>

            <div className="text-center">
              <Button
                onClick={() => {
                  setResult(null)
                  setBirthDate("")
                  setName("")
                  setCurrentThoughts("")
                  setFutureGoals("")
                }}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                もう一度診断する
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">© 2024 誕生日診断サイト - あなたの運命を知る旅</p>
          <p className="text-sm text-muted-foreground mt-2">※ この診断は娯楽目的です</p>
        </div>
      </footer>
    </div>
  )
}

export default BirthdayDiagnosis
