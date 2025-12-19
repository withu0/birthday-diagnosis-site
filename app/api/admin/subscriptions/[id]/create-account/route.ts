import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"
import { createUser, hashPassword } from "@/lib/auth"
import crypto from "crypto"

// POST - Create account and membership for a payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const { id: paymentId } = await params

    // Get payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1)

    if (!payment) {
      return NextResponse.json(
        { error: "支払い情報が見つかりません" },
        { status: 404 }
      )
    }

    // Check if membership already exists
    const [existingMembership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.paymentId, paymentId))
      .limit(1)

    if (existingMembership) {
      return NextResponse.json(
        { error: "この支払いには既に会員権限が作成されています" },
        { status: 400 }
      )
    }

    // Check for existing user by email
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, payment.email))
      .limit(1)

    let userId: string
    let password: string

    if (existingUser) {
      // Use existing user
      userId = existingUser.id
      
      // Update payment record with user ID
      await db
        .update(payments)
        .set({ userId })
        .where(eq(payments.id, paymentId))
      
      // Generate new password for existing user
      password = generatePassword()
      const passwordHash = await hashPassword(password)
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, userId))
    } else {
      // Create new user
      password = generatePassword()
      const user = await createUser(payment.email, payment.name, password)
      userId = user.id
      
      // Update payment record with user ID
      await db
        .update(payments)
        .set({ userId })
        .where(eq(payments.id, paymentId))
    }

    // Generate membership username and password
    const username = generateUsername()
    const membershipPassword = generatePassword()
    const passwordHash = await hashPassword(membershipPassword)

    // Calculate expiration date (6 months from now)
    const accessExpiresAt = new Date()
    accessExpiresAt.setMonth(accessExpiresAt.getMonth() + 6)

    // Create membership
    const [membership] = await db
      .insert(memberships)
      .values({
        userId,
        paymentId: payment.id,
        username,
        passwordHash,
        accessExpiresAt,
        isActive: true,
        accessGrantedAt: new Date(),
      })
      .returning()

    // Update payment status to completed
    await db
      .update(payments)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))

    return NextResponse.json({
      message: "アカウントと会員権限を作成しました",
      user: {
        email: payment.email,
        password, // Login password
      },
      membership: {
        username: membership.username,
        password: membershipPassword, // Membership site password
        accessExpiresAt: membership.accessExpiresAt,
      },
    })
  } catch (error) {
    console.error("Error creating account:", error)
    return NextResponse.json(
      { error: "アカウントの作成に失敗しました" },
      { status: 500 }
    )
  }
}

// Helper functions
function generateUsername(): string {
  return "user_" + crypto.randomBytes(4).toString("hex")
}

function generatePassword(): string {
  return crypto.randomBytes(8).toString("hex")
}

