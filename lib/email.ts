import nodemailer from "nodemailer"

// Create Gmail SMTP transporter using app password
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || "console"
  
  if (emailService === "gmail") {
    const gmailUser = process.env.GMAIL_USER
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD
    
    if (!gmailUser || !gmailAppPassword) {
      throw new Error(
        "Gmail SMTP requires GMAIL_USER and GMAIL_APP_PASSWORD environment variables"
      )
    }
    
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword, // Use App Password, not regular password
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
    } catch (error) {
      console.error("❌ Failed to send email:", error)
      throw error
    }
  }
  
  throw new Error(`Unsupported email service: ${emailService}`)
}

