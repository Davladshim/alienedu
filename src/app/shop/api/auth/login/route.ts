import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { login, code } = await request.json()

    if (!login || !code) {
      return NextResponse.json(
        { error: 'Введите логин и код' },
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
        { error: 'Неверный логин или код' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Проверяем код
    const codeMatch = await bcrypt.compare(code, user.code_hash)
    if (!codeMatch) {
      return NextResponse.json(
        { error: 'Неверный логин или код' },
        { status: 401 }
      )
    }

    // Создаём токен
    const token = jwt.sign(
      {
        id: user.id,
        login: user.login,
        role: user.role,
        full_name: user.full_name
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        login: user.login,
        role: user.role
      }
    })

    // Сохраняем токен в куки
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    })

    return response

  } catch (error) {
    console.error('Ошибка входа:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}