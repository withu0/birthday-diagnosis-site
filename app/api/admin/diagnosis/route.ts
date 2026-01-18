import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { diagnosisResults } from "@/lib/db/schema"
import { desc, or, like, count } from "drizzle-orm"
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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit
    const search = searchParams.get("search") || ""

    // Build conditions for search
    let whereCondition: any = undefined
    if (search) {
      whereCondition = or(
        like(diagnosisResults.name, `%${search}%`),
        like(diagnosisResults.birthDate, `%${search}%`)
      )!
    }

    // Get total count
    const countQuery = db
      .select({ total: count() })
      .from(diagnosisResults)
      .where(whereCondition)

    const [{ total }] = await countQuery

    // Build query for results
    const query = db
      .select()
      .from(diagnosisResults)
      .where(whereCondition)
      .orderBy(desc(diagnosisResults.createdAt))
      .limit(limit)
      .offset(offset)

    const results = await query

    return NextResponse.json({
      results,
      totalCount: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching diagnosis logs:", error)
    return NextResponse.json(
      { error: "診断ログの取得に失敗しました" },
      { status: 500 }
    )
  }
}

