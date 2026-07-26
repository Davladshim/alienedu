import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { searchParams } = new URL(request.url)
    const teacherStudentId = searchParams.get('teacher_student_id')
    if (!teacherStudentId) {
      return NextResponse.json({ error: 'Укажите teacher_student_id' }, { status: 400 })
    }

    const owner = await query(`SELECT teacher_id FROM teacher_students WHERE id = $1`, [teacherStudentId])
    if (owner.rows.length === 0 || owner.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const result = await query(
      `SELECT id, amount, description, payment_date FROM payments
       WHERE teacher_student_id = $1 ORDER BY payment_date DESC LIMIT 50`,
      [teacherStudentId]
    )

    return NextResponse.json({ payments: result.rows })
  } catch (error) {
    console.error('Ошибка получения платежей:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { teacher_student_id, amount, description } = await request.json()
    if (!teacher_student_id || !amount || Number.isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Укажите ученика и сумму' }, { status: 400 })
    }

    const studentResult = await query(`SELECT * FROM teacher_students WHERE id = $1`, [teacher_student_id])
    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
    }
    const student = studentResult.rows[0]
    if (student.teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    if (student.family_id) {
      await query(`UPDATE families SET balance = balance + $1 WHERE id = $2`, [amount, student.family_id])
    } else {
      await query(`UPDATE teacher_students SET balance = balance + $1 WHERE id = $2`, [amount, teacher_student_id])
    }

    const result = await query(
      `INSERT INTO payments (teacher_id, teacher_student_id, amount, description)
       VALUES ($1, $2, $3, $4) RETURNING id, amount, description, payment_date`,
      [decoded.id, teacher_student_id, amount, description || null]
    )

    return NextResponse.json({ success: true, payment: result.rows[0] })
  } catch (error) {
    console.error('Ошибка добавления платежа:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
