// Load environment variables FIRST, before any imports that depend on them
import * as dotenv from "dotenv"
import * as path from "path"
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

import * as fs from "fs"
import { db } from "../lib/db"
import { skinCompatibility } from "../lib/db/schema"

interface SkinCompatibilityData {
  [skinType: string]: {
    [otherSkinType: string]: {
      compatibilityLevel: string
      iconType: string
      relationshipImage: string
    }
  }
}

async function main() {
  const jsonPath = path.join(process.cwd(), "skin-compatibility.json")

  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: ${jsonPath} not found.`)
    process.exit(1)
  }

  console.log(`Reading skin compatibility data from: ${jsonPath}`)
  const fileContent = fs.readFileSync(jsonPath, "utf-8")
  const data: SkinCompatibilityData = JSON.parse(fileContent)

  console.log(`Found ${Object.keys(data).length} skin types to import`)

  // Clear existing data
  console.log("\nClearing existing skin compatibility data...")
  await db.delete(skinCompatibility)
  console.log("✓ Cleared existing data")

  let totalInserted = 0

  // Import each skin type combination
  for (const [skinTypeA, compatibilities] of Object.entries(data)) {
    console.log(`\nImporting compatibility data for: ${skinTypeA}`)
    
    const valuesToInsert = Object.entries(compatibilities).map(([skinTypeB, compatibility]) => ({
      skinTypeA,
      skinTypeB,
      compatibilityLevel: compatibility.compatibilityLevel,
      iconType: compatibility.iconType,
      relationshipImage: compatibility.relationshipImage,
    }))

    try {
      // Insert in batches to avoid overwhelming the database
      const batchSize = 50
      for (let i = 0; i < valuesToInsert.length; i += batchSize) {
        const batch = valuesToInsert.slice(i, i + batchSize)
        await db.insert(skinCompatibility).values(batch)
        totalInserted += batch.length
      }

      console.log(`  ✓ Inserted ${valuesToInsert.length} records for ${skinTypeA}`)
    } catch (error) {
      console.error(`  ✗ Error importing ${skinTypeA}:`, error)
    }
  }

  console.log(`\n✓ Successfully imported ${totalInserted} skin compatibility records`)
  console.log("  Database import complete!")
}

main()
  .then(() => {
    console.log("\nScript completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\nScript failed:", error)
    process.exit(1)
  })

