import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compatibilityTypes } from "@/lib/db/schema"

// GET all compatibility types (public endpoint for reading descriptions)
export async function GET() {
  try {
    const types = await db.select().from(compatibilityTypes).orderBy(compatibilityTypes.id)

    // Convert to object keyed by id for easy lookup
    const typesMap: Record<number, { id: number; name: string; description: string }> = {}
    types.forEach((type) => {
      typesMap[type.id] = {
        id: type.id,
        name: type.name,
        description: type.description,
      }
    })

    return NextResponse.json({ types: typesMap })
  } catch (error) {
    console.error("Error fetching compatibility types:", error)
    return NextResponse.json(
      { error: "相性タイプの取得に失敗しました" },
      { status: 500 }
    )
  }
}

