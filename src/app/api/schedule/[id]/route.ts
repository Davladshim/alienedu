import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { chargeForLesson, refundForLesson } from '@/lib/familyBalance'
import { hasCrossTeacherConflict } from '@/lib/scheduleConflict'
import { DEFAULT_TIMEZONE, toDateOnlyString } from '@/lib/timezone'

function isPast(date: string | Date, time: string): boolean {
  return new Date(`${toDateOnlyString(date)}T${time}:00`) < new Date()
}

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

    const { date, time, duration_minutes, subject, status, notes, price, is_paid } = await request.json()

    const isMoved = (date && date !== toDateOnlyString(existing.date)) || (time && time !== existing.time)

    // Занятие, которое уже прошло, переносить нельзя — только менять статус
    // или удалять. Дата берётся такая, какой она была ДО этого запроса.
    if (isMoved && isPast(existing.date, existing.time)) {
      return NextResponse.json({ error: 'Занятие уже прошло — перенести нельзя, можно только удалить' }, { status: 400 })
    }

    const newDate = date || existing.date
    const newTime = time || existing.time

    const originalDate = isMoved && !existing.original_date ? existing.date : existing.original_date
    const originalTime = isMoved && !existing.original_time ? existing.time : existing.original_time

    const newPrice = price !== undefined ? price : existing.price
    const newDuration = duration_minutes ?? existing.duration_minutes

    // Статус/оплата теперь меняются автоматически по времени (см. autoCompleteDueLessons).
    // Вручную из календаря можно только отменить занятие; ручная отметка "оплачено"
    // остаётся как аварийный вариант на странице "Финансы" (если авто-списание почему-то не сработало)
    const newStatus = status === 'cancelled' ? 'cancelled' : existing.status
    const newIsPaid = is_paid !== undefined ? is_paid : existing.is_paid

    if (existing.student_id && newStatus !== 'cancelled' && (isMoved || duration_minutes !== undefined)) {
      const teacherResult = await query(`SELECT timezone FROM users WHERE id = $1`, [decoded.id])
      const teacherTz: string = teacherResult.rows[0]?.timezone || DEFAULT_TIMEZONE
      const conflict = await hasCrossTeacherConflict(existing.student_id, decoded.id, teacherTz, newDate, newTime, newDuration)
      if (conflict) {
        return NextResponse.json({ error: 'Это время у ученика уже занято другим репетитором' }, { status: 409 })
      }
    }

    if (newIsPaid !== existing.is_paid && newPrice) {
      const studentResult = await query(
        `SELECT id, family_id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2`,
        [decoded.id, existing.student_id]
      )
      const rosterEntry = studentResult.rows[0]
      if (rosterEntry) {
        if (newIsPaid) {
          await chargeForLesson(rosterEntry.id, rosterEntry.family_id, newPrice)
        } else {
          await refundForLesson(rosterEntry.id, rosterEntry.family_id, newPrice)
        }
      }
    }

    await query(
      `UPDATE schedule_lessons
       SET date = $1, time = $2, duration_minutes = $3, subject = $4, status = $5, notes = $6,
           original_date = $7, original_time = $8, price = $9, is_paid = $10, updated_at = NOW()
       WHERE id = $11`,
      [
        newDate, newTime,
        newDuration,
        subject !== undefined ? subject : existing.subject,
        newStatus,
        notes !== undefined ? notes : existing.notes,
        originalDate, originalTime,
        newPrice, newIsPaid,
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

    const existingResult = await query(
      `SELECT * FROM schedule_lessons WHERE id = $1 AND teacher_id = $2`,
      [id, decoded.id]
    )
    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
    }
    const existing = existingResult.rows[0]

    // Если занятие было оплачено — возвращаем списанную сумму на баланс,
    // иначе удаление уронит баланс ученика без причины
    if (existing.is_paid && existing.price) {
      const studentResult = await query(
        `SELECT id, family_id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2`,
        [decoded.id, existing.student_id]
      )
      const rosterEntry = studentResult.rows[0]
      if (rosterEntry) {
        await refundForLesson(rosterEntry.id, rosterEntry.family_id, existing.price)
      }
    }

    await query(`DELETE FROM schedule_lessons WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления занятия:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
