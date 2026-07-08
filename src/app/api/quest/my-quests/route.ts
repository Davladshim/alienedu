import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const teacherId = decoded.id

    const result = await query(
      `SELECT id, title, status, player_count, created_at, finished_at
       FROM quest_sessions
       WHERE teacher_id = $1
       ORDER BY created_at DESC`,
      [teacherId]
    )

    return NextResponse.json({ quests: result.rows })
  } catch (error) {
    console.error('my-quests error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}