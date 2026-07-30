import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { settleFamilyDebts, reconcileNegativeFamilyBalance } from '@/lib/familyBalance'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Подчищаем случаи, когда в пуле уже лежат деньги, а личный долг ученика
    // ещё не погашен (например, пополнение случилось раньше, чем появился
    // этот автоматический перерасчёт) — чтобы не зависало до следующего платежа
    const familiesWithPool = await query(
      `SELECT id FROM families WHERE teacher_id = $1 AND balance > 0`,
      [decoded.id]
    )
    for (const family of familiesWithPool.rows) {
      await settleFamilyDebts(family.id)
    }

    // Разовое исправление: у семьи не должно быть отрицательного баланса
    // (это всегда пул ещё не распределённых денег, >= 0) — если ушёл в минус
    // из-за старого сбоя, забираем недостачу обратно у переплативших учеников
    const familiesInDebt = await query(
      `SELECT id FROM families WHERE teacher_id = $1 AND balance < 0`,
      [decoded.id]
    )
    for (const family of familiesInDebt.rows) {
      await reconcileNegativeFamilyBalance(family.id)
    }

    // Баланс семьи — реальный пул ещё не распределённых денег (families.balance,
    // всегда >= 0). Долги за проведённые занятия — отдельно, у каждого ученика лично
    const result = await query(
      `SELECT f.id, f.name, f.created_at, f.balance,
         COALESCE(AVG(ts.lesson_price) FILTER (WHERE ts.lesson_price IS NOT NULL), 0) as avg_lesson_price
       FROM families f
       LEFT JOIN teacher_students ts ON ts.family_id = f.id
       WHERE f.teacher_id = $1
       GROUP BY f.id
       ORDER BY f.name`,
      [decoded.id]
    )

    return NextResponse.json({ families: result.rows })
  } catch (error) {
    console.error('Ошибка получения семей:', error)
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

    const { name } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Введите название семьи' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO families (teacher_id, name) VALUES ($1, $2) RETURNING id, name, balance, created_at`,
      [decoded.id, name.trim()]
    )

    return NextResponse.json({ success: true, family: result.rows[0] })
  } catch (error) {
    console.error('Ошибка создания семьи:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
