import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { liveChannelName } from '@/lib/liveChannelName'
import { getTeacherLimits } from '@/lib/plan'

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

    const lessonResult = await query(`SELECT * FROM lessons WHERE id = $1`, [lessonId])
    if (lessonResult.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    const lesson = lessonResult.rows[0]

    const isOwner = lesson.teacher_id === decoded.id
    if (!isOwner) {
      const assigned = await query(
        `SELECT 1 FROM lesson_assignments WHERE lesson_id = $1 AND student_id = $2`,
        [lessonId, decoded.id]
      )
      if (assigned.rows.length === 0 || lesson.status !== 'published') {
        return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
      }
    }

    const blocksResult = await query(
      `SELECT id, order_index, type, content FROM lesson_blocks
       WHERE lesson_id = $1 ORDER BY order_index`,
      [lessonId]
    )

    const assignmentsResult = await query(
      `SELECT student_id FROM lesson_assignments WHERE lesson_id = $1`,
      [lessonId]
    )

    // Прошлые попытки текущего пользователя — чтобы плеер урока мог
    // восстановить прогресс после перезагрузки страницы, а не начинать заново
    const attemptsResult = await query(
      `SELECT block_id, answer, is_correct, completed_at FROM lesson_attempts
       WHERE lesson_id = $1 AND student_id = $2
       ORDER BY completed_at ASC`,
      [lessonId, decoded.id]
    )

    // Канал живого наблюдения нужен только ученику и только для проверочных
    // уроков (учитель не может подглядывать/подсказывать на контрольной)
    const liveChannel = !isOwner && lesson.mode === 'quiz'
      ? liveChannelName(lessonId, decoded.id)
      : null

    return NextResponse.json({
      lesson,
      blocks: blocksResult.rows,
      assigned_student_ids: assignmentsResult.rows.map(r => r.student_id),
      attempts: attemptsResult.rows,
      live_channel: liveChannel,
    })
  } catch (error) {
    console.error('Ошибка получения урока:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(
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

    const owner = await query(`SELECT teacher_id, locked FROM lessons WHERE id = $1`, [lessonId])
    if (owner.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    if (owner.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }
    if (owner.rows[0].locked) {
      return NextResponse.json({ error: 'Урок из библиотеки нельзя редактировать' }, { status: 403 })
    }

    const { title, subject, grade, status, mode, is_public, library_description, blocks } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Введите название урока' }, { status: 400 })
    }

    const limits = await getTeacherLimits(decoded.id)
    const isPublic = limits.canPublishToLibrary ? !!is_public : false
    if (isPublic && !(library_description || '').trim()) {
      return NextResponse.json({ error: 'Для публикации в библиотеке нужно заполнить описание урока' }, { status: 400 })
    }

    await query(
      `UPDATE lessons SET title = $1, subject = $2, grade = $3, status = $4, mode = $5, is_public = $6, library_description = $7, updated_at = NOW()
       WHERE id = $8`,
      [title, subject || null, grade || null, status || 'draft', mode === 'exam' ? 'exam' : 'quiz', isPublic, isPublic ? library_description.trim() : null, lessonId]
    )

    await query(`DELETE FROM lesson_blocks WHERE lesson_id = $1`, [lessonId])
    for (let i = 0; i < (blocks || []).length; i++) {
      const block = blocks[i]
      await query(
        `INSERT INTO lesson_blocks (lesson_id, order_index, type, content)
         VALUES ($1, $2, $3, $4)`,
        [lessonId, i, block.type, JSON.stringify(block.content || {})]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка обновления урока:', error)
    // Временная диагностика: показываем текст реальной ошибки, чтобы понять,
    // почему это падает на проде (убрать после того как разберёмся)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Ошибка сервера', detail }, { status: 500 })
  }
}

export async function DELETE(
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

    const owner = await query(`SELECT teacher_id FROM lessons WHERE id = $1`, [lessonId])
    if (owner.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    if (owner.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    await query(`DELETE FROM lessons WHERE id = $1`, [lessonId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления урока:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
