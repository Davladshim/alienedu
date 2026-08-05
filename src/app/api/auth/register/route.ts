import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { MIN_STUDENT_SELF_REGISTER_AGE, calculateAge } from '@/lib/ageGate'

export async function POST(request: NextRequest) {
  try {
    const { full_name, login, code, secret_question, secret_answer, role, grade, birth_date, agree_terms } = await request.json()

    if (!full_name || !login || !code || !secret_question || !secret_answer) {
      return NextResponse.json(
        { error: 'Заполните все поля' },
        { status: 400 }
      )
    }

    if (!agree_terms) {
      return NextResponse.json(
        { error: 'Нужно согласиться с условиями использования и политикой конфиденциальности' },
        { status: 400 }
      )
    }

    const userRole = role === 'teacher' ? 'teacher' : role === 'parent' ? 'parent' : 'student'
    if (userRole === 'student' && !grade) {
      return NextResponse.json(
        { error: 'Выберите класс' },
        { status: 400 }
      )
    }

    if (userRole === 'student') {
      if (!birth_date) {
        return NextResponse.json(
          { error: 'Укажите дату рождения' },
          { status: 400 }
        )
      }
      const age = calculateAge(birth_date)
      if (Number.isNaN(age) || age < 0 || age > 120) {
        return NextResponse.json(
          { error: 'Проверьте дату рождения' },
          { status: 400 }
        )
      }
      // Несовершеннолетний младше порога не может пройти регистрацию сам —
      // аккаунт для него должен завести родитель из своего кабинета (роль
      // "Родитель"), где ребёнок не проходит самостоятельную регистрацию вообще
      if (age < MIN_STUDENT_SELF_REGISTER_AGE) {
        return NextResponse.json(
          { error: `Самостоятельная регистрация доступна с ${MIN_STUDENT_SELF_REGISTER_AGE} лет. Если тебе меньше — попроси родителя зарегистрироваться на платформе как «Родитель» и завести тебе аккаунт из своего кабинета.` },
          { status: 403 }
        )
      }
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

    const result = await query(
      `INSERT INTO users
        (full_name, login, code_hash, role, secret_question, secret_answer_hash, grade, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, full_name, login, role`,
      [
        full_name, login, code_hash, userRole, secret_question, secret_answer_hash,
        userRole === 'student' ? Number(grade) : null,
        userRole === 'student' ? birth_date : null,
      ]
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
