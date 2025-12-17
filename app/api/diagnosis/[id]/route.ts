import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { diagnosisResults } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    // Fetch specific diagnosis result
    const [result] = await db
      .select()
      .from(diagnosisResults)
      .where(eq(diagnosisResults.id, id))
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

