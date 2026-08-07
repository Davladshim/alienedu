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
// Раньше — фиксированный список [30, 365]. Теперь допускается любое
// целое число дней в разумных пределах — на фронте это варианты
// "1 месяц"/"1 год"/"произвольный срок" с полем ввода дней
const MIN_VALID_DAYS = 1
const MAX_VALID_DAYS = 3650

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const result = await query(
      `SELECT pc.id, pc.code, pc.plan, pc.status, pc.first_used_at, pc.valid_days, pc.created_at,
         u.login as used_by_login, u.full_name as used_by_name
       FROM plan_codes pc
       LEFT JOIN users u ON u.id = pc.user_id
       ORDER BY pc.created_at DESC LIMIT 200`
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
    const days = Number(validDays)
    if (!Number.isInteger(days) || days < MIN_VALID_DAYS || days > MAX_VALID_DAYS) {
      return NextResponse.json({ error: `Срок должен быть целым числом дней от ${MIN_VALID_DAYS} до ${MAX_VALID_DAYS}` }, { status: 400 })
    }

    let code = generateCode()
    let attempts = 0
    while (attempts < 10) {
      try {
        await query(
          `INSERT INTO plan_codes (code, plan, valid_days) VALUES ($1, $2, $3)`,
          [code, plan, days]
        )
        return NextResponse.json({ code, plan, valid_days: days })
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
