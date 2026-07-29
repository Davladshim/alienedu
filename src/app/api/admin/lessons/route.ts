import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get('platform_admin_session')
  return session?.value === process.env.ADMIN_SECRET
}

// Модерация библиотеки — все опубликованные в библиотеку уроки, для
// разбора жалоб на неприемлемое содержимое
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const result = await query(
      `SELECT l.id, l.title, l.subject, l.grade, l.mode, l.created_at, u.full_name as author_name,
         (SELECT COUNT(*) FROM lesson_blocks lb WHERE lb.lesson_id = l.id) as block_count
       FROM lessons l
       JOIN users u ON u.id = l.teacher_id
       WHERE l.is_public = true AND l.status = 'published'
       ORDER BY l.created_at DESC
       LIMIT 200`
    )
    return NextResponse.json({ lessons: result.rows })
  } catch (error) {
    console.error('Ошибка получения библиотеки для модерации:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
