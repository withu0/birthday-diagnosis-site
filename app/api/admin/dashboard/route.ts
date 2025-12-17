import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq, count, sql, and, gte, lte, desc } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"

// GET dashboard statistics
export async function GET() {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    // Get total counts
    const [totalUsers] = await db
      .select({ count: count() })
      .from(users)

    const [totalPayments] = await db
      .select({ count: count() })
      .from(payments)

    const [totalMemberships] = await db
      .select({ count: count() })
      .from(memberships)

    const [activeMemberships] = await db
      .select({ count: count() })
      .from(memberships)
      .where(eq(memberships.isActive, true))

    // Get payment statistics by status
    const paymentStats = await db
      .select({
        status: payments.status,
        count: count(),
      })
      .from(payments)
      .groupBy(payments.status)

    // Get payment statistics by plan type
    const planStats = await db
      .select({
        planType: payments.planType,
        count: count(),
        totalAmount: sql<number>`SUM(CAST(${payments.totalAmount} AS DECIMAL))`,
      })
      .from(payments)
      .where(eq(payments.status, "completed"))
      .groupBy(payments.planType)

    // Get revenue statistics (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [revenueLast30Days] = await db
      .select({
        total: sql<number>`SUM(CAST(${payments.totalAmount} AS DECIMAL))`,
        count: count(),
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "completed"),
          gte(payments.createdAt, thirtyDaysAgo)
        )
      )

    // Get recent payments (last 10)
    const recentPayments = await db
      .select({
        id: payments.id,
        customerName: payments.name,
        planType: payments.planType,
        totalAmount: payments.totalAmount,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(10)

    // Get expiring memberships (next 30 days)
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiringMemberships = await db
      .select({
        id: memberships.id,
        username: memberships.username,
        accessExpiresAt: memberships.accessExpiresAt,
        isActive: memberships.isActive,
      })
      .from(memberships)
      .where(
        and(
          eq(memberships.isActive, true),
          gte(memberships.accessExpiresAt, now),
          lte(memberships.accessExpiresAt, thirtyDaysFromNow)
        )
      )
      .orderBy(memberships.accessExpiresAt)
      .limit(10)

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers.count,
        totalPayments: totalPayments.count,
        totalMemberships: totalMemberships.count,
        activeMemberships: activeMemberships.count,
        revenueLast30Days: revenueLast30Days.total || 0,
        paymentCountLast30Days: revenueLast30Days.count,
      },
      paymentStats: paymentStats.map((stat) => ({
        status: stat.status,
        count: stat.count,
      })),
      planStats: planStats.map((stat) => ({
        planType: stat.planType,
        count: stat.count,
        totalAmount: Number(stat.totalAmount) || 0,
      })),
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id,
        customerName: payment.customerName,
        planType: payment.planType,
        totalAmount: payment.totalAmount,
        status: payment.status,
        createdAt: payment.createdAt,
      })),
      expiringMemberships: expiringMemberships.map((membership) => ({
        id: membership.id,
        username: membership.username,
        accessExpiresAt: membership.accessExpiresAt,
        isActive: membership.isActive,
      })),
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "ダッシュボード情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}

