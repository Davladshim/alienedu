import { query } from '@/lib/db'
import { wallTimeToUtcMs, toDateOnlyString, DEFAULT_TIMEZONE } from '@/lib/timezone'

// Проверяет, не занято ли это время у ученика уже другим репетитором —
// сравнение идёт по единому мировому времени (с учётом часовых поясов),
// поэтому 11:00 у одного репетитора и 12:00 у другого в соседнем поясе
// корректно распознаются как одно и то же время. Пересечения в рамках
// занятий ОДНОГО репетитора этой проверкой намеренно не блокируются —
// это отдельный визуальный индикатор в календаре, решение остаётся за ним.
export async function hasCrossTeacherConflict(
  studentId: number,
  teacherId: number,
  teacherTz: string,
  date: string,
  time: string,
  durationMinutes: number
): Promise<boolean> {
  const startMs = wallTimeToUtcMs(date, time, teacherTz)
  const endMs = startMs + durationMinutes * 60000

  // Берём занятия ученика на соседних датах с запасом в сутки в обе
  // стороны — при пересчёте между поясами дата события может сдвинуться
  const dayMs = 24 * 60 * 60 * 1000
  const from = new Date(new Date(`${date}T00:00:00Z`).getTime() - dayMs).toISOString().slice(0, 10)
  const to = new Date(new Date(`${date}T00:00:00Z`).getTime() + dayMs).toISOString().slice(0, 10)

  const result = await query(
    `SELECT sl.date, sl.time, sl.duration_minutes, u.timezone
     FROM schedule_lessons sl
     JOIN users u ON u.id = sl.teacher_id
     WHERE sl.student_id = $1 AND sl.teacher_id != $2 AND sl.status != 'cancelled'
       AND sl.date BETWEEN $3 AND $4`,
    [studentId, teacherId, from, to]
  )

  return result.rows.some(row => {
    const otherTz: string = row.timezone || DEFAULT_TIMEZONE
    const otherStart = wallTimeToUtcMs(toDateOnlyString(row.date), row.time, otherTz)
    const otherEnd = otherStart + Number(row.duration_minutes || 0) * 60000
    return startMs < otherEnd && otherStart < endMs
  })
}
