import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { getTeacherPlan } from '@/lib/plan'

// Лёгкий "кто я" эндпоинт — используется в шапке личного кабинета
// (виджет тарифа/ввода кода) на любой странице, без похода за полными
// данными урока/расписания и т.п.
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const result = await query(`SELECT id, full_name, role, grade, timezone FROM users WHERE id = $1`, [decoded.id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Не найден' }, { status: 404 })
    }
    const user = result.rows[0]
    const plan = user.role === 'teacher' ? await getTeacherPlan(user.id) : 'free'

    return NextResponse.json({
      id: user.id, full_name: user.full_name, role: user.role, plan,
      grade: user.grade, timezone: user.timezone,
    })
  } catch (error) {
    console.error('Ошибка получения текущего пользователя:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
