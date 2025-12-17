import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import * as dotenv from "dotenv"
import * as path from "path"

// Load environment variables from .env.local if not already loaded
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(process.cwd(), ".env.local") })
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const connectionString = process.env.DATABASE_URL
const client = postgres(connectionString, { 
  max: 1,
})

export const db = drizzle(client, { schema })
