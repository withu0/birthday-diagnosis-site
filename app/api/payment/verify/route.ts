import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get("paymentId")

  if (!paymentId) {
    return NextResponse.json(
      { error: "Payment ID is required" },
      { status: 400 }
    )
  }

  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1)

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    // Check if membership exists
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.paymentId, paymentId))
      .limit(1)

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      isCompleted: payment.status === "completed",
      hasMembership: !!membership,
      membership: membership ? {
        username: membership.username,
        // Note: Password is not returned for security
      } : null,
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    )
  }
}

