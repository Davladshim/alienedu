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
      `SELECT
         l.id, l.title, l.subject, l.grade, u.full_name as teacher_name, la.assigned_at,
         (SELECT COUNT(*) FROM lesson_blocks lb WHERE lb.lesson_id = l.id) AS total_blocks,
         (SELECT COUNT(DISTINCT block_id) FROM lesson_attempts att
           WHERE att.lesson_id = l.id AND att.student_id = $1) AS answered_blocks,
         (SELECT COUNT(*) FILTER (WHERE t.is_correct = true) FROM (
            SELECT DISTINCT ON (block_id) block_id, is_correct FROM lesson_attempts att2
            WHERE att2.lesson_id = l.id AND att2.student_id = $1
            ORDER BY block_id, completed_at DESC
          ) t) AS correct_count,
         (SELECT COUNT(*) FILTER (WHERE t.is_correct IS NOT NULL) FROM (
            SELECT DISTINCT ON (block_id) block_id, is_correct FROM lesson_attempts att3
            WHERE att3.lesson_id = l.id AND att3.student_id = $1
            ORDER BY block_id, completed_at DESC
          ) t) AS gradable_count
       FROM lesson_assignments la
       JOIN lessons l ON l.id = la.lesson_id
       JOIN users u ON u.id = l.teacher_id
       WHERE la.student_id = $1 AND l.status = 'published'
       ORDER BY la.assigned_at DESC`,
      [decoded.id]
    )

    return NextResponse.json({ lessons: result.rows })
  } catch (error) {
    console.error('Ошибка получения уроков ученика:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
