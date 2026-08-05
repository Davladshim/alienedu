import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Активация кода "Полный доступ" прямо с витрины магазина, без привязки к
// конкретной презентации — в отличие от /api/verify-code-shop (которая
// принимает и презентационные, и подписочные коды, но требует presentationId),
// эта ручка ищет только подписочные коды (presentation_id IS NULL) и сразу
// выставляет куку, без промежуточного токена — тут не нужно доказывать
// принадлежность конкретной презентации, как в старом флоу
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) {
      return NextResponse.json({ error: "Слишком короткий код" }, { status: 400 });
    }

    const result = await query(
      `SELECT * FROM access_codes WHERE code = $1 AND presentation_id IS NULL AND status = 'active'`,
      [cleanCode]
    );

    if (result.rows.length === 0) {
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: "Код не найден или уже использован" }, { status: 403 });
    }

    const accessCode = result.rows[0];
    let expiresAt: Date;

    if (accessCode.first_used_at) {
      expiresAt = new Date(new Date(accessCode.first_used_at).getTime() + accessCode.valid_days * 24 * 60 * 60 * 1000);
      if (expiresAt.getTime() <= Date.now()) {
        return NextResponse.json({ error: "Срок действия кода истёк" }, { status: 403 });
      }
    } else {
      await query(`UPDATE access_codes SET first_used_at = NOW() WHERE code = $1`, [cleanCode]);
      expiresAt = new Date(Date.now() + accessCode.valid_days * 24 * 60 * 60 * 1000);
    }

    const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    const response = NextResponse.json({ ok: true, daysLeft });

    response.cookies.set("access_shop_all", expiresAt.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("verify-code-shop-subscription error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
