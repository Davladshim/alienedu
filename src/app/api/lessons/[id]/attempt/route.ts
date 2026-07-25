import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

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

    const { block_id, answer, is_correct } = await request.json()
    if (!block_id) {
      return NextResponse.json({ error: 'Не указан блок' }, { status: 400 })
    }

    await query(
      `INSERT INTO lesson_attempts (lesson_id, block_id, student_id, answer, is_correct)
       VALUES ($1, $2, $3, $4, $5)`,
      [lessonId, block_id, decoded.id, JSON.stringify(answer ?? null), is_correct ?? null]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка сохранения ответа:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
