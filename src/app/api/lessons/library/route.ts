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
    const subject = request.nextUrl.searchParams.get('subject')?.trim() || ''
    const gradeParam = request.nextUrl.searchParams.get('grade')?.trim() || ''
    const grade = gradeParam && Number.isInteger(Number(gradeParam)) ? Number(gradeParam) : null
    const sort = request.nextUrl.searchParams.get('sort') === 'likes' ? 'likes' : 'new'
    const orderBy = sort === 'likes' ? 'likes_count DESC, l.created_at DESC' : 'l.created_at DESC'

    const result = await query(
      `SELECT l.id, l.title, l.subject, l.grade, l.mode, l.created_at, u.full_name as author_name,
         l.library_description, l.moderation_status, l.moderation_reason,
         (l.teacher_id = $1) as is_own,
         (SELECT COUNT(*) FROM lesson_blocks lb WHERE lb.lesson_id = l.id) as block_count,
         COALESCE(lk.likes_count, 0)::int as likes_count,
         EXISTS(SELECT 1 FROM lesson_likes ml WHERE ml.lesson_id = l.id AND ml.teacher_id = $1) as liked_by_me
       FROM lessons l
       JOIN users u ON u.id = l.teacher_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) as likes_count FROM lesson_likes WHERE lesson_id = l.id
       ) lk ON true
       WHERE l.is_public = true AND l.status = 'published'
         AND (l.teacher_id = $1 OR l.moderation_status = 'approved')
         AND ($2 = '' OR l.title ILIKE '%' || $2 || '%' OR l.subject ILIKE '%' || $2 || '%' OR l.library_description ILIKE '%' || $2 || '%')
         AND ($3 = '' OR l.subject = $3)
         AND ($4::int IS NULL OR l.grade = $4::int)
       ORDER BY ${orderBy}
       LIMIT 100`,
      [decoded.id, q, subject, grade]
    )

    // Списки для выпадающих фильтров — по всей видимой библиотеке, без учёта
    // текущих q/subject/grade, иначе применённый фильтр сужал бы сам себя
    const facetsResult = await query(
      `SELECT DISTINCT subject, grade FROM lessons
       WHERE is_public = true AND status = 'published' AND (teacher_id = $1 OR moderation_status = 'approved')`,
      [decoded.id]
    )
    const subjects = Array.from(new Set(facetsResult.rows.map(r => r.subject).filter(Boolean))).sort()
    const grades = Array.from(new Set(facetsResult.rows.map(r => r.grade).filter((g): g is number => g != null))).sort((a, b) => a - b)

    return NextResponse.json({ lessons: result.rows, facets: { subjects, grades } })
  } catch (error) {
    console.error('Ошибка получения библиотеки уроков:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
