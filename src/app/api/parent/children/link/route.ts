import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

// Второй родитель (мама/папа по отдельности, опекун и т.п.) привязывается
// к уже существующему аккаунту ребёнка, зная его логин и пароль — в отличие
// от POST /api/parent/children, здесь новый аккаунт не создаётся
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

    const { login, code, consent } = await request.json()
    if (!login?.trim() || !code) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }
    if (!consent) {
      return NextResponse.json({ error: 'Нужно подтвердить согласие на обработку персональных данных ребёнка' }, { status: 400 })
    }

    const result = await query(
      `SELECT id, full_name, login, grade, role, code_hash, is_placeholder FROM users WHERE login = $1`,
      [login.trim()]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ученик с таким логином не найден' }, { status: 404 })
    }
    const child = result.rows[0]
    if (child.role !== 'student' || child.is_placeholder) {
      return NextResponse.json({ error: 'Этот логин не принадлежит зарегистрированному ученику' }, { status: 400 })
    }

    const codeMatch = await bcrypt.compare(String(code), child.code_hash)
    if (!codeMatch) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 400 })
    }

    const already = await query(
      `SELECT 1 FROM parent_children WHERE parent_id = $1 AND student_id = $2`,
      [decoded.id, child.id]
    )
    if (already.rows.length > 0) {
      return NextResponse.json({ error: 'Этот ребёнок уже привязан к вашему аккаунту' }, { status: 400 })
    }

    await query(
      `INSERT INTO parent_children (parent_id, student_id) VALUES ($1, $2)`,
      [decoded.id, child.id]
    )
    await query(
      `INSERT INTO parent_consent_log (parent_id, student_id, action) VALUES ($1, $2, 'child_account_linked')`,
      [decoded.id, child.id]
    )

    return NextResponse.json({
      success: true,
      child: { id: child.id, full_name: child.full_name, login: child.login, grade: child.grade },
    })
  } catch (error) {
    console.error('Ошибка привязки существующего аккаунта ребёнка:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
