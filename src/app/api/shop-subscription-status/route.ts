import { NextRequest, NextResponse } from "next/server";

// Для баннера тарифа наверху магазина — сколько дней осталось у подписки
// на весь магазин (access_shop_all). Legacy-кука "granted" (до перехода на
// хранение даты истечения в значении куки) не несёт точной даты — считаем
// подписку активной, но без счётчика дней, пока не будет активирован новый код
export async function GET(req: NextRequest) {
  const raw = req.cookies.get("access_shop_all")?.value;

  if (!raw) {
    return NextResponse.json({ active: false, daysLeft: null });
  }
  if (raw === "granted") {
    return NextResponse.json({ active: true, daysLeft: null });
  }

  const expiresAt = new Date(raw);
  if (isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ active: false, daysLeft: null });
  }

  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return NextResponse.json({ active: true, daysLeft });
}
