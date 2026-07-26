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
      `SELECT id, name, balance, created_at FROM families
       WHERE teacher_id = $1 ORDER BY name`,
      [decoded.id]
    )

    return NextResponse.json({ families: result.rows })
  } catch (error) {
    console.error('Ошибка получения семей:', error)
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

    const { name } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Введите название семьи' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO families (teacher_id, name) VALUES ($1, $2) RETURNING id, name, balance, created_at`,
      [decoded.id, name.trim()]
    )

    return NextResponse.json({ success: true, family: result.rows[0] })
  } catch (error) {
    console.error('Ошибка создания семьи:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
