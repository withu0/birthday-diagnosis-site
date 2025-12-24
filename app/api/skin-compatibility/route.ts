import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { skinCompatibility } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skinTypeA = searchParams.get("skinTypeA")
    const skinTypeB = searchParams.get("skinTypeB")

    // If both skin types are provided, return specific compatibility
    if (skinTypeA && skinTypeB) {
      const result = await db
        .select()
        .from(skinCompatibility)
        .where(
          and(
            eq(skinCompatibility.skinTypeA, skinTypeA),
            eq(skinCompatibility.skinTypeB, skinTypeB)
          )
        )
        .limit(1)

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Compatibility data not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(result[0])
    }

    // If only skinTypeA is provided, return all compatibilities for that skin type
    if (skinTypeA) {
      const results = await db
        .select()
        .from(skinCompatibility)
        .where(eq(skinCompatibility.skinTypeA, skinTypeA))

      // Transform to match the JSON structure
      const compatibilityMap: Record<string, {
        compatibilityLevel: string
        iconType: string
        relationshipImage: string
      }> = {}

      results.forEach((result) => {
        compatibilityMap[result.skinTypeB] = {
          compatibilityLevel: result.compatibilityLevel,
          iconType: result.iconType,
          relationshipImage: result.relationshipImage,
        }
      })

      return NextResponse.json(compatibilityMap)
    }

    // If no parameters, return all compatibility data
    const allResults = await db.select().from(skinCompatibility)

    // Transform to match the JSON structure
    const allCompatibilityMap: Record<string, Record<string, {
      compatibilityLevel: string
      iconType: string
      relationshipImage: string
    }>> = {}

    allResults.forEach((result) => {
      if (!allCompatibilityMap[result.skinTypeA]) {
        allCompatibilityMap[result.skinTypeA] = {}
      }
      allCompatibilityMap[result.skinTypeA][result.skinTypeB] = {
        compatibilityLevel: result.compatibilityLevel,
        iconType: result.iconType,
        relationshipImage: result.relationshipImage,
      }
    })

    return NextResponse.json(allCompatibilityMap)
  } catch (error) {
    console.error("[skin-compatibility] API route error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

