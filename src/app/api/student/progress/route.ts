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

    const overall = await query(
      `SELECT
         COUNT(*) FILTER (WHERE is_correct = true) AS correct,
         COUNT(*) FILTER (WHERE is_correct IS NOT NULL) AS gradable
       FROM (
         SELECT DISTINCT ON (block_id) block_id, is_correct
         FROM lesson_attempts
         WHERE student_id = $1
         ORDER BY block_id, completed_at DESC
       ) t`,
      [decoded.id]
    )

    const bySubject = await query(
      `SELECT
         COALESCE(l.subject, 'Без предмета') AS subject,
         COUNT(*) FILTER (WHERE t.is_correct = true) AS correct,
         COUNT(*) FILTER (WHERE t.is_correct IS NOT NULL) AS gradable
       FROM (
         SELECT DISTINCT ON (block_id) block_id, lesson_id, is_correct
         FROM lesson_attempts
         WHERE student_id = $1
         ORDER BY block_id, completed_at DESC
       ) t
       JOIN lessons l ON l.id = t.lesson_id
       GROUP BY l.subject
       ORDER BY subject`,
      [decoded.id]
    )

    return NextResponse.json({
      overall: overall.rows[0],
      bySubject: bySubject.rows,
    })
  } catch (error) {
    console.error('Ошибка получения прогресса:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
