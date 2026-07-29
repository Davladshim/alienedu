import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Список активных (ещё не завершённых учителем) назначений уроков —
// одна строка на пару урок×ученик, для таблицы "Назначенные уроки"
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const result = await query(
      `SELECT la.id, la.lesson_id, l.title as lesson_title, l.mode as lesson_mode,
              la.student_id, u.full_name as student_name, la.assigned_at,
              started.started_at,
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
       CROSS JOIN LATERAL (
         SELECT MIN(completed_at) as started_at FROM lesson_attempts att
         WHERE att.lesson_id = la.lesson_id AND att.student_id = la.student_id
       ) started
       WHERE l.teacher_id = $1 AND l.status = 'published' AND la.reviewed_at IS NULL
       ORDER BY la.assigned_at DESC`,
      [decoded.id]
    )

    return NextResponse.json({ assignments: result.rows })
  } catch (error) {
    console.error('Ошибка получения назначенных уроков:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
