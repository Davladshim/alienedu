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

    const family = await query(`SELECT teacher_id FROM families WHERE id = $1`, [id])
    if (family.rows.length === 0) {
      return NextResponse.json({ error: 'Семья не найдена' }, { status: 404 })
    }
    if (family.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    // Учеников не удаляем — просто разгруппировываем, у каждого остаётся его
    // личный баланс
    await query(`UPDATE teacher_students SET family_id = NULL WHERE family_id = $1`, [id])
    await query(`DELETE FROM families WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления семьи:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
