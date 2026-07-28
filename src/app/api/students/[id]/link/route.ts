import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Привязка карточки-заглушки (незарегистрированный ученик) к реальному
// аккаунту, который ученик завёл сам. Переносит всю историю (расписание,
// шаблоны, назначенные уроки, попытки решения) с заглушки на реальный id
// и удаляет саму заглушку.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id } = await params

    const { login } = await request.json()
    if (!login || !login.trim()) {
      return NextResponse.json({ error: 'Введите логин ученика' }, { status: 400 })
    }

    const rosterResult = await query(`SELECT * FROM teacher_students WHERE id = $1`, [id])
    if (rosterResult.rows.length === 0) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    const roster = rosterResult.rows[0]
    if (roster.teacher_id !== decoded.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const placeholderId = roster.student_id
    const placeholderResult = await query(`SELECT * FROM users WHERE id = $1`, [placeholderId])
    if (placeholderResult.rows.length === 0 || !placeholderResult.rows[0].is_placeholder) {
      return NextResponse.json({ error: 'Этот ученик уже привязан к реальному аккаунту' }, { status: 400 })
    }

    const realResult = await query(
      `SELECT id, full_name, login, role, is_placeholder, grade FROM users WHERE login = $1`,
      [login.trim()]
    )
    if (realResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ученик с таким логином не найден' }, { status: 404 })
    }
    const real = realResult.rows[0]
    if (real.is_placeholder) {
      return NextResponse.json({ error: 'Этот логин тоже принадлежит незарегистрированной карточке' }, { status: 400 })
    }
    if (real.role !== 'student') {
      return NextResponse.json({ error: 'Этот логин принадлежит не ученику' }, { status: 400 })
    }

    const alreadyInRoster = await query(
      `SELECT id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2`,
      [decoded.id, real.id]
    )
    if (alreadyInRoster.rows.length > 0) {
      return NextResponse.json({ error: 'Этот ученик уже есть в списке отдельной карточкой' }, { status: 400 })
    }

    // Переносим историю с заглушки на реальный аккаунт
    await query(
      `UPDATE schedule_lessons SET student_id = $1 WHERE student_id = $2 AND teacher_id = $3`,
      [real.id, placeholderId, decoded.id]
    )
    await query(
      `UPDATE lesson_templates SET student_id = $1 WHERE student_id = $2 AND teacher_id = $3`,
      [real.id, placeholderId, decoded.id]
    )
    // lesson_assignments: сначала убираем дубли (лишний урок уже мог быть
    // назначен реальному аккаунту напрямую), потом переносим остальное
    await query(
      `DELETE FROM lesson_assignments
       WHERE student_id = $1
         AND lesson_id IN (SELECT lesson_id FROM lesson_assignments WHERE student_id = $2)`,
      [placeholderId, real.id]
    )
    await query(
      `UPDATE lesson_assignments SET student_id = $1 WHERE student_id = $2`,
      [real.id, placeholderId]
    )
    await query(
      `UPDATE lesson_attempts SET student_id = $1 WHERE student_id = $2`,
      [real.id, placeholderId]
    )

    // Класс подтягиваем из профиля привязываемого аккаунта, только если в
    // карточке он ещё не был указан репетитором вручную
    await query(
      `UPDATE teacher_students SET student_id = $1, grade = COALESCE(grade, $2) WHERE id = $3`,
      [real.id, real.grade ?? null, id]
    )
    await query(`DELETE FROM users WHERE id = $1`, [placeholderId])

    return NextResponse.json({
      success: true,
      student: { id: Number(id), student_id: real.id, full_name: real.full_name, login: real.login, is_placeholder: false },
    })
  } catch (error) {
    console.error('Ошибка привязки ученика:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
