import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { player_id, room_id, bonus_index, answer } = await request.json()

    if (!player_id || !room_id || answer === undefined) {
      return NextResponse.json({ error: 'Не все данные переданы' }, { status: 400 })
    }

    const roomResult = await query(
      `SELECT bonus_tasks FROM quest_rooms WHERE id = $1`,
      [room_id]
    )

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: 'Комната не найдена' }, { status: 404 })
    }

    const bonusTasks = roomResult.rows[0].bonus_tasks || []
    const task = bonusTasks[bonus_index]

    if (!task) {
      return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
    }

    const isCorrect = answer.toLowerCase().trim() === task.answer.toLowerCase().trim()

    if (isCorrect) {
      // Получаем текущий прогресс и добавляем выполненное бонусное задание
      const progressResult = await query(
        `SELECT id, bonus_completed FROM quest_progress 
         WHERE player_id = $1 AND room_id = $2 AND is_correct = true
         ORDER BY created_at DESC LIMIT 1`,
        [player_id, room_id]
      )

      if (progressResult.rows.length > 0) {
        const current = progressResult.rows[0].bonus_completed || []
        const updated = [...current, bonus_index]
        await query(
          `UPDATE quest_progress SET bonus_completed = $1 WHERE id = $2`,
          [JSON.stringify(updated), progressResult.rows[0].id]
        )
      }
    }

    return NextResponse.json({
      correct: isCorrect,
      hint: isCorrect ? null : task.hint
    })

  } catch (error) {
    console.error('Ошибка бонусного задания:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}