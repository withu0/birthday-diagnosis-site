import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq, desc, and, or, like } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"

// GET all subscriptions with payment and membership info
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const planType = searchParams.get("planType")
    const search = searchParams.get("search")

    // Build query conditions
    let conditions: any[] = []

    if (status) {
      conditions.push(eq(payments.status, status))
    }

    if (planType) {
      conditions.push(eq(payments.planType, planType))
    }

    if (search) {
      conditions.push(
        or(
          like(payments.name, `%${search}%`),
          like(payments.email, `%${search}%`),
          like(payments.phoneNumber, `%${search}%`)
        )!
      )
    }

    // Fetch payments with related data
    const allPayments = await db
      .select({
        payment: payments,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
        membership: {
          id: memberships.id,
          username: memberships.username,
          isActive: memberships.isActive,
          accessGrantedAt: memberships.accessGrantedAt,
          accessExpiresAt: memberships.accessExpiresAt,
          credentialsSentAt: memberships.credentialsSentAt,
        },
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(memberships, eq(payments.id, memberships.paymentId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payments.createdAt))

    // Format response
    const subscriptions = allPayments.map((item) => ({
      paymentId: item.payment.id,
      planType: item.payment.planType,
      amount: item.payment.amount,
      taxAmount: item.payment.taxAmount,
      totalAmount: item.payment.totalAmount,
      paymentMethod: item.payment.paymentMethod,
      status: item.payment.status,
      customerName: item.payment.name,
      customerEmail: item.payment.email,
      customerPhone: item.payment.phoneNumber,
      univapayOrderId: item.payment.univapayOrderId,
      univapayTransactionId: item.payment.univapayTransactionId,
      createdAt: item.payment.createdAt,
      updatedAt: item.payment.updatedAt,
      user: item.user,
      membership: item.membership,
    }))

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json(
      { error: "サブスクリプション一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}

