import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Убрать СВОЙ урок из библиотеки — просто снимает публикацию (is_public),
// сам урок и его назначения ученикам остаются нетронутыми
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id: lessonId } = await params

    const owner = await query(`SELECT teacher_id FROM lessons WHERE id = $1`, [lessonId])
    if (owner.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })
    }
    if (owner.rows[0].teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Убрать из библиотеки может только автор' }, { status: 403 })
    }

    await query(`UPDATE lessons SET is_public = false WHERE id = $1`, [lessonId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления урока из библиотеки:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
