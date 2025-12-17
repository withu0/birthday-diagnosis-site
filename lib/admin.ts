import { getSession } from "./session"
import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"

/**
 * Check if the current user is an admin
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  if (!session) return false

  try {
    const [user] = await db
      .select({
        isAdmin: users.isAdmin,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user) return false

    // Check both isAdmin flag and role field
    return user.isAdmin === true || user.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

/**
 * Get admin user info
 */
export async function getAdminUser() {
  const session = await getSession()
  if (!session) return null

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user) return null

    const isAdminUser = user.isAdmin === true || user.role === "admin"
    if (!isAdminUser) return null

    return user
  } catch (error) {
    console.error("Error getting admin user:", error)
    return null
  }
}

