import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}
function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { weeks } = await request.json()
    const weekCount = Math.min(Math.max(Number(weeks) || 4, 1), 12)

    const templatesResult = await query(
      `SELECT * FROM lesson_templates WHERE teacher_id = $1`,
      [decoded.id]
    )
    const templates = templatesResult.rows

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentWeekStart = startOfWeek(today)

    let created = 0
    let skipped = 0

    for (let w = 0; w < weekCount; w++) {
      const weekStart = addDays(currentWeekStart, w * 7)
      for (const tpl of templates) {
        const targetDate = addDays(weekStart, tpl.day_of_week)
        if (targetDate < today) continue

        const startDate = new Date(tpl.start_date)
        if (targetDate < startDate) continue
        if (tpl.end_date && targetDate > new Date(tpl.end_date)) continue

        const dateStr = toISODate(targetDate)

        const existing = await query(
          `SELECT 1 FROM schedule_lessons WHERE teacher_id = $1 AND student_id = $2 AND date = $3 AND time = $4`,
          [decoded.id, tpl.student_id, dateStr, tpl.time]
        )
        if (existing.rows.length > 0) {
          skipped++
          continue
        }

        await query(
          `INSERT INTO schedule_lessons (teacher_id, student_id, date, time, duration_minutes, subject, price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [decoded.id, tpl.student_id, dateStr, tpl.time, tpl.duration_minutes, tpl.subject, tpl.price]
        )
        created++
      }
    }

    return NextResponse.json({ success: true, created, skipped })
  } catch (error) {
    console.error('Ошибка применения шаблона:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
