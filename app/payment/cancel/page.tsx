"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-blue-200 bg-blue-50">
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center text-red-600">
              お支払いがキャンセルされました
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center">
              お支払いがキャンセルされました。
              <br />
              再度お申し込みいただく場合は、支払いページからお手続きください。
            </p>
            <div className="pt-4">
              <Button
                onClick={() => router.push("/payment")}
                className="w-full"
              >
                支払いページに戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

