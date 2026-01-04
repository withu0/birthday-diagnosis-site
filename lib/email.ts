import nodemailer from "nodemailer"

// Create Gmail SMTP transporter using app password
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || "console"
  
  if (emailService === "gmail") {
    const gmailUser = process.env.GMAIL_USER?.trim()
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim()
    
    if (!gmailUser || !gmailAppPassword) {
      throw new Error(
        "Gmail SMTP requires GMAIL_USER and GMAIL_APP_PASSWORD environment variables"
      )
    }
    
    // Validate email format
    if (!gmailUser.includes("@")) {
      throw new Error(`Invalid Gmail address: ${gmailUser}`)
    }
    
    // Validate app password format (should be 16 characters, no spaces)
    const cleanPassword = gmailAppPassword.replace(/\s/g, "")
    if (cleanPassword.length !== 16) {
      console.warn(
        `⚠️ Warning: Gmail app password should be 16 characters. Got ${cleanPassword.length} characters.`
      )
    }
    
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: cleanPassword, // Use App Password (trimmed and spaces removed)
      },
    })
  }
  
  // For console mode, return null (will be handled in sendEmail function)
  return null
}

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const emailService = process.env.EMAIL_SERVICE || "console"
  
  if (emailService === "console") {
    // Development mode: log to console
    console.log("=== Email Content ===")
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(options.text)
    if (options.html) {
      console.log("\n--- HTML Content ---")
      console.log(options.html)
    }
    console.log("===================")
    return
  }
  
  if (emailService === "gmail") {
    const transporter = createTransporter()
    
    if (!transporter) {
      throw new Error("Failed to create Gmail transporter")
    }
    
    const gmailUser = process.env.GMAIL_USER || ""
    
    const mailOptions = {
      from: gmailUser,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, "<br>"),
    }
    
    try {
      const info = await transporter.sendMail(mailOptions)
      console.log("✅ Email sent successfully:", info.messageId)
      return
    } catch (error: any) {
      console.error("❌ Failed to send email:", error)
      
      // Provide helpful error messages for common issues
      if (error.code === "EAUTH") {
        const errorMessage = error.response || error.message || ""
        if (errorMessage.includes("BadCredentials") || errorMessage.includes("Username and Password not accepted")) {
          throw new Error(
            "Gmail authentication failed. Please check:\n" +
            "1. GMAIL_USER is correct (full email address)\n" +
            "2. GMAIL_APP_PASSWORD is correct (16-character app password, not regular password)\n" +
            "3. 2-Step Verification is enabled on your Gmail account\n" +
            "4. App password was generated correctly (no spaces, exactly 16 characters)\n" +
            `Error details: ${errorMessage}`
          )
        }
      }
      
      throw error
    }
  }
  
  throw new Error(`Unsupported email service: ${emailService}`)
}

/**
 * Get admin email addresses from environment variable
 * Supports comma-separated multiple email addresses
 */
function getAdminEmails(): string[] {
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  if (!adminEmail) {
    return []
  }
  
  // Split by comma and trim each email address
  return adminEmail
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0 && email.includes("@"))
}

/**
 * Send notification email to all administrators
 * @param options Email options (subject, text, html)
 */
export async function sendAdminNotification(options: Omit<EmailOptions, "to">): Promise<void> {
  const adminEmails = getAdminEmails()
  
  if (adminEmails.length === 0) {
    console.warn("⚠️ ADMIN_EMAIL environment variable is not set. Skipping admin notification.")
    return
  }
  
  // Send email to each admin address
  const emailPromises = adminEmails.map(async (email) => {
    try {
      await sendEmail({
        ...options,
        to: email,
      })
      console.log(`✅ Admin notification sent to ${email}`)
    } catch (error) {
      console.error(`❌ Failed to send admin notification to ${email}:`, error)
      // Don't throw - continue sending to other admins even if one fails
    }
  })
  
  // Wait for all emails to be sent (or fail)
  await Promise.allSettled(emailPromises)
}

