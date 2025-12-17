import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const connectionString = process.env.DATABASE_URL
<<<<<<< HEAD
// Configure postgres to handle Date objects correctly
const client = postgres(connectionString, { 
  max: 1,
  types: {
    date: {
      serialize: (value: Date) => value.toISOString(),
      parse: (value: string) => new Date(value),
    },
    timestamp: {
      serialize: (value: Date) => value.toISOString(),
      parse: (value: string) => new Date(value),
    },
    timestamptz: {
      serialize: (value: Date) => value.toISOString(),
      parse: (value: string) => new Date(value),
    },
  },
})
=======
const client = postgres(connectionString, { max: 1 })
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0

export const db = drizzle(client, { schema })
