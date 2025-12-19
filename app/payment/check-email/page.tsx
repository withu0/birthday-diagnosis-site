"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CheckEmailPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-900">
              お申込みありがとうございます
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              
              <p className="text-lg text-gray-800 font-medium">
                メールをご確認ください
              </p>
              
              <p className="text-gray-600">
                お申込み内容とお支払い方法のご案内をメールにてお送りいたしました。
                <br />
                メールに記載されている内容をご確認の上、お手続きをお願いいたします。
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-yellow-800">
                  <strong>ご注意：</strong>
                  <br />
                  メールが届かない場合は、迷惑メールフォルダもご確認ください。
                  <br />
                  銀行振込の場合は、入金確認後、管理者がアカウントを作成いたします。
                </p>
              </div>
            </div>
            
            <div className="pt-6 space-y-3">
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                トップページに戻る
              </Button>
              <Button
                onClick={() => router.push("/mypage")}
                variant="outline"
                className="w-full"
              >
                マイページへ
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-gray-50 mt-12">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 text-sm">
            Copyright © 株式会社美容総研 All Rights Reserved. Powered by MyASP (マイスピー)
          </p>
        </div>
      </footer>
    </div>
  )
}

