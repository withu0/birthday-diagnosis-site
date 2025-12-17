import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createUser } from "@/lib/auth"
import { hashPassword } from "@/lib/auth"
import crypto from "crypto"

// UnivaPay webhook handler
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify webhook authentication
    // UnivaPay may send webhook auth in Authorization header
    const webhookAuth = process.env.UNIVAPAY_WEBHOOK_AUTH
    if (webhookAuth) {
      const authHeader = request.headers.get("Authorization") || ""
      const expected = `Bearer ${webhookAuth}`
      if (authHeader !== expected) {
        return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 })
      }
    }

    const body = await request.json()
    
    // UnivaPay webhook payload structure
    // Extract event type and object data
    const eventType = body.event || body.type || body.status
    const obj = body.object
    const dataObj = body.data || body

    // Extract charge/subscription IDs from various possible shapes
    let chargeId: string | null = null
    let subscriptionId: string | null = null

    if (obj === "charge" || obj === "charges") {
      chargeId = body.id || dataObj.id || body.charge_id
    } else if (obj === "subscription" || obj === "subscriptions") {
      subscriptionId = body.id || dataObj.id || body.subscription_id
    } else {
      // Try nested shapes
      chargeId = body.charge?.id || dataObj.charge_id || body.chargeId
      subscriptionId = body.subscription?.id || dataObj.subscription_id || body.subscriptionId
    }

    const newStatus = body.status || dataObj.status

    // Find payment by UnivaPay charge/transaction ID
    let payment = null
    if (chargeId) {
      const [found] = await db
        .select()
        .from(payments)
        .where(eq(payments.univapayTransactionId, chargeId.toString()))
        .limit(1)
      payment = found
    }

    if (!payment && subscriptionId) {
      const [found] = await db
        .select()
        .from(payments)
        .where(eq(payments.univapayTransactionId, subscriptionId.toString()))
        .limit(1)
      payment = found
    }

    // If payment found, update status
    if (payment) {
      let updatedStatus = payment.status

      // Map UnivaPay status to our status
      if (newStatus === "successful" || newStatus === "paid" || newStatus === "completed") {
        updatedStatus = "completed"
      } else if (newStatus === "failed" || newStatus === "error") {
        updatedStatus = "failed"
      } else if (newStatus === "cancelled" || newStatus === "canceled") {
        updatedStatus = "cancelled"
      }

      await db
        .update(payments)
        .set({
          status: updatedStatus,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      // If payment completed, create membership if not exists
      if (updatedStatus === "completed") {
        const [existingMembership] = await db
          .select()
          .from(memberships)
          .where(eq(memberships.paymentId, payment.id))
          .limit(1)

        if (!existingMembership) {
          await createMembership(payment)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Payment webhook error:", error)
    // Always return 200 to acknowledge webhook receipt
    return NextResponse.json({ ok: true })
  }
}

// GETリクエストも処理（3DSリダイレクト後のコールバック）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const chargeId = searchParams.get("univapayChargeId") || searchParams.get("charge_id")
  const tokenId = searchParams.get("univapayTokenId") || searchParams.get("token_id")
  const status = searchParams.get("status")
  const paymentId = searchParams.get("payment_id")

  // Redirect to return page with query params
  const returnUrl = new URL("/payment/return", request.url)
  if (chargeId) returnUrl.searchParams.set("univapayChargeId", chargeId)
  if (tokenId) returnUrl.searchParams.set("univapayTokenId", tokenId)
  if (status) returnUrl.searchParams.set("status", status)
  if (paymentId) returnUrl.searchParams.set("paymentId", paymentId)

  return NextResponse.redirect(returnUrl)
}

// Export createMembership for use in other routes
export async function createMembership(payment: typeof payments.$inferSelect) {
  // 既存のユーザーを確認（メールアドレスで検索）
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, payment.email))
    .limit(1)

  let userId: string

  if (existingUser) {
    // 既存のユーザーを使用
    userId = existingUser.id
    
    // 支払いレコードにユーザーIDを関連付ける
    await db
      .update(payments)
      .set({ userId })
      .where(eq(payments.id, payment.id))
  } else {
    // 新しいユーザーを作成
    // 会員サイト用のパスワードを生成
    const memberPassword = generatePassword()
    const user = await createUser(payment.email, payment.name, memberPassword)
    userId = user.id
    
    // 支払いレコードにユーザーIDを関連付ける
    await db
      .update(payments)
      .set({ userId })
      .where(eq(payments.id, payment.id))
  }

  // 会員サイト用のユーザー名とパスワードを生成
  const username = generateUsername()
  const password = generatePassword()
  const passwordHash = await hashPassword(password)

  // 6ヶ月後の有効期限を計算
  const accessExpiresAt = new Date()
  accessExpiresAt.setMonth(accessExpiresAt.getMonth() + 6)

  // 会員権限を作成
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

  // メール送信
  await sendCredentialsEmail(payment, username, password)

  // メール送信日時を更新
  await db
    .update(memberships)
    .set({
      credentialsSentAt: new Date(),
    })
    .where(eq(memberships.id, membership.id))

  return membership
}

// ユーザー名を生成
function generateUsername(): string {
  // 8文字のランダムなユーザー名を生成
  return "user_" + crypto.randomBytes(4).toString("hex")
}

// パスワードを生成
function generatePassword(): string {
  // 12文字のランダムなパスワードを生成
  return crypto.randomBytes(8).toString("hex")
}

// 認証情報をメールで送信
async function sendCredentialsEmail(
  payment: typeof payments.$inferSelect,
  username: string,
  password: string
) {
  // メール送信の実装
  // 実際の実装は、使用するメールサービス（SendGrid、AWS SES、Nodemailerなど）に合わせてください
  
  const emailService = process.env.EMAIL_SERVICE || "console" // "console", "sendgrid", "ses", etc.

  const emailContent = `
12SKINS会員サイトへのアクセス情報

${payment.name}様

お支払いありがとうございます。
会員サイトへのアクセス情報をお送りいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【会員サイトアクセス情報】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ユーザーID: ${username}
パスワード: ${password}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

会員サイトURL: ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/member

※この認証情報は6ヶ月間有効です。
※このメールは自動送信されています。返信はできません。

ご不明な点がございましたら、お問い合わせください。

Copyright © 株式会社美容総研 All Rights Reserved.
`

  if (emailService === "console") {
    // 開発環境ではコンソールに出力
    console.log("=== Email Content ===")
    console.log(`To: ${payment.email}`)
    console.log(`Subject: 12SKINS会員サイトへのアクセス情報`)
    console.log(emailContent)
    console.log("===================")
  } else {
    // 本番環境では実際のメールサービスを使用
    // 例: SendGrid, AWS SES, Nodemailer など
    // ここでは実装例を示しますが、実際のサービスに合わせて実装してください
    try {
      // メール送信APIを呼び出す
      // await sendEmail({
      //   to: payment.email,
      //   subject: "12SKINS会員サイトへのアクセス情報",
      //   text: emailContent,
      // })
    } catch (error) {
      console.error("Failed to send email:", error)
    }
  }
}

