import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const player_id = request.nextUrl.searchParams.get('player_id')

    if (!player_id) {
      return NextResponse.json({ error: 'Не указан player_id' }, { status: 400 })
    }

    // Получаем игрока и его текущую комнату
    const playerResult = await query(
      `SELECT qp.*, qr.id as room_id, qr.room_number, qr.room_type,
              qr.hint, qr.key_task, qr.key_answer, qr.max_players,
              qr.bonus_tasks, qr.session_id as room_session_id
       FROM quest_players qp
       LEFT JOIN quest_rooms qr ON qp.current_room_id = qr.id
       WHERE qp.id = $1`,
      [player_id]
    )

    if (playerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Игрок не найден' }, { status: 404 })
    }

    const player = playerResult.rows[0]

    // Если нет текущей комнаты — ищем первую комнату сессии
    let room = null
    if (!player.current_room_id) {
      const firstRoomResult = await query(
        `SELECT * FROM quest_rooms 
         WHERE session_id = $1 
         ORDER BY room_number ASC LIMIT 1`,
        [player.session_id]
      )

      if (firstRoomResult.rows.length > 0) {
        room = firstRoomResult.rows[0]
        // Назначаем первую комнату игроку
        await query(
          `UPDATE quest_players SET current_room_id = $1 WHERE id = $2`,
          [room.id, player_id]
        )
      }
    } else {
      room = {
        id: player.room_id,
        room_number: player.room_number,
        room_type: player.room_type,
        hint: player.hint,
        key_task: player.key_task,
        key_answer: player.key_answer,
        max_players: player.max_players,
        bonus_tasks: player.bonus_tasks,
        session_id: player.room_session_id
      }
    }

    if (!room) {
      return NextResponse.json({ room: null }) // квест пройден
    }

    // Считаем кусочки ключа — сколько правильных ответов у игрока в этой комнате
    const progressResult = await query(
      `SELECT COUNT(*) as pieces
       FROM quest_progress
       WHERE player_id = $1 AND room_id = $2 AND is_correct = true`,
      [player_id, room.id]
    )
    const piecesCollected = parseInt(progressResult.rows[0].pieces)

    // Считаем сколько всего заданий в комнате (= total pieces)
    // Пока одно задание = один кусочек
    const totalPieces = 1

    // Если комната совместная — проверяем кто ещё не собрал ключ
    let waitingFor: string[] = []
    if (room.room_type !== 'solo') {
      const roomPlayersResult = await query(
        `SELECT qp.player_name, 
                COUNT(prog.id) FILTER (WHERE prog.is_correct = true) as pieces
         FROM quest_players qp
         LEFT JOIN quest_progress prog ON prog.player_id = qp.id 
              AND prog.room_id = $1
         WHERE qp.current_room_id = $1 
           AND qp.id != $2
           AND qp.is_excluded = false
         GROUP BY qp.id, qp.player_name`,
        [room.id, player_id]
      )

      waitingFor = roomPlayersResult.rows
        .filter(p => parseInt(p.pieces) < 1)
        .map(p => p.player_name || 'Игрок')
    }

    return NextResponse.json({
      room,
      pieces_collected: piecesCollected,
      total_pieces: totalPieces,
      waiting_for: waitingFor
    })

  } catch (error) {
    console.error('Ошибка получения комнаты:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}