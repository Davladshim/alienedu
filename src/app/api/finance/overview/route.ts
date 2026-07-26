import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const monthPayments = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE teacher_id = $1
         AND payment_date >= date_trunc('month', NOW())
         AND payment_date < date_trunc('month', NOW()) + interval '1 month'`,
      [decoded.id]
    )

    const monthCompleted = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as count,
         COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0) as total,
         COUNT(*) FILTER (WHERE template_id IS NOT NULL) as planned_count,
         COUNT(*) FILTER (WHERE status = 'completed' AND template_id IS NULL) as unplanned_completed_count
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

    const personalBalance = await query(
      `SELECT COALESCE(SUM(balance), 0) as total FROM teacher_students WHERE teacher_id = $1 AND family_id IS NULL`,
      [decoded.id]
    )
    const familyBalance = await query(
      `SELECT COALESCE(SUM(balance), 0) as total FROM families WHERE teacher_id = $1`,
      [decoded.id]
    )

    return NextResponse.json({
      monthIncome: monthPayments.rows[0].total,
      monthCompletedCount: monthCompleted.rows[0].count,
      monthCompletedTotal: monthCompleted.rows[0].total,
      monthPlannedCount: monthCompleted.rows[0].planned_count,
      monthUnplannedCompletedCount: monthCompleted.rows[0].unplanned_completed_count,
      unpaidLessons: unpaid.rows,
      unpaidTotal: unpaid.rows.reduce((sum, r) => sum + Number(r.price || 0), 0),
      totalBalance: Number(personalBalance.rows[0].total) + Number(familyBalance.rows[0].total),
    })
  } catch (error) {
    console.error('Ошибка получения финансового обзора:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
