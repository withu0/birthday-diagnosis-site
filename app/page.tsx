"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthButton } from "@/components/auth/auth-button"
import { useAdmin } from "@/lib/hooks/use-admin"

export default function Home() {
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")

  const handleCategoryClick = (category: string) => {
    if (!name || !birthDate) {
      alert("お名前と生年月日を入力してください")
      return
    }
    router.push(`/diagnosis?name=${encodeURIComponent(name)}&birthDate=${encodeURIComponent(birthDate)}&category=${category}`)
  }
  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="border-b border-gold/30 bg-white">
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
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="border-silver text-silver-dark text-sm"
                onClick={() => router.push("/payment")}
              >
                お支払い
              </Button>
              <Button variant="outline" className="border-silver text-silver-dark text-sm">
                履歴検索ページ
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  className="border-silver text-silver-dark text-sm"
                  onClick={() => router.push("/admin")}
                >
                管理画面
              </Button>
              )}
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* ブランドタイトル */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <Image
              src="/brand.avif"
              alt="12 SKINS - Your skin, Your story"
              width={400}
              height={150}
              className="mx-auto h-auto w-auto max-w-full"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            肌診断で理想の美しさへ
          </h1>
          <p className="text-lg text-gray-600">
            あなたの生年月日とお名前から、パーソナライズされた美容診断を受けましょう
          </p>
        </div>

        {/* 入力セクション（ゴールド背景） */}
        <Card className="mb-12 gradient-bg-gold border-0 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center text-white mb-6">
              診断を開始
            </h2>
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium">
                    お名前
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                    placeholder="山田太郎"
                    required
                    className="bg-white border-white text-gray-800"
              />
            </div>
            <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-white font-medium">
                生年月日
              </Label>
              <Input
                    id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                    required
                    className="bg-white border-white text-gray-800"
              />
            </div>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* 診断タイプ選択セクション */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            診断タイプを選択してください
          </h2>
          <p className="text-center text-gray-600 mb-8 text-sm">
            見たい項目を押すと、一番上に表示されます
          </p>

          {/* 8つの診断ボタン */}
          <div className="flex flex-wrap justify-center items-center gap-6 max-w-4xl mx-auto">
            {[
              { key: "talent", label: "才能", image: "/talent.avif" },
              { key: "impressive", label: "印象", image: "/impressive.avif" },
              { key: "work", label: "仕事", image: "/work.avif" },
              { key: "stress", label: "ストレス", image: "/stress.avif" },
              { key: "affair", label: "恋愛", image: "/affair.avif" },
              { key: "marriage", label: "結婚", image: "/marriage.avif" },
              { key: "like", label: "好き嫌い", image: "/like.avif" },
              { key: "faceMuscle", label: "顔の筋肉の癖", image: "/muscle_button.avif" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleCategoryClick(item.key)}
                className="flex flex-col items-center justify-center p-4 rounded-full hover:scale-105 transition-transform flex-[0_0_calc(25%-1.125rem)]"
              >
                <Image
                  src={item.image}
                  alt={item.label}
                  width={100}
                  height={100}
                  className="mb-2 w-full h-full object-contain"
                />
              </button>
            ))}
            </div>
          </div>
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
