import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === process.env.ADMIN_SECRET;
}

// Получить все презентации
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT id, title, subject, grade, price, content_path, is_active, created_at
       FROM presentations
       ORDER BY created_at DESC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// Добавить новую презентацию
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const { title, description, subject, grade, price, htmlCode, slidesData } = await req.json();

    if (!title || !subject || !grade || !price || !htmlCode) {
      return NextResponse.json({ error: "Заполни все обязательные поля" }, { status: 400 });
    }

    // Генерируем имя файла
    const fileName = `presentation-${Date.now()}.html`;

    // Загружаем HTML в Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: uploadError } = await supabase.storage
      .from("presentations")
      .upload(fileName, new Blob([htmlCode], { type: "text/html" }), {
        contentType: "text/html",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Ошибка загрузки файла" }, { status: 500 });
    }

    // Сохраняем метаданные в БД
    const result = await query(
      `INSERT INTO presentations (title, description, subject, grade, price, content_path, slides_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [title, description || "", subject, grade, price, fileName, slidesData ? JSON.stringify(slidesData) : null]
    );

    return NextResponse.json({ id: result.rows[0].id, ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}