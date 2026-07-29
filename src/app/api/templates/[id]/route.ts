import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

function addDaysISO(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + n)
  return date.toISOString().slice(0, 10)
}
function toISODateStr(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

// Редактирование уже созданного слота шаблона с указанной даты вступления
// в силу: старый слот закрывается (end_date = effective_date - 1 день) и
// не трогается, создаётся новая версия слота с новыми параметрами и
// start_date = effective_date. Уже сгенерированные, но ещё не проведённые
// занятия из старого слота с датой >= effective_date убираются — они
// пересоздадутся под новую версию при следующем нажатии «Добавить в
// расписание». Занятия раньше effective_date (в т.ч. непроведённые) и уже
// проведённые занятия не трогаются.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id } = await params

    const { day_of_week, time, duration_minutes, subject, price, effective_date } = await request.json()

    if (day_of_week === undefined || !time || !effective_date) {
      return NextResponse.json({ error: 'Заполните день недели, время и дату вступления в силу' }, { status: 400 })
    }

    const existing = await query(`SELECT * FROM lesson_templates WHERE id = $1`, [id])
    if (existing.rows.length === 0 || existing.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    const old = existing.rows[0]
    const originalEndDate = old.end_date ? toISODateStr(old.end_date) : null

    const closeDate = addDaysISO(effective_date, -1)
    await query(`UPDATE lesson_templates SET end_date = $1 WHERE id = $2`, [closeDate, old.id])

    const created = await query(
      `INSERT INTO lesson_templates (teacher_id, student_id, day_of_week, time, duration_minutes, subject, price, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [old.teacher_id, old.student_id, day_of_week, time, duration_minutes || 60, subject || null, price === undefined || price === '' ? old.price : price, effective_date, originalEndDate]
    )

    await query(
      `DELETE FROM schedule_lessons WHERE template_id = $1 AND status != 'completed' AND date >= $2`,
      [old.id, effective_date]
    )

    return NextResponse.json({ success: true, id: created.rows[0].id })
  } catch (error) {
    console.error('Ошибка редактирования шаблона:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id } = await params

    const owner = await query(`SELECT teacher_id FROM lesson_templates WHERE id = $1`, [id])
    if (owner.rows.length === 0 || owner.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    // Ещё не проведённые занятия, сгенерированные из этого слота, тоже убираем —
    // проведённые остаются в истории
    await query(
      `DELETE FROM schedule_lessons WHERE template_id = $1 AND status != 'completed'`,
      [id]
    )

    await query(`DELETE FROM lesson_templates WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
