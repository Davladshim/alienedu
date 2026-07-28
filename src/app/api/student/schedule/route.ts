import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { autoCompleteDueLessons } from '@/lib/scheduleAutoComplete'
import { convertWallTime, addMinutesToTime, toDateOnlyString, DEFAULT_TIMEZONE } from '@/lib/timezone'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    await autoCompleteDueLessons()

    const studentResult = await query(`SELECT timezone FROM users WHERE id = $1`, [decoded.id])
    const studentTz: string = studentResult.rows[0]?.timezone || DEFAULT_TIMEZONE

    const result = await query(
      `SELECT sl.id, sl.date, sl.time, sl.duration_minutes, sl.subject, sl.status,
              sl.original_date, sl.original_time, u.full_name as teacher_name,
              u.timezone as teacher_timezone, ts.call_link
       FROM schedule_lessons sl
       JOIN users u ON u.id = sl.teacher_id
       LEFT JOIN teacher_students ts ON ts.teacher_id = sl.teacher_id AND ts.student_id = sl.student_id
       WHERE sl.student_id = $1 AND sl.date >= CURRENT_DATE
       ORDER BY sl.date, sl.time`,
      [decoded.id]
    )

    // Время урока хранится "настенным" — в поясе репетитора на момент ввода.
    // Переводим в пояс ученика, чтобы физический момент занятия совпадал
    const lessons = result.rows.map(row => {
      const teacherTz: string = row.teacher_timezone || DEFAULT_TIMEZONE
      const converted = convertWallTime(toDateOnlyString(row.date), row.time, teacherTz, studentTz)
      const end = addMinutesToTime(converted.date, converted.time, row.duration_minutes || 0)
      return {
        ...row,
        date: converted.date,
        time: converted.time,
        end_time: end.time,
      }
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Ошибка получения расписания ученика:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
