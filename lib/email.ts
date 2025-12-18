import { google } from "googleapis"

// Get Gmail API client using service account
const getGmailClient = async () => {
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
  const gmail = google.gmail({ version: "v1", auth: authClient })
  
  // Ensure user is always a string (clientEmail is checked above, so gmailUser will always be defined)
  const user = gmailUser || clientEmail
  
  return { gmail, user }
}

// Create RFC 2822 formatted email message
const createEmailMessage = (
  from: string,
  to: string,
  subject: string,
  text: string,
  html?: string
): string => {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  let message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text,
    ``,
  ]

  if (html) {
    message.push(
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      html,
      ``
    )
  }

  message.push(`--${boundary}--`)
  
  return message.join(`\r\n`)
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
    const { gmail, user } = await getGmailClient()
    
    // Create the email message in RFC 2822 format
    const emailMessage = createEmailMessage(
      user,
      options.to,
      options.subject,
      options.text,
      options.html || options.text.replace(/\n/g, "<br>")
    )
    
    // Encode the message in base64url format (Gmail API requirement)
    const encodedMessage = Buffer.from(emailMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    
    try {
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      })
      
      console.log("✅ Email sent successfully:", response.data.id)
      return
    } catch (error) {
      console.error("❌ Failed to send email:", error)
      throw error
    }
  }
  
  throw new Error(`Unsupported email service: ${emailService}`)
}

