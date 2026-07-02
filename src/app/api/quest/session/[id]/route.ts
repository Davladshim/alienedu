import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    const sessionResult = await query(
      `SELECT * FROM quest_sessions WHERE id = $1`,
      [sessionId]
    )

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 })
    }

    const roomsResult = await query(
      `SELECT * FROM quest_rooms WHERE session_id = $1 ORDER BY room_number`,
      [sessionId]
    )

    const playersResult = await query(
      `SELECT qp.*,
        json_agg(
          json_build_object(
            'room_id', prog.room_id,
            'is_correct', prog.is_correct,
            'bonus_completed', prog.bonus_completed
          )
        ) FILTER (WHERE prog.id IS NOT NULL) as progress
       FROM quest_players qp
       LEFT JOIN quest_progress prog ON prog.player_id = qp.id
       WHERE qp.session_id = $1
       GROUP BY qp.id
       ORDER BY qp.created_at`,
      [sessionId]
    )

    const codes = playersResult.rows.map(p => p.access_code)

    return NextResponse.json({
      session: sessionResult.rows[0],
      rooms: roomsResult.rows,
      players: playersResult.rows,
      codes
    })

  } catch (error) {
    console.error('Ошибка получения сессии:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}