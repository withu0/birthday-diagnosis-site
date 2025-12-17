"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const chargeId = useMemo(
    () => searchParams.get("univapayChargeId") || searchParams.get("charge_id") || "",
    [searchParams]
  )
  const tokenId = useMemo(
    () => searchParams.get("univapayTokenId") || searchParams.get("token_id") || "",
    [searchParams]
  )
  const status = useMemo(() => searchParams.get("status") || "", [searchParams])
  const paymentId = useMemo(() => searchParams.get("paymentId") || "", [searchParams])

  const [seconds, setSeconds] = useState(5) // redirect countdown
  const [auto, setAuto] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // Check payment status when component mounts or paymentId changes
  useEffect(() => {
    if (!paymentId) {
      setIsChecking(false)
      return
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment/verify?paymentId=${paymentId}`)
        const data = await response.json()
        
        if (data.status) {
          setPaymentStatus(data.status)
        }
      } catch (error) {
        console.error("Failed to check payment status:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkPaymentStatus()

    // Poll payment status every 3 seconds for up to 30 seconds (for webhook updates)
    const pollInterval = setInterval(() => {
      checkPaymentStatus()
    }, 3000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
    }, 30000) // Stop polling after 30 seconds

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [paymentId])

  // Auto-redirect based on payment status
  useEffect(() => {
    if (!auto || isChecking || !paymentStatus) return

    if (paymentStatus === "completed") {
      // Redirect to success page immediately if completed
      if (seconds <= 0) {
        router.push(`/payment/success?paymentId=${paymentId}`)
        return
      }
    } else if (paymentStatus === "failed" || paymentStatus === "cancelled") {
      // Redirect to cancel page if failed
      if (seconds <= 0) {
        router.push(`/payment/cancel?paymentId=${paymentId}`)
        return
      }
    } else {
      // Still pending, wait for countdown
      if (seconds <= 0) {
        router.push(`/payment/success?paymentId=${paymentId}`)
        return
      }
    }

    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [auto, seconds, router, paymentId, paymentStatus, isChecking])

  const banner = (() => {
    const statusLower = status.toLowerCase()
    if (statusLower === "successful" || statusLower === "completed" || statusLower === "paid") {
      return {
        cls: "border-green-200 bg-green-50 text-green-700",
        text: "3Dセキュア認証が正常に完了しました。決済が完了次第、会員権限が付与されます。",
      }
    }
    if (statusLower === "failed" || statusLower === "error" || statusLower === "cancelled") {
      return {
        cls: "border-red-200 bg-red-50 text-red-700",
        text: "3Dセキュア認証が失敗したか、キャンセルされました。再度お試しください。",
      }
    }
    return {
      cls: "border-amber-200 bg-amber-50 text-amber-800",
      text: "3Dセキュア認証から戻りました。決済状況を確認中です。",
    }
  })()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">決済処理中</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            3Dセキュア認証の処理が完了しました。決済状況を確認しています。
          </p>

          <div className={`rounded-md border p-3 text-sm ${banner.cls}`}>{banner.text}</div>

          {(chargeId || tokenId || status) && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
              <div>
                Charge ID: <code className="break-all">{chargeId || "—"}</code>
              </div>
              <div>
                Token ID: <code className="break-all">{tokenId || "—"}</code>
              </div>
              <div>
                Status: <code>{status || "—"}</code>
              </div>
            </div>
          )}

          {isChecking && (
            <div className="text-center text-sm text-gray-600">
              決済状況を確認中...
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button
              onClick={() => {
                if (paymentStatus === "completed" && paymentId) {
                  router.push(`/payment/success?paymentId=${paymentId}`)
                } else if (paymentStatus === "failed" || paymentStatus === "cancelled") {
                  router.push(`/payment/cancel?paymentId=${paymentId}`)
                } else if (paymentId) {
                  router.push(`/payment/success?paymentId=${paymentId}`)
                } else {
                  router.push("/payment")
                }
              }}
              className="bg-gray-700 hover:bg-gray-800"
              disabled={isChecking}
            >
              {paymentStatus === "completed"
                ? "決済完了ページへ"
                : paymentStatus === "failed" || paymentStatus === "cancelled"
                ? "決済失敗ページへ"
                : "決済状況を確認"}
            </Button>

            <div className="text-xs text-gray-500">
              {auto ? (
                <button
                  onClick={() => setAuto(false)}
                  className="underline hover:no-underline"
                >
                  {seconds}秒後に自動リダイレクト — 停止
                </button>
              ) : (
                <span>自動リダイレクト停止中</span>
              )}
            </div>
          </div>

          <Button
            onClick={() => router.push("/payment")}
            variant="outline"
            className="w-full"
          >
            ← 決済ページに戻る
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

