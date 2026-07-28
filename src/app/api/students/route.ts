import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { query } from '@/lib/db'
import { getTeacherLimits } from '@/lib/plan'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const result = await query(
      `SELECT ts.id, u.id as student_id, u.full_name, u.login, u.is_placeholder, ts.created_at,
         ts.lesson_price, ts.grade, ts.parent_name, ts.family_id, f.name as family_name,
         ts.balance as balance,
         COALESCE(prog.assigned_count, 0) as assigned_count,
         COALESCE(prog.completed_count, 0) as completed_count
       FROM teacher_students ts
       JOIN users u ON u.id = ts.student_id
       LEFT JOIN families f ON f.id = ts.family_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) as assigned_count,
           COUNT(*) FILTER (WHERE total_blocks > 0 AND answered_blocks >= total_blocks) as completed_count
         FROM (
           SELECT
             (SELECT COUNT(*) FROM lesson_blocks lb WHERE lb.lesson_id = l.id) as total_blocks,
             (SELECT COUNT(DISTINCT block_id) FROM lesson_attempts att
               WHERE att.lesson_id = l.id AND att.student_id = ts.student_id) as answered_blocks
           FROM lesson_assignments la
           JOIN lessons l ON l.id = la.lesson_id AND l.status = 'published'
           WHERE la.student_id = ts.student_id
         ) per_lesson
       ) prog ON true
       WHERE ts.teacher_id = $1
       ORDER BY u.full_name`,
      [decoded.id]
    )

    return NextResponse.json({ students: result.rows })
  } catch (error) {
    console.error('Ошибка получения учеников:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const limits = await getTeacherLimits(decoded.id)
    const countResult = await query(`SELECT COUNT(*) FROM teacher_students WHERE teacher_id = $1`, [decoded.id])
    if (Number(countResult.rows[0].count) >= limits.maxStudents) {
      return NextResponse.json({
        error: `На бесплатном тарифе доступно не больше ${limits.maxStudents} учеников. Чтобы добавить больше — перейдите на тариф Pro`,
      }, { status: 403 })
    }

    const { login, full_name } = await request.json()

    let student: { id: number; full_name: string; login: string; is_placeholder?: boolean }

    if (full_name && full_name.trim()) {
      // Ученик ещё не зарегистрирован — заводим карточку-заглушку,
      // которую можно будет привязать к реальному аккаунту позже
      const placeholderLogin = `_placeholder_${crypto.randomBytes(12).toString('hex')}`
      const placeholderCode = crypto.randomBytes(24).toString('hex')
      const codeHash = await bcrypt.hash(placeholderCode, 10)

      const created = await query(
        `INSERT INTO users (full_name, login, code_hash, role, is_placeholder)
         VALUES ($1, $2, $3, 'student', true)
         RETURNING id, full_name, login, is_placeholder`,
        [full_name.trim(), placeholderLogin, codeHash]
      )
      student = created.rows[0]
    } else if (login && login.trim()) {
      const userResult = await query(
        `SELECT id, full_name, login, role FROM users WHERE login = $1`,
        [login.trim()]
      )
      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Ученик с таким логином не найден' }, { status: 404 })
      }
      const found = userResult.rows[0]
      if (found.role !== 'student') {
        return NextResponse.json({ error: 'Этот логин принадлежит не ученику' }, { status: 400 })
      }
      if (found.id === decoded.id) {
        return NextResponse.json({ error: 'Нельзя добавить самого себя' }, { status: 400 })
      }
      student = found
    } else {
      return NextResponse.json({ error: 'Введите логин ученика или имя' }, { status: 400 })
    }

    const existing = await query(
      `SELECT id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2`,
      [decoded.id, student.id]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Этот ученик уже в списке' }, { status: 400 })
    }

    const insertResult = await query(
      `INSERT INTO teacher_students (teacher_id, student_id) VALUES ($1, $2) RETURNING id`,
      [decoded.id, student.id]
    )

    return NextResponse.json({
      success: true,
      student: {
        id: insertResult.rows[0].id,
        student_id: student.id,
        full_name: student.full_name,
        login: student.login,
        is_placeholder: !!student.is_placeholder,
      },
    })
  } catch (error) {
    console.error('Ошибка добавления ученика:', error)
    // Временная диагностика: показываем текст реальной ошибки, чтобы понять,
    // почему это падает на проде (убрать после того как разберёмся)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Ошибка сервера', detail }, { status: 500 })
  }
}
