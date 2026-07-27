import { query } from './db'
import { chargeForLesson } from './familyBalance'

// Занятие завершается само, когда истекает заявленное время (начало + длительность).
// В этот момент статус становится "проведён" и, если это не пробный урок,
// автоматически списывается оплата: сначала из семейного пула (если ученик
// состоит в семье), а то, что пул не покрыл — личным долгом ученика.
// Отменённые занятия сюда не попадают — их статус больше не меняется.
export async function autoCompleteDueLessons() {
  const due = await query(
    `SELECT id, teacher_id, student_id, price, is_paid, is_trial
     FROM schedule_lessons
     WHERE status = 'scheduled'
       AND (date + time::time + (duration_minutes || ' minutes')::interval) <= NOW()`
  )

  for (const lesson of due.rows) {
    if (!lesson.is_trial && !lesson.is_paid && lesson.price && lesson.student_id) {
      const rosterResult = await query(
        `SELECT id, family_id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2`,
        [lesson.teacher_id, lesson.student_id]
      )
      const rosterEntry = rosterResult.rows[0]
      if (rosterEntry) {
        await chargeForLesson(rosterEntry.id, rosterEntry.family_id, lesson.price)
      }
      await query(`UPDATE schedule_lessons SET status = 'completed', is_paid = true, updated_at = NOW() WHERE id = $1`, [lesson.id])
    } else if (lesson.is_trial) {
      // Пробный урок бесплатный — считаем его "оплаченным" (нечего списывать),
      // чтобы он не попадал в списки неоплаченных занятий
      await query(`UPDATE schedule_lessons SET status = 'completed', is_paid = true, updated_at = NOW() WHERE id = $1`, [lesson.id])
    } else {
      await query(`UPDATE schedule_lessons SET status = 'completed', updated_at = NOW() WHERE id = $1`, [lesson.id])
    }
  }
}
