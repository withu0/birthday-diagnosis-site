import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { checkAndExpireMembership } from "@/lib/membership"

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // Check membership expiration and expire if needed
  const hasActiveMembership = await checkAndExpireMembership(session.userId)

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
    },
    hasActiveMembership,
  })
}
