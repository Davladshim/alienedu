import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

function generateToken(code: string, presentationId: string): string {
  const payload = `${code}:${presentationId}:${Date.now()}`;
  return Buffer.from(payload).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, presentationId } = body;

    if (!code || typeof code !== "string" || !presentationId) {
      return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode.length < 4) {
      return NextResponse.json({ error: "Слишком короткий код" }, { status: 400 });
    }

    // Ищем код в БД
    const result = await query(
      `SELECT ac.*, p.id as pid
       FROM access_codes ac
       JOIN presentations p ON p.id = ac.presentation_id
       WHERE ac.code = $1
         AND ac.presentation_id = $2
         AND ac.status = 'active'`,
      [cleanCode, presentationId]
    );

    if (result.rows.length === 0) {
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: "Код не найден или уже использован" }, { status: 403 });
    }

    const accessCode = result.rows[0];

    // Проверяем срок действия если код уже использовался
    if (accessCode.first_used_at) {
      const firstUsed = new Date(accessCode.first_used_at);
      const expiresAt = new Date(firstUsed.getTime() + accessCode.valid_days * 24 * 60 * 60 * 1000);
      if (new Date() > expiresAt) {
        return NextResponse.json({ error: "Срок действия кода истёк" }, { status: 403 });
      }
    } else {
      // Первый ввод — записываем дату
      await query(
        `UPDATE access_codes SET first_used_at = NOW() WHERE code = $1`,
        [cleanCode]
      );
    }

    const token = generateToken(cleanCode, String(presentationId));
    return NextResponse.json({ token });

  } catch (error) {
    console.error("verify-code error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}