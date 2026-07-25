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

    const existingResult = await query(`SELECT * FROM schedule_lessons WHERE id = $1`, [id])
    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
    }
    const existing = existingResult.rows[0]
    if (existing.teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const { date, time, duration_minutes, subject, status, notes } = await request.json()

    const newDate = date || existing.date
    const newTime = time || existing.time
    const isMoved = (date && date !== String(existing.date).slice(0, 10)) || (time && time !== existing.time)

    const originalDate = isMoved && !existing.original_date ? existing.date : existing.original_date
    const originalTime = isMoved && !existing.original_time ? existing.time : existing.original_time

    await query(
      `UPDATE schedule_lessons
       SET date = $1, time = $2, duration_minutes = $3, subject = $4, status = $5, notes = $6,
           original_date = $7, original_time = $8, updated_at = NOW()
       WHERE id = $9`,
      [
        newDate, newTime,
        duration_minutes ?? existing.duration_minutes,
        subject !== undefined ? subject : existing.subject,
        status || existing.status,
        notes !== undefined ? notes : existing.notes,
        originalDate, originalTime,
        id,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка обновления занятия:', error)
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
      `DELETE FROM schedule_lessons WHERE id = $1 AND teacher_id = $2`,
      [id, decoded.id]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления занятия:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
