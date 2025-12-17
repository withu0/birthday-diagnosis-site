import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { diagnosisResults } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "1000")
    const offset = parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search") || ""

    // Build query
    let query = db
      .select()
      .from(diagnosisResults)
      .orderBy(desc(diagnosisResults.createdAt))
      .limit(limit)
      .offset(offset)

    // If search is provided, we'll filter in memory for now
    // (For better performance, you could add full-text search to the database)
    let results = await query

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase()
      results = results.filter(
        (result) =>
          result.name.toLowerCase().includes(searchLower) ||
          result.birthDate.toLowerCase().includes(searchLower)
      )
    }

    // Get total count for pagination
    const allResults = await db.select().from(diagnosisResults)
    const totalCount = search
      ? results.length
      : allResults.length

    return NextResponse.json({
      results,
      totalCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching diagnosis logs:", error)
    return NextResponse.json(
      { error: "診断ログの取得に失敗しました" },
      { status: 500 }
    )
  }
}

