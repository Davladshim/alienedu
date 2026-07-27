import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { autoCompleteDueLessons } from '@/lib/scheduleAutoComplete'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    await autoCompleteDueLessons()

    const monthPayments = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE teacher_id = $1
         AND payment_date >= date_trunc('month', NOW())
         AND payment_date < date_trunc('month', NOW()) + interval '1 month'`,
      [decoded.id]
    )

    // Уроки этого месяца, кроме пробных, по 4 категориям — и уроки, и деньги
    // считаются одним и тем же фильтром, только COUNT vs SUM(price):
    //  - "по шаблону": сгенерированы из шаблона недели (template_id задан)
    //    и не отменены — включает как уже проведённые, так и ещё предстоящие
    //    в этом месяце (сколько всего запланировано)
    //  - "внеплановые": не из шаблона (template_id NULL) и уже проведены —
    //    перенос шаблонного урока остаётся шаблонным (template_id не трогается
    //    при переносе), поэтому сюда попадают только реально добавленные
    //    внепланово уроки
    //  - "отмены": из шаблона, но отменены (перенос тоже остаётся "из шаблона")
    //  - "всего": все проведённые в этом месяце, кроме пробных
    const monthStats = await query(
      `SELECT
         COUNT(*) FILTER (WHERE template_id IS NOT NULL AND status != 'cancelled') as template_count,
         COALESCE(SUM(price) FILTER (WHERE template_id IS NOT NULL AND status != 'cancelled'), 0) as template_money,
         COUNT(*) FILTER (WHERE template_id IS NULL AND status = 'completed' AND is_trial = false) as unplanned_count,
         COALESCE(SUM(price) FILTER (WHERE template_id IS NULL AND status = 'completed' AND is_trial = false), 0) as unplanned_money,
         COUNT(*) FILTER (WHERE template_id IS NOT NULL AND status = 'cancelled') as cancelled_count,
         COALESCE(SUM(price) FILTER (WHERE template_id IS NOT NULL AND status = 'cancelled'), 0) as cancelled_money,
         COUNT(*) FILTER (WHERE status = 'completed' AND is_trial = false) as total_count,
         COALESCE(SUM(price) FILTER (WHERE status = 'completed' AND is_trial = false), 0) as total_money
       FROM schedule_lessons
       WHERE teacher_id = $1
         AND date >= date_trunc('month', NOW())::date
         AND date < (date_trunc('month', NOW()) + interval '1 month')::date`,
      [decoded.id]
    )

    const unpaid = await query(
      `SELECT sl.id, sl.date, sl.time, sl.price, u.full_name as student_name
       FROM schedule_lessons sl
       JOIN users u ON u.id = sl.student_id
       WHERE sl.teacher_id = $1 AND sl.status = 'completed' AND sl.is_paid = false AND sl.price IS NOT NULL
       ORDER BY sl.date`,
      [decoded.id]
    )

    // Личный баланс учеников без семьи (может быть и +, и -) + долги учеников
    // в семьях (только <= 0) + общий пул семей (только >= 0)
    const studentsBalance = await query(
      `SELECT COALESCE(SUM(balance), 0) as total FROM teacher_students WHERE teacher_id = $1`,
      [decoded.id]
    )
    const familyBalance = await query(
      `SELECT COALESCE(SUM(balance), 0) as total FROM families WHERE teacher_id = $1`,
      [decoded.id]
    )

    const s = monthStats.rows[0]

    return NextResponse.json({
      monthIncome: monthPayments.rows[0].total,
      lessonStats: {
        templateCount: s.template_count,
        unplannedCount: s.unplanned_count,
        cancelledCount: s.cancelled_count,
        totalCount: s.total_count,
      },
      moneyStats: {
        templateMoney: s.template_money,
        unplannedMoney: s.unplanned_money,
        cancelledMoney: s.cancelled_money,
        totalMoney: s.total_money,
      },
      unpaidLessons: unpaid.rows,
      unpaidTotal: unpaid.rows.reduce((sum, r) => sum + Number(r.price || 0), 0),
      totalBalance: Number(studentsBalance.rows[0].total) + Number(familyBalance.rows[0].total),
    })
  } catch (error) {
    console.error('Ошибка получения финансового обзора:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
