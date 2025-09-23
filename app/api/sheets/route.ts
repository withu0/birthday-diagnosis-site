import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const GOOGLE_SHEET_ID1 = process.env.GOOGLE_SHEET_ID1
const GOOGLE_SHEET_ID2 = process.env.GOOGLE_SHEET_ID2
const SHEET_NAME = "分類表"

interface LookupData {
  birthday: string
  essential: string
  attractive: string
  valuable: string
  problem: string
}

interface EnergyScore {
  action: string
  focus: string
  stamina: string
  creative: string
  influence: string
  emotional: string
  recovery: string
  intuition: string
  judgment: string
  adaptability: string
  total: string
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

// Mapping for talent labels with circled numbers
const talentLabelMapping = {
  "①天才肌": "天才肌",
  "②オリジナル肌": "オリジナル肌", 
  "③赤ちゃん肌": "赤ちゃん肌",
  "④多才肌": "多才肌",
  "⑤ポジティブ肌": "ポジティブ肌",
  "⑥スマート肌": "スマート肌",
  "⑦親分肌": "親分肌",
  "⑧姉御肌": "姉御肌",
  "⑨コミュ肌": "コミュ肌",
  "⑩ドリーム": "ドリーム肌",
  "⑪職人肌": "職人肌",
  "⑫平和肌": "平和肌"
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
    console.log("[v0] Starting Google Sheets API fetch on server")
    console.log("[v0] Spreadsheet ID:", GOOGLE_SHEET_ID1)
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
        spreadsheetId: GOOGLE_SHEET_ID1,
      })
      console.log("[v0] Spreadsheet found:", spreadsheetInfo.data.properties?.title)
      console.log("[v0] Available sheets:", spreadsheetInfo.data.sheets?.map((s: any) => s.properties?.title))
    } catch (metaError) {
      console.error("[v0] Error getting spreadsheet metadata:", metaError)
      throw new Error(`Cannot access spreadsheet. Please check: 1) Spreadsheet ID is correct, 2) Service account has access to the sheet, 3) Sheet is not deleted. Error: ${metaError}`)
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID1,
      range: `${SHEET_NAME}!C22:K45678`,
    })

    console.log("[v0] Google Sheets API response received")
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

const fetchTalentData = async (essential_lb: string, valuable_lb: string, attractive_lb: string, problem_lb: string): Promise<{talent: {title: string, subtitle: string, content: string, additionalTitle: string, additionalContent: string, valuableTitle: string, valuableSubtitle: string, energyScore: EnergyScore}, work: {recommend: string, tenConcept: string, workContent: string}, like: {title: string, subtitle: string, content: string}, impressive: {title: string, subtitle: string, strong: string, likeDislike: string}, loveAffair: {content: string}, marriage: {content: string}, stress: {plus: string, minus: string, fiveGrowth: string}} | null> => {
  try {
    console.log("[v0] Fetching talent data for essential_lb:", essential_lb)
    
    if (!GOOGLE_SHEET_ID2) {
      console.log("[v0] GOOGLE_SHEET_ID2 not configured, returning empty talent data")
      return null
    }

    const sheets = getGoogleSheetsClient()
    
    // Fetch data from 才能 tab, range B2:M5, B12:D13 for additional data, B8:K10 for valuable data, B18:M29 for energy score, 仕事 tab data, 好き tab data, 印象 tab data, 恋愛 tab data, 結婚・離婚 tab data, and ストレス tab data
    const [talentResponse, additionalResponse, valuableResponse, energyResponse, workResponse1, workResponse2, likeResponse, impressiveResponse, liveAffairResponse, marriageResponse, stressResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "才能!B2:M5",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "才能!B12:D13",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "才能!B8:K10",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "才能!B18:M29",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "仕事!B2:M4",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "仕事!B7:K8",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "好き!B2:M5",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "印象!B3:M7",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "恋愛!B7:K8",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "結婚・離婚!B11:K12",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID2,
        range: "ストレス!C3:L6",
      })
    ])

    console.log("[v0] Talent data fetched from Google Sheets")
    const rows = talentResponse.data.values || []
    const additionalRows = additionalResponse.data.values || []
    const valuableRows = valuableResponse.data.values || []
    const energyRows = energyResponse.data.values || []
    const workRows1 = workResponse1.data.values || []
    const workRows2 = workResponse2.data.values || []
    const likeRows = likeResponse.data.values || []
    const impressiveRows = impressiveResponse.data.values || []
    const loveAffairRows = liveAffairResponse.data.values || []
    const marriageRows = marriageResponse.data.values || []
    const stressRows = stressResponse.data.values || []
    
    // Find the row that contains the matching essential_lb with circled number
    let matchingRowIndex = -1
    let matchingColumnIndex = -1
    
    // Create a mapping from essential_lb to the circled number version
    const essentialToCircledMapping: { [key: string]: string } = {
      "天才肌": "①天才肌",
      "オリジナル肌": "②オリジナル肌",
      "赤ちゃん肌": "③赤ちゃん肌",
      "多才肌": "④多才肌",
      "ポジティブ肌": "⑤ポジティブ肌",
      "スマート肌": "⑥スマート肌",
      "親分肌": "⑦親分肌",
      "姉御肌": "⑧姉御肌",
      "コミュ肌": "⑨コミュ肌",
      "ドリーム肌": "⑩ドリーム",
      "職人肌": "⑪職人肌",
      "平和肌": "⑫平和肌"
    }
    
    const circledEssential = essentialToCircledMapping[essential_lb]
    console.log("[v0] Looking for circled essential:", circledEssential)
    
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex]
        // Check if cell exactly matches the circled number version
        if (cellValue && cellValue === circledEssential) {
          matchingRowIndex = rowIndex
          matchingColumnIndex = colIndex
          console.log("[v0] Found matching talent at row:", rowIndex, "col:", colIndex, "value:", cellValue)
          break
        }
      }
      if (matchingRowIndex !== -1) break
    }
    
    if (matchingRowIndex === -1) {
      console.log("[v0] No matching talent found for:", essential_lb)
      return null
    }
    
    // Get the 3 top cells (above the matching cell)
    // First one is title, second one is subtitle, last one is content
    const titleRowIndex = matchingRowIndex - 3
    const subtitleRowIndex = matchingRowIndex - 2
    const contentRowIndex = matchingRowIndex - 1
    
    const title = (titleRowIndex >= 0 && rows[titleRowIndex] && rows[titleRowIndex][matchingColumnIndex]) 
      ? rows[titleRowIndex][matchingColumnIndex] : ""
    const subtitle = (subtitleRowIndex >= 0 && rows[subtitleRowIndex] && rows[subtitleRowIndex][matchingColumnIndex]) 
      ? rows[subtitleRowIndex][matchingColumnIndex] : ""
    const content = (contentRowIndex >= 0 && rows[contentRowIndex] && rows[contentRowIndex][matchingColumnIndex]) 
      ? rows[contentRowIndex][matchingColumnIndex] : ""
    
    // Determine which column to use for additional data based on essential_lb
    let additionalColumnIndex = -1
    if (["赤ちゃん肌", "スマート肌", "コミュ肌", "平和肌"].includes(essential_lb)) {
      additionalColumnIndex = 0 // Column B (index 0)
    } else if (["オリジナル肌", "多才肌", "姉御肌", "ドリーム肌"].includes(essential_lb)) {
      additionalColumnIndex = 1 // Column C (index 1)
    } else if (["天才肌", "ポジティブ肌", "親分肌", "職人肌"].includes(essential_lb)) {
      additionalColumnIndex = 2 // Column D (index 2)
    }
    
    // Get additional data from row 12 (title) and row 13 (content)
    const additionalTitle = (additionalColumnIndex >= 0 && additionalRows[0] && additionalRows[0][additionalColumnIndex]) 
      ? additionalRows[0][additionalColumnIndex] : ""
    const additionalContent = (additionalColumnIndex >= 0 && additionalRows[1] && additionalRows[1][additionalColumnIndex]) 
      ? additionalRows[1][additionalColumnIndex] : ""
    
    // Find valuable_lb in B10:K10 (row index 2 in valuableRows) and get cells above it
    let valuableColumnIndex = -1
    if (valuableRows.length > 2) { // Make sure we have at least 3 rows (B8:K10)
      const valuableRow = valuableRows[2] // Row 10 (index 2)
      for (let colIndex = 0; colIndex < valuableRow.length; colIndex++) {
        const cellValue = valuableRow[colIndex]
        if (cellValue && cellValue === valuable_lb) {
          valuableColumnIndex = colIndex
          console.log("[v0] Found valuable_lb at column:", colIndex, "value:", cellValue)
          break
        }
      }
    }
    
    // Get valuable data: 1 above cell (subtitle), 2 above cell (title)
    const valuableTitle = (valuableColumnIndex >= 0 && valuableRows[0] && valuableRows[0][valuableColumnIndex]) 
      ? valuableRows[0][valuableColumnIndex] : "" // Row 8 (index 0)
    const valuableSubtitle = (valuableColumnIndex >= 0 && valuableRows[1] && valuableRows[1][valuableColumnIndex]) 
      ? valuableRows[1][valuableColumnIndex] : "" // Row 9 (index 1)
    
    // Find energy score data from B18:M29
    let energyMatchingRowIndex = -1
    let energyMatchingColumnIndex = -1
    
    // Find the circled essential in energy rows (B18:M29)
    for (let rowIndex = 0; rowIndex < energyRows.length; rowIndex++) {
      const row = energyRows[rowIndex]
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex]
        // Check if cell exactly matches the circled number version
        if (cellValue && cellValue === circledEssential) {
          energyMatchingRowIndex = rowIndex
          energyMatchingColumnIndex = colIndex
          console.log("[v0] Found energy matching at row:", rowIndex, "col:", colIndex, "value:", cellValue)
          break
        }
      }
      if (energyMatchingRowIndex !== -1) break
    }
    
    // Get energy score values from the 11 rows above the matching cell
    const energyScore: EnergyScore = {
      action: "",
      focus: "",
      stamina: "",
      creative: "",
      influence: "",
      emotional: "",
      recovery: "",
      intuition: "",
      judgment: "",
      adaptability: "",
      total: ""
    }
    
    if (energyMatchingRowIndex !== -1 && energyMatchingColumnIndex !== -1) {
      // Get values from 11 rows above (action is 11 above, total is 1 above)
      const actionRowIndex = energyMatchingRowIndex - 11
      const focusRowIndex = energyMatchingRowIndex - 10
      const staminaRowIndex = energyMatchingRowIndex - 9
      const creativeRowIndex = energyMatchingRowIndex - 8
      const influenceRowIndex = energyMatchingRowIndex - 7
      const emotionalRowIndex = energyMatchingRowIndex - 6
      const recoveryRowIndex = energyMatchingRowIndex - 5
      const intuitionRowIndex = energyMatchingRowIndex - 4
      const judgmentRowIndex = energyMatchingRowIndex - 3
      const adaptabilityRowIndex = energyMatchingRowIndex - 2
      const totalRowIndex = energyMatchingRowIndex - 1
      
      energyScore.action = (actionRowIndex >= 0 && energyRows[actionRowIndex] && energyRows[actionRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[actionRowIndex][energyMatchingColumnIndex] : ""
      energyScore.focus = (focusRowIndex >= 0 && energyRows[focusRowIndex] && energyRows[focusRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[focusRowIndex][energyMatchingColumnIndex] : ""
      energyScore.stamina = (staminaRowIndex >= 0 && energyRows[staminaRowIndex] && energyRows[staminaRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[staminaRowIndex][energyMatchingColumnIndex] : ""
      energyScore.creative = (creativeRowIndex >= 0 && energyRows[creativeRowIndex] && energyRows[creativeRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[creativeRowIndex][energyMatchingColumnIndex] : ""
      energyScore.influence = (influenceRowIndex >= 0 && energyRows[influenceRowIndex] && energyRows[influenceRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[influenceRowIndex][energyMatchingColumnIndex] : ""
      energyScore.emotional = (emotionalRowIndex >= 0 && energyRows[emotionalRowIndex] && energyRows[emotionalRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[emotionalRowIndex][energyMatchingColumnIndex] : ""
      energyScore.recovery = (recoveryRowIndex >= 0 && energyRows[recoveryRowIndex] && energyRows[recoveryRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[recoveryRowIndex][energyMatchingColumnIndex] : ""
      energyScore.intuition = (intuitionRowIndex >= 0 && energyRows[intuitionRowIndex] && energyRows[intuitionRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[intuitionRowIndex][energyMatchingColumnIndex] : ""
      energyScore.judgment = (judgmentRowIndex >= 0 && energyRows[judgmentRowIndex] && energyRows[judgmentRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[judgmentRowIndex][energyMatchingColumnIndex] : ""
      energyScore.adaptability = (adaptabilityRowIndex >= 0 && energyRows[adaptabilityRowIndex] && energyRows[adaptabilityRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[adaptabilityRowIndex][energyMatchingColumnIndex] : ""
      energyScore.total = (totalRowIndex >= 0 && energyRows[totalRowIndex] && energyRows[totalRowIndex][energyMatchingColumnIndex]) 
        ? energyRows[totalRowIndex][energyMatchingColumnIndex] : ""
    }
    
    // Get work data from 仕事 tab
    // 1. Find circled essential in B4:M4 (row index 2) and get one above (recommend) and two above (tenConcept)
    let workMatchingRowIndex = -1
    let workMatchingColumnIndex = -1
    
    if (workRows1.length > 2) { // Make sure we have at least 3 rows (B2:M4)
      const workRow = workRows1[2] // Row 4 (index 2)
      for (let colIndex = 0; colIndex < workRow.length; colIndex++) {
        const cellValue = workRow[colIndex]
        if (cellValue && cellValue === circledEssential) {
          workMatchingRowIndex = 2 // Row 4
          workMatchingColumnIndex = colIndex
          console.log("[v0] Found work matching at row:", 2, "col:", colIndex, "value:", cellValue)
          break
        }
      }
    }
    
    const recommend = (workMatchingRowIndex !== -1 && workRows1[1] && workRows1[1][workMatchingColumnIndex]) 
      ? workRows1[1][workMatchingColumnIndex] : "" // Row 3 (index 1)
    const tenConcept = (workMatchingRowIndex !== -1 && workRows1[0] && workRows1[0][workMatchingColumnIndex]) 
      ? workRows1[0][workMatchingColumnIndex] : "" // Row 2 (index 0)
    
    // 2. Find valuable_lb in B8:K8 (row index 1) and get one above (content)
    let workValuableColumnIndex = -1
    if (workRows2.length > 1) { // Make sure we have at least 2 rows (B7:K8)
      const workValuableRow = workRows2[1] // Row 8 (index 1)
      for (let colIndex = 0; colIndex < workValuableRow.length; colIndex++) {
        const cellValue = workValuableRow[colIndex]
        if (cellValue && cellValue === valuable_lb) {
          workValuableColumnIndex = colIndex
          console.log("[v0] Found work valuable at column:", colIndex, "value:", cellValue)
          break
        }
      }
    }
    
    const workContent = (workValuableColumnIndex >= 0 && workRows2[0] && workRows2[0][workValuableColumnIndex]) 
      ? workRows2[0][workValuableColumnIndex] : "" // Row 7 (index 0)
    
    const work = {
      recommend,
      tenConcept,
      workContent
    }
    
    // Get like data from 好き tab
    // Find circled essential in B5:M5 (row index 3) and get one above (content), two above (subtitle), three above (title)
    let likeMatchingRowIndex = -1
    let likeMatchingColumnIndex = -1
    
    if (likeRows.length > 3) { // Make sure we have at least 4 rows (B2:M5)
      const likeRow = likeRows[3] // Row 5 (index 3)
      for (let colIndex = 0; colIndex < likeRow.length; colIndex++) {
        const cellValue = likeRow[colIndex]
        if (cellValue && cellValue === circledEssential) {
          likeMatchingRowIndex = 3 // Row 5
          likeMatchingColumnIndex = colIndex
          console.log("[v0] Found like matching at row:", 3, "col:", colIndex, "value:", cellValue)
          break
        }
      }
    }
    
    const likeTitle = (likeMatchingRowIndex !== -1 && likeRows[0] && likeRows[0][likeMatchingColumnIndex]) 
      ? likeRows[0][likeMatchingColumnIndex] : "" // Row 2 (index 0)
    const likeSubtitle = (likeMatchingRowIndex !== -1 && likeRows[1] && likeRows[1][likeMatchingColumnIndex]) 
      ? likeRows[1][likeMatchingColumnIndex] : "" // Row 3 (index 1)
    const likeContent = (likeMatchingRowIndex !== -1 && likeRows[2] && likeRows[2][likeMatchingColumnIndex]) 
      ? likeRows[2][likeMatchingColumnIndex] : "" // Row 4 (index 2)
    
    const like = {
      title: likeTitle,
      subtitle: likeSubtitle,
      content: likeContent
    }
    
    // Get impressive data from 印象 tab
    // Find circled attractive in B7:M7 (row index 4) and get one above (likeDislike), two above (strong), three above (subtitle), four above (title)
    let impressiveMatchingRowIndex = -1
    let impressiveMatchingColumnIndex = -1
    
    // Create a mapping from attractive_lb to the circled number version
    const attractiveToCircledMapping: { [key: string]: string } = {
      // Element combinations (original mappings)
      "金土": "①金土",
      "銀金": "②銀金",
      "金水": "③金水",
      "金金": "④金金",
      "銀土": "⑤銀土",
      "銀水": "⑥銀水",
      "金木": "⑦金木",
      "銀火": "⑧銀火",
      "銀木": "⑨銀木",
      "金火": "⑩金火",
      // Skin types (added for attractive_lb when it's a skin type)
      "天才肌": "①天才肌",
      "オリジナル肌": "②オリジナル肌",
      "赤ちゃん肌": "③赤ちゃん肌",
      "多才肌": "④多才肌",
      "ポジティブ肌": "⑤ポジティブ肌",
      "スマート肌": "⑥スマート肌",
      "親分肌": "⑦親分肌",
      "姉御肌": "⑧姉御肌",
      "コミュ肌": "⑨コミュ肌",
      "ドリーム肌": "⑩ドリーム肌",
      "職人肌": "⑪職人肌",
      "平和肌": "⑫平和肌"
    }
    
    const circledAttractive = attractiveToCircledMapping[attractive_lb]
    console.log("[v0] Looking for circled attractive:", circledAttractive)
    
    if (impressiveRows.length > 4) { // Make sure we have at least 5 rows (B3:M7)
      const impressiveRow = impressiveRows[4] // Row 7 (index 4)
      for (let colIndex = 0; colIndex < impressiveRow.length; colIndex++) {
        const cellValue = impressiveRow[colIndex]
        if (cellValue && cellValue === circledAttractive) {
          impressiveMatchingRowIndex = 4 // Row 7
          impressiveMatchingColumnIndex = colIndex
          console.log("[v0] Found impressive matching at row:", 4, "col:", colIndex, "value:", cellValue)
          break
        }
      }
    }
    
    const impressiveTitle = (impressiveMatchingRowIndex !== -1 && impressiveRows[0] && impressiveRows[0][impressiveMatchingColumnIndex]) 
      ? impressiveRows[0][impressiveMatchingColumnIndex] : "" // Row 3 (index 0)
    const impressiveSubtitle = (impressiveMatchingRowIndex !== -1 && impressiveRows[1] && impressiveRows[1][impressiveMatchingColumnIndex]) 
      ? impressiveRows[1][impressiveMatchingColumnIndex] : "" // Row 4 (index 1)
    const impressiveStrong = (impressiveMatchingRowIndex !== -1 && impressiveRows[2] && impressiveRows[2][impressiveMatchingColumnIndex]) 
      ? impressiveRows[2][impressiveMatchingColumnIndex] : "" // Row 5 (index 2)
    const impressiveLikeDislike = (impressiveMatchingRowIndex !== -1 && impressiveRows[3] && impressiveRows[3][impressiveMatchingColumnIndex]) 
      ? impressiveRows[3][impressiveMatchingColumnIndex] : "" // Row 6 (index 3)
    
    const impressive = {
      title: impressiveTitle,
      subtitle: impressiveSubtitle,
      strong: impressiveStrong,
      likeDislike: impressiveLikeDislike
    }
    
    // Get loveAffair data from 恋愛 tab
    // Find valuable_lb in B8:K8 (row index 1) and get one above (content)
    let loveAffairMatchingColumnIndex = -1
    
    if (loveAffairRows.length > 1) { // Make sure we have at least 2 rows (B7:K8)
      const loveAffairRow = loveAffairRows[1] // Row 8 (index 1)
      for (let colIndex = 0; colIndex < loveAffairRow.length; colIndex++) {
        const cellValue = loveAffairRow[colIndex]
        if (cellValue && cellValue === valuable_lb) {
          loveAffairMatchingColumnIndex = colIndex
          console.log("[v0] Found loveAffair matching at column:", colIndex, "value:", cellValue)
          break
        }
      }
    }
    
    const loveAffairContent = (loveAffairMatchingColumnIndex >= 0 && loveAffairRows[0] && loveAffairRows[0][loveAffairMatchingColumnIndex]) 
      ? loveAffairRows[0][loveAffairMatchingColumnIndex] : "" // Row 7 (index 0)
    
    const loveAffair = {
      content: loveAffairContent
    }
    
    // Get marriage data from 結婚・離婚 tab
    // Find valuable_lb in B12:K12 (row index 1) and get one above (content)
    let marriageMatchingColumnIndex = -1
    
    if (marriageRows.length > 1) { // Make sure we have at least 2 rows (B11:K12)
      const marriageRow = marriageRows[1] // Row 12 (index 1)
      for (let colIndex = 0; colIndex < marriageRow.length; colIndex++) {
        const cellValue = marriageRow[colIndex]
        if (cellValue && cellValue === valuable_lb) {
          marriageMatchingColumnIndex = colIndex
          console.log("[v0] Found marriage matching at column:", colIndex, "value:", cellValue)
          break
        }
      }
    }
    
    const marriageContent = (marriageMatchingColumnIndex >= 0 && marriageRows[0] && marriageRows[0][marriageMatchingColumnIndex]) 
      ? marriageRows[0][marriageMatchingColumnIndex] : "" // Row 11 (index 0)
    
    const marriage = {
      content: marriageContent
    }
    
    // Get stress data from ストレス tab
    // Find problem_lb in C6:L6 (row index 3) and get one above (fiveGrowth), two above (minus), three above (plus)
    let stressMatchingColumnIndex = -1
    
    if (stressRows.length > 3) { // Make sure we have at least 4 rows (C3:L6)
      const stressRow = stressRows[3] // Row 6 (index 3)
      for (let colIndex = 0; colIndex < stressRow.length; colIndex++) {
        const cellValue = stressRow[colIndex]
        if (cellValue && cellValue === problem_lb) {
          stressMatchingColumnIndex = colIndex
          console.log("[v0] Found stress matching at column:", colIndex, "value:", cellValue)
          break
        }
      }
    }
    
    const stressPlus = (stressMatchingColumnIndex >= 0 && stressRows[0] && stressRows[0][stressMatchingColumnIndex]) 
      ? stressRows[0][stressMatchingColumnIndex] : "" // Row 3 (index 0)
    const stressMinus = (stressMatchingColumnIndex >= 0 && stressRows[1] && stressRows[1][stressMatchingColumnIndex]) 
      ? stressRows[1][stressMatchingColumnIndex] : "" // Row 4 (index 1)
    const stressFiveGrowth = (stressMatchingColumnIndex >= 0 && stressRows[2] && stressRows[2][stressMatchingColumnIndex]) 
      ? stressRows[2][stressMatchingColumnIndex] : "" // Row 5 (index 2)
    
    const stress = {
      plus: stressPlus,
      minus: stressMinus,
      fiveGrowth: stressFiveGrowth
    }
    
    console.log("[v0] Talent data structured:", { title, subtitle, content, additionalTitle, additionalContent, valuableTitle, valuableSubtitle, energyScore, work, like, impressive, loveAffair, marriage, stress })
    
    return { 
      talent: { title, subtitle, content, additionalTitle, additionalContent, valuableTitle, valuableSubtitle, energyScore },
      work,
      like,
      impressive,
      loveAffair,
      marriage,
      stress
    }
    
  } catch (error) {
    console.error("[v0] Error fetching talent data:", error)
    return null
  }
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
    
    console.log("[v0] Mapping results:")
    console.log("[v0] essential:", essential, "-> essential_lb:", essential_lb)
    console.log("[v0] attractive:", attractive, "-> attractive_lb:", attractive_lb)
    console.log("[v0] valuable:", valuable, "-> valuable_lb:", valuable_lb)
    console.log("[v0] problem:", problem, "-> problem_lb:", problem_lb)
    
    // Check if mappings are working correctly
    if (essential_lb === essential) {
      console.log("[v0] WARNING: essential mapping failed for:", essential)
    }
    if (attractive_lb === attractive) {
      console.log("[v0] WARNING: attractive mapping failed for:", attractive)
    }
    if (valuable_lb === valuable) {
      console.log("[v0] WARNING: valuable mapping failed for:", valuable)
    }
    if (problem_lb === problem) {
      console.log("[v0] WARNING: problem mapping failed for:", problem)
    }
    
    // Fetch talent data from the second Google Sheet
    const talent = await fetchTalentData(essential_lb, valuable_lb, attractive_lb, problem_lb)
    console.log("[v0] Talent data fetched:", talent)
    console.log("[v0] Returning diagnosis results")

    return NextResponse.json({
      essential,
      essential_lb,
      attractive,
      attractive_lb,
      valuable,
      valuable_lb,
      problem,
      problem_lb,
      talent: talent?.talent,
      work: talent?.work,
      like: talent?.like,
      impressive: talent?.impressive,
      loveAffair: talent?.loveAffair,
      marriage: talent?.marriage,
      stress: talent?.stress,
    })
  } catch (error) {
    console.error("[v0] API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
