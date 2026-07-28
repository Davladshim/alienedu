import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

// Активация кода перехода на платный тариф — доступно только репетиторам,
// код привязывается к аккаунту при первом вводе (тот же принцип, что и у
// access_codes/stereo_access_codes, см. verify-code-shop)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const userResult = await query(`SELECT role FROM users WHERE id = $1`, [decoded.id])
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'teacher') {
      return NextResponse.json({ error: 'Тарифы доступны только репетиторам' }, { status: 403 })
    }

    const { code } = await request.json()
    if (!code || typeof code !== 'string' || code.trim().length < 4) {
      return NextResponse.json({ error: 'Введите код' }, { status: 400 })
    }
    const cleanCode = code.trim().toUpperCase()

    const codeResult = await query(`SELECT * FROM plan_codes WHERE code = $1 AND status = 'active'`, [cleanCode])
    if (codeResult.rows.length === 0) {
      await new Promise(r => setTimeout(r, 500))
      return NextResponse.json({ error: 'Код не найден или уже недействителен' }, { status: 403 })
    }
    const planCode = codeResult.rows[0]

    let firstUsedAt: Date = planCode.first_used_at ? new Date(planCode.first_used_at) : new Date()
    if (planCode.first_used_at) {
      const expiresAt = new Date(firstUsedAt.getTime() + planCode.valid_days * 24 * 60 * 60 * 1000)
      if (new Date() > expiresAt) {
        return NextResponse.json({ error: 'Срок действия кода истёк' }, { status: 403 })
      }
    } else {
      await query(
        `UPDATE plan_codes SET first_used_at = NOW(), user_id = $1 WHERE code = $2`,
        [decoded.id, cleanCode]
      )
      firstUsedAt = new Date()
    }

    const expiresAt = new Date(firstUsedAt.getTime() + planCode.valid_days * 24 * 60 * 60 * 1000)
    await query(
      `UPDATE users SET plan = $1, plan_expires_at = $2 WHERE id = $3`,
      [planCode.plan, expiresAt, decoded.id]
    )

    return NextResponse.json({ success: true, plan: planCode.plan, expires_at: expiresAt })
  } catch (error) {
    console.error('Ошибка активации кода тарифа:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
