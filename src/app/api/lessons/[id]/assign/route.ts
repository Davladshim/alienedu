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
    const { id: lessonId } = await params

    const owner = await query(`SELECT teacher_id FROM lessons WHERE id = $1`, [lessonId])
    if (owner.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    if (owner.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const { student_ids } = await request.json()
    const ids: number[] = Array.isArray(student_ids) ? student_ids : []

    // Назначаем только учеников из ростера этого преподавателя
    const rosterResult = await query(
      `SELECT student_id FROM teacher_students WHERE teacher_id = $1`,
      [decoded.id]
    )
    const rosterIds = new Set(rosterResult.rows.map(r => r.student_id))
    const validIds = ids.filter(id => rosterIds.has(id))

    await query(`DELETE FROM lesson_assignments WHERE lesson_id = $1`, [lessonId])
    for (const studentId of validIds) {
      await query(
        `INSERT INTO lesson_assignments (lesson_id, student_id) VALUES ($1, $2)`,
        [lessonId, studentId]
      )
    }

    return NextResponse.json({ success: true, assigned_student_ids: validIds })
  } catch (error) {
    console.error('Ошибка назначения урока:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
