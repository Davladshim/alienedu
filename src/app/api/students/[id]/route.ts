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

    const result = await query(
      `DELETE FROM teacher_students WHERE id = $1 AND teacher_id = $2`,
      [id, decoded.id]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления ученика:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
