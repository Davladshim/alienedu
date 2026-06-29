import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { code, name } = await request.json()

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Введи код и имя' },
        { status: 400 }
      )
    }

    // Ищем игрока по коду
    const playerResult = await query(
      `SELECT qp.*, qs.status as session_status, qs.id as sess_id
       FROM quest_players qp
       JOIN quest_sessions qs ON qp.session_id = qs.id
       WHERE qp.access_code = $1`,
      [code]
    )

    if (playerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Неверный код. Проверь и попробуй снова' },
        { status: 404 }
      )
    }

    const player = playerResult.rows[0]

    // Проверяем что игрок не исключён
    if (player.is_excluded) {
      return NextResponse.json(
        { error: 'Этот код больше недействителен' },
        { status: 403 }
      )
    }

    // Проверяем что сессия активна или в ожидании
    if (player.session_status === 'finished') {
      return NextResponse.json(
        { error: 'Этот квест уже завершён' },
        { status: 403 }
      )
    }

    // Обновляем имя игрока и время входа (если первый раз)
    if (!player.joined_at) {
      await query(
        `UPDATE quest_players 
         SET player_name = $1, joined_at = NOW(), status = 'playing'
         WHERE id = $2`,
        [name, player.id]
      )
    } else {
      // Повторный вход — просто обновляем имя если изменилось
      await query(
        `UPDATE quest_players SET player_name = $1 WHERE id = $2`,
        [name, player.id]
      )
    }

    return NextResponse.json({
      success: true,
      player_id: player.id,
      session_id: player.sess_id,
      current_room_id: player.current_room_id,
      player_name: name
    })

  } catch (error) {
    console.error('Ошибка входа в квест:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}