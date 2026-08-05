import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Обзор одного ребёнка для кабинета родителя: репетиторы (с балансом
// и стоимостью занятия у каждого) и расписание. Ребёнок может заниматься
// сразу у нескольких репетиторов — данные агрегируются по всем
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const studentId = Number(id)
    if (!studentId) {
      return NextResponse.json({ error: 'Некорректный id' }, { status: 400 })
    }

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Доступно только родителям' }, { status: 403 })
    }

    const link = await query(
      `SELECT 1 FROM parent_children WHERE parent_id = $1 AND student_id = $2`,
      [decoded.id, studentId]
    )
    if (link.rows.length === 0) {
      return NextResponse.json({ error: 'Этот ребёнок не привязан к вашему аккаунту' }, { status: 403 })
    }

    const childResult = await query(
      `SELECT id, full_name, login, grade FROM users WHERE id = $1`,
      [studentId]
    )
    if (childResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ребёнок не найден' }, { status: 404 })
    }

    const tutors = await query(
      `SELECT ts.id, ts.teacher_id, u.full_name AS teacher_name, ts.lesson_price, ts.balance,
              ts.family_id, f.name AS family_name, f.balance AS family_balance
       FROM teacher_students ts
       JOIN users u ON u.id = ts.teacher_id
       LEFT JOIN families f ON f.id = ts.family_id
       WHERE ts.student_id = $1 AND ts.archived_at IS NULL
       ORDER BY u.full_name`,
      [studentId]
    )

    const upcoming = await query(
      `SELECT sl.id, sl.teacher_id, u.full_name AS teacher_name, sl.date, sl.time,
              sl.duration_minutes, sl.subject, sl.status, sl.price, sl.is_paid
       FROM schedule_lessons sl
       JOIN users u ON u.id = sl.teacher_id
       WHERE sl.student_id = $1 AND sl.date >= CURRENT_DATE AND sl.status != 'cancelled'
       ORDER BY sl.date ASC, sl.time ASC
       LIMIT 30`,
      [studentId]
    )

    const recent = await query(
      `SELECT sl.id, sl.teacher_id, u.full_name AS teacher_name, sl.date, sl.time,
              sl.duration_minutes, sl.subject, sl.status, sl.price, sl.is_paid
       FROM schedule_lessons sl
       JOIN users u ON u.id = sl.teacher_id
       WHERE sl.student_id = $1 AND sl.date < CURRENT_DATE
       ORDER BY sl.date DESC, sl.time DESC
       LIMIT 10`,
      [studentId]
    )

    return NextResponse.json({
      child: childResult.rows[0],
      tutors: tutors.rows,
      upcoming: upcoming.rows,
      recent: recent.rows,
    })
  } catch (error) {
    console.error('Ошибка получения обзора ребёнка:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
