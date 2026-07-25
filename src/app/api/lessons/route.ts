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
      `SELECT id, title, subject, grade, status, created_at, updated_at
       FROM lessons
       WHERE teacher_id = $1
       ORDER BY updated_at DESC`,
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

    const { title, subject, grade, status, blocks } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Введите название урока' }, { status: 400 })
    }

    const lessonResult = await query(
      `INSERT INTO lessons (teacher_id, title, subject, grade, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [decoded.id, title, subject || null, grade || null, status === 'published' ? 'published' : 'draft']
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
