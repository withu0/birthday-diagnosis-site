import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { skinCompatibility } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"

// GET all skin compatibility data, optionally filtered by skinTypeA
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
    const skinTypeA = searchParams.get("skinTypeA")

    const data = skinTypeA
      ? await db
          .select()
          .from(skinCompatibility)
          .where(eq(skinCompatibility.skinTypeA, skinTypeA))
      : await db.select().from(skinCompatibility)

    // Group by skinTypeA
    const grouped = new Map<string, typeof data>()
    data.forEach((item) => {
      const type = item.skinTypeA
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
    console.error("Error fetching skin compatibility data:", error)
    return NextResponse.json(
      { error: "個性の相性データの取得に失敗しました" },
      { status: 500 }
    )
  }
}

// POST - Create or update skin compatibility data
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
    const { id, skinTypeA, skinTypeB, compatibilityLevel, iconType, relationshipImage } = body

    if (!skinTypeA || !skinTypeB || !compatibilityLevel || !iconType || !relationshipImage) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      )
    }

    if (id) {
      // Update existing
      const [updated] = await db
        .update(skinCompatibility)
        .set({
          skinTypeA,
          skinTypeB,
          compatibilityLevel,
          iconType,
          relationshipImage,
          updatedAt: new Date(),
        })
        .where(eq(skinCompatibility.id, id))
        .returning()

      return NextResponse.json({ data: updated, message: "更新しました" })
    } else {
      // Create new
      const [created] = await db
        .insert(skinCompatibility)
        .values({
          skinTypeA,
          skinTypeB,
          compatibilityLevel,
          iconType,
          relationshipImage,
        })
        .returning()

      return NextResponse.json({ data: created, message: "作成しました" })
    }
  } catch (error) {
    console.error("Error saving skin compatibility data:", error)
    return NextResponse.json(
      { error: "個性の相性データの保存に失敗しました" },
      { status: 500 }
    )
  }
}

// DELETE - Delete skin compatibility data
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

    await db.delete(skinCompatibility).where(eq(skinCompatibility.id, id))

    return NextResponse.json({ message: "削除しました" })
  } catch (error) {
    console.error("Error deleting skin compatibility data:", error)
    return NextResponse.json(
      { error: "個性の相性データの削除に失敗しました" },
      { status: 500 }
    )
  }
}

