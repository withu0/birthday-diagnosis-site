import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createUser } from "@/lib/auth"
import { hashPassword } from "@/lib/auth"
import crypto from "crypto"

// UnivaPayからのコールバックを処理
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // UnivaPayからのコールバックデータを検証
    // 実際の実装はUnivaPayのドキュメントに従ってください
    const { order_id, transaction_id, status, payment_id } = body

    if (!payment_id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    // 支払いレコードを取得
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, payment_id))
      .limit(1)

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // 決済が完了した場合
    if (status === "completed" || status === "paid") {
      // 支払いステータスを更新
      await db
        .update(payments)
        .set({
          status: "completed",
          univapayOrderId: order_id || payment.univapayOrderId,
          univapayTransactionId: transaction_id,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment_id))

      // 既に会員権限が作成されているか確認
      const [existingMembership] = await db
        .select()
        .from(memberships)
        .where(eq(memberships.paymentId, payment_id))
        .limit(1)

      if (!existingMembership) {
        // 会員権限を作成
        await createMembership(payment)
      }

      return NextResponse.json({ success: true, message: "Payment processed successfully" })
    } else if (status === "failed" || status === "cancelled") {
      // 決済が失敗またはキャンセルされた場合
      await db
        .update(payments)
        .set({
          status: status === "failed" ? "failed" : "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment_id))

      return NextResponse.json({ success: true, message: "Payment status updated" })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Payment callback error:", error)
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 }
    )
  }
}

// GETリクエストも処理（UnivaPayがGETでコールバックする場合）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get("payment_id")
  const orderId = searchParams.get("order_id")
  const status = searchParams.get("status")

  if (!paymentId) {
    return NextResponse.redirect(new URL("/payment/cancel", request.url))
  }

  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1)

    if (!payment) {
      return NextResponse.redirect(new URL("/payment/cancel", request.url))
    }

    if (status === "completed" || status === "paid") {
      await db
        .update(payments)
        .set({
          status: "completed",
          univapayOrderId: orderId || payment.univapayOrderId,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))

      // 会員権限を作成
      const [existingMembership] = await db
        .select()
        .from(memberships)
        .where(eq(memberships.paymentId, paymentId))
        .limit(1)

      if (!existingMembership) {
        await createMembership(payment)
      }

      return NextResponse.redirect(new URL(`/payment/success?paymentId=${paymentId}`, request.url))
    }

    return NextResponse.redirect(new URL(`/payment/cancel?paymentId=${paymentId}`, request.url))
  } catch (error) {
    console.error("Payment callback error:", error)
    return NextResponse.redirect(new URL("/payment/cancel", request.url))
  }
}

// 会員権限を作成し、ID/パスワードを生成してメール送信
async function createMembership(payment: typeof payments.$inferSelect) {
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

