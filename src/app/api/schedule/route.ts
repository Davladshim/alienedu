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

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    if (!from || !to) {
      return NextResponse.json({ error: 'Укажите диапазон дат (from, to)' }, { status: 400 })
    }

    const result = await query(
      `SELECT sl.*, u.full_name as student_name
       FROM schedule_lessons sl
       JOIN users u ON u.id = sl.student_id
       WHERE sl.teacher_id = $1 AND sl.date BETWEEN $2 AND $3
       ORDER BY sl.date, sl.time`,
      [decoded.id, from, to]
    )

    return NextResponse.json({ lessons: result.rows })
  } catch (error) {
    console.error('Ошибка получения расписания:', error)
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

    const { student_id, date, time, duration_minutes, subject, notes, price } = await request.json()

    if (!student_id || !date || !time) {
      return NextResponse.json({ error: 'Заполните ученика, дату и время' }, { status: 400 })
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
      `INSERT INTO schedule_lessons (teacher_id, student_id, date, time, duration_minutes, subject, notes, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [decoded.id, student_id, date, time, duration_minutes || 60, subject || null, notes || null, effectivePrice]
    )

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error('Ошибка создания занятия:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
