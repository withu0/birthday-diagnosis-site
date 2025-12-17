import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, memberships } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"

// UPDATE user
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

    const { name, email, role, isAdmin: isAdminFlag, accessExpiresAt } = await request.json()

    const updateData: { name?: string; email?: string; role?: string; isAdmin?: boolean } = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (isAdminFlag !== undefined) updateData.isAdmin = isAdminFlag

    // Update user if there's user data to update
    if (Object.keys(updateData).length > 0) {
      await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, params.id))
    }

    // Update membership expiration date if provided
    if (accessExpiresAt) {
      const [membership] = await db
        .select()
        .from(memberships)
        .where(eq(memberships.userId, params.id))
        .limit(1)

      if (membership) {
        await db
          .update(memberships)
          .set({
            accessExpiresAt: new Date(accessExpiresAt),
            updatedAt: new Date(),
          })
          .where(eq(memberships.id, membership.id))
      }
    }

    // Fetch updated user with membership
    const [updatedUser] = await db
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
      .where(eq(users.id, params.id))
      .limit(1)

    if (!updatedUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "ユーザーの更新に失敗しました" },
      { status: 500 }
    )
  }
}

