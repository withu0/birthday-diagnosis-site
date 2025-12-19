import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ plan: string }> }
) {
  try {
    const { plan } = await params

    if (!plan || !["basic", "standard", "premium"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      )
    }

    // Get all payments for this plan type (ordered by most recent first)
    const planPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.planType, plan))
      .orderBy(desc(payments.createdAt))

    return NextResponse.json({
      plan,
      payments: planPayments.map(p => ({
        id: p.id,
        planType: p.planType,
        amount: p.amount,
        taxAmount: p.taxAmount,
        totalAmount: p.totalAmount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching payments by plan:", error)
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}

