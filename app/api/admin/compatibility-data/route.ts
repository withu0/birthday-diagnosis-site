import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compatibilityData } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"

// GET all compatibility data, optionally filtered by type
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
    const compatibilityType = searchParams.get("compatibilityType")

    const data = compatibilityType
      ? await db
          .select()
          .from(compatibilityData)
          .where(eq(compatibilityData.compatibilityType, parseInt(compatibilityType, 10)))
      : await db.select().from(compatibilityData)

    // Group by compatibility type
    const grouped = new Map<number, typeof data>()
    data.forEach((item) => {
      const type = item.compatibilityType
      if (!grouped.has(type)) {
        grouped.set(type, [])
      }
      grouped.get(type)!.push(item)
    })

    return NextResponse.json({
      data,
      grouped: Object.fromEntries(grouped),
    })
  } catch (error) {
    console.error("Error fetching compatibility data:", error)
    return NextResponse.json(
      { error: "相性データの取得に失敗しました" },
      { status: 500 }
    )
  }
}

// POST - Create or update compatibility data
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, compatibilityType, sheetName, range, aPeach, aHard, bPeach, bHard, rowIndex, colIndex } = body

    if (!compatibilityType || !sheetName || !range || rowIndex === undefined || colIndex === undefined) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      )
    }

    if (id) {
      // Update existing
      const [updated] = await db
        .update(compatibilityData)
        .set({
          compatibilityType: parseInt(compatibilityType, 10),
          sheetName,
          range,
          aPeach: aPeach || null,
          aHard: aHard || null,
          bPeach: bPeach || null,
          bHard: bHard || null,
          rowIndex: parseInt(rowIndex, 10),
          colIndex: parseInt(colIndex, 10),
          updatedAt: new Date(),
        })
        .where(eq(compatibilityData.id, id))
        .returning()

      return NextResponse.json({ data: updated, message: "更新しました" })
    } else {
      // Create new
      const [created] = await db
        .insert(compatibilityData)
        .values({
          compatibilityType: parseInt(compatibilityType, 10),
          sheetName,
          range,
          aPeach: aPeach || null,
          aHard: aHard || null,
          bPeach: bPeach || null,
          bHard: bHard || null,
          rowIndex: parseInt(rowIndex, 10),
          colIndex: parseInt(colIndex, 10),
        })
        .returning()

      return NextResponse.json({ data: created, message: "作成しました" })
    }
  } catch (error) {
    console.error("Error saving compatibility data:", error)
    return NextResponse.json(
      { error: "相性データの保存に失敗しました" },
      { status: 500 }
    )
  }
}

// DELETE - Delete compatibility data
export async function DELETE(request: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "IDが必要です" },
        { status: 400 }
      )
    }

    await db.delete(compatibilityData).where(eq(compatibilityData.id, id))

    return NextResponse.json({ message: "削除しました" })
  } catch (error) {
    console.error("Error deleting compatibility data:", error)
    return NextResponse.json(
      { error: "相性データの削除に失敗しました" },
      { status: 500 }
    )
  }
}

