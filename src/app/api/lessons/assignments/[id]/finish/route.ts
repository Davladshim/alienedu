import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Учитель отмечает назначение как полностью проверенное — необратимо
// убирает его из активной таблицы "Назначенные уроки"
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
    const { id: assignmentId } = await params

    const owner = await query(
      `SELECT la.id FROM lesson_assignments la
       JOIN lessons l ON l.id = la.lesson_id
       WHERE la.id = $1 AND l.teacher_id = $2`,
      [assignmentId, decoded.id]
    )
    if (owner.rows.length === 0) {
      return NextResponse.json({ error: 'Назначение не найдено' }, { status: 404 })
    }

    await query(`UPDATE lesson_assignments SET reviewed_at = NOW() WHERE id = $1`, [assignmentId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка завершения назначения:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
