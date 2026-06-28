// src/app/api/shop/verify-code/route.ts
// API роут: проверяет код доступа и выдаёт временный токен

import { NextRequest, NextResponse } from "next/server";

function generateToken(code: string, presentationId: number): string {
  const payload = `${code}:${presentationId}:${Date.now()}`;
  return Buffer.from(payload).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, presentationId } = body;

    if (!code || typeof code !== "string" || !presentationId) {
      return NextResponse.json(
        { error: "Неверный запрос" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode.length < 4) {
      return NextResponse.json(
        { error: "Слишком короткий код" },
        { status: 400 }
      );
    }

    // TODO: заменить на реальный запрос к БД
    const isValidCode = cleanCode === "TEST-1234";

    if (!isValidCode) {
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: "Код не найден или уже использован" },
        { status: 403 }
      );
    }

    const token = generateToken(cleanCode, presentationId);

    return NextResponse.json({ token });

  } catch (error) {
    console.error("verify-code error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}