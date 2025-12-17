import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compatibilityData, compatibilityTypes } from "@/lib/db/schema"
import { eq, or, and, sql } from "drizzle-orm"

// Normalize value to handle Unicode variations (T+ = T＋, T- = Tー)
function normalizeValue(value: string | null): string | null {
  if (!value) return null
  
  // Replace Unicode full-width plus/minus with ASCII
  let normalized = value
    .replace(/＋/g, "+")  // Full-width plus to ASCII plus
    .replace(/ー/g, "-")  // Full-width minus to ASCII minus
  
  return normalized
}

// Get base value without +/- (e.g., T+ -> T, T- -> T, T -> T)
function getBaseValue(value: string | null): string | null {
  if (!value) return null
  const normalized = normalizeValue(value)
  // Remove trailing + or -
  return normalized?.replace(/[+-]$/, "") || null
}

// Create search patterns for a value (with +/- and without)
function getSearchPatterns(value: string | null): string[] {
  if (!value) return []
  
  const normalized = normalizeValue(value)
  const base = getBaseValue(value)
  
  const patterns: string[] = []
  
  if (normalized) {
    patterns.push(normalized) // Exact match: T+, T-, etc.
  }
  
  if (base && base !== normalized) {
    patterns.push(base) // Base match: T, W, M, E, F
  }
  
  // Also add Unicode variations
  if (normalized) {
    if (normalized.includes("+")) {
      patterns.push(normalized.replace(/\+/g, "＋")) // T+ -> T＋
    }
    if (normalized.includes("-")) {
      patterns.push(normalized.replace(/-/g, "ー")) // T- -> Tー
    }
  }
  
  return [...new Set(patterns)] // Remove duplicates
}

export async function POST(request: NextRequest) {
  try {
    const { personA, personB } = await request.json()

    if (!personA || !personB) {
      return NextResponse.json(
        { error: "Both person A and person B data are required" },
        { status: 400 }
      )
    }

    if (!personA.birthDate || !personB.birthDate) {
      return NextResponse.json(
        { error: "Both birth dates are required" },
        { status: 400 }
      )
    }

    console.log("[compatibility] API route called")
    console.log("[compatibility] Person A:", personA)
    console.log("[compatibility] Person B:", personB)

    // Get basic data for person A
    const basicResponseA = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/judge/basic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ birthDate: personA.birthDate }),
      }
    )

    if (!basicResponseA.ok) {
      return NextResponse.json(
        { error: "Failed to fetch basic data for person A" },
        { status: 500 }
      )
    }

    const basicDataA = await basicResponseA.json()
    console.log("[compatibility] Person A basic data:", basicDataA)

    // Get basic data for person B
    const basicResponseB = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/judge/basic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ birthDate: personB.birthDate }),
      }
    )

    if (!basicResponseB.ok) {
      return NextResponse.json(
        { error: "Failed to fetch basic data for person B" },
        { status: 500 }
      )
    }

    const basicDataB = await basicResponseB.json()
    console.log("[compatibility] Person B basic data:", basicDataB)

    // Extract valuable and problem values (not attractive)
    const aValuable = basicDataA.valuable
    const aProblem = basicDataA.problem
    const bValuable = basicDataB.valuable
    const bProblem = basicDataB.problem

    console.log("[compatibility] A valuable:", aValuable, "A problem:", aProblem)
    console.log("[compatibility] B valuable:", bValuable, "B problem:", bProblem)

    // Get search patterns for each value
    const aValuablePatterns = getSearchPatterns(aValuable)
    const aProblemPatterns = getSearchPatterns(aProblem)
    const bValuablePatterns = getSearchPatterns(bValuable)
    const bProblemPatterns = getSearchPatterns(bProblem)

    console.log("[compatibility] A valuable patterns:", aValuablePatterns)
    console.log("[compatibility] A problem patterns:", aProblemPatterns)
    console.log("[compatibility] B valuable patterns:", bValuablePatterns)
    console.log("[compatibility] B problem patterns:", bProblemPatterns)

    // Build query conditions
    // We need to match:
    // - A's peach (valuable) with aPeach
    // - A's hard (problem) with aHard
    // - B's peach (valuable) with bPeach
    // - B's hard (problem) with bHard
    
    // Combine all patterns including base values (without +/-)
    const allAPeachPatterns = [
      ...aValuablePatterns,
      ...aValuablePatterns.map((p) => getBaseValue(p)).filter((p): p is string => !!p),
    ]
    const allAHardPatterns = [
      ...aProblemPatterns,
      ...aProblemPatterns.map((p) => getBaseValue(p)).filter((p): p is string => !!p),
    ]
    const allBPeachPatterns = [
      ...bValuablePatterns,
      ...bValuablePatterns.map((p) => getBaseValue(p)).filter((p): p is string => !!p),
    ]
    const allBHardPatterns = [
      ...bProblemPatterns,
      ...bProblemPatterns.map((p) => getBaseValue(p)).filter((p): p is string => !!p),
    ]

    // Remove duplicates and null values
    const uniqueAPeach = [...new Set(allAPeachPatterns.filter((p): p is string => !!p))]
    const uniqueAHard = [...new Set(allAHardPatterns.filter((p): p is string => !!p))]
    const uniqueBPeach = [...new Set(allBPeachPatterns.filter((p): p is string => !!p))]
    const uniqueBHard = [...new Set(allBHardPatterns.filter((p): p is string => !!p))]

    // Build OR conditions for each field
    const aPeachConditions = uniqueAPeach.length > 0
      ? or(...uniqueAPeach.map((p) => eq(compatibilityData.aPeach, p)))!
      : undefined
    const aHardConditions = uniqueAHard.length > 0
      ? or(...uniqueAHard.map((p) => eq(compatibilityData.aHard, p)))!
      : undefined
    const bPeachConditions = uniqueBPeach.length > 0
      ? or(...uniqueBPeach.map((p) => eq(compatibilityData.bPeach, p)))!
      : undefined
    const bHardConditions = uniqueBHard.length > 0
      ? or(...uniqueBHard.map((p) => eq(compatibilityData.bHard, p)))!
      : undefined

    // Query the database - match all four fields
    const conditions = [aPeachConditions, aHardConditions, bPeachConditions, bHardConditions].filter(
      (c): c is NonNullable<typeof c> => !!c
    )

    const results = await db
      .select()
      .from(compatibilityData)
      .where(and(...conditions)!)

    console.log("[compatibility] Found", results.length, "matching records")

    // Group results by compatibility type
    const resultsByType = new Map<number, typeof results>()
    results.forEach((result) => {
      const type = result.compatibilityType
      if (!resultsByType.has(type)) {
        resultsByType.set(type, [])
      }
      resultsByType.get(type)!.push(result)
    })

    // Fetch compatibility type descriptions from database
    const typeIds = Array.from(resultsByType.keys())
    const typeDescriptions =
      typeIds.length > 0
        ? await db
            .select()
            .from(compatibilityTypes)
            .where(or(...typeIds.map((type) => eq(compatibilityTypes.id, type)))!)
        : []

    const descriptionsMap = new Map<number, { name: string; description: string }>()
    typeDescriptions.forEach((type) => {
      descriptionsMap.set(type.id, {
        name: type.name,
        description: type.description,
      })
    })

    return NextResponse.json({
      personA: {
        name: personA.name,
        birthDate: personA.birthDate,
        valuable: aValuable,
        problem: aProblem,
        valuable_lb: basicDataA.valuable_lb,
        problem_lb: basicDataA.problem_lb,
      },
      personB: {
        name: personB.name,
        birthDate: personB.birthDate,
        valuable: bValuable,
        problem: bProblem,
        valuable_lb: basicDataB.valuable_lb,
        problem_lb: basicDataB.problem_lb,
      },
      results: Array.from(resultsByType.entries()).map(([type, records]) => {
        const typeInfo = descriptionsMap.get(type)
        return {
          compatibilityType: type,
          sheetName: records[0]?.sheetName,
          name: typeInfo?.name || `相性タイプ${type}`,
          description: typeInfo?.description || "",
          count: records.length,
          records: records.map((r) => ({
            aPeach: r.aPeach,
            aHard: r.aHard,
            bPeach: r.bPeach,
            bHard: r.bHard,
          })),
        }
      }),
      totalMatches: results.length,
    })
  } catch (error) {
    console.error("[compatibility] API route error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

