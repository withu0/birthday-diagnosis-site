import { NextRequest, NextResponse } from "next/server"
import { getMembershipsExpiringSoon } from "@/lib/membership"
import { sendExpirationReminderEmail } from "@/lib/email-templates"

/**
 * Cron job endpoint to send expiration reminder emails
 * Runs daily to notify users whose memberships expire in ~30 days
 * 
 * Security: Validates CRON_SECRET from Authorization header
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log("=== Membership Expiration Reminder Cron Job Started ===")
  console.log(`Timestamp: ${new Date().toISOString()}`)

  try {
    // Validate cron secret for security
    // Vercel sends CRON_SECRET as Bearer token in Authorization header
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || ""
      // Extract token from "Bearer {token}" format
      const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader
      
      if (token !== cronSecret) {
        console.log("❌ Cron authentication failed")
        console.log(`Expected token length: ${cronSecret.length}`)
        console.log(`Received token length: ${token.length}`)
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
      console.log("✅ Cron authentication passed")
    } else {
      console.log("⚠️ CRON_SECRET not set - skipping authentication (not recommended for production)")
    }

    // Get memberships expiring soon (exactly 30 days from now)
    console.log("📋 Querying memberships expiring in exactly 30 days...")
    const expiringMemberships = await getMembershipsExpiringSoon()
    
    console.log(`📊 Found ${expiringMemberships.length} memberships expiring soon`)

    if (expiringMemberships.length === 0) {
      const duration = Date.now() - startTime
      console.log(`✅ No memberships expiring soon. Completed in ${duration}ms`)
      return NextResponse.json({
        success: true,
        message: "No memberships expiring soon",
        emailsSent: 0,
        duration: duration,
      })
    }

    // Send reminder emails
    let successCount = 0
    let failureCount = 0
    const errors: Array<{ email: string; error: string }> = []

    for (const { membership, user } of expiringMemberships) {
      try {
        await sendExpirationReminderEmail(
          user.name,
          user.email,
          membership.accessExpiresAt
        )
        successCount++
        console.log(`✅ Reminder sent to ${user.email}`)
      } catch (error) {
        failureCount++
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push({
          email: user.email,
          error: errorMessage,
        })
        console.error(`❌ Failed to send reminder to ${user.email}:`, errorMessage)
        // Continue processing other emails even if one fails
      }
    }

    const duration = Date.now() - startTime
    console.log(`=== Cron Job Completed ===`)
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Failures: ${failureCount}`)
    console.log(`⏱️ Duration: ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: `Processed ${expiringMemberships.length} memberships`,
      emailsSent: successCount,
      emailsFailed: failureCount,
      errors: errors.length > 0 ? errors : undefined,
      duration: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("❌ Cron job failed:", errorMessage)
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration: duration,
      },
      { status: 500 }
    )
  }
}
