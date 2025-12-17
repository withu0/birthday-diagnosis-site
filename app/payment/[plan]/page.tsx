"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"

export default function PlanPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const plan = params?.plan as string

  useEffect(() => {
    // Redirect to payment page with plan query parameter
    if (plan && ["basic", "standard", "premium"].includes(plan)) {
      router.replace(`/payment?plan=${plan}`)
    } else {
      router.replace("/pricing")
    }
  }, [plan, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">リダイレクト中...</p>
      </div>
    </div>
  )
}

