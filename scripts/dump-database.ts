import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { db } from "../lib/db"
import * as schema from "../lib/db/schema"

// Load environment variables FIRST, before any imports that depend on them
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function main() {
  console.log("Starting database dump...")

  const dumpData: any = {
    timestamp: new Date().toISOString(),
    tables: {},
  }

  try {
    // Dump users table
    console.log("Dumping users...")
    const users = await db.select().from(schema.users)
    dumpData.tables.users = users
    console.log(`  ✓ Dumped ${users.length} users`)

    // Dump payments table
    console.log("Dumping payments...")
    const payments = await db.select().from(schema.payments)
    dumpData.tables.payments = payments
    console.log(`  ✓ Dumped ${payments.length} payments`)

    // Dump memberships table
    console.log("Dumping memberships...")
    const memberships = await db.select().from(schema.memberships)
    dumpData.tables.memberships = memberships
    console.log(`  ✓ Dumped ${memberships.length} memberships`)

    // Dump diagnosis_results table
    console.log("Dumping diagnosis_results...")
    const diagnosisResults = await db.select().from(schema.diagnosisResults)
    dumpData.tables.diagnosisResults = diagnosisResults
    console.log(`  ✓ Dumped ${diagnosisResults.length} diagnosis results`)

    // Dump compatibility_data table
    console.log("Dumping compatibility_data...")
    const compatibilityData = await db.select().from(schema.compatibilityData)
    dumpData.tables.compatibilityData = compatibilityData
    console.log(`  ✓ Dumped ${compatibilityData.length} compatibility data records`)

    // Dump compatibility_types table
    console.log("Dumping compatibility_types...")
    const compatibilityTypes = await db.select().from(schema.compatibilityTypes)
    dumpData.tables.compatibilityTypes = compatibilityTypes
    console.log(`  ✓ Dumped ${compatibilityTypes.length} compatibility types`)

    // Save to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const outputPath = path.join(process.cwd(), `database-dump-${timestamp}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(dumpData, null, 2), "utf-8")

    console.log(`\n✓ Database dump completed successfully!`)
    console.log(`  Saved to: ${outputPath}`)
    console.log(`  Total records: ${Object.values(dumpData.tables).reduce((sum: number, table: any) => sum + (Array.isArray(table) ? table.length : 0), 0)}`)
  } catch (error) {
    console.error("Error dumping database:", error)
    process.exit(1)
  }
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

