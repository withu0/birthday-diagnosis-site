"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthButton } from "@/components/auth/auth-button"
import { useCompatibilityDiagnosis, CompatibilityResult } from "@/lib/hooks/use-compatibility"

export default function CompatibilityPage() {
  const [personA, setPersonA] = useState({ name: "", birthDate: "" })
  const [personB, setPersonB] = useState({ name: "", birthDate: "" })
  
  const compatibilityMutation = useCompatibilityDiagnosis()
  const result = compatibilityMutation.data
  const loading = compatibilityMutation.isPending
  const error = compatibilityMutation.error?.message || null

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
                      placeholder="佐藤花子"
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

                <div className="border-t pt-4">
                  <p className="text-lg font-semibold text-gray-800 mb-4">
                    マッチング結果: {result.totalMatches}件の相性データが見つかりました
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 相性タイプ別結果 */}
            {result.results.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">相性タイプ別の結果</h2>
                {result.results.map((typeResult) => (
                  <Card key={typeResult.compatibilityType} className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {typeResult.name || `相性タイプ ${typeResult.compatibilityType}`} 
                        {/* ({typeResult.sheetName}) */}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {typeResult.count}件のマッチ
                      </p>
                      {typeResult.description && (
                        <p className="text-gray-700 mt-3 leading-relaxed">
                          {typeResult.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {typeResult.records.map((record, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 p-3 rounded border border-gray-200"
                          >
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-semibold">Aさん:</span> ピーチ {record.aPeach || "N/A"}, ハイド {record.aHard || "N/A"}
                              </div>
                              <div>
                                <span className="font-semibold">Bさん:</span> ピーチ {record.bPeach || "N/A"}, ハイド {record.bHard || "N/A"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
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
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-gold/30 bg-gradient-silver mt-12">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-silver-dark">© 2024 誕生日診断サイト - あなたの運命を知る旅</p>
          <p className="text-sm text-silver-dark mt-2">※ この診断は娯楽目的です</p>
        </div>
      </footer>
    </div>
  )
}

