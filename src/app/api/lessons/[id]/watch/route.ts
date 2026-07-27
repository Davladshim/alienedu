import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { liveChannelName } from '@/lib/liveChannelName'

// Для учителя: данные для страницы живого наблюдения за конкретным учеником —
// урок, ученик, блоки и его текущие попытки, плюс имя realtime-канала.
// Доступно только для своих опубликованных проверочных уроков (не контрольных)
// с назначенным учеником — на контрольной подглядывать/подсказывать нельзя
export async function GET(
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
    const studentId = request.nextUrl.searchParams.get('student_id')
    if (!studentId) {
      return NextResponse.json({ error: 'Не указан ученик' }, { status: 400 })
    }

    const lessonResult = await query(`SELECT * FROM lessons WHERE id = $1`, [lessonId])
    if (lessonResult.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    const lesson = lessonResult.rows[0]
    if (lesson.teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }
    if (lesson.mode !== 'quiz') {
      return NextResponse.json({ error: 'Наблюдение доступно только для проверочных уроков' }, { status: 403 })
    }

    const assignment = await query(
      `SELECT 1 FROM lesson_assignments WHERE lesson_id = $1 AND student_id = $2`,
      [lessonId, studentId]
    )
    if (assignment.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не назначен этому ученику' }, { status: 404 })
    }

    const studentResult = await query(`SELECT id, full_name FROM users WHERE id = $1`, [studentId])
    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
    }

    const blocksResult = await query(
      `SELECT id, order_index, type, content FROM lesson_blocks WHERE lesson_id = $1 ORDER BY order_index`,
      [lessonId]
    )

    const attemptsResult = await query(
      `SELECT block_id, answer, is_correct, completed_at FROM lesson_attempts
       WHERE lesson_id = $1 AND student_id = $2 ORDER BY completed_at ASC`,
      [lessonId, studentId]
    )

    return NextResponse.json({
      lesson,
      student: studentResult.rows[0],
      blocks: blocksResult.rows,
      attempts: attemptsResult.rows,
      live_channel: liveChannelName(lessonId, studentId),
    })
  } catch (error) {
    console.error('Ошибка получения данных для наблюдения:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
