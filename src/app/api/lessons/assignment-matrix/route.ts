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
      `SELECT la.student_id, u.full_name as student_name, la.lesson_id, l.title as lesson_title,
              CASE
                WHEN tb.total_blocks = 0 OR ab.answered_blocks = 0 THEN 'not_started'
                WHEN ab.answered_blocks < tb.total_blocks THEN 'in_progress'
                ELSE 'completed'
              END as status
       FROM lesson_assignments la
       JOIN users u ON u.id = la.student_id
       JOIN lessons l ON l.id = la.lesson_id
       CROSS JOIN LATERAL (SELECT COUNT(*) as total_blocks FROM lesson_blocks lb WHERE lb.lesson_id = la.lesson_id) tb
       CROSS JOIN LATERAL (
         SELECT COUNT(DISTINCT block_id) as answered_blocks FROM lesson_attempts att
         WHERE att.lesson_id = la.lesson_id AND att.student_id = la.student_id
       ) ab
       WHERE l.teacher_id = $1 AND l.status = 'published'
       ORDER BY u.full_name, l.title`,
      [decoded.id]
    )

    const students = new Map<number, string>()
    const lessons = new Map<number, string>()
    for (const row of result.rows) {
      students.set(row.student_id, row.student_name)
      lessons.set(row.lesson_id, row.lesson_title)
    }

    return NextResponse.json({
      students: Array.from(students, ([id, full_name]) => ({ id, full_name })),
      lessons: Array.from(lessons, ([id, title]) => ({ id, title })),
      cells: result.rows.map(r => ({ student_id: r.student_id, lesson_id: r.lesson_id, status: r.status })),
    })
  } catch (error) {
    console.error('Ошибка получения матрицы назначений:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
