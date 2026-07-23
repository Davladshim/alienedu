import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("stereo_admin_session")?.value;
  if (!session || session !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT id, label FROM stereo_models ORDER BY created_at DESC`
    );

    return NextResponse.json({ models: result.rows });
  } catch (error) {
    console.error("stereo-models-list error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}