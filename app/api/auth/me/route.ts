import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
<<<<<<< HEAD
import { checkAndExpireMembership } from "@/lib/membership"
=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

<<<<<<< HEAD
  // Check membership expiration and expire if needed
  const hasActiveMembership = await checkAndExpireMembership(session.userId)

=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
    },
<<<<<<< HEAD
    hasActiveMembership,
=======
>>>>>>> 64956f79ec93423c1e4cf858f8428179b8715fe0
  })
}
