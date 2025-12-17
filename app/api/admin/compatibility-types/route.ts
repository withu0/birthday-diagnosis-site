import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compatibilityTypes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isAdmin } from "@/lib/admin"

// GET all compatibility types
export async function GET() {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const types = await db.select().from(compatibilityTypes).orderBy(compatibilityTypes.id)

    return NextResponse.json({ types })
  } catch (error) {
    console.error("Error fetching compatibility types:", error)
    return NextResponse.json(
      { error: "相性タイプの取得に失敗しました" },
      { status: 500 }
    )
  }
}

// POST - Create or update compatibility type
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
    const { id, name, description } = body

    if (!id || !name || !description) {
      return NextResponse.json(
        { error: "ID、名前、説明は必須です" },
        { status: 400 }
      )
    }

    // Check if type exists
    const [existing] = await db
      .select()
      .from(compatibilityTypes)
      .where(eq(compatibilityTypes.id, id))
      .limit(1)

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(compatibilityTypes)
        .set({
          name,
          description,
          updatedAt: new Date(),
        })
        .where(eq(compatibilityTypes.id, id))
        .returning()

      return NextResponse.json({ type: updated, message: "更新しました" })
    } else {
      // Create new
      const [created] = await db
        .insert(compatibilityTypes)
        .values({
          id,
          name,
          description,
        })
        .returning()

      return NextResponse.json({ type: created, message: "作成しました" })
    }
  } catch (error) {
    console.error("Error saving compatibility type:", error)
    return NextResponse.json(
      { error: "相性タイプの保存に失敗しました" },
      { status: 500 }
    )
  }
}

// DELETE - Delete compatibility type
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

    await db.delete(compatibilityTypes).where(eq(compatibilityTypes.id, parseInt(id, 10)))

    return NextResponse.json({ message: "削除しました" })
  } catch (error) {
    console.error("Error deleting compatibility type:", error)
    return NextResponse.json(
      { error: "相性タイプの削除に失敗しました" },
      { status: 500 }
    )
  }
}

