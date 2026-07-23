import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    jwt.verify(token, process.env.JWT_SECRET!)

    const result = await query(
      `SELECT qr.id, qr.room_number, qr.room_type, qr.session_id
       FROM quest_rooms qr
       JOIN quest_sessions qs ON qs.id = qr.session_id
       ORDER BY qr.session_id DESC, qr.room_number ASC`
    )

    return NextResponse.json({ rooms: result.rows })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}