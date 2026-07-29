import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get('platform_admin_session')
  return session?.value === process.env.ADMIN_SECRET
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const { id } = await params
    const { title, subject, topic, html_code, frame_width, frame_height, offset_x, offset_y, scale } = await req.json()
    if (!title?.trim() || !subject?.trim() || !html_code?.trim()) {
      return NextResponse.json({ error: 'Название, предмет и код модели обязательны' }, { status: 400 })
    }
    const result = await query(
      `UPDATE interactive_models
       SET title = $1, subject = $2, topic = $3, html_code = $4,
           frame_width = $5, frame_height = $6, offset_x = $7, offset_y = $8, scale = $9
       WHERE id = $10
       RETURNING id, title, subject, topic, html_code, frame_width, frame_height, offset_x, offset_y, scale, created_at`,
      [
        title.trim(), subject.trim(), (topic || '').trim(), html_code,
        frame_width || 500, frame_height || 400, offset_x || 0, offset_y || 0, scale || 1, id,
      ]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Модель не найдена' }, { status: 404 })
    }
    return NextResponse.json({ model: result.rows[0] })
  } catch (error) {
    console.error('Ошибка обновления модели:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const { id } = await params
    await query(`DELETE FROM interactive_models WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления модели:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
