import { NextRequest, NextResponse } from "next/server";

interface TokenPayload {
  marker: string;
  timestamp: number;
  validDays: number;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = Buffer.from(token, "base64").toString("utf-8");
    const parts = payload.split(":");
    if (parts.length < 3) return null;
    const validDays = parts.length >= 4 ? Number(parts[3]) : 10;
    return { marker: parts[1], timestamp: Number(parts[2]), validDays: validDays || 10 };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, presentationId } = await req.json();

    if (!token || !presentationId) {
      return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Неверный токен" }, { status: 403 });
    }

    const isSubscription = decoded.marker === "ALL";
    if (!isSubscription && decoded.marker !== String(presentationId)) {
      return NextResponse.json({ error: "Неверный токен" }, { status: 403 });
    }

    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - decoded.timestamp > ONE_DAY) {
      return NextResponse.json({ error: "Неверный токен" }, { status: 403 });
    }

    const maxAge = 60 * 60 * 24 * decoded.validDays;
    // Значение куки — момент истечения (ISO), а не просто флаг "granted":
    // без этого негде хранить дату для счётчика "осталось N дней" на витрине
    const expiresAt = new Date(Date.now() + maxAge * 1000);
    const response = NextResponse.json({ ok: true, isSubscription, daysLeft: decoded.validDays });

    const cookieName = isSubscription ? "access_shop_all" : `access_shop_${presentationId}`;
    response.cookies.set(cookieName, expiresAt.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("grant-access-shop error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
