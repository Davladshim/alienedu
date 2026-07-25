import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const code = req.nextUrl.searchParams.get("code");

    const result = await query(
      `SELECT t.*, m.model_url
       FROM stereo_tasks t
       LEFT JOIN stereo_models m ON m.id = t.model_id
       WHERE t.id = $1 AND t.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
    }

    const task = result.rows[0];

    if (task.is_free) {
      return NextResponse.json({ task });
    }

    const adminSession = req.cookies.get("stereo_admin_session")?.value;
    if (adminSession && adminSession === process.env.ADMIN_SECRET) {
      return NextResponse.json({ task });
    }

    if (!code) {
      return NextResponse.json({ error: "Нужен код доступа" }, { status: 403 });
    }

    const cleanCode = code.trim().toUpperCase();
    const codeResult = await query(
      `SELECT * FROM stereo_access_codes WHERE code = $1 AND status = 'active'`,
      [cleanCode]
    );

    if (codeResult.rows.length === 0) {
      return NextResponse.json({ error: "Код недействителен" }, { status: 403 });
    }

    const accessCode = codeResult.rows[0];
    if (accessCode.first_used_at) {
      const firstUsed = new Date(accessCode.first_used_at);
      const expiresAt = new Date(firstUsed.getTime() + accessCode.valid_days * 24 * 60 * 60 * 1000);
      if (new Date() > expiresAt) {
        return NextResponse.json({ error: "Срок действия кода истёк" }, { status: 403 });
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("stereo-task error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}