import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get('platform_admin_session')
  return session?.value === process.env.ADMIN_SECRET
}

// Отклонить урок с указанием причины — не появляется в библиотеке, но
// автор сохраняет доступ к редактированию и может исправить и отправить
// на повторную модерацию (см. PUT /api/lessons/[id])
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const { id } = await params
    const { reason } = await req.json()
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Укажите причину отклонения' }, { status: 400 })
    }
    await query(
      `UPDATE lessons SET moderation_status = 'rejected', moderation_reason = $1 WHERE id = $2`,
      [reason.trim(), id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка отклонения урока:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
