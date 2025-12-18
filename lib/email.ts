import nodemailer from "nodemailer"
import { google } from "googleapis"

// Get access token from service account
const getServiceAccountAccessToken = async (): Promise<{ token: string; user: string }> => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const gmailUser = process.env.GMAIL_USER || clientEmail

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Gmail service account requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables"
    )
  }

  // Clean and format the private key
  const cleanPrivateKey = privateKey.replace(/\\n/g, "\n")

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: cleanPrivateKey,
    },
    scopes: [
      "https://www.googleapis.com/auth/gmail.send",
    ],
  })

  // If GMAIL_USER is provided and different from service account email,
  // use domain-wide delegation to impersonate that user
  if (gmailUser && gmailUser !== clientEmail) {
    auth.subject = gmailUser
  }

  const authClient = await auth.getClient()
  const accessTokenResponse = await authClient.getAccessToken()
  
  if (!accessTokenResponse.token) {
    throw new Error("Failed to get access token from service account")
  }
  
  // TypeScript narrowing: after the check above, token is guaranteed to be string
  const token = accessTokenResponse.token
  
  // Ensure user is always a string (clientEmail is checked above, so gmailUser will always be defined)
  const user = gmailUser || clientEmail
  
  return {
    token,
    user,
  }
}

// Gmail SMTP configuration using service account
const createTransporter = async () => {
  const emailService = process.env.EMAIL_SERVICE || "console"
  
  if (emailService === "gmail") {
    const { token, user } = await getServiceAccountAccessToken()
    
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: user,
        accessToken: token,
        // For service accounts, we'll refresh the token manually when needed
        // by calling getServiceAccountAccessToken again
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
    let transporter = await createTransporter()
    
    if (!transporter) {
      throw new Error("Failed to create Gmail transporter")
    }
    
    const { user } = await getServiceAccountAccessToken()
    
    const mailOptions = {
      from: user,
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
      // If token expired, try refreshing and sending again
      if (error.code === "EAUTH" || error.message?.includes("Invalid login")) {
        console.log("🔄 Access token expired, refreshing...")
        // Create a new transporter with a fresh token
        transporter = await createTransporter()
        if (transporter) {
          const retryInfo = await transporter.sendMail(mailOptions)
          console.log("✅ Email sent successfully after token refresh:", retryInfo.messageId)
          return
        }
      }
      console.error("❌ Failed to send email:", error)
      throw error
    }
  }
  
  throw new Error(`Unsupported email service: ${emailService}`)
}

