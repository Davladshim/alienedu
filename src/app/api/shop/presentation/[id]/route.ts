import { NextRequest, NextResponse } from "next/server";

function verifyToken(token: string, presentationId: string): boolean {
  try {
    const payload = Buffer.from(token, "base64").toString("utf-8");
    const parts = payload.split(":");
    if (parts.length < 3) return false;

    const tokenPresentationId = parts[1];
    const timestamp = Number(parts[2]);

    if (tokenPresentationId !== presentationId) return false;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > ONE_DAY) return false;

    return true;
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Доступ запрещён", { status: 403 });
  }

  if (!verifyToken(token, id)) {
    return new NextResponse("Токен недействителен или истёк", { status: 403 });
  }

  const demoHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Презентация ${id}</title>
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
    <p>Здесь будет твоя настоящая презентация #${id}</p>
    <div class="badge">AlienEdu — демо режим</div>
  </div>
</body>
</html>
  `.trim();

  return new NextResponse(demoHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
    },
  });
}