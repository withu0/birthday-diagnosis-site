import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"

// GET subscription details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, params.id))
      .limit(1)

    if (!payment) {
      return NextResponse.json(
        { error: "支払い情報が見つかりません" },
        { status: 404 }
      )
    }

    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.paymentId, params.id))
      .limit(1)

    return NextResponse.json({
      payment,
      membership: membership || null,
    })
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json(
      { error: "サブスクリプション情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}

// PATCH - Update membership status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActiveはboolean型である必要があります" },
        { status: 400 }
      )
    }

    // Update membership status
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.paymentId, params.id))
      .limit(1)

    if (!membership) {
      return NextResponse.json(
        { error: "会員権限が見つかりません" },
        { status: 404 }
      )
    }

    await db
      .update(memberships)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(memberships.id, membership.id))

    return NextResponse.json({
      message: "会員権限の状態を更新しました",
      membership: {
        ...membership,
        isActive,
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error updating membership:", error)
    return NextResponse.json(
      { error: "会員権限の更新に失敗しました" },
      { status: 500 }
    )
  }
}

