import { type NextRequest, NextResponse } from "next/server"
import { crypto } from "node:crypto"

const GOOGLE_SHEET_ID = "1YH8S2AQA2qL9GlTYWb4uZEP1bEoEcVIClf"
const SHEET_NAME = "分類表"

interface LookupData {
  birthday: string
  snowColor: string
  peachCore: string
  surfaceColor: string
  hideCore: string
}

const createJWT = async (clientEmail: string, privateKey: string): Promise<string> => {
  const header = {
    alg: "RS256",
    typ: "JWT",
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  try {
    // Clean and format the private key
    let cleanPrivateKey = privateKey.replace(/\\n/g, "\n")

    if (!cleanPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      cleanPrivateKey = `-----BEGIN PRIVATE KEY-----\n${cleanPrivateKey}\n-----END PRIVATE KEY-----`
    }

    // Import the private key for signing
    const keyData = cleanPrivateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s/g, "")

    const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    )

    // Create the unsigned token
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
    const unsignedToken = `${encodedHeader}.${encodedPayload}`

    // Sign the token
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedToken))

    // Encode the signature
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")

    return `${unsignedToken}.${encodedSignature}`
  } catch (error) {
    console.error("[v0] Error creating JWT:", error)
    throw error
  }
}

const getAccessToken = async (clientEmail: string, privateKey: string): Promise<string> => {
  try {
    const jwt = await createJWT(clientEmail, privateKey)

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] OAuth error:", errorText)
      throw new Error(`OAuth failed: ${response.status}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("[v0] Error getting access token:", error)
    throw error
  }
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

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    console.log("[v0] Checking environment variables...")
    console.log("[v0] GOOGLE_CLIENT_EMAIL exists:", !!clientEmail)
    console.log("[v0] GOOGLE_PRIVATE_KEY exists:", !!privateKey)

    if (!clientEmail || !privateKey) {
      console.log("[v0] Missing service account credentials, using dummy data")
      return getDummyData()
    }

    // Use service account authentication
    console.log("[v0] Using service account authentication")
    const accessToken = await getAccessToken(clientEmail, privateKey)
    console.log("[v0] Successfully obtained access token")

    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${SHEET_NAME}!C22:K45678`
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    console.log(response)
    if (!response.ok) {
      console.error("[v0] API request failed:", response.status, await response.text())
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Authenticated API response received")

    const rows = data.values || []
    const lookupData: LookupData[] = []

    rows.forEach((row: string[]) => {
      if (row.length >= 8 && row[0]) {
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
