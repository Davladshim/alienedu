import { NextRequest, NextResponse } from "next/server";

function verifyToken(token: string, presentationId: string): boolean {
  try {
    const payload = Buffer.from(token, "base64").toString("utf-8");
    const parts = payload.split(":");
    if (parts.length < 3) return false;
    if (parts[1] !== presentationId) return false;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - Number(parts[2]) > ONE_DAY) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, presentationId } = await req.json();

    if (!token || !presentationId) {
      return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
    }

    if (!verifyToken(token, String(presentationId))) {
      return NextResponse.json({ error: "Неверный токен" }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true });

    // Сохраняем доступ в куки на 10 дней
    response.cookies.set(`access_shop_${presentationId}`, "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 10,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("grant-access-shop error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}