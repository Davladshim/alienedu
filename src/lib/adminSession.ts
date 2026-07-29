import { NextResponse } from 'next/server'

// Три админки (платформа, магазин презентаций, StereoSpace) используют
// один и тот же ADMIN_SECRET, но каждая проверяет свою cookie. Вход или
// выход в любой из них должен сразу давать/забирать доступ ко всем трём —
// это общая точка, чтобы не дублировать список из трёх cookie в трёх местах
const ADMIN_COOKIE_NAMES = ['platform_admin_session', 'admin_session_shop', 'stereo_admin_session'] as const

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
}

export function setAllAdminCookies(response: NextResponse) {
  for (const name of ADMIN_COOKIE_NAMES) {
    response.cookies.set(name, process.env.ADMIN_SECRET!, COOKIE_OPTIONS)
  }
}

export function clearAllAdminCookies(response: NextResponse) {
  for (const name of ADMIN_COOKIE_NAMES) {
    response.cookies.delete(name)
  }
}
