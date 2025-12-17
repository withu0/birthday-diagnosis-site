import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { db } from "../lib/db"
import * as schema from "../lib/db/schema"
import { eq } from "drizzle-orm"

// Load environment variables FIRST, before any imports that depend on them
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error("Error: Please provide the dump file path")
    console.log("\nUsage: npm run db:restore <dump-file-path>")
    console.log("Example: npm run db:restore database-dump-2025-12-17T20-06-30-649Z.json")
    process.exit(1)
  }

  const dumpFilePath = path.isAbsolute(args[0]) 
    ? args[0] 
    : path.join(process.cwd(), args[0])

  if (!fs.existsSync(dumpFilePath)) {
    console.error(`Error: Dump file not found: ${dumpFilePath}`)
    process.exit(1)
  }

  console.log(`Reading dump file: ${dumpFilePath}`)
  const fileContent = fs.readFileSync(dumpFilePath, "utf-8")
  const dumpData = JSON.parse(fileContent)

  console.log(`Dump timestamp: ${dumpData.timestamp}`)
  console.log(`\nStarting database restore...`)

  try {
    // Restore users
    if (dumpData.tables.users && dumpData.tables.users.length > 0) {
      console.log(`\nRestoring ${dumpData.tables.users.length} users...`)
      // Clear existing users first (optional - comment out if you want to keep existing)
      // await db.delete(schema.users)
      
      // Insert users - handle conflicts by skipping
      for (const user of dumpData.tables.users) {
        try {
          await db.insert(schema.users).values(user)
        } catch (error: any) {
          // Skip if duplicate (unique constraint violation)
          if (error?.code === "23505") {
            console.log(`  ⚠ Skipped duplicate user: ${user.email}`)
          } else {
            throw error
          }
        }
      }
      console.log(`  ✓ Restored users`)
    }

    // Restore payments
    if (dumpData.tables.payments && dumpData.tables.payments.length > 0) {
      console.log(`\nRestoring ${dumpData.tables.payments.length} payments...`)
      // await db.delete(schema.payments)
      for (const payment of dumpData.tables.payments) {
        try {
          await db.insert(schema.payments).values(payment)
        } catch (error: any) {
          if (error?.code === "23505") {
            console.log(`  ⚠ Skipped duplicate payment: ${payment.id}`)
          } else {
            throw error
          }
        }
      }
      console.log(`  ✓ Restored payments`)
    }

    // Restore memberships
    if (dumpData.tables.memberships && dumpData.tables.memberships.length > 0) {
      console.log(`\nRestoring ${dumpData.tables.memberships.length} memberships...`)
      // await db.delete(schema.memberships)
      for (const membership of dumpData.tables.memberships) {
        try {
          await db.insert(schema.memberships).values(membership)
        } catch (error: any) {
          if (error?.code === "23505") {
            console.log(`  ⚠ Skipped duplicate membership: ${membership.id}`)
          } else {
            throw error
          }
        }
      }
      console.log(`  ✓ Restored memberships`)
    }

    // Restore diagnosis_results
    if (dumpData.tables.diagnosisResults && dumpData.tables.diagnosisResults.length > 0) {
      console.log(`\nRestoring ${dumpData.tables.diagnosisResults.length} diagnosis results...`)
      // await db.delete(schema.diagnosisResults)
      for (const result of dumpData.tables.diagnosisResults) {
        try {
          await db.insert(schema.diagnosisResults).values(result)
        } catch (error: any) {
          if (error?.code === "23505") {
            console.log(`  ⚠ Skipped duplicate diagnosis result: ${result.id}`)
          } else {
            throw error
          }
        }
      }
      console.log(`  ✓ Restored diagnosis results`)
    }

    // Restore compatibility_data
    if (dumpData.tables.compatibilityData && dumpData.tables.compatibilityData.length > 0) {
      console.log(`\nRestoring ${dumpData.tables.compatibilityData.length} compatibility data records...`)
      // await db.delete(schema.compatibilityData)
      
      // Insert in batches to avoid overwhelming the database
      const batchSize = 100
      let inserted = 0
      let skipped = 0
      for (let i = 0; i < dumpData.tables.compatibilityData.length; i += batchSize) {
        const batch = dumpData.tables.compatibilityData.slice(i, i + batchSize)
        for (const item of batch) {
          try {
            await db.insert(schema.compatibilityData).values(item)
            inserted++
          } catch (error: any) {
            if (error?.code === "23505") {
              skipped++
            } else {
              throw error
            }
          }
        }
      }
      console.log(`  ✓ Restored ${inserted} records, skipped ${skipped} duplicates`)
    }

    // Restore compatibility_types
    if (dumpData.tables.compatibilityTypes && dumpData.tables.compatibilityTypes.length > 0) {
      console.log(`\nRestoring ${dumpData.tables.compatibilityTypes.length} compatibility types...`)
      // await db.delete(schema.compatibilityTypes)
      for (const type of dumpData.tables.compatibilityTypes) {
        try {
          // Try to update first, if not exists, insert
          const [existing] = await db
            .select()
            .from(schema.compatibilityTypes)
            .where(eq(schema.compatibilityTypes.id, type.id))
            .limit(1)
          
          if (existing) {
            await db
              .update(schema.compatibilityTypes)
              .set({
                name: type.name,
                description: type.description,
                updatedAt: new Date(),
              })
              .where(eq(schema.compatibilityTypes.id, type.id))
          } else {
            await db.insert(schema.compatibilityTypes).values(type)
          }
        } catch (error: any) {
          if (error?.code !== "23505") {
            throw error
          }
        }
      }
      console.log(`  ✓ Restored compatibility types`)
    }

    console.log(`\n✓ Database restore completed successfully!`)
    console.log(`  Total records restored: ${Object.values(dumpData.tables).reduce((sum: number, table: any) => sum + (Array.isArray(table) ? table.length : 0), 0)}`)
  } catch (error) {
    console.error("Error restoring database:", error)
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

