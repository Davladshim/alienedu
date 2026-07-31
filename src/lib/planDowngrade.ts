import { query } from './db'

// Сколько дней архивные ученики/уроки хранятся, прежде чем удалятся
// физически, если Pro так и не продлили — тот же принцип "мягкого" срока,
// что и у самостоятельного удаления аккаунта (accountDeletion.ts)
export const ARCHIVE_RETENTION_DAYS = 180

// Уроки, уже одобренные в общей библиотеке, не участвуют в архивации —
// ими могут пользоваться другие репетиторы независимо от тарифа автора
const ARCHIVABLE_LESSON_FILTER = `locked = false AND NOT (is_public = true AND moderation_status = 'approved')`

export async function countActiveStudents(teacherId: number): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) FROM teacher_students WHERE teacher_id = $1 AND archived_at IS NULL`,
    [teacherId]
  )
  return Number(result.rows[0].count)
}

export async function countActiveArchivableLessons(teacherId: number): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) FROM lessons WHERE teacher_id = $1 AND archived_at IS NULL AND ${ARCHIVABLE_LESSON_FILTER}`,
    [teacherId]
  )
  return Number(result.rows[0].count)
}

// Оставляет активными только выбранные записи ростера, остальные (кроме
// уже архивированных ранее) архивирует. Ничего не удаляет и не трогает
// связанные расписание/шаблон/оплаты — те просто перестают показываться,
// пока запись архивирована (см. фильтры archived_at IS NULL в /api/schedule,
// /api/templates, scheduleAutoComplete.ts)
export async function archiveStudentsExcept(teacherId: number, keepIds: number[]): Promise<void> {
  await query(
    `UPDATE teacher_students SET archived_at = NOW()
     WHERE teacher_id = $1 AND archived_at IS NULL AND NOT (id = ANY($2::int[]))`,
    [teacherId, keepIds]
  )
}

export async function archiveLessonsExcept(teacherId: number, keepId: number): Promise<void> {
  await query(
    `UPDATE lessons SET archived_at = NOW()
     WHERE teacher_id = $1 AND archived_at IS NULL AND id != $2 AND ${ARCHIVABLE_LESSON_FILTER}`,
    [teacherId, keepId]
  )
}

// Вызывается при успешной активации/продлении Pro — возвращает всё,
// что было заморожено из-за возврата на Free, обратно в активное
// состояние, на те же места в расписании/шаблоне/списке уроков
export async function restoreArchivedForTeacher(teacherId: number): Promise<void> {
  await query(`UPDATE teacher_students SET archived_at = NULL WHERE teacher_id = $1 AND archived_at IS NOT NULL`, [teacherId])
  await query(`UPDATE lessons SET archived_at = NULL WHERE teacher_id = $1 AND archived_at IS NOT NULL`, [teacherId])
}

// Раз в вызов (лениво, из /api/auth/login — по аналогии с
// purgeExpiredDeletedAccounts) находит записи, архивированные больше
// ARCHIVE_RETENTION_DAYS назад без продления Pro, и удаляет их
// физически — тем же путём, что обычное ручное удаление
export async function purgeExpiredArchives(): Promise<void> {
  const expiredStudents = await query(
    `SELECT id, teacher_id, student_id FROM teacher_students
     WHERE archived_at IS NOT NULL AND archived_at < NOW() - INTERVAL '${ARCHIVE_RETENTION_DAYS} days'`
  )
  for (const row of expiredStudents.rows) {
    await query(
      `DELETE FROM schedule_lessons WHERE teacher_id = $1 AND student_id = $2 AND status != 'completed'`,
      [row.teacher_id, row.student_id]
    )
    await query(`DELETE FROM lesson_templates WHERE teacher_id = $1 AND student_id = $2`, [row.teacher_id, row.student_id])
    await query(`DELETE FROM teacher_students WHERE id = $1`, [row.id])
  }

  await query(
    `DELETE FROM lessons WHERE archived_at IS NOT NULL AND archived_at < NOW() - INTERVAL '${ARCHIVE_RETENTION_DAYS} days'`
  )
}
