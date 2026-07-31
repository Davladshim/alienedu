import crypto from 'crypto'
import pool from './db'

export const DELETION_GRACE_DAYS = 30

// Помечает аккаунт к удалению — данные не трогаем, просто блокируем вход.
// В течение DELETION_GRACE_DAYS пользователь может восстановить аккаунт,
// войдя с тем же логином и паролем (см. /api/auth/restore-account)
export async function requestAccountDeletion(userId: number) {
  await pool.query(`UPDATE users SET deleted_at = NOW() WHERE id = $1`, [userId])
}

export async function restoreAccount(userId: number) {
  await pool.query(`UPDATE users SET deleted_at = NULL WHERE id = $1`, [userId])
}

// Сколько дней действует ещё запрос на удаление (для сообщения на /login)
export function daysLeftToRestore(deletedAt: string | Date): number {
  const elapsedMs = Date.now() - new Date(deletedAt).getTime()
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(DELETION_GRACE_DAYS - elapsedDays))
}

// Раз в вызов (лениво, из /api/auth/login — по аналогии с
// autoCompleteDueLessons) находит аккаунты с истёкшим сроком восстановления
// и удаляет/обезличивает их безвозвратно
export async function purgeExpiredDeletedAccounts() {
  const expired = await pool.query(
    `SELECT id, role FROM users WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '${DELETION_GRACE_DAYS} days'`
  )

  for (const user of expired.rows) {
    if (user.role === 'teacher') {
      await purgeTeacher(user.id)
    } else {
      await anonymizeStudent(user.id)
    }
  }
}

// Репетитор: удаляем каскадом всё, что принадлежит только ему. Учеников,
// у которых есть собственный рабочий аккаунт, не трогаем — удаляется
// только связь с этим репетитором (запись в ростере) и относящиеся к ней
// расписание/финансы. Учеников-заглушек (никогда не регистрировались сами)
// удаляем целиком — они существовали только как запись этого репетитора
async function purgeTeacher(teacherId: number) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Квесты
    await client.query(
      `DELETE FROM quest_progress WHERE player_id IN (
         SELECT qp.id FROM quest_players qp
         JOIN quest_sessions qs ON qs.id = qp.session_id
         WHERE qs.teacher_id = $1
       )`,
      [teacherId]
    )
    await client.query(
      `DELETE FROM quest_players WHERE session_id IN (SELECT id FROM quest_sessions WHERE teacher_id = $1)`,
      [teacherId]
    )
    await client.query(
      `DELETE FROM quest_rooms WHERE session_id IN (SELECT id FROM quest_sessions WHERE teacher_id = $1)`,
      [teacherId]
    )
    await client.query(`DELETE FROM quest_sessions WHERE teacher_id = $1`, [teacherId])

    // Уроки — каскадом тянут за собой lesson_blocks, lesson_assignments,
    // lesson_attempts; у чужих копий этого урока source_lesson_id станет NULL
    await client.query(`DELETE FROM lessons WHERE teacher_id = $1`, [teacherId])

    // Расписание, шаблоны, финансы этого репетитора
    await client.query(`DELETE FROM schedule_lessons WHERE teacher_id = $1`, [teacherId])
    await client.query(`DELETE FROM lesson_templates WHERE teacher_id = $1`, [teacherId])
    await client.query(`DELETE FROM payments WHERE teacher_id = $1`, [teacherId])

    // Ученики-заглушки, существовавшие только в ростере этого репетитора
    const placeholders = await client.query(
      `SELECT u.id FROM teacher_students ts
       JOIN users u ON u.id = ts.student_id
       WHERE ts.teacher_id = $1 AND u.is_placeholder = true`,
      [teacherId]
    )

    await client.query(`DELETE FROM teacher_students WHERE teacher_id = $1`, [teacherId])
    await client.query(`DELETE FROM families WHERE teacher_id = $1`, [teacherId])

    const placeholderIds = placeholders.rows.map(r => r.id)
    if (placeholderIds.length > 0) {
      await client.query(`DELETE FROM users WHERE id = ANY($1::int[])`, [placeholderIds])
    }

    // Активации кодов — не блокируем удаление, просто теряем привязку
    await client.query(`UPDATE access_codes SET user_id = NULL WHERE user_id = $1`, [teacherId])
    await client.query(`UPDATE stereo_access_codes SET user_id = NULL WHERE user_id = $1`, [teacherId])
    await client.query(`UPDATE plan_codes SET user_id = NULL WHERE user_id = $1`, [teacherId])

    await client.query(`DELETE FROM users WHERE id = $1`, [teacherId])

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Ученик: репетиторы, у которых он был в ростере, сохраняют законный интерес
// в собственной истории занятий и оплат (это их бухгалтерия) — поэтому не
// удаляем связанные записи, а обезличиваем сам аккаунт ученика на месте
async function anonymizeStudent(studentId: number) {
  const anonymizedLogin = `_deleted_${studentId}_${crypto.randomBytes(6).toString('hex')}`
  await pool.query(
    `UPDATE users
     SET full_name = 'Удалённый пользователь', login = $2, code_hash = $3,
         secret_question = NULL, secret_answer_hash = NULL, grade = NULL, deleted_at = NULL
     WHERE id = $1`,
    [studentId, anonymizedLogin, crypto.randomBytes(32).toString('hex')]
  )
  await pool.query(`UPDATE access_codes SET user_id = NULL WHERE user_id = $1`, [studentId])
  await pool.query(`UPDATE stereo_access_codes SET user_id = NULL WHERE user_id = $1`, [studentId])
  await pool.query(`UPDATE plan_codes SET user_id = NULL WHERE user_id = $1`, [studentId])
}
