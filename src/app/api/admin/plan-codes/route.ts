import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { query } from '@/lib/db'

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get('platform_admin_session')
  return session?.value === process.env.ADMIN_SECRET
}

function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-')
}

const ALLOWED_PLANS = ['pro']
const ALLOWED_DURATIONS = [30, 365]

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const result = await query(
      `SELECT id, code, plan, status, first_used_at, valid_days, created_at
       FROM plan_codes ORDER BY created_at DESC LIMIT 200`
    )
    return NextResponse.json({ codes: result.rows })
  } catch (error) {
    console.error('Ошибка получения кодов тарифа:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const { plan, validDays } = await req.json()
    if (!ALLOWED_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Некорректный тариф' }, { status: 400 })
    }
    if (!ALLOWED_DURATIONS.includes(Number(validDays))) {
      return NextResponse.json({ error: 'Некорректный срок' }, { status: 400 })
    }

    let code = generateCode()
    let attempts = 0
    while (attempts < 10) {
      try {
        await query(
          `INSERT INTO plan_codes (code, plan, valid_days) VALUES ($1, $2, $3)`,
          [code, plan, Number(validDays)]
        )
        return NextResponse.json({ code, plan, valid_days: Number(validDays) })
      } catch {
        code = generateCode()
        attempts++
      }
    }
    return NextResponse.json({ error: 'Не удалось сгенерировать уникальный код, попробуйте ещё раз' }, { status: 500 })
  } catch (error) {
    console.error('Ошибка генерации кода тарифа:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
