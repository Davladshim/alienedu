import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const isAdmin = req.nextUrl.searchParams.get("admin") === process.env.ADMIN_SECRET;

  if (!isAdmin && !token) {
    return new NextResponse("Доступ запрещён", { status: 403 });
  }

  if (!isAdmin && !verifyToken(token!, id)) {
    return new NextResponse("Токен недействителен или истёк", { status: 403 });
  }

  try {
    // Получаем путь к файлу из БД
    const { query } = await import("@/lib/db");
    const result = await query(
      `SELECT content_path FROM presentations WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return new NextResponse("Презентация не найдена", { status: 404 });
    }

    const contentPath = result.rows[0].content_path;

    // Если это демо-заглушка
    if (contentPath === "demo") {
      return new NextResponse("<html><body style='background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;'><div style='text-align:center'><h1>🎉 Доступ открыт!</h1><p style='color:#71717a'>Здесь будет настоящая презентация</p></div></body></html>", {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    // Читаем файл из Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.storage
      .from("presentations")
      .download(contentPath);

    if (error || !data) {
      console.error("Storage error:", error);
      return new NextResponse("Файл не найден", { status: 404 });
    }

    const html = await data.text();

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error) {
    console.error("presentation route error:", error);
    return new NextResponse("Внутренняя ошибка", { status: 500 });
  }
}