import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Библиотека готовых уроков — то, что репетиторы опубликовали
// (lessons.is_public = true), доступно для поиска и копирования себе.
// Собственные опубликованные уроки тоже показываем (с флагом is_own) —
// иначе автор не может увидеть и убрать свой урок из библиотеки
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const q = request.nextUrl.searchParams.get('q')?.trim() || ''

    const result = await query(
      `SELECT l.id, l.title, l.subject, l.grade, l.mode, l.created_at, u.full_name as author_name,
         l.library_description,
         (l.teacher_id = $1) as is_own,
         (SELECT COUNT(*) FROM lesson_blocks lb WHERE lb.lesson_id = l.id) as block_count
       FROM lessons l
       JOIN users u ON u.id = l.teacher_id
       WHERE l.is_public = true AND l.status = 'published'
         AND ($2 = '' OR l.title ILIKE '%' || $2 || '%' OR l.subject ILIKE '%' || $2 || '%')
       ORDER BY l.created_at DESC
       LIMIT 100`,
      [decoded.id, q]
    )

    return NextResponse.json({ lessons: result.rows })
  } catch (error) {
    console.error('Ошибка получения библиотеки уроков:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
