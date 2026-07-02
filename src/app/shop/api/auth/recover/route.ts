import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { login, secret_answer, new_code } = await request.json()

    if (!login || !secret_answer || !new_code) {
      return NextResponse.json(
        { error: 'Заполните все поля' },
        { status: 400 }
      )
    }

    // Ищем пользователя
    const result = await query(
      'SELECT * FROM users WHERE login = $1',
      [login]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    // Проверяем ответ на секретный вопрос
    const answerMatch = await bcrypt.compare(
      secret_answer.toLowerCase().trim(),
      user.secret_answer_hash
    )

    if (!answerMatch) {
      return NextResponse.json(
        { error: 'Неверный ответ на секретный вопрос' },
        { status: 401 }
      )
    }

    // Обновляем код
    const new_code_hash = await bcrypt.hash(new_code, 10)

    await query(
      'UPDATE users SET code_hash = $1, updated_at = NOW() WHERE id = $2',
      [new_code_hash, user.id]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ошибка восстановления:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}