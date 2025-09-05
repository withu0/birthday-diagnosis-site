"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// ダミー診断データ
const diagnosisData = {
  personalities: [
    {
      name: "情熱の炎",
      description:
        "あなたは燃えるような情熱を持つ人です。困難に立ち向かう勇気と、周りを引っ張るリーダーシップがあります。",
      traits: ["リーダーシップ", "情熱的", "勇敢", "決断力"],
      luckyColor: "赤",
      luckyNumber: 7,
      compatibility: "水の流れ",
    },
    {
      name: "静寂の月",
      description: "あなたは静かな知恵を持つ人です。深く考え、周りの人を癒す力があります。直感力に優れています。",
      traits: ["直感的", "癒し系", "思慮深い", "神秘的"],
      luckyColor: "銀",
      luckyNumber: 3,
      compatibility: "大地の守護者",
    },
    {
      name: "風の旅人",
      description: "あなたは自由を愛する冒険者です。新しいことに挑戦し、変化を恐れない柔軟性があります。",
      traits: ["自由奔放", "冒険好き", "柔軟性", "創造的"],
      luckyColor: "青",
      luckyNumber: 5,
      compatibility: "情熱の炎",
    },
    {
      name: "大地の守護者",
      description: "あなたは安定と信頼の象徴です。周りの人を支え、着実に目標を達成する力があります。",
      traits: ["安定感", "信頼性", "忍耐力", "責任感"],
      luckyColor: "緑",
      luckyNumber: 8,
      compatibility: "静寂の月",
    },
    {
      name: "水の流れ",
      description: "あなたは適応力に優れた人です。どんな環境でも自然に馴染み、人との調和を大切にします。",
      traits: ["適応力", "協調性", "優しさ", "包容力"],
      luckyColor: "水色",
      luckyNumber: 2,
      compatibility: "風の旅人",
    },
  ],
  fortunes: [
    "今日は新しい出会いがあなたの人生を変えるかもしれません。",
    "困難な状況も、あなたの持つ力で乗り越えられるでしょう。",
    "創造性を発揮する絶好のタイミングです。",
    "人との絆を深める良い機会が訪れます。",
    "直感を信じて行動すると良い結果が得られるでしょう。",
  ],
}

export default function BirthdayDiagnosis() {
  const [birthDate, setBirthDate] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDiagnosis = () => {
    if (!birthDate) return

    setIsLoading(true)

    // 生年月日から診断結果を生成（ダミーロジック）
    setTimeout(() => {
      const date = new Date(birthDate)
      const dayOfYear = Math.floor(
        (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
      )

      const personalityIndex = dayOfYear % diagnosisData.personalities.length
      const fortuneIndex = (dayOfYear + date.getDate()) % diagnosisData.fortunes.length

      setResult({
        personality: diagnosisData.personalities[personalityIndex],
        fortune: diagnosisData.fortunes[fortuneIndex],
        birthDate: date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      })
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center text-primary">✨ 誕生日診断 ✨</h1>
          <p className="text-center text-muted-foreground mt-2">あなたの生年月日から性格と運勢を診断します</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 入力セクション */}
        <Card className="mb-8 shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">生年月日を入力してください</CardTitle>
            <CardDescription>正確な診断のため、生年月日を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button
              onClick={handleDiagnosis}
              disabled={!birthDate || isLoading}
              className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
            >
              {isLoading ? "診断中..." : "診断する"}
            </Button>
          </CardContent>
        </Card>

        {/* 結果表示 */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-700">
            {/* 基本情報 */}
            <Card className="shadow-lg border-accent/30">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardTitle className="text-xl text-center">{result.birthDate} 生まれのあなた</CardTitle>
              </CardHeader>
            </Card>

            {/* 性格診断 */}
            <Card className="shadow-lg border-secondary/30">
              <CardHeader>
                <CardTitle className="text-2xl text-secondary flex items-center gap-2">🌟 あなたの性格タイプ</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">
                  {result.personality.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed">{result.personality.description}</p>

                <div>
                  <h4 className="font-semibold mb-2 text-foreground">あなたの特徴：</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.personality.traits.map((trait: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">ラッキーカラー</div>
                    <div className="font-semibold text-primary">{result.personality.luckyColor}</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">ラッキーナンバー</div>
                    <div className="font-semibold text-primary">{result.personality.luckyNumber}</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">相性の良いタイプ</div>
                    <div className="font-semibold text-primary">{result.personality.compatibility}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 今日の運勢 */}
            <Card className="shadow-lg border-accent/30">
              <CardHeader>
                <CardTitle className="text-2xl text-accent flex items-center gap-2">🔮 今日のメッセージ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-center italic">"{result.fortune}"</p>
              </CardContent>
            </Card>

            {/* リセットボタン */}
            <div className="text-center">
              <Button
                onClick={() => {
                  setResult(null)
                  setBirthDate("")
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
