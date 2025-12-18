import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createUser } from "@/lib/auth"
import { hashPassword } from "@/lib/auth"
import crypto from "crypto"

// UnivaPay webhook handler
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("=== Webhook Received ===")
  console.log(`Timestamp: ${new Date().toISOString()}`)
  
  try {
    // Optional: Verify webhook authentication
    // UnivaPay may send webhook auth in Authorization header
    const webhookAuth = process.env.UNIVAPAY_WEBHOOK_AUTH
    if (webhookAuth) {
      const authHeader = request.headers.get("Authorization") || ""
      const expected = `Bearer ${webhookAuth}`
      if (authHeader !== expected) {
        console.log("❌ Webhook authentication failed")
        return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 })
      }
      console.log("✅ Webhook authentication passed")
    } else {
      console.log("⚠️ Webhook authentication not configured (UNIVAPAY_WEBHOOK_AUTH not set)")
    }

    const body = await request.json()
    console.log("📦 Webhook payload:", JSON.stringify(body, null, 2))
    
    // UnivaPay webhook payload structure
    // Extract event type and object data
    const eventType = body.event || body.type || body.status
    const obj = body.object
    const dataObj = body.data || body

    console.log(`📋 Event type: ${eventType}`)
    console.log(`📋 Object type: ${obj}`)

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

    // Also try to extract from metadata if available
    const metadata = body.metadata || dataObj.metadata || {}
    const paymentIdFromMetadata = metadata.payment_id

    const newStatus = body.status || dataObj.status || body.state

    console.log(`🔍 Extracted IDs:`)
    console.log(`   - Charge ID: ${chargeId}`)
    console.log(`   - Subscription ID: ${subscriptionId}`)
    console.log(`   - Payment ID from metadata: ${paymentIdFromMetadata}`)
    console.log(`   - New status: ${newStatus}`)

    // Find payment by multiple methods
    let payment = null
    let searchMethod = ""

    // Method 1: Search by payment ID from metadata
    if (!payment && paymentIdFromMetadata) {
      console.log(`🔎 Searching payment by metadata payment_id: ${paymentIdFromMetadata}`)
      const [found] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentIdFromMetadata))
        .limit(1)
      if (found) {
        payment = found
        searchMethod = "metadata.payment_id"
        console.log(`✅ Found payment by metadata payment_id`)
      }
    }

    // Method 2: Search by univapayTransactionId (charge ID)
    if (!payment && chargeId) {
      console.log(`🔎 Searching payment by univapayTransactionId: ${chargeId}`)
      const [found] = await db
        .select()
        .from(payments)
        .where(eq(payments.univapayTransactionId, chargeId.toString()))
        .limit(1)
      if (found) {
        payment = found
        searchMethod = "univapayTransactionId"
        console.log(`✅ Found payment by univapayTransactionId`)
      } else {
        console.log(`❌ No payment found with univapayTransactionId: ${chargeId}`)
      }
    }

    // Method 3: Search by univapayOrderId (charge ID)
    if (!payment && chargeId) {
      console.log(`🔎 Searching payment by univapayOrderId: ${chargeId}`)
      const [found] = await db
        .select()
        .from(payments)
        .where(eq(payments.univapayOrderId, chargeId.toString()))
        .limit(1)
      if (found) {
        payment = found
        searchMethod = "univapayOrderId"
        console.log(`✅ Found payment by univapayOrderId`)
      } else {
        console.log(`❌ No payment found with univapayOrderId: ${chargeId}`)
      }
    }

    // Method 4: Search by subscription ID
    if (!payment && subscriptionId) {
      console.log(`🔎 Searching payment by subscription ID: ${subscriptionId}`)
      const [found] = await db
        .select()
        .from(payments)
        .where(eq(payments.univapayTransactionId, subscriptionId.toString()))
        .limit(1)
      if (found) {
        payment = found
        searchMethod = "subscriptionId"
        console.log(`✅ Found payment by subscription ID`)
      }
    }

    if (!payment) {
      console.log(`❌ Payment not found with any method`)
      console.log(`   Attempted searches:`)
      if (paymentIdFromMetadata) console.log(`     - metadata.payment_id: ${paymentIdFromMetadata}`)
      if (chargeId) console.log(`     - univapayTransactionId: ${chargeId}`)
      if (chargeId) console.log(`     - univapayOrderId: ${chargeId}`)
      if (subscriptionId) console.log(`     - subscriptionId: ${subscriptionId}`)
      
      // Log all payments with univapay IDs for debugging
      const allPayments = await db
        .select({
          id: payments.id,
          univapayOrderId: payments.univapayOrderId,
          univapayTransactionId: payments.univapayTransactionId,
          status: payments.status,
        })
        .from(payments)
        .limit(10)
      console.log(`📊 Recent payments with UnivaPay IDs:`, JSON.stringify(allPayments, null, 2))
      
      return NextResponse.json({ 
        ok: true, 
        message: "Payment not found",
        searchedIds: { chargeId, subscriptionId, paymentIdFromMetadata }
      })
    }

    console.log(`✅ Payment found via ${searchMethod}`)
    console.log(`   Payment ID: ${payment.id}`)
    console.log(`   Current status: ${payment.status}`)
    console.log(`   UnivaPay Order ID: ${payment.univapayOrderId}`)
    console.log(`   UnivaPay Transaction ID: ${payment.univapayTransactionId}`)

    // If payment found, update status
    let updatedStatus = payment.status

    // Map UnivaPay status to our status
    if (newStatus === "successful" || newStatus === "paid" || newStatus === "completed" || newStatus === "succeeded") {
      updatedStatus = "completed"
    } else if (newStatus === "failed" || newStatus === "error" || newStatus === "declined") {
      updatedStatus = "failed"
    } else if (newStatus === "cancelled" || newStatus === "canceled") {
      updatedStatus = "cancelled"
    }

    console.log(`🔄 Status update:`)
    console.log(`   From: ${payment.status}`)
    console.log(`   To: ${updatedStatus}`)
    console.log(`   UnivaPay status: ${newStatus}`)

    if (updatedStatus !== payment.status) {
      await db
        .update(payments)
        .set({
          status: updatedStatus,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      console.log(`✅ Payment status updated successfully`)

      // If payment completed, create membership if not exists
      if (updatedStatus === "completed") {
        console.log(`🎉 Payment completed - checking for membership`)
        const [existingMembership] = await db
          .select()
          .from(memberships)
          .where(eq(memberships.paymentId, payment.id))
          .limit(1)

        if (!existingMembership) {
          console.log(`📝 Creating membership for payment ${payment.id}`)
          await createMembership(payment)
          console.log(`✅ Membership created successfully`)
        } else {
          console.log(`ℹ️ Membership already exists for this payment`)
        }
      }
    } else {
      console.log(`ℹ️ Status unchanged (already ${payment.status})`)
    }

    const duration = Date.now() - startTime
    console.log(`⏱️ Webhook processing completed in ${duration}ms`)
    console.log("=== Webhook End ===\n")

    return NextResponse.json({ 
      ok: true,
      paymentId: payment.id,
      oldStatus: payment.status,
      newStatus: updatedStatus,
      searchMethod
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ Payment webhook error:", error)
    console.error(`⏱️ Error occurred after ${duration}ms`)
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`)
      console.error(`   Stack trace: ${error.stack}`)
    }
    console.log("=== Webhook End (Error) ===\n")
    // Always return 200 to acknowledge webhook receipt
    return NextResponse.json({ ok: true, error: error instanceof Error ? error.message : "Unknown error" })
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

会員サイトURL: ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login

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

