import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { users, memberships, payments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user with membership and payment info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get membership if exists
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, session.userId))
      .limit(1)

    // Get payment info if membership exists
    let payment = null
    if (membership) {
      const [paymentData] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, membership.paymentId))
        .limit(1)
      payment = paymentData
    }

    // Get all payments for this user (ordered by most recent first)
    const allPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, session.userId))
      .orderBy(desc(payments.createdAt))

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      membership: membership ? {
        id: membership.id,
        username: membership.username,
        accessGrantedAt: membership.accessGrantedAt,
        accessExpiresAt: membership.accessExpiresAt,
        isActive: membership.isActive,
        credentialsSentAt: membership.credentialsSentAt,
      } : null,
      payment: payment ? {
        id: payment.id,
        planType: payment.planType,
        amount: payment.amount,
        taxAmount: payment.taxAmount,
        totalAmount: payment.totalAmount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        createdAt: payment.createdAt,
      } : null,
      allPayments: allPayments.map(p => ({
        id: p.id,
        planType: p.planType,
        amount: p.amount,
        taxAmount: p.taxAmount,
        totalAmount: p.totalAmount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        createdAt: p.createdAt,
      })),
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

