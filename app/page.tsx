"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthButton } from "@/components/auth/auth-button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n/hooks"

export default function Home() {
  const router = useRouter()
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")

  const handleCategoryClick = (category: string) => {
    if (!name || !birthDate) {
      alert(t("home.nameAndBirthDateRequired"))
      return
    }
    router.push(`/diagnosis?name=${encodeURIComponent(name)}&birthDate=${encodeURIComponent(birthDate)}&category=${category}`)
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
              <LanguageSwitcher />
              <AuthButton />
            </nav>
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
            {t("home.title")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("home.subtitle")}
          </p>
        </div>

        {/* 入力セクション（ゴールド背景） */}
        <Card className="mb-12 gradient-bg-gold border-0 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center text-white mb-6">
              {t("home.startDiagnosis")}
            </h2>
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium">
                    {t("home.name")}
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                    placeholder={t("home.namePlaceholder")}
                    required
                    className="bg-white border-white text-gray-800"
              />
            </div>
            <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-white font-medium">
                {t("home.birthDate")}
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
            {t("home.selectCategory")}
          </h2>
          <p className="text-center text-gray-600 mb-8 text-sm">
            {t("home.categoryHint")}
          </p>

          {/* 8つの診断ボタン */}
          <div className="flex flex-wrap justify-center items-center md:gap-6 gap-2 max-w-4xl mx-auto">
            {[
              { key: "talent", labelKey: "home.talent", image: "/talent.avif" },
              { key: "impressive", labelKey: "home.impressive", image: "/impressive.avif" },
              { key: "work", labelKey: "home.work", image: "/work.avif" },
              { key: "stress", labelKey: "home.stress", image: "/stress.avif" },
              { key: "affair", labelKey: "home.affair", image: "/affair.avif" },
              { key: "marriage", labelKey: "home.marriage", image: "/marriage.avif" },
              { key: "like", labelKey: "home.like", image: "/like.avif" },
              { key: "faceMuscle", labelKey: "home.faceMuscle", image: "/muscle_button.avif" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleCategoryClick(item.key)}
                className="flex flex-col items-center justify-center md:p-4 p-0 rounded-full hover:scale-105 transition-transform flex-[0_0_calc(25%-1.125rem)]"
              >
                <Image
                  src={item.image}
                  alt={t(item.labelKey)}
                  width={100}
                  height={100}
                  className="mb-2 w-full h-full object-contain"
                />
              </button>
            ))}
            </div>
          </div>

          
        {/* 相性診断ボタン */}
        <div className="mb-12 flex justify-center">
          <Link href="/compatibility" className="w-full max-w-2xl mx-auto">
            <Button
              className="w-full bg-gradient-to-r from-gold via-gold-light to-gold text-white font-bold py-8 text-3xl shadow-2xl hover:shadow-3xl transition-all mysterious-glow mysterious-pulse mysterious-shimmer relative overflow-hidden"
            >
              <span className="relative z-10">{t("home.compatibilityDiagnosis")}</span>
              <div className="absolute inset-0 mysterious-shine"></div>
            </Button>
          </Link>
        </div>
      </main>

      {/* フッター */}
      {/* <footer className="border-t border-gold/30 bg-gradient-silver mt-12">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-silver-dark">© 2024 誕生日診断サイト - あなたの運命を知る旅</p>
          <p className="text-sm text-silver-dark mt-2">※ この診断は娯楽目的です</p>
        </div>
      </footer> */}
    </div>
  )
}
