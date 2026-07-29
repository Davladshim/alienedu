import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Банк интерактивных моделей для конструктора урока — поиск/фильтр по
// предмету и теме/названию. Модели пополняет только админ (см.
// /api/admin/models), здесь — только чтение для авторизованных репетиторов
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    jwt.verify(token, process.env.JWT_SECRET!)

    const q = request.nextUrl.searchParams.get('q')?.trim() || ''
    const subject = request.nextUrl.searchParams.get('subject')?.trim() || ''

    const result = await query(
      `SELECT id, title, subject, topic, html_code, frame_width, frame_height, offset_x, offset_y, scale, created_at
       FROM interactive_models
       WHERE ($1 = '' OR title ILIKE '%' || $1 || '%' OR topic ILIKE '%' || $1 || '%')
         AND ($2 = '' OR subject = $2)
       ORDER BY subject, title`,
      [q, subject]
    )
    return NextResponse.json({ models: result.rows })
  } catch (error) {
    console.error('Ошибка получения банка моделей:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
