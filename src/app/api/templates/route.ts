import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const result = await query(
      `SELECT lt.*, COALESCE(ts.display_name, u.full_name) as student_name
       FROM lesson_templates lt
       JOIN users u ON u.id = lt.student_id
       LEFT JOIN teacher_students ts ON ts.teacher_id = lt.teacher_id AND ts.student_id = lt.student_id
       WHERE lt.teacher_id = $1 AND (lt.end_date IS NULL OR lt.end_date >= CURRENT_DATE)
       ORDER BY lt.day_of_week, lt.time`,
      [decoded.id]
    )

    return NextResponse.json({ templates: result.rows })
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { student_id, day_of_week, time, duration_minutes, subject, price, start_date } = await request.json()

    if (!student_id || day_of_week === undefined || !time || !start_date) {
      return NextResponse.json({ error: 'Заполните ученика, день недели, время и дату начала' }, { status: 400 })
    }

    const roster = await query(
      `SELECT lesson_price FROM teacher_students WHERE teacher_id = $1 AND student_id = $2`,
      [decoded.id, student_id]
    )
    if (roster.rows.length === 0) {
      return NextResponse.json({ error: 'Этот ученик не в твоём списке' }, { status: 400 })
    }
    const effectivePrice = price !== undefined && price !== '' ? price : roster.rows[0].lesson_price

    const result = await query(
      `INSERT INTO lesson_templates (teacher_id, student_id, day_of_week, time, duration_minutes, subject, price, start_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [decoded.id, student_id, day_of_week, time, duration_minutes || 60, subject || null, effectivePrice, start_date]
    )

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error('Ошибка создания шаблона:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
