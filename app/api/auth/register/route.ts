import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createUser, getUserByEmail } from "@/lib/auth"
import { createSession } from "@/lib/session"

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  name: z.string().min(1, "名前を入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(
      validatedData.email,
      validatedData.name,
      validatedData.password
    )

    // Create session
    await createSession(user.id, user.email, user.name)

    return NextResponse.json(
      {
        message: "登録が完了しました",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "登録中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
