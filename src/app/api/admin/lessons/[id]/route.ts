import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get('platform_admin_session')
  return session?.value === process.env.ADMIN_SECRET
}

// Полное удаление любого урока — на случай жалобы на неприемлемое
// содержимое. В отличие от "убрать из библиотеки" у автора (снимает
// только is_public), это удаляет урок целиком, вместе со всеми блоками,
// назначениями и попытками учеников (каскад в схеме БД)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const { id } = await params
    await query(`DELETE FROM lessons WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления урока администратором:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
