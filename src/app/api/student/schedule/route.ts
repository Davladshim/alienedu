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
      `SELECT sl.id, sl.date, sl.time, sl.duration_minutes, sl.subject, sl.status,
              sl.original_date, sl.original_time, u.full_name as teacher_name
       FROM schedule_lessons sl
       JOIN users u ON u.id = sl.teacher_id
       WHERE sl.student_id = $1 AND sl.date >= CURRENT_DATE
       ORDER BY sl.date, sl.time`,
      [decoded.id]
    )

    return NextResponse.json({ lessons: result.rows })
  } catch (error) {
    console.error('Ошибка получения расписания ученика:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
