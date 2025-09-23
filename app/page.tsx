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

// Helper function to convert line breaks to JSX
const formatTextWithLineBreaks = (text: string) => {
  if (!text) return ""
  return text.split('\n').map((line, index) => (
    <span key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </span>
  ))
}

// Interface for the API response
interface DiagnosisResult {
  essential: string
  essential_lb: string
  attractive: string
  attractive_lb: string
  valuable: string
  valuable_lb: string
  problem: string
  problem_lb: string
  talent: {
    title: string
    subtitle: string
    content: string
    additionalTitle: string
    additionalContent: string
    valuableTitle: string
    valuableSubtitle: string
    energyScore: {
      action: string
      focus: string
      stamina: string
      creative: string
      influence: string
      emotional: string
      recovery: string
      intuition: string
      judgment: string
      adaptability: string
      total: string
    }
  }
  work: {
    recommend: string
    tenConcept: string
    workContent: string
  }
  like: {
    title: string
    subtitle: string
    content: string
  }
  impressive: {
    title: string
    subtitle: string
    strong: string
    likeDislike: string
  }
  loveAffair: {
    content: string
  }
  marriage: {
    content: string
  }
  stress: {
    plus: string
    minus: string
    fiveGrowth: string
  }
}

const BirthdayDiagnosis = () => {
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [result, setResult] = useState<DiagnosisResult | null>(null)
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

      const diagnosisData: DiagnosisResult = await response.json()
      console.log("[v0] Received diagnosis data:", diagnosisData)

      // Validate the response data
      if (!diagnosisData.essential || !diagnosisData.attractive || !diagnosisData.valuable || !diagnosisData.problem) {
        throw new Error("Invalid response data from API")
      }

      setResult(diagnosisData)
    } catch (error) {
      console.error("[v0] Diagnosis error:", error)
      alert(`診断中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
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
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* 基本情報 */}
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-primary">🎂 あなたの誕生日診断結果</CardTitle>
                <CardDescription className="text-lg">
                  {name} さん（{calculateAge(birthDate)}歳）の診断結果
                </CardDescription>
              </CardHeader>
            </Card>

            {/* 基本診断結果 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="text-center p-4 border-2 border-blue-200">
                <div className="font-bold text-blue-600 mb-2">本質</div>
                <div className="text-2xl font-bold text-blue-600 bg-blue-50 p-3 rounded">
                  {result.essential}
                </div>
                <div className="text-sm mt-2 text-gray-600">{result.essential_lb}</div>
              </Card>

              <Card className="text-center p-4 border-2 border-pink-200">
                <div className="font-bold text-pink-600 mb-2">魅力的</div>
                <div className="text-2xl font-bold text-pink-600 bg-pink-50 p-3 rounded">
                  {result.attractive}
                </div>
                <div className="text-sm mt-2 text-gray-600">{result.attractive_lb}</div>
              </Card>

              <Card className="text-center p-4 border-2 border-green-200">
                <div className="font-bold text-green-600 mb-2">価値観</div>
                <div className="text-2xl font-bold text-green-600 bg-green-50 p-3 rounded">
                  {result.valuable}
                </div>
                <div className="text-sm mt-2 text-gray-600">{result.valuable_lb}</div>
              </Card>

              <Card className="text-center p-4 border-2 border-red-200">
                <div className="font-bold text-red-600 mb-2">問題</div>
                <div className="text-2xl font-bold text-red-600 bg-red-50 p-3 rounded">
                  {result.problem}
                </div>
                <div className="text-sm mt-2 text-gray-600">{result.problem_lb}</div>
              </Card>
            </div>

            {/* 才能セクション */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-purple-600">🌟 才能・能力</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">メイン才能</h3>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="font-semibold text-purple-800">{formatTextWithLineBreaks(result.talent.title)}</div>
                      <div className="text-sm text-purple-600 mt-1">{formatTextWithLineBreaks(result.talent.subtitle)}</div>
                      <div className="text-sm text-gray-600 mt-2">{formatTextWithLineBreaks(result.talent.content)}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">追加才能</h3>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="font-semibold text-purple-800">{formatTextWithLineBreaks(result.talent.additionalTitle)}</div>
                      <div className="text-sm text-gray-600 mt-2">{formatTextWithLineBreaks(result.talent.additionalContent)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">価値観才能</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="font-semibold text-purple-800">{formatTextWithLineBreaks(result.talent.valuableTitle)}</div>
                    <div className="text-sm text-purple-600 mt-1">{formatTextWithLineBreaks(result.talent.valuableSubtitle)}</div>
                  </div>
                </div>

                {/* エネルギースコア */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">⚡ エネルギースコア</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Object.entries(result.talent.energyScore).map(([key, value]) => (
                      <div key={key} className="bg-gradient-to-br from-yellow-50 to-orange-50 p-3 rounded-lg text-center">
                        <div className="text-xs font-semibold text-gray-600 mb-1">
                          {key === 'action' ? '行動' : 
                           key === 'focus' ? '集中' :
                           key === 'stamina' ? '持久力' :
                           key === 'creative' ? '創造性' :
                           key === 'influence' ? '影響力' :
                           key === 'emotional' ? '感情' :
                           key === 'recovery' ? '回復' :
                           key === 'intuition' ? '直感' :
                           key === 'judgment' ? '判断' :
                           key === 'adaptability' ? '適応' :
                           key === 'total' ? '総合' : key}
                        </div>
                        <div className="text-lg font-bold text-orange-600">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 仕事セクション */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-blue-600">💼 仕事・キャリア</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-800 mb-2">おすすめ</div>
                  <div className="text-gray-700">{formatTextWithLineBreaks(result.work.recommend)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-800 mb-2">10のコンセプト</div>
                  <div className="text-gray-700">{formatTextWithLineBreaks(result.work.tenConcept)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-800 mb-2">仕事内容</div>
                  <div className="text-gray-700">{formatTextWithLineBreaks(result.work.workContent)}</div>
                </div>
              </CardContent>
            </Card>

            {/* 好きなものセクション */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-pink-600">❤️ 好きなもの</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-pink-50 p-4 rounded-lg">
                  <div className="font-semibold text-pink-800 mb-2">{formatTextWithLineBreaks(result.like.title)}</div>
                  <div className="text-sm text-pink-600 mb-2">{formatTextWithLineBreaks(result.like.subtitle)}</div>
                  <div className="text-gray-700">{formatTextWithLineBreaks(result.like.content)}</div>
                </div>
              </CardContent>
            </Card>

            {/* 印象セクション */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-indigo-600">✨ 印象・魅力</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="font-semibold text-indigo-800 mb-2">{formatTextWithLineBreaks(result.impressive.title)}</div>
                    <div className="text-sm text-indigo-600 mb-2">{formatTextWithLineBreaks(result.impressive.subtitle)}</div>
                    <div className="text-gray-700">{formatTextWithLineBreaks(result.impressive.strong)}</div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="font-semibold text-indigo-800 mb-2">好き・嫌い</div>
                    <div className="text-gray-700">{formatTextWithLineBreaks(result.impressive.likeDislike)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 恋愛・結婚セクション */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-center text-red-600">💕 恋愛</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-gray-700">{formatTextWithLineBreaks(result.loveAffair.content)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-center text-rose-600">💍 結婚・離婚</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-rose-50 p-4 rounded-lg">
                    <div className="text-gray-700">{formatTextWithLineBreaks(result.marriage.content)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ストレスセクション */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-orange-600">😰 ストレス・成長</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-semibold text-green-800 mb-2">プラス</div>
                    <div className="text-gray-700">{formatTextWithLineBreaks(result.stress.plus)}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="font-semibold text-red-800 mb-2">マイナス</div>
                    <div className="text-gray-700">{formatTextWithLineBreaks(result.stress.minus)}</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="font-semibold text-yellow-800 mb-2">5つの成長</div>
                    <div className="text-gray-700">{formatTextWithLineBreaks(result.stress.fiveGrowth)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 個人の感想セクション */}
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
