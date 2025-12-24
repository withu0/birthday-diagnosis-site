"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthButton } from "@/components/auth/auth-button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useCompatibilityDiagnosis, CompatibilityResult } from "@/lib/hooks/use-compatibility"

// Helper function to get image path for skin types
const getSkinImagePath = (skinType: string): string => {
  const imageMap: Record<string, string> = {
    職人肌: "/basic/職人肌.webp",
    平和肌: "/basic/平和肌.webp",
    親分肌: "/basic/親分肌.webp",
    コミュ肌: "/basic/コミュ肌.webp",
    赤ちゃん肌: "/basic/赤ちゃん肌.webp",
    多才肌: "/basic/多才肌.webp",
    スマート肌: "/basic/スマート肌.webp",
    ドリーム肌: "/basic/ドリーム肌.webp",
    ポジティブ肌: "/basic/ポジティブ肌.webp",
    姉御肌: "/basic/姉御肌.webp",
    天才肌: "/basic/天才肌.webp",
    オリジナル肌: "/basic/オリジナル肌.webp",
  }
  return imageMap[skinType] || "/basic/オリジナル肌.webp"
}

// Skin type colors (full opacity for text)
const skinColors: Record<string, string> = {
  天才肌: "#e2a9f1",
  オリジナル肌: "#41b8d5",
  赤ちゃん肌: "#c1ff72",
  多才肌: "#ff914d",
  ポジティブ肌: "#ff751f",
  スマート肌: "#ffed00",
  親分肌: "#1800ad",
  姉御肌: "#0097b2",
  コミュ肌: "#38b6ff",
  ドリーム肌: "#ff66c4",
  職人肌: "#ff3131",
  平和肌: "#00bf63",
}

// Skin type background colors (10% opacity for backgrounds)
const skinBgColors: Record<string, string> = {
  天才肌: "rgba(226, 169, 241, 0.1)", // #e2a9f1
  オリジナル肌: "rgba(65, 184, 213, 0.1)", // #41b8d5
  赤ちゃん肌: "rgba(193, 255, 114, 0.1)", // #c1ff72
  多才肌: "rgba(255, 145, 77, 0.1)", // #ff914d
  ポジティブ肌: "rgba(255, 117, 31, 0.1)", // #ff751f
  スマート肌: "rgba(255, 237, 0, 0.1)", // #ffed00
  親分肌: "rgba(24, 0, 173, 0.1)", // #1800ad
  姉御肌: "rgba(0, 151, 178, 0.1)", // #0097b2
  コミュ肌: "rgba(56, 182, 255, 0.1)", // #38b6ff
  ドリーム肌: "rgba(255, 102, 196, 0.1)", // #ff66c4
  職人肌: "rgba(255, 49, 49, 0.1)", // #ff3131
  平和肌: "rgba(0, 191, 99, 0.1)", // #00bf63
}

// Icon component for compatibility level
const CompatibilityIcon = ({ iconType }: { iconType: string }) => {
  switch (iconType) {
    case "double-circle":
      return <span className="text-2xl">◎</span>
    case "single-circle":
      return <span className="text-2xl">○</span>
    case "triangle":
      return <span className="text-2xl">▲</span>
    default:
      return null
  }
}

interface SkinCompatibilityData {
  [skinType: string]: {
    [otherSkinType: string]: {
      compatibilityLevel: string
      iconType: string
      relationshipImage: string
    }
  }
}

export default function CompatibilityPage() {
  const [personA, setPersonA] = useState({ name: "", birthDate: "" })
  const [personB, setPersonB] = useState({ name: "", birthDate: "" })
  const [skinCompatibility, setSkinCompatibility] = useState<SkinCompatibilityData | null>(null)
  
  const compatibilityMutation = useCompatibilityDiagnosis()
  const result = compatibilityMutation.data
  const loading = compatibilityMutation.isPending
  const error = compatibilityMutation.error?.message || null

  // Load skin compatibility data from API
  useEffect(() => {
    fetch("/api/skin-compatibility")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch skin compatibility data")
        }
        return res.json()
      })
      .then((data) => setSkinCompatibility(data))
      .catch((err) => console.error("Failed to load skin compatibility data:", err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!personA.name || !personA.birthDate || !personB.name || !personB.birthDate) {
      return
    }

    compatibilityMutation.mutate({
      personA: {
        name: personA.name,
        birthDate: personA.birthDate,
      },
      personB: {
        name: personB.name,
        birthDate: personB.birthDate,
      },
    })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
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
              <nav className="flex items-center gap-6">
                <AuthButton />
              </nav>
            </div>
          </div>
        </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">相性診断</h1>
          <p className="text-lg text-gray-600">
            2人の生年月日から相性を診断します
          </p>
        </div>

        {/* 入力フォーム */}
        <Card className="mb-8 gradient-bg-gold border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-white">
              2人の情報を入力
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Person A */}
                <div className="space-y-4 bg-white/10 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Aさん</h3>
                  <div className="space-y-2">
                    <Label htmlFor="personA-name" className="text-white font-medium">
                      お名前
                    </Label>
                    <Input
                      id="personA-name"
                      type="text"
                      value={personA.name}
                      onChange={(e) => setPersonA({ ...personA, name: e.target.value })}
                      placeholder="山田太郎"
                      required
                      className="bg-white border-white text-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personA-birthDate" className="text-white font-medium">
                      生年月日
                    </Label>
                    <Input
                      id="personA-birthDate"
                      type="date"
                      value={personA.birthDate}
                      onChange={(e) => setPersonA({ ...personA, birthDate: e.target.value })}
                      required
                      className="bg-white border-white text-gray-800"
                    />
                  </div>
                </div>

                {/* Person B */}
                <div className="space-y-4 bg-white/10 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Bさん</h3>
                  <div className="space-y-2">
                    <Label htmlFor="personB-name" className="text-white font-medium">
                      お名前
                    </Label>
                    <Input
                      id="personB-name"
                      type="text"
                      value={personB.name}
                      onChange={(e) => setPersonB({ ...personB, name: e.target.value })}
                      placeholder="佐藤さくら"
                      required
                      className="bg-white border-white text-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personB-birthDate" className="text-white font-medium">
                      生年月日
                    </Label>
                    <Input
                      id="personB-birthDate"
                      type="date"
                      value={personB.birthDate}
                      onChange={(e) => setPersonB({ ...personB, birthDate: e.target.value })}
                      required
                      className="bg-white border-white text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-gold hover:bg-gray-100 font-bold py-6 text-lg"
              >
                {loading ? "診断中..." : "相性を診断する"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 結果表示 */}
        {result && (
          <div className="space-y-6">
            {/* 相性診断ボタン - 全体 */}
            <div className="flex justify-end mb-4">
              <Button className="gradient-bg-gold text-white hover:opacity-90 font-bold px-6 py-3 shadow-md">
                相性診断
              </Button>
            </div>

            {/* 基本情報 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">診断結果</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-800">{result.personA.name}さん (A)</h3>
                    <p className="text-sm text-gray-600">生年月日: {result.personA.birthDate}</p>
                    <div className="mt-4 space-y-2">
                      <p>
                        <span className="font-semibold">価値:</span> {result.personA.valuable} ({result.personA.valuable_lb})
                      </p>
                      <p>
                        <span className="font-semibold">問題:</span> {result.personA.problem} ({result.personA.problem_lb})
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-800">{result.personB.name}さん (B)</h3>
                    <p className="text-sm text-gray-600">生年月日: {result.personB.birthDate}</p>
                    <div className="mt-4 space-y-2">
                      <p>
                        <span className="font-semibold">価値:</span> {result.personB.valuable} ({result.personB.valuable_lb})
                      </p>
                      <p>
                        <span className="font-semibold">問題:</span> {result.personB.problem} ({result.personB.problem_lb})
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 相性タイプ別結果 */}
            {result.results.length > 0 && (
              <div className="space-y-4">
                {/* 相性診断ボタン - 価値観 */}
                <div className="flex justify-end mb-4">
                  <Button className="gradient-bg-gold text-white hover:opacity-90 font-bold px-6 py-3 shadow-md">
                    相性診断
                  </Button>
                </div>
                {result.results.map((typeResult) => (
                  <Card key={typeResult.compatibilityType} className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {/* {typeResult.name || `相性タイプ ${typeResult.compatibilityType}`}  */}
                        {/* ({typeResult.sheetName}) */}
                      </CardTitle>
                      {typeResult.description && (
                        <p className="text-gray-700 mt-3 leading-relaxed">
                          {typeResult.description}
                        </p>
                      )}
                    </CardHeader>
                    
                  </Card>
                ))}
              </div>
            )}

            {result.results.length === 0 && (
              <Card className="shadow-md">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">該当する相性データが見つかりませんでした。</p>
                </CardContent>
              </Card>
            )}

            {/* 個性の相性 (Skin Compatibility) */}
            {result.personA.essential_lb && result.personB.essential_lb && skinCompatibility && (
              <>
                {/* 相性診断ボタン - 個性 */}
                <div className="flex justify-end mb-4">
                  <Button className="gradient-bg-gold text-white hover:opacity-90 font-bold px-6 py-3 shadow-md">
                    相性診断
                  </Button>
                </div>
                <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">個性の相性</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {(() => {
                    const skinA = result.personA.essential_lb
                    const skinB = result.personB.essential_lb
                    const compatibility = skinCompatibility[skinA]?.[skinB]

                    if (!compatibility) {
                      return (
                        <div className="text-center text-gray-600">
                          <p>相性データが見つかりませんでした。</p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-6">
                        {/* Skin Type Display */}
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Person A Skin */}
                          <div className="rounded-lg p-6 border-2 bg-white">
                            <div className="flex flex-col items-center">
                              <div className="text-lg font-semibold text-gray-700 mb-2">
                                {result.personA.name}さん
                              </div>
                              <div
                                className="text-2xl font-bold mb-4"
                                style={{ color: skinColors[skinA] || "#000000" }}
                              >
                                {skinA}
                              </div>
                              <div className="relative w-48 h-48 md:w-64 md:h-64">
                                <img
                                  src={getSkinImagePath(skinA)}
                                  alt={skinA}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Person B Skin */}
                          <div className="rounded-lg p-6 border-2 bg-white">
                            <div className="flex flex-col items-center">
                              <div className="text-lg font-semibold text-gray-700 mb-2">
                                {result.personB.name}さん
                              </div>
                              <div
                                className="text-2xl font-bold mb-4"
                                style={{ color: skinColors[skinB] || "#000000" }}
                              >
                                {skinB}
                              </div>
                              <div className="relative w-48 h-48 md:w-64 md:h-64">
                                <img
                                  src={getSkinImagePath(skinB)}
                                  alt={skinB}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Compatibility Info */}
                        <div
                          className="rounded-lg p-6 space-y-4"
                          style={{ backgroundColor: skinBgColors[skinA] || "rgba(0, 0, 0, 0.05)" }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-gray-800">相性度:</span>
                            <CompatibilityIcon iconType={compatibility.iconType} />
                            <span className="text-lg font-bold text-gray-800">
                              {compatibility.compatibilityLevel}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="text-lg font-semibold text-gray-800">
                              人としての相性・関係性イメージ:
                            </div>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {compatibility.relationshipImage}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
              </>
            )}
          </div>
        )}
      </main>

      </div>
    </ProtectedRoute>
  )
}

