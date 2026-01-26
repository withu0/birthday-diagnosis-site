import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { diagnosisResults } from "@/lib/db/schema"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, birthDate, resultData } = await request.json()

    if (!name || !birthDate || !resultData) {
      return NextResponse.json(
        { error: "Name, birthDate, and resultData are required" },
        { status: 400 }
      )
    }

    // Save diagnosis result to database with userId
    const [result] = await db
      .insert(diagnosisResults)
      .values({
        userId: session.userId,
        name,
        birthDate,
        resultData: resultData as any, // Store as JSONB
      })
      .returning()

    return NextResponse.json({ success: true, id: result.id }, { status: 201 })
  } catch (error) {
    console.error("[diagnosis/save] Error saving diagnosis result:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

