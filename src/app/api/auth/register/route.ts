import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { full_name, login, code, secret_question, secret_answer, role } = await request.json()

    if (!full_name || !login || !code || !secret_question || !secret_answer) {
      return NextResponse.json(
        { error: 'Заполните все поля' },
        { status: 400 }
      )
    }

    // Проверяем что логин не занят
    const existing = await query(
      'SELECT id FROM users WHERE login = $1',
      [login]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Этот логин уже занят' },
        { status: 400 }
      )
    }

    // Хэшируем код и секретный ответ
    const code_hash = await bcrypt.hash(code, 10)
    const secret_answer_hash = await bcrypt.hash(
      secret_answer.toLowerCase().trim(), 10
    )

    const userRole = role === 'teacher' ? 'teacher' : 'student'

    const result = await query(
      `INSERT INTO users 
        (full_name, login, code_hash, role, secret_question, secret_answer_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, login, role`,
      [full_name, login, code_hash, userRole, secret_question, secret_answer_hash]
    )

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    })

  } catch (error) {
    console.error('Ошибка регистрации:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}