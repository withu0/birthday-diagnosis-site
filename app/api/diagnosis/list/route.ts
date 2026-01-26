import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { diagnosisResults } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch only current user's diagnosis results, ordered by most recent first
    const results = await db
      .select({
        id: diagnosisResults.id,
        name: diagnosisResults.name,
        birthDate: diagnosisResults.birthDate,
        createdAt: diagnosisResults.createdAt,
      })
      .from(diagnosisResults)
      .where(eq(diagnosisResults.userId, session.userId))
      .orderBy(desc(diagnosisResults.createdAt))
      .limit(100) // Limit to 100 most recent results

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    console.error("[diagnosis/list] Error fetching diagnosis results:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

