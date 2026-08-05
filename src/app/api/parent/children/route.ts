import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Доступно только родителям' }, { status: 403 })
    }

    const result = await query(
      `SELECT u.id, u.full_name, u.login, u.grade, pc.created_at
       FROM parent_children pc
       JOIN users u ON u.id = pc.student_id
       WHERE pc.parent_id = $1
       ORDER BY pc.created_at DESC`,
      [decoded.id]
    )

    return NextResponse.json({ children: result.rows })
  } catch (error) {
    console.error('Ошибка получения списка детей:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// Родитель сам создаёт аккаунт ребёнка (логин и пароль придумывает
// родитель) — в отличие от обычной регистрации ученика, несовершеннолетний
// тут вообще не проходит через самостоятельную регистрацию
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Доступно только родителям' }, { status: 403 })
    }

    const { full_name, login, code, grade } = await request.json()

    if (!full_name?.trim() || !login?.trim() || !code || !grade) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    if (String(code).length < 4) {
      return NextResponse.json({ error: 'Пароль слишком короткий' }, { status: 400 })
    }

    const existing = await query(`SELECT id FROM users WHERE login = $1`, [login.trim()])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Этот логин уже занят' }, { status: 400 })
    }

    const code_hash = await bcrypt.hash(String(code), 10)

    const created = await query(
      `INSERT INTO users (full_name, login, code_hash, role, grade)
       VALUES ($1, $2, $3, 'student', $4)
       RETURNING id, full_name, login, grade`,
      [full_name.trim(), login.trim(), code_hash, Number(grade)]
    )
    const child = created.rows[0]

    await query(
      `INSERT INTO parent_children (parent_id, student_id) VALUES ($1, $2)`,
      [decoded.id, child.id]
    )

    return NextResponse.json({ success: true, child })
  } catch (error) {
    console.error('Ошибка создания аккаунта ребёнка:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
