import { db } from "./db"
import { memberships } from "./db/schema"
import { eq, and } from "drizzle-orm"

/**
 * ユーザーの会員権限の有効期限をチェックし、期限切れの場合は無効化する
 * @param userId ユーザーID
 * @returns 会員権限が有効かどうか
 */
export async function checkAndExpireMembership(userId: string): Promise<boolean> {
  try {
    const now = new Date()

    // ユーザーの会員権限を取得
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1)

    if (!membership) {
      // 会員権限が存在しない場合は、通常のユーザーとして扱う
      return false
    }

    // 有効期限が切れている場合
    if (membership.accessExpiresAt < now) {
      // 会員権限を無効化
      if (membership.isActive) {
        await db
          .update(memberships)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(memberships.id, membership.id))
      }
      return false
    }

    // 会員権限が有効かどうかを返す
    return membership.isActive
  } catch (error) {
    console.error("Error checking membership expiration:", error)
    return false
  }
}

/**
 * ユーザーの会員権限情報を取得
 * @param userId ユーザーID
 * @returns 会員権限情報、またはnull
 */
export async function getMembership(userId: string) {
  try {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1)

    return membership || null
  } catch (error) {
    console.error("Error getting membership:", error)
    return null
  }
}

