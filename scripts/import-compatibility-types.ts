import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { db } from "../lib/db"
import { compatibilityTypes } from "../lib/db/schema"

// Load environment variables FIRST, before any imports that depend on them
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

interface CompatibilityTypeData {
  id: number
  name: string
  description: string
}

async function main() {
  const jsonPath = path.join(process.cwd(), "compatibility-types.json")

  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: ${jsonPath} not found.`)
    process.exit(1)
  }

  console.log(`Reading compatibility types from: ${jsonPath}`)
  const fileContent = fs.readFileSync(jsonPath, "utf-8")
  const data: Record<string, CompatibilityTypeData> = JSON.parse(fileContent)

  console.log(`Found ${Object.keys(data).length} compatibility types to import`)

  // Clear existing data
  console.log("\nClearing existing compatibility types...")
  await db.delete(compatibilityTypes)
  console.log("✓ Cleared existing data")

  // Convert to array and import
  const typesToInsert = Object.values(data).map((type) => ({
    id: type.id,
    name: type.name,
    description: type.description,
  }))

  try {
    // Insert all types
    await db.insert(compatibilityTypes).values(typesToInsert)
    console.log(`\n✓ Successfully imported ${typesToInsert.length} compatibility types`)
    console.log("  Database import complete!")
  } catch (error) {
    console.error("✗ Error importing compatibility types:", error)
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

