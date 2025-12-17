import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyUser } from "@/lib/auth"
import { createSession } from "@/lib/session"
<<<<<<< HEAD
import { checkAndExpireMembership } from "@/lib/membership"
=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Verify user credentials
    const user = await verifyUser(validatedData.email, validatedData.password)
    if (!user) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 }
      )
    }

<<<<<<< HEAD
    // Check membership expiration and expire if needed
    const hasActiveMembership = await checkAndExpireMembership(user.id)

=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
    // Create session
    await createSession(user.id, user.email, user.name)

    return NextResponse.json({
      message: "ログインに成功しました",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
<<<<<<< HEAD
      hasActiveMembership,
=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Login error:", error)
    return NextResponse.json(
      { error: "ログイン中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
