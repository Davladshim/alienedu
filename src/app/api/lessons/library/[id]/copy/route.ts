import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Копирует урок из библиотеки в собственный список репетитора: полная
// копия урока и всех его блоков, но с locked = true — оригинал остаётся
// редактируемым только у автора, а копия видна себе только для просмотра
// и назначения ученикам (см. PUT /api/lessons/[id], там же проверка locked)
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
    const { id: sourceId } = await params

    const sourceResult = await query(
      `SELECT l.*, u.full_name as owner_name FROM lessons l JOIN users u ON u.id = l.teacher_id WHERE l.id = $1`,
      [sourceId]
    )
    if (sourceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    const source = sourceResult.rows[0]

    if (!source.is_public || source.status !== 'published') {
      return NextResponse.json({ error: 'Урок недоступен в библиотеке' }, { status: 403 })
    }
    if (source.teacher_id === decoded.id) {
      return NextResponse.json({ error: 'Это ваш собственный урок' }, { status: 400 })
    }

    const copyResult = await query(
      `INSERT INTO lessons (teacher_id, title, subject, grade, status, mode, locked, source_lesson_id, author_name)
       VALUES ($1, $2, $3, $4, 'published', $5, true, $6, $7)
       RETURNING id`,
      [decoded.id, source.title, source.subject, source.grade, source.mode, source.id, source.owner_name]
    )
    const newLessonId = copyResult.rows[0].id

    const blocksResult = await query(
      `SELECT order_index, type, content FROM lesson_blocks WHERE lesson_id = $1 ORDER BY order_index`,
      [sourceId]
    )
    for (const block of blocksResult.rows) {
      await query(
        `INSERT INTO lesson_blocks (lesson_id, order_index, type, content) VALUES ($1, $2, $3, $4)`,
        [newLessonId, block.order_index, block.type, JSON.stringify(block.content || {})]
      )
    }

    return NextResponse.json({ success: true, lesson_id: newLessonId })
  } catch (error) {
    console.error('Ошибка копирования урока из библиотеки:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
