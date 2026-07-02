import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const teacherId = decoded.id

    const { title, rooms, player_count } = await request.json()

    if (!title || !rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }

    // Создаём сессию квеста
    const sessionResult = await query(
      `INSERT INTO quest_sessions (teacher_id, title, player_count, status)
       VALUES ($1, $2, $3, 'waiting')
       RETURNING id`,
      [teacherId, title, player_count || 10]
    )
    const sessionId = sessionResult.rows[0].id

    // Создаём комнаты
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i]
      await query(
        `INSERT INTO quest_rooms 
          (session_id, room_number, room_type, max_players, hint, key_task, key_answer, bonus_tasks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          sessionId, i + 1, room.room_type,
          room.room_type === 'solo' ? 1 : (player_count || 10),
          room.hint || '', room.key_task, room.key_answer,
          JSON.stringify(room.bonus_tasks || [])
        ]
      )
    }

    // Генерируем коды доступа для учеников
    const count = player_count || 10
    const codes = []
    for (let i = 0; i < count; i++) {
      const code = generateCode()
      await query(
        `INSERT INTO quest_players (session_id, access_code, status)
         VALUES ($1, $2, 'waiting')`,
        [sessionId, code]
      )
      codes.push(code)
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      codes
    })

  } catch (error) {
    console.error('Ошибка создания квеста:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}