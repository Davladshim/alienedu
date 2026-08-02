import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Лайк урока в библиотеке — только "нравится", без дизлайков: повторный
// вызов снимает лайк (toggle). Свой урок лайкнуть нельзя
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id: lessonId } = await params

    const lessonResult = await query(
      `SELECT teacher_id, is_public, status, moderation_status FROM lessons WHERE id = $1`,
      [lessonId]
    )
    if (lessonResult.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    const lesson = lessonResult.rows[0]
    if (!lesson.is_public || lesson.status !== 'published' || lesson.moderation_status !== 'approved') {
      return NextResponse.json({ error: 'Урок недоступен в библиотеке' }, { status: 403 })
    }
    if (lesson.teacher_id === decoded.id) {
      return NextResponse.json({ error: 'Нельзя лайкнуть свой урок' }, { status: 400 })
    }

    const existing = await query(
      `SELECT id FROM lesson_likes WHERE lesson_id = $1 AND teacher_id = $2`,
      [lessonId, decoded.id]
    )
    let liked: boolean
    if (existing.rows.length > 0) {
      await query(`DELETE FROM lesson_likes WHERE id = $1`, [existing.rows[0].id])
      liked = false
    } else {
      await query(`INSERT INTO lesson_likes (lesson_id, teacher_id) VALUES ($1, $2)`, [lessonId, decoded.id])
      liked = true
    }

    const countResult = await query(`SELECT COUNT(*) FROM lesson_likes WHERE lesson_id = $1`, [lessonId])

    return NextResponse.json({ liked, likes_count: Number(countResult.rows[0].count) })
  } catch (error) {
    console.error('Ошибка лайка урока:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
