// src/app/api/shop/presentation/[id]/route.ts
// API роут: отдаёт HTML презентации только при наличии валидного токена
// Файл хранится в закрытом Yandex Cloud Storage — клиент никогда не получает прямую ссылку

import { NextRequest, NextResponse } from "next/server";

// Проверяем токен (потом заменим на jwt.verify)
function verifyToken(token: string, presentationId: number): boolean {
  try {
    // TODO: заменить на нормальную проверку JWT
    // Сейчас декодируем base64 и проверяем presentationId
    const payload = Buffer.from(token, "base64").toString("utf-8");
    const parts = payload.split(":");
    if (parts.length < 3) return false;

    const tokenPresentationId = Number(parts[1]);
    const timestamp = Number(parts[2]);

    // Проверяем что токен для правильной презентации
    if (tokenPresentationId !== presentationId) return false;

    // Токен живёт 24 часа (потом пользователь вводит код снова)
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > ONE_DAY) return false;

    return true;
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const presentationId = Number(params.id);
  const token = req.nextUrl.searchParams.get("token");

  // Нет токена → отказ
  if (!token) {
    return new NextResponse("Доступ запрещён", { status: 403 });
  }

  // Токен невалидный → отказ
  if (!verifyToken(token, presentationId)) {
    return new NextResponse("Токен недействителен или истёк", { status: 403 });
  }

  // TODO: получить реальный путь к файлу из БД
  // SELECT content_path FROM presentations WHERE id = $1 AND is_active = true

  // TODO: запросить файл из закрытого Yandex Cloud Storage
  // Это делается через подписанный URL (Presigned URL) или через SDK:
  //
  // import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
  // const client = new S3Client({
  //   region: "ru-central1",
  //   endpoint: "https://storage.yandexcloud.net",
  //   credentials: {
  //     accessKeyId: process.env.YC_ACCESS_KEY_ID!,
  //     secretAccessKey: process.env.YC_SECRET_ACCESS_KEY!,
  //   },
  // });
  // const command = new GetObjectCommand({ Bucket: "alienedu-presentations", Key: contentPath });
  // const response = await client.send(command);
  // const html = await response.Body?.transformToString();

  // --- ВРЕМЕННАЯ ЗАГЛУШКА ---
  // Возвращаем демо-презентацию
  const demoHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Презентация ${presentationId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, sans-serif;
      background: #0a0a0a;
      color: #fff;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .slide {
      text-align: center;
      padding: 40px;
    }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    p { color: #a1a1aa; font-size: 1.1rem; }
    .badge {
      display: inline-block;
      margin-top: 2rem;
      padding: 6px 16px;
      background: #27272a;
      border-radius: 999px;
      font-size: 0.8rem;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="slide">
    <h1>🎉 Доступ открыт!</h1>
    <p>Здесь будет твоя настоящая презентация #${presentationId}</p>
    <div class="badge">AlienEdu — демо режим</div>
  </div>
</body>
</html>
  `.trim();

  return new NextResponse(demoHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Запрещаем кешировать и встраивать в другие сайты
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
