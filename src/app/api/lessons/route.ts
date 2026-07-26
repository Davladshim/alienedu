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
      `SELECT l.id, l.title, l.subject, l.grade, l.status, l.created_at, l.updated_at,
         COALESCE(stats.assigned_count, 0) as assigned_count,
         COALESCE(stats.completed_count, 0) as completed_count
       FROM lessons l
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) as assigned_count,
           COUNT(*) FILTER (WHERE total_blocks > 0 AND answered_blocks >= total_blocks) as completed_count
         FROM (
           SELECT la.student_id,
             (SELECT COUNT(*) FROM lesson_blocks lb WHERE lb.lesson_id = l.id) as total_blocks,
             (SELECT COUNT(DISTINCT block_id) FROM lesson_attempts att
               WHERE att.lesson_id = l.id AND att.student_id = la.student_id) as answered_blocks
           FROM lesson_assignments la
           WHERE la.lesson_id = l.id
         ) per_student
       ) stats ON true
       WHERE l.teacher_id = $1
       ORDER BY l.updated_at DESC`,
      [decoded.id]
    )

    return NextResponse.json({ lessons: result.rows })
  } catch (error) {
    console.error('Ошибка получения уроков:', error)
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

    const { title, subject, grade, status, mode, blocks } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Введите название урока' }, { status: 400 })
    }

    const lessonResult = await query(
      `INSERT INTO lessons (teacher_id, title, subject, grade, status, mode)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [decoded.id, title, subject || null, grade || null, status === 'published' ? 'published' : 'draft', mode === 'exam' ? 'exam' : 'quiz']
    )
    const lessonId = lessonResult.rows[0].id

    for (let i = 0; i < (blocks || []).length; i++) {
      const block = blocks[i]
      await query(
        `INSERT INTO lesson_blocks (lesson_id, order_index, type, content)
         VALUES ($1, $2, $3, $4)`,
        [lessonId, i, block.type, JSON.stringify(block.content || {})]
      )
    }

    return NextResponse.json({ success: true, lesson_id: lessonId })
  } catch (error) {
    console.error('Ошибка создания урока:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
