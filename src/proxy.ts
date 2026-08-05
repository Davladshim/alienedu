import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Страницы доступные без авторизации
const publicPaths = ['/login', '/register', '/recover', '/shop', '/stereo', '/_next', '/previews', '/quest/join', '/quest/room', '/rooms', '/rooms/items', '/admin', '/privacy', '/terms', '/oferta']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Корневая страница ничего не показывает сама по себе (это нетронутый
  // шаблон Next.js) — сразу ведём в свой кабинет или на страницу входа
  if (pathname === '/') {
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
        return NextResponse.redirect(new URL(getDashboardPath(decoded.role), request.url))
      } catch {
        // Невалидный токен — считаем неавторизованным
      }
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Пропускаем публичные страницы и API
  if (publicPaths.some(path => pathname.startsWith(path))) {
    // У этих разделов своя, отдельная авторизация (пароль ADMIN_SECRET) —
    // всегда пропускаем, даже если человек залогинен на платформе или нет
    if (pathname.startsWith('/shop') || pathname.startsWith('/stereo') || pathname.startsWith('/previews') || pathname.startsWith('/rooms') || pathname.startsWith('/admin') || pathname.startsWith('/privacy') || pathname.startsWith('/terms') || pathname.startsWith('/oferta')) {
      return NextResponse.next()
    }
    // Если уже залогинен — перенаправляем на дашборд
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        return NextResponse.redirect(
          new URL(getDashboardPath(decoded.role), request.url)
        )
      } catch {
        // Токен невалидный — пускаем на публичную страницу
      }
    }
    return NextResponse.next()
  }

  // Для остальных страниц — проверяем авторизацию
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!)
    return NextResponse.next()
  } catch {
    // Токен истёк или невалидный
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'admin': return '/admin'
    case 'teacher': return '/teacher'
    case 'parent': return '/parent'
    default: return '/student'
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}