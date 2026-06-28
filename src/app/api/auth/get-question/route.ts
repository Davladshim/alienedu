import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const login = request.nextUrl.searchParams.get('login')

    if (!login) {
      return NextResponse.json(
        { error: 'Укажите логин' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT secret_question FROM users WHERE login = $1',
      [login]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      secret_question: result.rows[0].secret_question
    })

  } catch (error) {
    console.error('Ошибка:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}