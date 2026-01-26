import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { diagnosisResults } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    // Fetch specific diagnosis result for current user only
    const [result] = await db
      .select()
      .from(diagnosisResults)
      .where(
        and(
          eq(diagnosisResults.id, id),
          eq(diagnosisResults.userId, session.userId)
        )
      )
      .limit(1)

    if (!result) {
      return NextResponse.json(
        { error: "Diagnosis result not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        id: result.id,
        name: result.name,
        birthDate: result.birthDate,
        resultData: result.resultData,
        createdAt: result.createdAt,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[diagnosis/[id]] Error fetching diagnosis result:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

