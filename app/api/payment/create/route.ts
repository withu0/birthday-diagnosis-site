import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { payments, memberships, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUnivaPaySDK } from "@/lib/univapay"
import { ResponseError, TransactionTokenType, PaymentType } from "univapay-node"
import { createUser, hashPassword } from "@/lib/auth"
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

    // UnivaPay API連携
    // 銀行振込の場合は直接完了として扱う
    if (validatedData.paymentMethod === "bank_transfer") {
      // 銀行振込の場合は直接完了として扱う
      await db
        .update(payments)
        .set({
          status: "completed",
        })
        .where(eq(payments.id, payment.id))

      // アカウントと会員権限を作成
      const accountInfo = await createAccountAndMembership(payment, validatedData)

      return NextResponse.json({
        paymentId: payment.id,
        message: "銀行振込の案内をメールでお送りします",
        email: accountInfo.email,
        password: accountInfo.password,
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

    // 口座引き落としの場合は未実装
    if (validatedData.paymentMethod === "direct_debit") {
      return NextResponse.json(
        { error: "口座引き落とし決済は現在利用できません" },
        { status: 400 }
      )
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

// UnivaPay クレジットカード決済関数（ECFormLinkを使用）
// 直接カードトークン作成が無効なため、ECFormLink（ホストページ）を使用
async function createCreditCardPayment(
  paymentId: string,
  data: z.infer<typeof paymentSchema>
) {
  try {
    const sdk = getUnivaPaySDK()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    // ECForm IDを取得（環境変数から）
    const formId = process.env.UNIVAPAY_FORM_ID
    
    if (!formId) {
      throw new Error(
        "UnivaPay ECForm IDが設定されていません。\n\n" +
        "以下の手順で設定してください:\n" +
        "1. UnivaPayダッシュボードにログイン\n" +
        "2. 店舗 > 選択した店舗 > ECフォーム ページに移動\n" +
        "3. 新しいECフォームを作成（または既存のフォームを使用）\n" +
        "4. ECフォームのIDをコピー\n" +
        "5. 環境変数UNIVAPAY_FORM_IDにECフォームIDを設定\n\n" +
        "例: UNIVAPAY_FORM_ID=your_form_id_here"
      )
    }

    // 一時的なECFormLinkを作成
    // expiry: 24時間後（ISO 8601形式）
    const expiryDate = new Date()
    expiryDate.setHours(expiryDate.getHours() + 24)

    // JWTトークンを取得（認証トークン）
    const token = process.env.UNIVAPAY_TOKEN || process.env.UNIVAPAY_STORE_JWT
    
    // ECFormLinkを作成（公開APIで必要なフィールドのみを渡す）
    // jwtは必須フィールドのため、認証トークンを使用
    const ecFormLinkParams: any = {
      formId: formId,
      amount: Math.round(data.totalAmount), // 整数に変換（最小通貨単位）
      currency: "JPY",
      description: `12SKINS利用料 - ${data.planType}`,
      tokenType: TransactionTokenType.ONE_TIME,
      expiry: expiryDate.toISOString(),
      tokenOnly: false, // トークンだけでなく、決済も実行
      allowCardInstallments: false, // 分割払いを許可しない
      jwt: token, // 認証トークンをjwtフィールドに含める（APIが要求）
      metadata: {
        payment_id: paymentId,
        plan_type: data.planType,
        customer_name: data.name,
        customer_email: data.email,
      },
    }

    const ecFormLink = await sdk.ecFormLinks.createTemporary(ecFormLinkParams)

    // デバッグ: レスポンス構造を確認
    console.log("UnivaPay ECFormLink Response:", JSON.stringify(ecFormLink, null, 2))

    // ECFormLink URLを取得
    // destinationフィールドがある場合はそれを使用、なければJWTを使用してURLを構築
    let checkoutUrl = ecFormLink.destination

    // destinationがない場合は、JWTを使用して決済ページのURLを構築
    // UnivaPayのホストページURL形式: https://checkout.univapay.com/{jwt}
    if (!checkoutUrl && ecFormLink.jwt) {
      const apiEndpoint = process.env.UNIVAPAY_API_URL || "https://api.univapay.com"
      // APIエンドポイントからcheckoutエンドポイントを推測
      const checkoutBaseUrl = apiEndpoint.replace("api.", "checkout.") || "https://checkout.univapay.com"
      checkoutUrl = `${checkoutBaseUrl}/${ecFormLink.jwt}`
    }

    // それでもURLが取得できない場合はエラー
    if (!checkoutUrl) {
      console.error("Checkout URL not found in response:", ecFormLink)
      throw new Error("UnivaPayから決済URLを取得できませんでした。レスポンス構造を確認してください。")
    }

    return {
      success: true,
      orderId: ecFormLink.id,
      transactionId: ecFormLink.id,
      paymentUrl: checkoutUrl,
    }
  } catch (error) {
    console.error("UnivaPay SDK error:", error)
    
    if (error instanceof ResponseError) {
      console.error("UnivaPay API error details:", {
        httpCode: (error as any).errorResponse?.httpCode,
        code: (error as any).errorResponse?.code,
        message: error.message,
        errors: (error as any).errorResponse?.errors,
      })
      return {
        success: false,
        error: error.message || "UnivaPay API error",
        details: (error as any).errorResponse?.errors,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
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

