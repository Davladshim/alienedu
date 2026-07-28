import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { isValidTimezone } from '@/lib/timezone'

// Обновление часового пояса текущего пользователя — вызывается автоматически
// при определении пояса браузера, либо вручную из выпадающего списка в шапке
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { timezone } = await request.json()
    if (!timezone || typeof timezone !== 'string' || !isValidTimezone(timezone)) {
      return NextResponse.json({ error: 'Некорректный часовой пояс' }, { status: 400 })
    }

    await query(`UPDATE users SET timezone = $1 WHERE id = $2`, [timezone, decoded.id])

    return NextResponse.json({ success: true, timezone })
  } catch (error) {
    console.error('Ошибка обновления часового пояса:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
