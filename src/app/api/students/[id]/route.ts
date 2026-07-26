import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

export async function PUT(
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

    const existing = await query(`SELECT * FROM teacher_students WHERE id = $1`, [id])
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    const row = existing.rows[0]
    if (row.teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const { lesson_price, family_id } = await request.json()

    if (family_id !== undefined && family_id !== null) {
      const family = await query(`SELECT teacher_id FROM families WHERE id = $1`, [family_id])
      if (family.rows.length === 0 || family.rows[0].teacher_id !== decoded.id) {
        return NextResponse.json({ error: 'Семья не найдена' }, { status: 400 })
      }
    }

    await query(
      `UPDATE teacher_students SET lesson_price = $1, family_id = $2 WHERE id = $3`,
      [
        lesson_price !== undefined ? lesson_price : row.lesson_price,
        family_id !== undefined ? family_id : row.family_id,
        id,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка обновления ученика:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

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
