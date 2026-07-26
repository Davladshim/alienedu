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

    const result = await query(
      `SELECT ts.id, u.id as student_id, u.full_name, u.login, ts.created_at,
         ts.lesson_price, ts.family_id, f.name as family_name,
         COALESCE(f.balance, ts.balance) as balance
       FROM teacher_students ts
       JOIN users u ON u.id = ts.student_id
       LEFT JOIN families f ON f.id = ts.family_id
       WHERE ts.teacher_id = $1
       ORDER BY u.full_name`,
      [decoded.id]
    )

    return NextResponse.json({ students: result.rows })
  } catch (error) {
    console.error('Ошибка получения учеников:', error)
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

    const { login } = await request.json()
    if (!login || !login.trim()) {
      return NextResponse.json({ error: 'Введите логин ученика' }, { status: 400 })
    }

    const userResult = await query(
      `SELECT id, full_name, login, role FROM users WHERE login = $1`,
      [login.trim()]
    )
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ученик с таким логином не найден' }, { status: 404 })
    }
    const student = userResult.rows[0]
    if (student.role !== 'student') {
      return NextResponse.json({ error: 'Этот логин принадлежит не ученику' }, { status: 400 })
    }
    if (student.id === decoded.id) {
      return NextResponse.json({ error: 'Нельзя добавить самого себя' }, { status: 400 })
    }

    const existing = await query(
      `SELECT id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2`,
      [decoded.id, student.id]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Этот ученик уже в списке' }, { status: 400 })
    }

    const insertResult = await query(
      `INSERT INTO teacher_students (teacher_id, student_id) VALUES ($1, $2) RETURNING id`,
      [decoded.id, student.id]
    )

    return NextResponse.json({
      success: true,
      student: {
        id: insertResult.rows[0].id,
        student_id: student.id,
        full_name: student.full_name,
        login: student.login,
      },
    })
  } catch (error) {
    console.error('Ошибка добавления ученика:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
