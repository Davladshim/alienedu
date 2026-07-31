import { query } from './db'
import { chargeForLesson } from './familyBalance'
import { addMinutesToTime, wallTimeToUtcMs, toDateOnlyString, DEFAULT_TIMEZONE } from './timezone'

// Занятие завершается само, когда истекает заявленное время (начало + длительность).
// В этот момент статус становится "проведён" и, если это не пробный урок,
// автоматически списывается оплата: сначала из семейного пула (если ученик
// состоит в семье), а то, что пул не покрыл — личным долгом ученика.
// Отменённые занятия сюда не попадают — их статус больше не меняется.
//
// date/time в schedule_lessons — это "настенное" время в часовом поясе
// репетитора, а не UTC. Раньше сравнение "истекло ли время" делалось прямо
// в SQL (date + time + duration <= NOW()) — Postgres неявно трактует такой
// naive-timestamp в часовом поясе СЕССИИ БД, который может не совпадать с
// часовым поясом репетитора (например, сессия в UTC, а репетитор в МСК),
// из-за чего занятие могло считаться завершённым на несколько часов раньше
// или позже настоящего окончания. Теперь конец занятия считается явно, в
// часовом поясе конкретного репетитора, через те же хелперы, что уже
// используются для проверки конфликтов расписания между репетиторами
export async function autoCompleteDueLessons() {
  const candidates = await query(
    `SELECT sl.id, sl.teacher_id, sl.student_id, sl.price, sl.is_paid, sl.is_trial,
            sl.date, sl.time, sl.duration_minutes, u.timezone as teacher_timezone
     FROM schedule_lessons sl
     JOIN users u ON u.id = sl.teacher_id
     LEFT JOIN teacher_students ts ON ts.teacher_id = sl.teacher_id AND ts.student_id = sl.student_id
     WHERE sl.status = 'scheduled'
       AND sl.date <= (CURRENT_DATE + INTERVAL '1 day')
       AND ts.archived_at IS NULL`
  )

  const nowMs = Date.now()
  const due = candidates.rows.filter(lesson => {
    const tz = lesson.teacher_timezone || DEFAULT_TIMEZONE
    const dateStr = toDateOnlyString(lesson.date)
    const end = addMinutesToTime(dateStr, lesson.time.slice(0, 5), Number(lesson.duration_minutes) || 60)
    const endMs = wallTimeToUtcMs(end.date, end.time, tz)
    return endMs <= nowMs
  })

  for (const lesson of due) {
    try {
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
    } catch (error) {
      // Один проблемный урок не должен ронять весь календарь/финансы —
      // пропускаем его, он подхватится на следующем вызове
      console.error(`Ошибка автозавершения занятия ${lesson.id}:`, error)
    }
  }
}
