import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUnivaPaySDK } from "@/lib/univapay"
import { ResponseError } from "univapay-node"
import { createUser, hashPassword } from "@/lib/auth"
import { sendEmail, sendAdminNotification } from "@/lib/email"
import { generateBankTransferEmail, generateDirectDebitEmail } from "@/lib/email-templates"
import crypto from "crypto"

const paymentSchema = z.object({
  planType: z.enum(["basic", "standard", "premium"]),
  paymentMethod: z.enum(["bank_transfer", "credit_card", "direct_debit"]),
  companyName: z.string().optional(),
  name: z.string().min(1, "氏名を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phoneNumber: z.string().min(1, "電話番号を入力してください"),
  postalCode: z.string().min(1, "郵便番号を入力してください"),
  address: z.string().min(1, "住所を入力してください"),
  gender: z.enum(["male", "female"]),
  birthYear: z.string(),
  birthMonth: z.string(),
  birthDay: z.string(),
  amount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  seller: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // 生年月日をDateオブジェクトに変換
    const birthDate = new Date(
      parseInt(validatedData.birthYear),
      parseInt(validatedData.birthMonth) - 1,
      parseInt(validatedData.birthDay)
    )

    // 支払いレコードを作成
    const [payment] = await db
      .insert(payments)
      .values({
        planType: validatedData.planType,
        amount: validatedData.amount.toString(),
        taxAmount: validatedData.taxAmount.toString(),
        totalAmount: validatedData.totalAmount.toString(),
        paymentMethod: validatedData.paymentMethod,
        companyName: validatedData.companyName || null,
        name: validatedData.name,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        postalCode: validatedData.postalCode,
        address: validatedData.address,
        gender: validatedData.gender,
        birthDate,
        status: "pending",
        seller: validatedData.seller || null,
      })
      .returning()

    // Generate payment link (UnivaPay hosted checkout)
    const paymentLink = await generatePaymentLink(payment.id, validatedData.totalAmount, validatedData.paymentMethod)

    // Send admin notification for new payment application
    try {
      await sendPaymentApplicationNotification(payment, validatedData)
    } catch (notificationError) {
      console.error("Failed to send admin notification:", notificationError)
      // Continue even if notification fails
    }

    // UnivaPay API連携
    // 銀行振込の場合は管理者が確認後に手動でアカウントを作成する
    if (validatedData.paymentMethod === "bank_transfer") {
      // Use the actual payment record amount to ensure accuracy
      const paymentTotalAmount = parseFloat(payment.totalAmount)
      
      // Send bank transfer email
      const emailContent = generateBankTransferEmail({
        name: validatedData.name,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        postalCode: validatedData.postalCode,
        address: validatedData.address,
        orderId: payment.id.substring(0, 8),
        totalAmount: paymentTotalAmount,
        paymentLink,
      })

      try {
        await sendEmail({
          to: validatedData.email,
          subject: "12SKINSサイト利用のお申込ありがとうございます",
          text: emailContent,
        })
      } catch (emailError) {
        console.error("Failed to send bank transfer email:", emailError)
        // Continue even if email fails
      }

      // 銀行振込の場合はpendingのまま（管理者が確認後に手動で完了にする）
      // アカウントは作成しない（管理者が手動で作成）

      return NextResponse.json({
        paymentId: payment.id,
        message: "銀行振込の案内をメールでお送りしました。入金確認後、管理者がアカウントを作成いたします。",
      })
    }

    // クレジットカード決済の場合は、フロントエンドでUnivaPayウィジェットを使用
    // ウィジェットがトークンを作成した後、/api/payment/checkout/charge エンドポイントで決済を実行
    if (validatedData.paymentMethod === "credit_card") {
      // 支払いレコードを作成済みなので、paymentIdを返す
      // フロントエンドでUnivaPayウィジェットを開く
      return NextResponse.json({
        paymentId: payment.id,
        message: "クレジットカード決済を開始します",
      })
    }

    // 口座引き落としの場合は管理者が確認後に手動でアカウントを作成する
    if (validatedData.paymentMethod === "direct_debit") {
      // Use the actual payment record amount to ensure accuracy
      const paymentTotalAmount = parseFloat(payment.totalAmount)
      
      // Send direct debit email
      const emailContent = generateDirectDebitEmail({
        name: validatedData.name,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        postalCode: validatedData.postalCode,
        address: validatedData.address,
        orderId: payment.id.substring(0, 8),
        totalAmount: paymentTotalAmount,
        paymentLink,
      })

      try {
        await sendEmail({
          to: validatedData.email,
          subject: "12SKINSサイト利用のお申込ありがとうございます",
          text: emailContent,
        })
      } catch (emailError) {
        console.error("Failed to send direct debit email:", emailError)
        // Continue even if email fails
      }

      // 口座引き落としの場合はpendingのまま（管理者が確認後に手動で完了にする）
      // アカウントは作成しない（管理者が手動で作成）

      return NextResponse.json({
        paymentId: payment.id,
        message: "口座引き落としの案内をメールでお送りしました。確認後、管理者がアカウントを作成いたします。",
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Payment creation error:", error)
    return NextResponse.json(
      { error: "支払い処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}

// アカウントと会員権限を作成（開発モード用）
async function createAccountAndMembership(
  payment: typeof payments.$inferSelect,
  data: z.infer<typeof paymentSchema>
) {
  // 既存のユーザーを確認（メールアドレスで検索）
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, payment.email))
    .limit(1)

  let userId: string
  let password: string

  if (existingUser) {
    // 既存のユーザーを使用
    userId = existingUser.id
    
    // 支払いレコードにユーザーIDを関連付ける
    await db
      .update(payments)
      .set({ userId })
      .where(eq(payments.id, payment.id))
    
    // 既存ユーザーの場合は、新しいパスワードを生成して返す（実際には既存パスワードは変更しない）
    // 開発モードでは、新しいパスワードを生成して表示
    password = generatePassword()
    const passwordHash = await hashPassword(password)
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId))
  } else {
    // 新しいユーザーを作成
    // システム生成のパスワードを作成
    password = generatePassword()
    const user = await createUser(payment.email, payment.name, password)
    userId = user.id
    
    // 支払いレコードにユーザーIDを関連付ける
    await db
      .update(payments)
      .set({ userId })
      .where(eq(payments.id, payment.id))
  }

  // 会員サイト用のユーザー名とパスワードを生成
  const username = generateUsername()
  const membershipPassword = generatePassword()
  const passwordHash = await hashPassword(membershipPassword)

  // 6ヶ月後の有効期限を計算
  const accessExpiresAt = new Date()
  accessExpiresAt.setMonth(accessExpiresAt.getMonth() + 6)

  // 既存の会員権限を確認
  const [existingMembership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1)

  if (existingMembership) {
    // 既存の会員権限を更新
    await db
      .update(memberships)
      .set({
        paymentId: payment.id,
        accessExpiresAt,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(memberships.id, existingMembership.id))
  } else {
    // 新しい会員権限を作成
    await db
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
  }

  return {
    email: payment.email,
    password: password, // ログイン用のパスワード（ユーザーが入力したメールアドレスでログイン）
  }
}

// ユーザー名を生成（会員サイト用）
function generateUsername(): string {
  // 8文字のランダムなユーザー名を生成
  return "user_" + crypto.randomBytes(4).toString("hex")
}

// パスワードを生成
function generatePassword(): string {
  // 12文字のランダムなパスワードを生成
  return crypto.randomBytes(8).toString("hex")
}

// Send admin notification for payment application
async function sendPaymentApplicationNotification(
  payment: typeof payments.$inferSelect,
  data: z.infer<typeof paymentSchema>
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

  const genderNames: Record<string, string> = {
    male: "男性",
    female: "女性",
  }

  const birthDateStr = `${data.birthYear}年${data.birthMonth}月${data.birthDay}日`
  const planName = planNames[data.planType] || data.planType
  const paymentMethodName = paymentMethodNames[data.paymentMethod] || data.paymentMethod
  const genderName = genderNames[data.gender] || data.gender

  const emailText = `
新しいお申し込みが入りました

【注文情報】
注文ID: ${payment.id.substring(0, 8)}
プラン: ${planName}プラン
支払い方法: ${paymentMethodName}
ステータス: 保留中（pending）

【金額情報】
小計（税別）: ${data.amount.toLocaleString()}円
消費税（10%）: ${data.taxAmount.toLocaleString()}円
合計金額: ${data.totalAmount.toLocaleString()}円

【お客様情報】
氏名: ${data.name}
メールアドレス: ${data.email}
電話番号: ${data.phoneNumber}
郵便番号: ${data.postalCode}
住所: ${data.address}
性別: ${genderName}
生年月日: ${birthDateStr}
${data.companyName ? `会社名: ${data.companyName}` : ""}

【管理画面】
支払いID: ${payment.id}
作成日時: ${new Date(payment.createdAt).toLocaleString("ja-JP")}
`

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>新しいお申し込み通知</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
    <h1 style="color: #333; font-size: 24px; margin-bottom: 20px; text-align: center;">新しいお申し込みが入りました</h1>
    
    <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">注文情報</h2>
      <p style="margin: 10px 0;"><strong>注文ID:</strong> ${payment.id.substring(0, 8)}</p>
      <p style="margin: 10px 0;"><strong>プラン:</strong> ${planName}プラン</p>
      <p style="margin: 10px 0;"><strong>支払い方法:</strong> ${paymentMethodName}</p>
      <p style="margin: 10px 0;"><strong>ステータス:</strong> <span style="color: #ff9800; font-weight: bold;">保留中（pending）</span></p>
    </div>

    <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">金額情報</h2>
      <p style="margin: 10px 0;"><strong>小計（税別）:</strong> ${data.amount.toLocaleString()}円</p>
      <p style="margin: 10px 0;"><strong>消費税（10%）:</strong> ${data.taxAmount.toLocaleString()}円</p>
      <p style="margin: 10px 0;"><strong>合計金額:</strong> <span style="font-size: 20px; font-weight: bold; color: #007bff;">${data.totalAmount.toLocaleString()}円</span></p>
    </div>

    <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">お客様情報</h2>
      <p style="margin: 10px 0;"><strong>氏名:</strong> ${data.name}</p>
      <p style="margin: 10px 0;"><strong>メールアドレス:</strong> ${data.email}</p>
      <p style="margin: 10px 0;"><strong>電話番号:</strong> ${data.phoneNumber}</p>
      <p style="margin: 10px 0;"><strong>郵便番号:</strong> ${data.postalCode}</p>
      <p style="margin: 10px 0;"><strong>住所:</strong> ${data.address}</p>
      <p style="margin: 10px 0;"><strong>性別:</strong> ${genderName}</p>
      <p style="margin: 10px 0;"><strong>生年月日:</strong> ${birthDateStr}</p>
      ${data.companyName ? `<p style="margin: 10px 0;"><strong>会社名:</strong> ${data.companyName}</p>` : ""}
    </div>

    <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">管理情報</h2>
      <p style="margin: 10px 0;"><strong>支払いID:</strong> ${payment.id}</p>
      <p style="margin: 10px 0;"><strong>作成日時:</strong> ${new Date(payment.createdAt).toLocaleString("ja-JP")}</p>
    </div>

    <div style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin-bottom: 0;">このメールは自動送信されています。返信はできません。</p>
    </div>
  </div>
</body>
</html>
`

  await sendAdminNotification({
    subject: `【12SKINS】新しいお申し込みが入りました - ${data.name}様`,
    text: emailText,
    html: emailHtml,
  })
}

// Generate UnivaPay hosted checkout URL
async function generatePaymentLink(
  paymentId: string,
  amount: number,
  paymentMethod: "bank_transfer" | "credit_card" | "direct_debit"
): Promise<string> {
  try {
    const sdk = getUnivaPaySDK()
    const returnUrl = process.env.NEXT_PUBLIC_UNIVAPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/return`
    
    // Determine payment methods for checkout
    const paymentMethods = paymentMethod === "bank_transfer" 
      ? ["bank_transfer"] 
      : paymentMethod === "direct_debit"
      ? ["direct_debit"]
      : ["card"]

    // Create checkout session
    const checkoutParams: any = {
      amount: Math.round(amount),
      currency: "JPY",
      paymentMethods,
      metadata: {
        payment_id: paymentId,
      },
    }

    // Add redirect if available
    if (returnUrl) {
      checkoutParams.redirect = {
        endpoint: returnUrl,
      }
    }

    // Try to create checkout session
    // Note: UnivaPay SDK might have a different method for creating checkout sessions
    // This is a placeholder - adjust based on actual SDK API
    try {
      const checkout = await sdk.checkouts.create(checkoutParams)
      if (checkout && checkout.url) {
        return checkout.url
      }
    } catch (sdkError) {
      console.warn("Failed to create UnivaPay checkout session, using placeholder:", sdkError)
    }

    // Fallback: Return a placeholder URL or generate one based on payment ID
    // In production, you should implement proper checkout URL generation
    return `https://univa.cc/${paymentId.substring(0, 7)}`
  } catch (error) {
    console.error("Error generating payment link:", error)
    // Return placeholder URL as fallback
    return `https://univa.cc/${paymentId.substring(0, 7)}`
  }
}

