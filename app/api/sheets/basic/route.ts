import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const GOOGLE_SHEET_ID1 = process.env.GOOGLE_SHEET_ID1
const SHEET_NAME = "分類表"

interface LookupData {
  birthday: string
  essential: string
  attractive: string
  valuable: string
  problem: string
}

// Mapping for essential/attractive values (skin types)
const essentialAttractiveMapping = {
  "R": "職人肌",
  "G": "平和肌",
  "I": "親分肌",
  "B": "コミュ肌",
  "YG": "赤ちゃん肌",
  "O": "多才肌",
  "Y": "スマート肌",
  "M": "ドリーム肌",
  "RO": "ポジティブ肌",
  "BG": "姉御肌",
  "P": "天才肌",
  "T": "オリジナル肌"
}

// Mapping for valuable/problem values (element combinations)
const valuableProblemMapping = {
  "E+": "金土",
  "M-": "銀金", 
  "W+": "金水",
  "M+": "金金",
  "E-": "銀土",
  "W-": "銀水",
  "T+": "金木",
  "F-": "銀火",
  "T-": "銀木",
  "F+": "金火"
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
    { birthday: "01/01", essential: "YG", attractive: "T+", valuable: "B", problem: "T-" },
    { birthday: "01/02", essential: "R", attractive: "S+", valuable: "G", problem: "S-" },
    { birthday: "09/02", essential: "YG", attractive: "T+", valuable: "B", problem: "T-" },
    // Add more dummy data as needed
  ]
}

const fetchGoogleSheetData = async (): Promise<LookupData[]> => {
  try {
    console.log("[basic] Starting Google Sheets API fetch on server")
    console.log("[basic] Spreadsheet ID:", GOOGLE_SHEET_ID1)
    console.log("[basic] Sheet Name:", SHEET_NAME)

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    console.log("[basic] Checking environment variables...")
    console.log("[basic] GOOGLE_CLIENT_EMAIL exists:", !!clientEmail)
    console.log("[basic] GOOGLE_PRIVATE_KEY exists:", !!privateKey)

    if (!clientEmail || !privateKey) {
      console.log("[basic] Missing service account credentials, using dummy data")
      return getDummyData()
    }

    // Use Google Sheets API client
    console.log("[basic] Using Google Sheets API client")
    const sheets = getGoogleSheetsClient()
    
    // First, let's try to get the spreadsheet metadata to verify access
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEET_ID1,
      })
      console.log("[basic] Spreadsheet found:", spreadsheetInfo.data.properties?.title)
      console.log("[basic] Available sheets:", spreadsheetInfo.data.sheets?.map((s: any) => s.properties?.title))
    } catch (metaError) {
      console.error("[basic] Error getting spreadsheet metadata:", metaError)
      throw new Error(`Cannot access spreadsheet. Please check: 1) Spreadsheet ID is correct, 2) Service account has access to the sheet, 3) Sheet is not deleted. Error: ${metaError}`)
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID1,
      range: `${SHEET_NAME}!C22:K45678`,
    })

    console.log("[basic] Google Sheets API response received")
    const rows = response.data.values || []
    const lookupData: LookupData[] = []

    rows.forEach((row: string[]) => {
      if (row[0]) {
        lookupData.push({
          birthday: row[0], // Column C
          essential: row[1] || "#N/A", // Column D (VLOOKUP column 2)
          attractive: row[5] || "#N/A", // Column F (VLOOKUP column 4)
          valuable: row[3] || "#N/A", // Column H (VLOOKUP column 6)
          problem: row[7] || "#N/A", // Column J (VLOOKUP column 8)
        })
      }
    })

    console.log("[basic] Final lookup data count:", lookupData.length)
    return lookupData.length > 0 ? lookupData : getDummyData()
  } catch (error) {
    console.error("[basic] Error fetching Google Sheets data:", error)
    console.log("[basic] Falling back to dummy data")
    return getDummyData()
  }
}

const vlookup = (lookupValue: string, data: LookupData[], columnIndex: keyof LookupData): string => {
  console.log("[basic] VLOOKUP searching for:", lookupValue)
  const found = data.find((row) => row.birthday === lookupValue)
  const result = found ? found[columnIndex] : "#N/A"
  console.log("[basic] VLOOKUP result:", result)
  return result
}

const formatDateForLookup = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString() // No leading zero
  const day = date.getDate().toString() // No leading zero
  const formatted = `${year}/${month}/${day}` // Use actual year from input
  console.log("[basic] Formatted date for lookup:", formatted)
  return formatted
}

export async function POST(request: NextRequest) {
  try {
    const { birthDate } = await request.json()

    if (!birthDate) {
      return NextResponse.json({ error: "Birth date is required" }, { status: 400 })
    }

    console.log("[basic] API route called with birthDate:", birthDate)

    const sheetData = await fetchGoogleSheetData()

    if (sheetData.length === 0) {
      return NextResponse.json({ error: "No data found in Google Sheets" }, { status: 404 })
    }
    
    const lookupDate = formatDateForLookup(birthDate)

    // Perform VLOOKUP equivalent operations
    const essential = vlookup(lookupDate, sheetData, "essential")
    const attractive = vlookup(lookupDate, sheetData, "attractive")
    const valuable = vlookup(lookupDate, sheetData, "valuable")
    const problem = vlookup(lookupDate, sheetData, "problem")

    // Create _lb variables using the mappings
    const essential_lb = essentialAttractiveMapping[essential as keyof typeof essentialAttractiveMapping] || essential
    const attractive_lb = essentialAttractiveMapping[attractive as keyof typeof essentialAttractiveMapping] || attractive
    const valuable_lb = valuableProblemMapping[valuable as keyof typeof valuableProblemMapping] || valuable
    const problem_lb = valuableProblemMapping[problem as keyof typeof valuableProblemMapping] || problem

    console.log("[basic] Returning basic diagnosis results with mapped values")

    return NextResponse.json({
      essential,
      essential_lb,
      attractive,
      attractive_lb,
      valuable,
      valuable_lb,
      problem,
      problem_lb
    })
  } catch (error) {
    console.error("[basic] API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}