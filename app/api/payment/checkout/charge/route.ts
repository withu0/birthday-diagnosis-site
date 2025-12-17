import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { payments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUnivaPaySDK } from "@/lib/univapay"
import { ResponseError } from "univapay-node"
// Use crypto.randomUUID() for idempotency key (Node.js built-in)

const chargeSchema = z.object({
  paymentId: z.string().uuid(),
  transaction_token_id: z.string().min(1, "Transaction token ID is required"),
  amount: z.number().positive("Amount must be positive"),
  redirect_endpoint: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = chargeSchema.parse(body)

    // Get payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, validatedData.paymentId))
      .limit(1)

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    if (payment.paymentMethod !== "credit_card") {
      return NextResponse.json(
        { error: "Payment method is not credit card" },
        { status: 400 }
      )
    }

    // Create charge using UnivaPay SDK
    try {
      const sdk = getUnivaPaySDK()
      
      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID()

      // Create charge - using UnivaPay Node.js SDK format
      const chargeParams: any = {
        transactionTokenId: validatedData.transaction_token_id,
        amount: Math.round(validatedData.amount), // Convert to integer (minor units)
        currency: "JPY",
        capture: true, // Immediate capture
        metadata: {
          payment_id: validatedData.paymentId,
          plan_type: payment.planType,
          customer_name: payment.name,
          customer_email: payment.email,
        },
      }

      // Add redirect endpoint if provided
      if (validatedData.redirect_endpoint) {
        chargeParams.redirect = {
          endpoint: validatedData.redirect_endpoint,
        }
        // Also set threeDS mode if needed
        chargeParams.threeDS = {
          mode: "normal", // or "require", "force", "skip"
        }
      }

      const charge = await sdk.charges.create(chargeParams, {
        idempotencyKey,
      })

      // Determine payment status from charge
      const isSuccessful = charge.status === "successful" || charge.status === "completed" || charge.status === "paid"
      const newStatus = isSuccessful ? "completed" : 
                       (charge.status === "failed" || charge.status === "error") ? "failed" :
                       (charge.status === "cancelled" || charge.status === "canceled") ? "cancelled" :
                       payment.status

      // Update payment record with charge information
      await db
        .update(payments)
        .set({
          univapayOrderId: charge.id?.toString() || null,
          univapayTransactionId: charge.id?.toString() || null,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, validatedData.paymentId))

      // If payment completed immediately (no 3DS), create membership
      if (isSuccessful) {
        const { memberships } = await import("@/lib/db/schema")
        const [existingMembership] = await db
          .select()
          .from(memberships)
          .where(eq(memberships.paymentId, validatedData.paymentId))
          .limit(1)

        if (!existingMembership) {
          // Create membership - inline implementation to avoid circular dependency
          const { users } = await import("@/lib/db/schema")
          const { createUser, hashPassword } = await import("@/lib/auth")
          const crypto = await import("crypto")

          // Check for existing user
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, payment.email))
            .limit(1)

          let userId: string
          if (existingUser) {
            userId = existingUser.id
            await db.update(payments).set({ userId }).where(eq(payments.id, payment.id))
          } else {
            const memberPassword = crypto.randomBytes(8).toString("hex")
            const user = await createUser(payment.email, payment.name, memberPassword)
            userId = user.id
            await db.update(payments).set({ userId }).where(eq(payments.id, payment.id))
          }

          // Create membership
          const username = "user_" + crypto.randomBytes(4).toString("hex")
          const password = crypto.randomBytes(8).toString("hex")
          const passwordHash = await hashPassword(password)
          const accessExpiresAt = new Date()
          accessExpiresAt.setMonth(accessExpiresAt.getMonth() + 6)

          await db.insert(memberships).values({
            userId,
            paymentId: payment.id,
            username,
            passwordHash,
            accessExpiresAt,
            isActive: true,
            accessGrantedAt: new Date(),
          })

          // Send email (console log for now)
          console.log(`=== Membership Created ===`)
          console.log(`Payment ID: ${payment.id}`)
          console.log(`Username: ${username}`)
          console.log(`Password: ${password}`)
          console.log(`Email: ${payment.email}`)
        }
      }

      // Check if 3DS redirect is required
      const redirectInfo = charge.redirect
        ? {
            endpoint: charge.redirect.endpoint || charge.redirect.url,
          }
        : undefined

      return NextResponse.json({
        ok: true,
        payment: {
          id: payment.id,
          status: newStatus,
        },
        univapay: {
          charge_id: charge.id?.toString() || null,
          status: charge.status || null,
          mode: charge.mode || null,
          redirect: redirectInfo,
        },
      })
    } catch (error) {
      console.error("UnivaPay charge creation error:", error)

      if (error instanceof ResponseError) {
        const errorResponse = (error as any).errorResponse
        console.error("UnivaPay API error details:", {
          httpCode: errorResponse?.httpCode,
          code: errorResponse?.code,
          message: error.message,
          errors: errorResponse?.errors,
        })

        return NextResponse.json(
          {
            error: "UnivaPay charge failed",
            detail: error.message || "Unknown error",
            status: errorResponse?.httpCode || 500,
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: "Unexpected error creating charge",
          detail: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Charge creation error:", error)
    return NextResponse.json(
      { error: "決済処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}

