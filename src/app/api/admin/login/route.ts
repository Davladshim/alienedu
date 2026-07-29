import { NextRequest, NextResponse } from 'next/server'
import { setAllAdminCookies, clearAllAdminCookies } from '@/lib/adminSession'

// Админка платформы AlienEdu — тот же пароль и та же схема сессии,
// что у /shop/admin и /stereo/admin (общий ADMIN_SECRET). Вход сюда сразу
// авторизует и в двух остальных админках, выход — разлогинивает везде
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    setAllAdminCookies(response)
    return response
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  clearAllAdminCookies(response)
  return response
}
