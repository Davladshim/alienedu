import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

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
    const { id } = await params

    const owner = await query(`SELECT teacher_id FROM lesson_templates WHERE id = $1`, [id])
    if (owner.rows.length === 0 || owner.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    // Ещё не проведённые занятия, сгенерированные из этого слота, тоже убираем —
    // проведённые остаются в истории
    await query(
      `DELETE FROM schedule_lessons WHERE template_id = $1 AND status != 'completed'`,
      [id]
    )

    await query(`DELETE FROM lesson_templates WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
