import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const GOOGLE_SHEET_ID = "1YH8S2AQA2qL9GlTYWb4uZEP1bEoEcVIClf-SvUWOLcs"
const SHEET_NAME = "分類表"

interface LookupData {
  birthday: string
  snowColor: string
  peachCore: string
  surfaceColor: string
  hideCore: string
}

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

const getDummyData = (): LookupData[] => {
  return [
    { birthday: "01/01", snowColor: "YG", peachCore: "T+", surfaceColor: "B", hideCore: "T-" },
    { birthday: "01/02", snowColor: "R", peachCore: "S+", surfaceColor: "G", hideCore: "S-" },
    { birthday: "09/02", snowColor: "YG", peachCore: "T+", surfaceColor: "B", hideCore: "T-" },
    // Add more dummy data as needed
  ]
}

const fetchGoogleSheetData = async (): Promise<LookupData[]> => {
  try {
    console.log("[v0] Starting Google Sheets API fetch on server")
    console.log("[v0] Spreadsheet ID:", GOOGLE_SHEET_ID)
    console.log("[v0] Sheet Name:", SHEET_NAME)

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    console.log("[v0] Checking environment variables...")
    console.log("[v0] GOOGLE_CLIENT_EMAIL exists:", !!clientEmail)
    console.log("[v0] GOOGLE_PRIVATE_KEY exists:", !!privateKey)

    if (!clientEmail || !privateKey) {
      console.log("[v0] Missing service account credentials, using dummy data")
      return getDummyData()
    }

    // Use Google Sheets API client
    console.log("[v0] Using Google Sheets API client")
    const sheets = getGoogleSheetsClient()
    
    // First, let's try to get the spreadsheet metadata to verify access
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEET_ID,
      })
      console.log("[v0] Spreadsheet found:", spreadsheetInfo.data.properties?.title)
      console.log("[v0] Available sheets:", spreadsheetInfo.data.sheets?.map(s => s.properties?.title))
    } catch (metaError) {
      console.error("[v0] Error getting spreadsheet metadata:", metaError)
      throw new Error(`Cannot access spreadsheet. Please check: 1) Spreadsheet ID is correct, 2) Service account has access to the sheet, 3) Sheet is not deleted. Error: ${metaError}`)
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!C22:K45678`,
    })

    console.log("[v0] Google Sheets API response received")
    const rows = response.data.values || []
    const lookupData: LookupData[] = []

    rows.forEach((row: string[]) => {
      if (row[0]) {
        lookupData.push({
          birthday: row[0], // Column C
          snowColor: row[1] || "#N/A", // Column D (VLOOKUP column 2)
          peachCore: row[3] || "#N/A", // Column F (VLOOKUP column 4)
          surfaceColor: row[5] || "#N/A", // Column H (VLOOKUP column 6)
          hideCore: row[7] || "#N/A", // Column J (VLOOKUP column 8)
        })
      }
    })

    console.log("[v0] Final lookup data count:", lookupData.length)
    return lookupData.length > 0 ? lookupData : getDummyData()
  } catch (error) {
    console.error("[v0] Error fetching Google Sheets data:", error)
    console.log("[v0] Falling back to dummy data")
    return getDummyData()
  }
}

const vlookup = (lookupValue: string, data: LookupData[], columnIndex: keyof LookupData): string => {
  console.log("[v0] VLOOKUP searching for:", lookupValue)
  const found = data.find((row) => row.birthday === lookupValue)
  const result = found ? found[columnIndex] : "#N/A"
  console.log("[v0] VLOOKUP result:", result)
  return result
}

const formatDateForLookup = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString() // No leading zero
  const day = date.getDate().toString() // No leading zero
  const formatted = `${year}/${month}/${day}` // Use actual year from input
  console.log("[v0] Formatted date for lookup:", formatted)
  return formatted
}

export async function POST(request: NextRequest) {
  try {
    const { birthDate } = await request.json()

    if (!birthDate) {
      return NextResponse.json({ error: "Birth date is required" }, { status: 400 })
    }

    console.log("[v0] API route called with birthDate:", birthDate)

    const sheetData = await fetchGoogleSheetData()

    if (sheetData.length === 0) {
      return NextResponse.json({ error: "No data found in Google Sheets" }, { status: 404 })
    }
    console.log("sheetData", sheetData)
    const lookupDate = formatDateForLookup(birthDate)

    // Perform VLOOKUP equivalent operations
    const snowColor = vlookup(lookupDate, sheetData, "snowColor")
    const peachCore = vlookup(lookupDate, sheetData, "peachCore")
    const surfaceColor = vlookup(lookupDate, sheetData, "surfaceColor")
    const hideCore = vlookup(lookupDate, sheetData, "hideCore")

    console.log("[v0] Returning diagnosis results")

    return NextResponse.json({
      snowColor,
      peachCore,
      surfaceColor,
      hideCore,
    })
  } catch (error) {
    console.error("[v0] API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
