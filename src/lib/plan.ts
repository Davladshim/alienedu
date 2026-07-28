import { query } from './db'

export type PlanId = 'free' | 'pro'

export interface PlanLimits {
  maxStudents: number
  maxOwnLessons: number
  maxLibraryLessons: number
  canPublishToLibrary: boolean
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: { maxStudents: 5, maxOwnLessons: 1, maxLibraryLessons: 5, canPublishToLibrary: false },
  pro: { maxStudents: Infinity, maxOwnLessons: Infinity, maxLibraryLessons: Infinity, canPublishToLibrary: true },
}

// Эффективный тариф репетитора — 'pro' только пока код ещё не истёк.
// Проверяется на каждый запрос (без крон-джобы), в духе остального проекта
// (см. autoCompleteDueLessons) — истёкший тариф просто перестаёт давать
// права в следующем же запросе, отдельно "гасить" его в БД не нужно
export async function getTeacherPlan(teacherId: number): Promise<PlanId> {
  const result = await query(`SELECT plan, plan_expires_at FROM users WHERE id = $1`, [teacherId])
  if (result.rows.length === 0) return 'free'
  const row = result.rows[0]
  if (row.plan === 'pro' && (!row.plan_expires_at || new Date(row.plan_expires_at) > new Date())) {
    return 'pro'
  }
  return 'free'
}

export async function getTeacherLimits(teacherId: number): Promise<PlanLimits> {
  return PLAN_LIMITS[await getTeacherPlan(teacherId)]
}
