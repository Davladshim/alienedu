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

    const { lesson_price, family_id, grade, parent_name, call_link } = await request.json()

    if (family_id !== undefined && family_id !== null) {
      const family = await query(`SELECT teacher_id FROM families WHERE id = $1`, [family_id])
      if (family.rows.length === 0 || family.rows[0].teacher_id !== decoded.id) {
        return NextResponse.json({ error: 'Семья не найдена' }, { status: 400 })
      }
    }

    await query(
      `UPDATE teacher_students SET lesson_price = $1, family_id = $2, grade = $3, parent_name = $4, call_link = $5 WHERE id = $6`,
      [
        lesson_price !== undefined ? lesson_price : row.lesson_price,
        family_id !== undefined ? family_id : row.family_id,
        grade !== undefined ? grade : row.grade,
        parent_name !== undefined ? parent_name : row.parent_name,
        call_link !== undefined ? call_link : row.call_link,
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

    const existing = await query(`SELECT * FROM teacher_students WHERE id = $1 AND teacher_id = $2`, [id, decoded.id])
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    const studentId = existing.rows[0].student_id

    // Убираем ещё не проведённые занятия и шаблон этого ученика — проведённые
    // уроки остаются в истории, даже когда его больше нет в ростере
    await query(
      `DELETE FROM schedule_lessons WHERE teacher_id = $1 AND student_id = $2 AND status != 'completed'`,
      [decoded.id, studentId]
    )
    await query(`DELETE FROM lesson_templates WHERE teacher_id = $1 AND student_id = $2`, [decoded.id, studentId])

    await query(`DELETE FROM teacher_students WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления ученика:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
