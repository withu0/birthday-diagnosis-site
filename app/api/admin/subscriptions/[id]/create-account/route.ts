import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"
import { createUser, hashPassword } from "@/lib/auth"
import { sendAdminNotification, sendEmail } from "@/lib/email"
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

    // Send admin notification for manual account creation
    try {
      await sendManualAccountCreationNotification(
        payment,
        {
          email: payment.email,
          password,
          membershipUsername: membership.username,
          membershipPassword,
          accessExpiresAt: membership.accessExpiresAt,
        }
      )
    } catch (notificationError) {
      console.error("Failed to send admin notification:", notificationError)
      // Continue even if notification fails
    }

    // Send credentials email to user
    try {
      await sendUserCredentialsEmail(
        payment,
        {
          email: payment.email,
          password,
          membershipUsername: membership.username,
          membershipPassword,
          accessExpiresAt: membership.accessExpiresAt,
        }
      )
      
      // Update membership with credentials sent timestamp
      await db
        .update(memberships)
        .set({
          credentialsSentAt: new Date(),
        })
        .where(eq(memberships.id, membership.id))
    } catch (emailError) {
      console.error("Failed to send user credentials email:", emailError)
      // Continue even if email fails
    }

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

// Send admin notification for manual account creation
async function sendManualAccountCreationNotification(
  payment: typeof payments.$inferSelect,
  accountInfo: {
    email: string
    password: string
    membershipUsername: string
    membershipPassword: string
    accessExpiresAt: Date
  }
) {
  const planNames: Record<string, string> = {
    basic: "ベーシック",
    standard: "スタンダード",
    premium: "プレミアム",
  }

  const paymentMethodNames: Record<string, string> = {
    bank_transfer: "銀行振込",
    credit_card: "クレジットカード決済",
    direct_debit: "口座引き落とし分割払い",
  }

  const planName = planNames[payment.planType || "basic"] || payment.planType || "不明"
  const paymentMethodName = paymentMethodNames[payment.paymentMethod || "bank_transfer"] || payment.paymentMethod || "不明"
  const accessExpiresAtStr = new Date(accountInfo.accessExpiresAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })

  const emailText = `
アカウントが手動で発行されました

【注文情報】
注文ID: ${payment.id.substring(0, 8)}
プラン: ${planName}プラン
支払い方法: ${paymentMethodName}
ステータス: 完了（completed）

【金額情報】
小計（税別）: ${parseFloat(payment.amount || "0").toLocaleString()}円
消費税（10%）: ${parseFloat(payment.taxAmount || "0").toLocaleString()}円
合計金額: ${parseFloat(payment.totalAmount || "0").toLocaleString()}円

【お客様情報】
氏名: ${payment.name}
メールアドレス: ${payment.email}

【作成されたアカウント情報】
ログイン用メールアドレス: ${accountInfo.email}
ログイン用パスワード: ${accountInfo.password}

【管理情報】
支払いID: ${payment.id}
作成日時: ${new Date(payment.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
アカウント発行日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
`

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>アカウント手動発行通知</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #333; font-size: 24px; margin-bottom: 20px; text-align: center;">アカウントが手動で発行されました</h1>
    
    <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">注文情報</h2>
      <p style="margin: 10px 0;"><strong>注文ID:</strong> ${payment.id.substring(0, 8)}</p>
      <p style="margin: 10px 0;"><strong>プラン:</strong> ${planName}プラン</p>
      <p style="margin: 10px 0;"><strong>支払い方法:</strong> ${paymentMethodName}</p>
      <p style="margin: 10px 0;"><strong>ステータス:</strong> <span style="color: #28a745; font-weight: bold;">完了（completed）</span></p>
    </div>

    <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">金額情報</h2>
      <p style="margin: 10px 0;"><strong>小計（税別）:</strong> ${parseFloat(payment.amount || "0").toLocaleString()}円</p>
      <p style="margin: 10px 0;"><strong>消費税（10%）:</strong> ${parseFloat(payment.taxAmount || "0").toLocaleString()}円</p>
      <p style="margin: 10px 0;"><strong>合計金額:</strong> <span style="font-size: 20px; font-weight: bold; color: #28a745;">${parseFloat(payment.totalAmount || "0").toLocaleString()}円</span></p>
    </div>

    <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">お客様情報</h2>
      <p style="margin: 10px 0;"><strong>氏名:</strong> ${payment.name}</p>
      <p style="margin: 10px 0;"><strong>メールアドレス:</strong> ${payment.email}</p>
    </div>

    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin-bottom: 20px; border: 2px solid #28a745;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">作成されたアカウント情報</h2>
      <p style="margin: 10px 0;"><strong>ログイン用メールアドレス:</strong> ${accountInfo.email}</p>
      <p style="margin: 10px 0;"><strong>ログイン用パスワード:</strong> <span style="font-family: monospace; background-color: #fff; padding: 2px 6px; border-radius: 3px;">${accountInfo.password}</span></p>
    </div>

    <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">管理情報</h2>
      <p style="margin: 10px 0;"><strong>支払いID:</strong> ${payment.id}</p>
      <p style="margin: 10px 0;"><strong>作成日時:</strong> ${new Date(payment.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
      <p style="margin: 10px 0;"><strong>アカウント発行日時:</strong> ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
    </div>

    <div style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin-bottom: 0;">このメールは自動送信されています。返信はできません。</p>
    </div>
  </div>
</body>
</html>
`

  await sendAdminNotification({
    subject: `【12SKINS】アカウント手動発行完了 - ${payment.name}様`,
    text: emailText,
    html: emailHtml,
  })
}

// Send credentials email to user for manual account creation
async function sendUserCredentialsEmail(
  payment: typeof payments.$inferSelect,
  accountInfo: {
    email: string
    password: string
    membershipUsername: string
    membershipPassword: string
    accessExpiresAt: Date
  }
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const loginUrl = `${baseUrl}/login`
  const accessExpiresAtStr = new Date(accountInfo.accessExpiresAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })

  const emailText = `
12SKINS会員サイトへのアクセス情報

${payment.name}様

アカウントが作成されました。
会員サイトへのアクセス情報をお送りいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【ログイン用アカウント情報】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

メールアドレス: ${accountInfo.email}
パスワード: ${accountInfo.password}

会員サイトURL: ${loginUrl}

※この認証情報は6ヶ月間有効です。
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
    
    <p style="font-size: 16px; margin-bottom: 20px;">${payment.name}様</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">アカウントが作成されました。<br>会員サイトへのアクセス情報をお送りいたします。</p>
    
    <div style="background-color: #fff; border: 2px solid #ddd; border-radius: 6px; padding: 25px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 10px;">【ログイン用アカウント情報】</h2>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; display: inline-block; width: 140px;">メールアドレス:</strong>
        <span style="font-size: 16px; font-weight: bold; color: #333;">${accountInfo.email}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; display: inline-block; width: 140px;">パスワード:</strong>
        <span style="font-size: 16px; font-weight: bold; color: #333; font-family: monospace; background-color: #f5f5f5; padding: 4px 8px; border-radius: 3px;">${accountInfo.password}</span>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${loginUrl}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">会員サイトにログイン</a>
    </div>
    
    <div style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin-bottom: 10px;">※この認証情報は6ヶ月間有効です。</p>
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
      to: payment.email,
      subject: "12SKINS会員サイトへのアクセス情報",
      text: emailText,
      html: emailHtml,
    })
    console.log(`✅ User credentials email sent to ${payment.email}`)
  } catch (error) {
    console.error("❌ Failed to send user credentials email:", error)
    throw error
  }
}
