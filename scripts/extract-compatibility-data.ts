// Load environment variables FIRST, before any imports that depend on them
import * as dotenv from "dotenv"
import * as path from "path"
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

import * as fs from "fs"
import { fetchCompatibilityData, CompatibilityRange, CompatibilityPair } from "../lib/google-sheets-compatibility"

interface CompatibilityDataSet {
  compatibilityType: number
  sheetName: string
  range: string
  data: CompatibilityPair[]
}

// Define all the ranges to extract
const COMPATIBILITY_RANGES: CompatibilityRange[] = [
  { compatibilityType: 1, sheetName: "相性①完成", range: "A2:AM31" },
  // Type 2: Four separate tabs
  { compatibilityType: 2, sheetName: "相性②③ハイドコア++", range: "A3:AM17" },
  { compatibilityType: 2, sheetName: "相性②③ハイドコア+－", range: "A3:AM17" },
  { compatibilityType: 2, sheetName: "相性②③ハイドコア－＋", range: "A3:AM17" },
  { compatibilityType: 2, sheetName: "相性②③ハイドコア－－", range: "A3:AM17" },
  // Type 3: Four separate tabs
  { compatibilityType: 3, sheetName: "相性②③ハイドコア++", range: "A19:AM33" },
  { compatibilityType: 3, sheetName: "相性②③ハイドコア+－", range: "A19:AM33" },
  { compatibilityType: 3, sheetName: "相性②③ハイドコア－＋", range: "A19:AM33" },
  { compatibilityType: 3, sheetName: "相性②③ハイドコア－－", range: "A19:AM33" },
  // Type 4: Four separate tabs
  { compatibilityType: 4, sheetName: "相性④⑤＋＋", range: "A3:AM17" },
  { compatibilityType: 4, sheetName: "相性④⑤＋－", range: "A3:AM17" },
  { compatibilityType: 4, sheetName: "相性④⑤－－", range: "A3:AM17" },
  { compatibilityType: 4, sheetName: "相性④⑤－＋", range: "A3:AM17" },
  // Type 5: Four separate tabs
  { compatibilityType: 5, sheetName: "相性④⑤＋＋", range: "A19:AM33" },
  { compatibilityType: 5, sheetName: "相性④⑤＋－", range: "A19:AM33" },
  { compatibilityType: 5, sheetName: "相性④⑤－－", range: "A19:AM33" },
  { compatibilityType: 5, sheetName: "相性④⑤－＋", range: "A19:AM33" },
  { compatibilityType: 6, sheetName: "相性⑥完成", range: "A3:AM17" },
  { compatibilityType: 6, sheetName: "相性⑥完成", range: "A19:AM33" }, // Combined with above
  // Type 7: Three separate tabs
  { compatibilityType: 7, sheetName: "相性⑦⑬ピーチコア＋＋", range: "A3:AM17" },
  { compatibilityType: 7, sheetName: "相性⑦⑬ピーチコア＋－", range: "A3:AM17" },
  { compatibilityType: 7, sheetName: "相性⑦⑬ピーチコア－－", range: "A3:AM17" },
  // Type 13: Three separate tabs
  { compatibilityType: 13, sheetName: "相性⑦⑬ピーチコア＋＋", range: "A19:AM33" },
  { compatibilityType: 13, sheetName: "相性⑦⑬ピーチコア＋－", range: "A19:AM33" },
  { compatibilityType: 13, sheetName: "相性⑦⑬ピーチコア－－", range: "A19:AM33" },
  { compatibilityType: 8, sheetName: "相性⑧⑮完成", range: "A3:S17" },
  { compatibilityType: 15, sheetName: "相性⑧⑮完成", range: "A19:S33" },
  { compatibilityType: 9, sheetName: "相性⑨⑭完成", range: "A3:S17" },
  { compatibilityType: 14, sheetName: "相性⑨⑭完成", range: "A19:S33" },
  { compatibilityType: 10, sheetName: "相性⑩⑰完成", range: "A3:S17" },
  { compatibilityType: 17, sheetName: "相性⑩⑰完成", range: "A19:S33" },
  { compatibilityType: 11, sheetName: "相性⑪⑯完成", range: "A3:S17" },
  { compatibilityType: 16, sheetName: "相性⑪⑯完成", range: "A19:S33" },
  { compatibilityType: 12, sheetName: "相性⑫⑱完成", range: "A3:AM17" },
  { compatibilityType: 18, sheetName: "相性⑫⑱完成", range: "A19:AM33" },
  { compatibilityType: 19, sheetName: "相性⑲㉕完成", range: "A3:AM17" },
  { compatibilityType: 25, sheetName: "相性⑲㉕完成", range: "A19:AM33" },
  { compatibilityType: 20, sheetName: "相性⑳㉗完成", range: "A3:S17" },
  { compatibilityType: 27, sheetName: "相性⑳㉗完成", range: "A19:S33" },
  { compatibilityType: 21, sheetName: "相性㉑㉖完成", range: "A3:S17" },
  { compatibilityType: 26, sheetName: "相性㉑㉖完成", range: "A19:S33" },
  { compatibilityType: 22, sheetName: "相性㉒㉙完成", range: "A3:S17" },
  { compatibilityType: 29, sheetName: "相性㉒㉙完成", range: "A19:S33" },
  { compatibilityType: 23, sheetName: "相性㉓㉘完成", range: "A3:S17" },
  { compatibilityType: 28, sheetName: "相性㉓㉘完成", range: "A19:S33" },
  { compatibilityType: 24, sheetName: "相性㉔㉚完成", range: "A3:AM17" },
  { compatibilityType: 30, sheetName: "相性㉔㉚完成", range: "A19:AM33" },
  { compatibilityType: 31, sheetName: "相性㉛完成", range: "A2:AM31" },
  { compatibilityType: 32, sheetName: "相性㉜㉝完成", range: "A3:AM17" },
  { compatibilityType: 33, sheetName: "相性㉜㉝完成", range: "A19:AM33" },
  { compatibilityType: 34, sheetName: "相性㉞㉟完成", range: "A3:AM17" },
  { compatibilityType: 35, sheetName: "相性㉞㉟完成", range: "A19:AM33" },
  { compatibilityType: 36, sheetName: "相性㊱完成", range: "A2:AM31" },
]

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEET_COMP

  if (!spreadsheetId) {
    console.error("Error: GOOGLE_SHEET_COMP environment variable is not set")
    process.exit(1)
  }

  console.log(`Extracting compatibility data from spreadsheet: ${spreadsheetId}`)
  console.log(`Total ranges to process: ${COMPATIBILITY_RANGES.length}`)

  const allData: CompatibilityDataSet[] = []
  const dataByType = new Map<number, CompatibilityPair[]>()

  // Process each range
  for (let i = 0; i < COMPATIBILITY_RANGES.length; i++) {
    const range = COMPATIBILITY_RANGES[i]
    console.log(`\n[${i + 1}/${COMPATIBILITY_RANGES.length}] Processing ${range.sheetName}!${range.range} (Type ${range.compatibilityType})`)

    try {
      const data = await fetchCompatibilityData(spreadsheetId, range)

      if (data.length === 0) {
        console.warn(`  ⚠️  No data extracted from ${range.sheetName}!${range.range}`)
      } else {
        console.log(`  ✓ Extracted ${data.length} compatibility pairs`)

        // Combine data for types that have multiple ranges (2, 3, 4, 5, 6, 7, 13)
        const existing = dataByType.get(range.compatibilityType) || []
        dataByType.set(range.compatibilityType, [...existing, ...data])
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${range.sheetName}!${range.range}:`, error)
    }
  }

  // Convert map to array
  for (const [compatibilityType, data] of dataByType.entries()) {
    // Find all ranges with this type to get sheet name and combined range info
    const rangesForType = COMPATIBILITY_RANGES.filter((r) => r.compatibilityType === compatibilityType)
    if (rangesForType.length > 0) {
      const firstRange = rangesForType[0]
      // For types with multiple ranges (2, 3, 4, 5, 6, 7, 13, etc.), combine the ranges in the description
      const rangeDescription =
        rangesForType.length > 1
          ? rangesForType.map((r) => `${r.sheetName}!${r.range}`).join(" + ")
          : firstRange.range

      allData.push({
        compatibilityType,
        sheetName: firstRange.sheetName,
        range: rangeDescription,
        data,
      })
    }
  }

  // Save to JSON file
  const outputPath = path.join(process.cwd(), "compatibility-data.json")
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), "utf-8")

  console.log(`\n✓ Successfully extracted compatibility data`)
  console.log(`  Total compatibility types: ${allData.length}`)
  console.log(`  Total pairs: ${allData.reduce((sum, d) => sum + d.data.length, 0)}`)
  console.log(`  Saved to: ${outputPath}`)
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})

