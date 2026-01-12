import { db } from "./db"
import { memberships, users } from "./db/schema"
import { eq, and, gte, lte } from "drizzle-orm"

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

/**
 * ちょうど30日後に期限切れになるアクティブな会員権限を取得
 * @returns 期限切れ間近の会員権限とユーザー情報の配列
 */
export async function getMembershipsExpiringSoon() {
  try {
    const now = new Date()
    
    // ちょうど30日後の日付範囲を計算（その日の00:00:00から23:59:59まで）
    const daysFromNow30 = new Date(now)
    daysFromNow30.setDate(daysFromNow30.getDate() + 30)
    daysFromNow30.setHours(0, 0, 0, 0) // 30日後の00:00:00
    
    const daysFromNow30End = new Date(now)
    daysFromNow30End.setDate(daysFromNow30End.getDate() + 30)
    daysFromNow30End.setHours(23, 59, 59, 999) // 30日後の23:59:59

    // アクティブな会員権限で、ちょうど30日後に期限切れになるものを取得
    // ユーザー情報も一緒に取得
    const expiringMemberships = await db
      .select({
        membership: memberships,
        user: users,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(
        and(
          eq(memberships.isActive, true),
          gte(memberships.accessExpiresAt, daysFromNow30),
          lte(memberships.accessExpiresAt, daysFromNow30End)
        )
      )

    return expiringMemberships
  } catch (error) {
    console.error("Error getting memberships expiring soon:", error)
    return []
  }
}

