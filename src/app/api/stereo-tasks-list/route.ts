import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `SELECT id, title, topic, grade, difficulty, is_free, textbook, authors, year
       FROM stereo_tasks
       WHERE is_active = true
       ORDER BY topic, grade, difficulty`
    );

    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.error("stereo-tasks-list error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}