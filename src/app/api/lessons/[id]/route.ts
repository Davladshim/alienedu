import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params

    const lessonResult = await query(`SELECT * FROM lessons WHERE id = $1`, [lessonId])
    if (lessonResult.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }

    const blocksResult = await query(
      `SELECT id, order_index, type, content FROM lesson_blocks
       WHERE lesson_id = $1 ORDER BY order_index`,
      [lessonId]
    )

    return NextResponse.json({ lesson: lessonResult.rows[0], blocks: blocksResult.rows })
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

    const owner = await query(`SELECT teacher_id FROM lessons WHERE id = $1`, [lessonId])
    if (owner.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    if (owner.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const { title, subject, grade, status, blocks } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Введите название урока' }, { status: 400 })
    }

    await query(
      `UPDATE lessons SET title = $1, subject = $2, grade = $3, status = $4, updated_at = NOW()
       WHERE id = $5`,
      [title, subject || null, grade || null, status || 'draft', lessonId]
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
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
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
