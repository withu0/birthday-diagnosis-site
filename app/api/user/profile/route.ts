import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { users, memberships, payments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1, "名前を入力してください").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "パスワードは6文字以上で入力してください").optional(),
})

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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Get current user
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

    const updateData: { name?: string; passwordHash?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    }

    // Update name if provided
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    // Update password if provided
    if (validatedData.newPassword) {
      // Verify current password if provided
      if (!validatedData.currentPassword) {
        return NextResponse.json(
          { error: "現在のパスワードを入力してください" },
          { status: 400 }
        )
      }

      // Verify current password
      const isValidPassword = await verifyPassword(validatedData.currentPassword, user.passwordHash)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "現在のパスワードが正しくありません" },
          { status: 401 }
        )
      }

      // Hash new password
      updateData.passwordHash = await hashPassword(validatedData.newPassword)
    }

    // Update user
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.userId))

    // Fetch updated user
    const [updatedUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    return NextResponse.json({
      message: "プロフィールを更新しました",
      user: updatedUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "プロフィールの更新に失敗しました" },
      { status: 500 }
    )
  }
}
