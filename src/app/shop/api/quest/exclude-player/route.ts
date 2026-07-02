import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { player_id, session_id } = await request.json()

    // Исключаем игрока
    await query(
      `UPDATE quest_players 
       SET is_excluded = true, excluded_at = NOW(), status = 'finished'
       WHERE id = $1`,
      [player_id]
    )

    // Автоматически засчитываем его части во всех совместных комнатах
    const sharedRoomsResult = await query(
      `SELECT id FROM quest_rooms 
       WHERE session_id = $1 AND room_type != 'solo'`,
      [session_id]
    )

    for (const room of sharedRoomsResult.rows) {
      // Проверяем есть ли уже запись прогресса
      const existing = await query(
        `SELECT id FROM quest_progress 
         WHERE player_id = $1 AND room_id = $2`,
        [player_id, room.id]
      )

      if (existing.rows.length === 0) {
        // Создаём запись с засчитанным ответом
        await query(
          `INSERT INTO quest_progress 
            (player_id, room_id, answer_given, is_correct, completed_at)
           VALUES ($1, $2, '[исключён]', true, NOW())`,
          [player_id, room.id]
        )
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ошибка исключения игрока:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}