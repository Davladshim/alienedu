import { NextRequest, NextResponse } from "next/server";

// Значение куки — либо ISO-дата истечения (актуальный формат), либо
// legacy-строка "granted" (куки, выданные до перехода на дату истечения) —
// им доверяем без проверки даты, maxAge самой куки на браузере всё равно
// не даст ей пережить положенный срок
function isAccessCookieValid(value: string | undefined): boolean {
  if (!value) return false;
  if (value === "granted") return true;
  const expiresAt = new Date(value);
  return !isNaN(expiresAt.getTime()) && expiresAt.getTime() > Date.now();
}

export async function GET(req: NextRequest) {
  const presentationId = req.nextUrl.searchParams.get("presentationId");

  if (!presentationId) {
    return NextResponse.json({ hasAccess: false });
  }

  const isAdmin = req.cookies.get("admin_session_shop")?.value === process.env.ADMIN_SECRET;
  const hasAccess = isAccessCookieValid(req.cookies.get(`access_shop_${presentationId}`)?.value);
  const hasSubscription = isAccessCookieValid(req.cookies.get("access_shop_all")?.value);

  return NextResponse.json({ hasAccess: isAdmin || hasAccess || hasSubscription });
}
