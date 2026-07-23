import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("stereo_admin_session")?.value;
  if (!session || session !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      condition,
      solution,
      answer,
      model_id,
      topic,
      grade,
      difficulty,
      is_free,
      textbook,
      authors,
      year,
    } = body;

    if (!title || !condition || !solution || !model_id) {
      return NextResponse.json(
        { error: "Заполните обязательные поля: название, условие, решение, модель" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO stereo_tasks
        (title, condition, solution, answer, model_id, topic, grade, difficulty, is_free, textbook, authors, year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        title,
        condition,
        solution,
        answer || null,
        model_id,
        topic || null,
        grade || null,
        difficulty || 1,
        is_free || false,
        textbook || null,
        authors || null,
        year || null,
      ]
    );

    return NextResponse.json({ id: result.rows[0].id });
  } catch (error) {
    console.error("stereo-admin-tasks error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}