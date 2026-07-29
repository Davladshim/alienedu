import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get('platform_admin_session')
  return session?.value === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const result = await query(
      `SELECT id, title, subject, topic, html_code, frame_width, frame_height, offset_x, offset_y, scale, created_at
       FROM interactive_models ORDER BY created_at DESC`
    )
    return NextResponse.json({ models: result.rows })
  } catch (error) {
    console.error('Ошибка получения банка моделей:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const { title, subject, topic, html_code, frame_width, frame_height, offset_x, offset_y, scale } = await req.json()
    if (!title?.trim() || !subject?.trim() || !html_code?.trim()) {
      return NextResponse.json({ error: 'Название, предмет и код модели обязательны' }, { status: 400 })
    }
    const result = await query(
      `INSERT INTO interactive_models (title, subject, topic, html_code, frame_width, frame_height, offset_x, offset_y, scale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, subject, topic, html_code, frame_width, frame_height, offset_x, offset_y, scale, created_at`,
      [
        title.trim(), subject.trim(), (topic || '').trim(), html_code,
        frame_width || 500, frame_height || 400, offset_x || 0, offset_y || 0, scale || 1,
      ]
    )
    return NextResponse.json({ model: result.rows[0] })
  } catch (error) {
    console.error('Ошибка создания модели:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
