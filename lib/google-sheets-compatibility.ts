import { google } from "googleapis"

export interface CompatibilityValue {
  peach: string | null // ピーチコア
  hard: string | null // ハイドコア
}

export interface CompatibilityPair {
  A: CompatibilityValue
  B: CompatibilityValue
  rowIndex: number // 0-based row index in the sheet
  colIndex: number // 0-based column index in the sheet
}

export interface CompatibilityRange {
  sheetName: string
  range: string
  compatibilityType: number
}

// Convert column letter to 0-based index (A=0, B=1, etc.)
function columnLetterToIndex(letter: string): number {
  let index = 0
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64)
  }
  return index - 1
}

// Convert 0-based index to column letter
function indexToColumnLetter(index: number): string {
  let result = ""
  index++
  while (index > 0) {
    index--
    result = String.fromCharCode(65 + (index % 26)) + result
    index = Math.floor(index / 26)
  }
  return result
}

// Parse range like "A2:H10" into start/end coordinates
function parseRange(range: string): { startRow: number; startCol: number; endRow: number; endCol: number } {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
  if (!match) {
    throw new Error(`Invalid range format: ${range}`)
  }

  const [, startCol, startRowStr, endCol, endRowStr] = match
  return {
    startRow: parseInt(startRowStr, 10) - 1, // Convert to 0-based
    startCol: columnLetterToIndex(startCol),
    endRow: parseInt(endRowStr, 10) - 1,
    endCol: columnLetterToIndex(endCol),
  }
}

// Get Google Sheets client
export function getGoogleSheetsClient() {
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

// Extract compatibility data from a sheet range
export function extractCompatibilityData(
  rows: (string | number | boolean)[][],
  range: string,
  sheetName: string,
  compatibilityType: number
): CompatibilityPair[] {
  const { startRow, startCol, endRow, endCol } = parseRange(range)
  const results: CompatibilityPair[] = []

  // Data blocks are 3 columns wide (label, A, B) with 1 empty column between them
  // In Y direction, blocks are 2 rows tall (ピーチコア, ハイドコア) with 1 empty row between them

  // Find all row block starts (rows that contain "ピーチコア")
  const rowBlockStarts: number[] = []
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    // Check if this row contains "ピーチコア" in any column
    if (row && row.some((cell) => String(cell).trim() === "ピーチコア")) {
      rowBlockStarts.push(rowIdx)
    }
  }

  // Find all column block starts (columns that contain "ピーチコア" or "ハイドコア")
  const colBlockStarts: number[] = []
  for (let colIdx = 0; colIdx <= endCol - startCol; colIdx++) {
    // Check if this column contains "ピーチコア" or "ハイドコア" in any row
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx]
      if (row && row[colIdx] && (String(row[colIdx]).trim() === "ピーチコア" || String(row[colIdx]).trim() === "ハイドコア")) {
        if (!colBlockStarts.includes(colIdx)) {
          colBlockStarts.push(colIdx)
        }
        break
      }
    }
  }

  // Extract data from each block
  for (const rowBlockStart of rowBlockStarts) {
    for (const colBlockStart of colBlockStarts) {
      // Each block is 3 columns: label (colBlockStart), A (colBlockStart+1), B (colBlockStart+2)
      // And 2 rows: ピーチコア (rowBlockStart), ハイドコア (rowBlockStart+1)

      if (rowBlockStart + 1 >= rows.length || colBlockStart + 2 >= (rows[rowBlockStart]?.length || 0)) {
        continue
      }

      const peachRow = rows[rowBlockStart]
      const hardRow = rows[rowBlockStart + 1]

      if (!peachRow || !hardRow) {
        continue
      }

      // Verify labels
      const peachLabel = String(peachRow[colBlockStart] || "").trim()
      const hardLabel = String(hardRow[colBlockStart] || "").trim()

      if (peachLabel !== "ピーチコア" || hardLabel !== "ハイドコア") {
        continue
      }

      // Extract values
      const aPeach = String(peachRow[colBlockStart + 1] || "").trim() || null
      const bPeach = String(peachRow[colBlockStart + 2] || "").trim() || null
      const aHard = String(hardRow[colBlockStart + 1] || "").trim() || null
      const bHard = String(hardRow[colBlockStart + 2] || "").trim() || null

      // Only add if we have at least some data
      if (aPeach || bPeach || aHard || bHard) {
        results.push({
          A: {
            peach: aPeach,
            hard: aHard,
          },
          B: {
            peach: bPeach,
            hard: bHard,
          },
          rowIndex: startRow + rowBlockStart,
          colIndex: startCol + colBlockStart,
        })
      }
    }
  }

  return results
}

// Fetch data from Google Sheets and extract compatibility data
export async function fetchCompatibilityData(
  spreadsheetId: string,
  range: CompatibilityRange
): Promise<CompatibilityPair[]> {
  const sheets = getGoogleSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${range.sheetName}!${range.range}`,
  })

  const rows = response.data.values || []
  if (rows.length === 0) {
    console.warn(`No data found for ${range.sheetName}!${range.range}`)
    return []
  }

  // Convert to 2D array with proper dimensions
  const maxCols = Math.max(...rows.map((row) => row.length))
  const normalizedRows: (string | number | boolean)[][] = rows.map((row) => {
    const normalized: (string | number | boolean)[] = []
    for (let i = 0; i < maxCols; i++) {
      normalized.push(row[i] || "")
    }
    return normalized
  })

  return extractCompatibilityData(normalizedRows, range.range, range.sheetName, range.compatibilityType)
}

