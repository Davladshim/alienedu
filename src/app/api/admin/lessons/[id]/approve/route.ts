import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get('platform_admin_session')
  return session?.value === process.env.ADMIN_SECRET
}

// Одобрить урок — становится виден в общей библиотеке всем репетиторам
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const { id } = await params
    await query(
      `UPDATE lessons SET moderation_status = 'approved', moderation_reason = NULL WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка одобрения урока:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
