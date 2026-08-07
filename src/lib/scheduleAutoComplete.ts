import { query } from './db'
import pool from './db'
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
//
// Функция раньше всегда сканировала просроченные занятия ВСЕХ репетиторов
// платформы целиком, независимо от того, кто именно сейчас открыл
// календарь/финансы — при активной аудитории это лишняя нагрузка на базу
// на каждый заход (а календарь ещё и опрашивает раз в минуту). Теперь
// можно передать teacherId и/или studentId, чтобы обработать только
// занятия конкретного человека — так и делают все вызовы ниже по коду
export async function autoCompleteDueLessons(scope: { teacherId?: number; studentId?: number } = {}) {
  const conditions = [`sl.status = 'scheduled'`, `sl.date <= (CURRENT_DATE + INTERVAL '1 day')`, `ts.archived_at IS NULL`]
  const params: number[] = []
  if (scope.teacherId) {
    params.push(scope.teacherId)
    conditions.push(`sl.teacher_id = $${params.length}`)
  }
  if (scope.studentId) {
    params.push(scope.studentId)
    conditions.push(`sl.student_id = $${params.length}`)
  }

  const candidates = await query(
    `SELECT sl.id, sl.teacher_id, sl.student_id, sl.price, sl.is_paid, sl.is_trial,
            sl.date, sl.time, sl.duration_minutes, u.timezone as teacher_timezone
     FROM schedule_lessons sl
     JOIN users u ON u.id = sl.teacher_id
     LEFT JOIN teacher_students ts ON ts.teacher_id = sl.teacher_id AND ts.student_id = sl.student_id
     WHERE ${conditions.join(' AND ')}`,
    params
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
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Атомарно "застолбить" занятие внутри транзакции — если несколько
      // запросов (например, от двух разных репетиторов, чьи вызовы
      // пересеклись по времени) одновременно найдут один и тот же
      // просроченный урок ещё до того, как кто-то из них успеет обновить
      // статус, оба могли бы списать оплату дважды. FOR UPDATE блокирует
      // строку на время транзакции — вторая попытка дождётся первой и
      // увидит уже status != 'scheduled', и просто пропустит урок
      const claim = await client.query(
        `SELECT * FROM schedule_lessons WHERE id = $1 AND status = 'scheduled' FOR UPDATE`,
        [lesson.id]
      )
      if (claim.rows.length === 0) {
        await client.query('ROLLBACK')
        continue
      }

      if (!lesson.is_trial && !lesson.is_paid && lesson.price && lesson.student_id) {
        const rosterResult = await client.query(
          `SELECT id, family_id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2`,
          [lesson.teacher_id, lesson.student_id]
        )
        const rosterEntry = rosterResult.rows[0]
        if (rosterEntry) {
          // Списание — та же логика, что в chargeForLesson (familyBalance.ts),
          // но выполняется в ЭТОЙ ЖЕ транзакции и с той же блокировкой урока —
          // chargeForLesson открывает собственное соединение/транзакцию, и
          // если списание там закоммитится, а наша транзакция потом всё же
          // откатится по другой причине, урок останется "scheduled" и на
          // следующем цикле спишется повторно. Со своей транзакцией на весь
          // урок целиком такого разрыва между списанием и статусом быть не может
          if (rosterEntry.family_id) {
            await client.query(`SELECT id FROM families WHERE id = $1 FOR UPDATE`, [rosterEntry.family_id])
            const familyResult = await client.query(`SELECT balance FROM families WHERE id = $1`, [rosterEntry.family_id])
            const familyBalance = Number(familyResult.rows[0]?.balance || 0)
            const fromPool = Math.min(Math.max(familyBalance, 0), lesson.price)
            const shortfall = lesson.price - fromPool
            if (fromPool > 0) {
              await client.query(`UPDATE families SET balance = balance - $1 WHERE id = $2`, [fromPool, rosterEntry.family_id])
            }
            if (shortfall > 0) {
              await client.query(`UPDATE teacher_students SET balance = balance - $1 WHERE id = $2`, [shortfall, rosterEntry.id])
            }
          } else {
            await client.query(`UPDATE teacher_students SET balance = balance - $1 WHERE id = $2`, [lesson.price, rosterEntry.id])
          }
        }
        await client.query(`UPDATE schedule_lessons SET status = 'completed', is_paid = true, updated_at = NOW() WHERE id = $1`, [lesson.id])
      } else if (lesson.is_trial) {
        // Пробный урок бесплатный — считаем его "оплаченным" (нечего списывать),
        // чтобы он не попадал в списки неоплаченных занятий
        await client.query(`UPDATE schedule_lessons SET status = 'completed', is_paid = true, updated_at = NOW() WHERE id = $1`, [lesson.id])
      } else {
        await client.query(`UPDATE schedule_lessons SET status = 'completed', updated_at = NOW() WHERE id = $1`, [lesson.id])
      }

      await client.query('COMMIT')
    } catch (error) {
      // Один проблемный урок не должен ронять весь календарь/финансы —
      // откатываем только его транзакцию, он подхватится на следующем вызове
      await client.query('ROLLBACK').catch(() => {})
      console.error(`Ошибка автозавершения занятия ${lesson.id}:`, error)
    } finally {
      client.release()
    }
  }
}
