import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Страницы доступные без авторизации
const publicPaths = ['/login', '/register', '/recover', '/shop', '/stereo', '/_next', '/previews', '/quest/join', '/quest/room', '/rooms', '/rooms/items']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Пропускаем публичные страницы и API
  if (publicPaths.some(path => pathname.startsWith(path))) {
    // Для магазина — всегда пропускаем, даже если залогинен
    if (pathname.startsWith('/shop') || pathname.startsWith('/stereo') || pathname.startsWith('/previews') || pathname.startsWith('/rooms')) {
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
    default: return '/student'
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}