import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { getTeacherLimits } from '@/lib/plan'
import { archiveStudentsExcept } from '@/lib/planDowngrade'

// Репетитор выбрал, кто из учеников остаётся активным после того, как
// истёкшая Pro-подписка вернула его на Free с числом учеников больше
// лимита — остальные архивируются (см. archiveStudentsExcept)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { keepIds } = await request.json()
    if (!Array.isArray(keepIds) || keepIds.length === 0 || !keepIds.every(id => Number.isInteger(id))) {
      return NextResponse.json({ error: 'Выберите хотя бы одного ученика' }, { status: 400 })
    }

    const limits = await getTeacherLimits(decoded.id)
    if (keepIds.length > limits.maxStudents) {
      return NextResponse.json({ error: `На бесплатном тарифе можно оставить не больше ${limits.maxStudents} учеников` }, { status: 400 })
    }

    const owned = await query(
      `SELECT id FROM teacher_students WHERE teacher_id = $1 AND id = ANY($2::int[]) AND archived_at IS NULL`,
      [decoded.id, keepIds]
    )
    if (owned.rows.length !== keepIds.length) {
      return NextResponse.json({ error: 'Некоторые ученики не найдены' }, { status: 400 })
    }

    await archiveStudentsExcept(decoded.id, keepIds)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка архивации учеников:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
