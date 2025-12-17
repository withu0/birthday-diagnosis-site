import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"

// Lightweight endpoint to check if user is admin
export async function GET() {
  try {
    const adminStatus = await isAdmin()
    
    if (!adminStatus) {
      return NextResponse.json(
        { isAdmin: false, error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    return NextResponse.json({ isAdmin: true })
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json(
      { isAdmin: false, error: "管理者権限の確認に失敗しました" },
      { status: 500 }
    )
  }
}

