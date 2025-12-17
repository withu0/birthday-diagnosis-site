import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, memberships } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"
import { createUser, hashPassword } from "@/lib/auth"
import crypto from "crypto"

// GET all users
export async function GET() {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        membership: {
          id: memberships.id,
          accessExpiresAt: memberships.accessExpiresAt,
          isActive: memberships.isActive,
          accessGrantedAt: memberships.accessGrantedAt,
        },
      })
      .from(users)
      .leftJoin(memberships, eq(users.id, memberships.userId))
      .orderBy(users.createdAt)

    return NextResponse.json({ users: allUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "ユーザー一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}

// DELETE user
export async function DELETE(request: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      )
    }

    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({ message: "ユーザーを削除しました" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "ユーザーの削除に失敗しました" },
      { status: 500 }
    )
  }
}

// CREATE user
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, password, role, isAdmin: isAdminFlag, accessExpiresAt } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "名前、メールアドレス、パスワードは必須です" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(email, name, password)

    // Update role and isAdmin if provided
    if (role || isAdminFlag !== undefined) {
      await db
        .update(users)
        .set({
          role: role || "user",
          isAdmin: isAdminFlag || false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
    }

    // Create membership if accessExpiresAt is provided
    if (accessExpiresAt) {
      const expiryDate = new Date(accessExpiresAt)
      const username = `user_${crypto.randomBytes(4).toString("hex")}`
      const membershipPassword = crypto.randomBytes(8).toString("hex")
      const passwordHash = await hashPassword(membershipPassword)

      await db
        .insert(memberships)
        .values({
          userId: user.id,
          paymentId: null, // No payment for manually created users
          username,
          passwordHash,
          accessExpiresAt: expiryDate,
          isActive: true,
          accessGrantedAt: new Date(),
        })
    }

    // Fetch created user with membership
    const [createdUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        membership: {
          id: memberships.id,
          accessExpiresAt: memberships.accessExpiresAt,
          isActive: memberships.isActive,
          accessGrantedAt: memberships.accessGrantedAt,
        },
      })
      .from(users)
      .leftJoin(memberships, eq(users.id, memberships.userId))
      .where(eq(users.id, user.id))
      .limit(1)

    return NextResponse.json({ user: createdUser })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "ユーザーの作成に失敗しました" },
      { status: 500 }
    )
  }
}

