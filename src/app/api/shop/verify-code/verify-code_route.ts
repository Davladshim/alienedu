// src/app/api/shop/verify-code/route.ts
// API роут: проверяет код доступа и выдаёт временный токен

import { NextRequest, NextResponse } from "next/server";

// Простая функция генерации токена (потом заменим на jwt или crypto)
function generateToken(code: string, presentationId: number): string {
  const payload = `${code}:${presentationId}:${Date.now()}`;
  // TODO: заменить на нормальный JWT с подписью
  // Сейчас — base64 для демо (НЕ для продакшена!)
  return Buffer.from(payload).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, presentationId } = body;

    // Валидация входных данных
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
    // Логика которая будет:
    //
    // 1. Найти код в таблице access_codes:
    //    SELECT * FROM access_codes
    //    WHERE code = $1 AND presentation_id = $2 AND status = 'active'
    //
    // 2. Если не найден → вернуть ошибку
    //
    // 3. Если найден, проверить срок:
    //    - если first_used_at IS NULL → это первый ввод, записать дату
    //    - если first_used_at + valid_days дней > сейчас → доступ есть
    //    - иначе → срок истёк, вернуть ошибку
    //
    // 4. Если всё ок → сгенерировать токен и вернуть клиенту
    //
    // Примерный SQL для обновления first_used_at:
    //   UPDATE access_codes SET first_used_at = NOW()
    //   WHERE code = $1 AND first_used_at IS NULL
    //
    // Примерный SQL для проверки срока:
    //   SELECT first_used_at + (valid_days || ' days')::interval > NOW() as is_valid
    //   FROM access_codes WHERE code = $1

    // --- ВРЕМЕННАЯ ЗАГЛУШКА ДЛЯ РАЗРАБОТКИ ---
    // Принимаем тестовый код "TEST-1234"
    const isValidCode = cleanCode === "TEST-1234";

    if (!isValidCode) {
      // Небольшая задержка чтобы нельзя было брутфорсить
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: "Код не найден или уже использован" },
        { status: 403 }
      );
    }

    // Генерируем токен доступа
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
