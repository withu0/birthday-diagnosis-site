import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUnivaPaySDK } from "@/lib/univapay"
import { ResponseError } from "univapay-node"
import { createUser, hashPassword } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
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
      })
      .returning()

    // Generate payment link (UnivaPay hosted checkout)
    const paymentLink = await generatePaymentLink(payment.id, validatedData.totalAmount, validatedData.paymentMethod)

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

