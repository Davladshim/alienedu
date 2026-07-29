import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Данные одной модели для рендера в блоке урока — и в конструкторе/
// предпросмотре учителя, и в плеере ученика во время прохождения
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    jwt.verify(token, process.env.JWT_SECRET!)

    const { id } = await params
    const result = await query(
      `SELECT id, title, subject, topic, html_code, frame_width, frame_height, offset_x, offset_y, scale
       FROM interactive_models WHERE id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Модель не найдена' }, { status: 404 })
    }
    return NextResponse.json({ model: result.rows[0] })
  } catch (error) {
    console.error('Ошибка получения модели:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
