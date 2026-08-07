import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get('platform_admin_session')
  return session?.value === process.env.ADMIN_SECRET
}

// Отзыв кода тарифа. Код помечается недействительным (status='revoked'),
// повторно ввести его будет нельзя (redeem фильтрует по status='active').
// Если код уже был активирован — пользователь сразу теряет Pro: план
// переключается на free тем же способом, что и при обычном истечении
// срока (getTeacherPlan сверяет plan_expires_at на каждый запрос, поэтому
// отдельно "гасить" учеников/уроки сверх лимита здесь не нужно — при
// следующем заходе в "Мои ученики" сработает тот же гейт, что и всегда
// при возврате на бесплатный тариф)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 })
  }
  try {
    const { id } = await params

    const existing = await query(`SELECT * FROM plan_codes WHERE id = $1`, [id])
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Код не найден' }, { status: 404 })
    }
    const planCode = existing.rows[0]
    if (planCode.status !== 'active') {
      return NextResponse.json({ error: 'Этот код уже отозван' }, { status: 400 })
    }

    await query(`UPDATE plan_codes SET status = 'revoked' WHERE id = $1`, [id])

    if (planCode.user_id) {
      await query(`UPDATE users SET plan = 'free', plan_expires_at = NULL WHERE id = $1`, [planCode.user_id])
    }

    return NextResponse.json({ success: true, downgraded: !!planCode.user_id })
  } catch (error) {
    console.error('Ошибка отзыва кода тарифа:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
