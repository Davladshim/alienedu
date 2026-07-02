import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { player_id, room_id } = await request.json()

    if (!player_id || !room_id) {
      return NextResponse.json({ error: 'Не все данные переданы' }, { status: 400 })
    }

    // Проверяем что у игрока собран ключ
    const progressResult = await query(
      `SELECT COUNT(*) as pieces FROM quest_progress 
       WHERE player_id = $1 AND room_id = $2 AND is_correct = true`,
      [player_id, room_id]
    )

    if (parseInt(progressResult.rows[0].pieces) < 1) {
      return NextResponse.json({ error: 'Ключ ещё не собран' }, { status: 400 })
    }

    // Получаем текущую комнату чтобы узнать session_id и room_number
    const currentRoomResult = await query(
      `SELECT session_id, room_number, room_type FROM quest_rooms WHERE id = $1`,
      [room_id]
    )
    const currentRoom = currentRoomResult.rows[0]

    // Если совместная комната — проверяем что все остальные тоже готовы
    if (currentRoom.room_type !== 'solo') {
      const othersNotReady = await query(
        `SELECT COUNT(*) as count
         FROM quest_players qp
         WHERE qp.current_room_id = $1 
           AND qp.id != $2
           AND qp.is_excluded = false
           AND NOT EXISTS (
             SELECT 1 FROM quest_progress prog 
             WHERE prog.player_id = qp.id 
               AND prog.room_id = $1 
               AND prog.is_correct = true
           )`,
        [room_id, player_id]
      )

      if (parseInt(othersNotReady.rows[0].count) > 0) {
        return NextResponse.json({ error: 'Остальные ещё не готовы' }, { status: 400 })
      }
    }

    // Находим следующую комнату
    const nextRoomResult = await query(
      `SELECT id FROM quest_rooms 
       WHERE session_id = $1 AND room_number = $2
       ORDER BY room_number ASC LIMIT 1`,
      [currentRoom.session_id, currentRoom.room_number + 1]
    )

    const nextRoomId = nextRoomResult.rows.length > 0 ? nextRoomResult.rows[0].id : null

    // Обновляем текущую комнату игрока
    await query(
      `UPDATE quest_players SET current_room_id = $1 WHERE id = $2`,
      [nextRoomId, player_id]
    )

    if (!nextRoomId) {
      await query(
        `UPDATE quest_players SET status = 'finished' WHERE id = $1`,
        [player_id]
      )
    }

    return NextResponse.json({ success: true, next_room_id: nextRoomId })

  } catch (error) {
    console.error('Ошибка открытия двери:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}