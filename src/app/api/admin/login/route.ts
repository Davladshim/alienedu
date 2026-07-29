import { NextRequest, NextResponse } from 'next/server'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
}

// Админка платформы AlienEdu — тот же пароль и та же схема сессии,
// что у /shop/admin и /stereo/admin (общий ADMIN_SECRET). Вход сюда сразу
// авторизует и в двух остальных админках — их cookie ставим тем же секретом,
// чтобы не логиниться в три места отдельно
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set('platform_admin_session', process.env.ADMIN_SECRET!, COOKIE_OPTIONS)
    response.cookies.set('admin_session', process.env.ADMIN_SECRET!, COOKIE_OPTIONS)
    response.cookies.set('stereo_admin_session', process.env.ADMIN_SECRET!, COOKIE_OPTIONS)
    return response
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('platform_admin_session')
  response.cookies.delete('admin_session')
  response.cookies.delete('stereo_admin_session')
  return response
}
