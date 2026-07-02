import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT id, title, subject, grade, price, slides_data
       FROM presentations
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      title: row.title,
      subject: row.subject,
      grade: row.grade,
      price: row.price,
      slides: row.slides_data?.slides ?? [],
      shapes: row.slides_data?.shapes ?? [],
    });

  } catch (error) {
    console.error("presentation-meta error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}