import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { archiveLessonsExcept } from '@/lib/planDowngrade'

// Репетитор выбрал, какой из своих уроков оставить активным после того,
// как истёкшая Pro-подписка вернула его на Free с числом уроков больше
// лимита — остальные архивируются (кроме уже одобренных в библиотеке —
// те не архивируются вовсе, см. archiveLessonsExcept)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { keepId } = await request.json()
    if (!Number.isInteger(keepId)) {
      return NextResponse.json({ error: 'Выберите урок' }, { status: 400 })
    }

    const owned = await query(
      `SELECT id FROM lessons WHERE id = $1 AND teacher_id = $2 AND archived_at IS NULL AND locked = false`,
      [keepId, decoded.id]
    )
    if (owned.rows.length === 0) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 400 })
    }

    await archiveLessonsExcept(decoded.id, keepId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка архивации уроков:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
