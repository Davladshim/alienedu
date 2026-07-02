import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { player_id, room_id, answer } = await request.json()

    if (!player_id || !room_id || !answer) {
      return NextResponse.json({ error: 'Не все данные переданы' }, { status: 400 })
    }

    // Получаем правильный ответ
    const roomResult = await query(
      `SELECT key_answer, hint FROM quest_rooms WHERE id = $1`,
      [room_id]
    )

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: 'Комната не найдена' }, { status: 404 })
    }

    const correctAnswer = roomResult.rows[0].key_answer
    const hint = roomResult.rows[0].hint

    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

    // Записываем попытку
    await query(
      `INSERT INTO quest_progress (player_id, room_id, answer_given, is_correct, completed_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [player_id, room_id, answer, isCorrect, isCorrect ? new Date() : null]
    )

    return NextResponse.json({
      correct: isCorrect,
      hint: isCorrect ? null : hint
    })

  } catch (error) {
    console.error('Ошибка проверки ответа:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}