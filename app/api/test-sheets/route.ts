import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const GOOGLE_SHEET_ID = "1YH8S2AQA2qL9GlTYWb4uZEP1bEoEcVIClf"

const getGoogleSheetsClient = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account credentials")
  }

  // Clean and format the private key
  const cleanPrivateKey = privateKey.replace(/\\n/g, "\n")

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: cleanPrivateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  return google.sheets({ version: "v4", auth })
}

export async function GET(request: NextRequest) {
  try {
    console.log("[TEST] Testing Google Sheets connection...")
    
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    if (!clientEmail || !privateKey) {
      return NextResponse.json({ 
        error: "Missing credentials",
        clientEmail: !!clientEmail,
        privateKey: !!privateKey
      }, { status: 400 })
    }

    const sheets = getGoogleSheetsClient()
    
    // Test 1: Get spreadsheet metadata
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    })

    const result = {
      success: true,
      spreadsheetId: GOOGLE_SHEET_ID,
      spreadsheetTitle: spreadsheetInfo.data.properties?.title,
      availableSheets: spreadsheetInfo.data.sheets?.map(s => ({
        title: s.properties?.title,
        sheetId: s.properties?.sheetId,
        gridProperties: s.properties?.gridProperties
      })),
      serviceAccountEmail: clientEmail
    }

    console.log("[TEST] Success:", result)
    return NextResponse.json(result)

  } catch (error) {
    console.error("[TEST] Error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      spreadsheetId: GOOGLE_SHEET_ID,
      serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL
    }, { status: 500 })
  }
}
