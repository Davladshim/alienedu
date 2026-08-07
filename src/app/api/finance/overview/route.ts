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

    await autoCompleteDueLessons({ teacherId: decoded.id })

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
    //  - "всего": вообще все занятия этого месяца, кроме пробных — независимо
    //    от статуса (прошедшие, ещё предстоящие и отменённые тоже)
    const monthStats = await query(
      `SELECT
         COUNT(*) FILTER (WHERE template_id IS NOT NULL AND status != 'cancelled') as template_count,
         COALESCE(SUM(price) FILTER (WHERE template_id IS NOT NULL AND status != 'cancelled'), 0) as template_money,
         COUNT(*) FILTER (WHERE template_id IS NULL AND status = 'completed' AND is_trial = false) as unplanned_count,
         COALESCE(SUM(price) FILTER (WHERE template_id IS NULL AND status = 'completed' AND is_trial = false), 0) as unplanned_money,
         COUNT(*) FILTER (WHERE template_id IS NOT NULL AND status = 'cancelled') as cancelled_count,
         COALESCE(SUM(price) FILTER (WHERE template_id IS NOT NULL AND status = 'cancelled'), 0) as cancelled_money,
         COUNT(*) FILTER (WHERE is_trial = false) as total_count,
         COALESCE(SUM(price) FILTER (WHERE is_trial = false), 0) as total_money
       FROM schedule_lessons
       WHERE teacher_id = $1
         AND date >= date_trunc('month', NOW())::date
         AND date < (date_trunc('month', NOW()) + interval '1 month')::date`,
      [decoded.id]
    )

    // "Напомнить об оплате" раньше строился на schedule_lessons.is_paid, но
    // этот флаг выставляется в true автоматически при списании урока (см.
    // autoCompleteDueLessons) независимо от того, ушёл ли ученик в минус —
    // is_paid здесь означает "списание обработано", а не "долгов нет". Из-за
    // этого список почти всегда был пуст, даже если у учеников реальный
    // долг. Показываем вместо этого настоящих должников — по актуальному
    // балансу (teacher_students.balance для учеников без семьи, и общий
    // net-баланс семьи — пул минус долги её учеников, см. Патч 7)
    const studentDebtors = await query(
      `SELECT ts.id AS teacher_student_id, COALESCE(ts.display_name, u.full_name) AS name, ts.balance
       FROM teacher_students ts
       JOIN users u ON u.id = ts.student_id
       WHERE ts.teacher_id = $1 AND ts.family_id IS NULL AND ts.archived_at IS NULL AND ts.balance < 0
       ORDER BY ts.balance ASC`,
      [decoded.id]
    )
    const familyDebtors = await query(
      `SELECT f.id AS family_id, f.name, f.balance + COALESCE(SUM(ts.balance), 0) AS balance
       FROM families f
       LEFT JOIN teacher_students ts ON ts.family_id = f.id
       WHERE f.teacher_id = $1
       GROUP BY f.id
       HAVING f.balance + COALESCE(SUM(ts.balance), 0) < 0
       ORDER BY 2 ASC`,
      [decoded.id]
    )
    const debtors = [
      ...studentDebtors.rows.map(r => ({ kind: 'student' as const, teacherStudentId: r.teacher_student_id, name: r.name, balance: Number(r.balance) })),
      ...familyDebtors.rows.map(r => ({ kind: 'family' as const, familyId: r.family_id, name: r.name, balance: Number(r.balance) })),
    ].sort((a, b) => a.balance - b.balance)
    const debtTotal = debtors.reduce((sum, d) => sum + d.balance, 0)

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
      debtors,
      debtTotal,
      totalBalance: Number(studentsBalance.rows[0].total) + Number(familyBalance.rows[0].total),
    })
  } catch (error) {
    console.error('Ошибка получения финансового обзора:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
