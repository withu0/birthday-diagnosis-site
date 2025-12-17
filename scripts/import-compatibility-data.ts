// Load environment variables FIRST, before any imports that depend on them
import * as dotenv from "dotenv"
import * as path from "path"
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

import * as fs from "fs"
import { db } from "../lib/db"
import { compatibilityData } from "../lib/db/schema"
import { CompatibilityPair } from "../lib/google-sheets-compatibility"

interface CompatibilityDataSet {
  compatibilityType: number
  sheetName: string
  range: string
  data: CompatibilityPair[]
}

async function main() {
  const jsonPath = path.join(process.cwd(), "compatibility-data.json")

  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: ${jsonPath} not found. Please run extract-compatibility-data.ts first.`)
    process.exit(1)
  }

  console.log(`Reading compatibility data from: ${jsonPath}`)
  const fileContent = fs.readFileSync(jsonPath, "utf-8")
  const allData: CompatibilityDataSet[] = JSON.parse(fileContent)

  console.log(`Found ${allData.length} compatibility types to import`)

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("\nClearing existing compatibility data...")
  await db.delete(compatibilityData)
  console.log("✓ Cleared existing data")

  let totalInserted = 0

  // Import each compatibility type
  for (const dataSet of allData) {
    console.log(
      `\nImporting Type ${dataSet.compatibilityType} (${dataSet.sheetName}, ${dataSet.range}): ${dataSet.data.length} pairs`
    )

    const valuesToInsert = dataSet.data.map((pair) => ({
      compatibilityType: dataSet.compatibilityType,
      sheetName: dataSet.sheetName,
      range: dataSet.range,
      aPeach: pair.A.peach,
      aHard: pair.A.hard,
      bPeach: pair.B.peach,
      bHard: pair.B.hard,
      rowIndex: pair.rowIndex,
      colIndex: pair.colIndex,
    }))

    try {
      // Insert in batches to avoid overwhelming the database
      const batchSize = 100
      for (let i = 0; i < valuesToInsert.length; i += batchSize) {
        const batch = valuesToInsert.slice(i, i + batchSize)
        await db.insert(compatibilityData).values(batch)
        totalInserted += batch.length
      }

      console.log(`  ✓ Inserted ${valuesToInsert.length} records`)
    } catch (error) {
      console.error(`  ✗ Error importing Type ${dataSet.compatibilityType}:`, error)
    }
  }

  console.log(`\n✓ Successfully imported ${totalInserted} compatibility records`)
  console.log("  Database import complete!")
}

main()
  .then(() => {
    console.log("\nDone!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })

