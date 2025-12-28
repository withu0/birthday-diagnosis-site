import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, memberships, payments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"
import { createUser, hashPassword } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
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

    // Delete related memberships first (to avoid foreign key constraint violation)
    await db.delete(memberships).where(eq(memberships.userId, userId))

    // Set payments.userId to null (preserve payment records for audit purposes)
    await db
      .update(payments)
      .set({ userId: null })
      .where(eq(payments.userId, userId))

    // Now delete the user
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

    // Send credentials email to the user
    try {
      await sendUserCredentialsEmail(name, email, password)
    } catch (emailError) {
      console.error("Failed to send credentials email:", emailError)
      // Don't fail the user creation if email fails, just log the error
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

// Send credentials email to admin-created user
async function sendUserCredentialsEmail(
  name: string,
  email: string,
  password: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const loginUrl = `${baseUrl}/login`

  const emailText = `
12SKINS会員サイトへのアクセス情報

${name}様

アカウントが作成されました。
会員サイトへのアクセス情報をお送りいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【会員サイトアクセス情報】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

メールアドレス: ${email}
パスワード: ${password}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

会員サイトURL: ${loginUrl}

※このメールは自動送信されています。返信はできません。

ご不明な点がございましたら、お問い合わせください。

Copyright © 株式会社美容総研 All Rights Reserved.
`

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>12SKINS会員サイトへのアクセス情報</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #333; font-size: 24px; margin-bottom: 20px; text-align: center;">12SKINS会員サイトへのアクセス情報</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">${name}様</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">アカウントが作成されました。<br>会員サイトへのアクセス情報をお送りいたします。</p>
    
    <div style="background-color: #fff; border: 2px solid #ddd; border-radius: 6px; padding: 25px; margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 10px;">【会員サイトアクセス情報】</h2>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; display: inline-block; width: 120px;">メールアドレス:</strong>
        <span style="font-size: 16px; font-weight: bold; color: #333;">${email}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; display: inline-block; width: 120px;">パスワード:</strong>
        <span style="font-size: 16px; font-weight: bold; color: #333;">${password}</span>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${loginUrl}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">会員サイトにログイン</a>
    </div>
    
    <div style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin-bottom: 10px;">※このメールは自動送信されています。返信はできません。</p>
      <p style="margin-bottom: 0;">ご不明な点がございましたら、お問い合わせください。</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
      <p>Copyright © 株式会社美容総研 All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
`

  try {
    await sendEmail({
      to: email,
      subject: "12SKINS会員サイトへのアクセス情報",
      text: emailText,
      html: emailHtml,
    })
    console.log(`✅ Credentials email sent to ${email}`)
  } catch (error) {
    console.error("❌ Failed to send credentials email:", error)
    throw error
  }
}

