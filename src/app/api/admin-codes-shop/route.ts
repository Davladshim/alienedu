import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session_shop");
  return session?.value === process.env.ADMIN_SECRET;
}

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-");
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const presentationId = req.nextUrl.searchParams.get("presentationId");

  try {
    const result = await query(
      `SELECT ac.id, ac.code, ac.status, ac.first_used_at, ac.valid_days, ac.created_at,
              p.title as presentation_title
       FROM access_codes ac
       JOIN presentations p ON p.id = ac.presentation_id
       WHERE ($1::int IS NULL OR ac.presentation_id = $1::int)
       ORDER BY ac.created_at DESC`,
      [presentationId || null]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const { presentationId, count = 1, validDays = 10 } = await req.json();

    if (!presentationId) {
      return NextResponse.json({ error: "Укажи презентацию" }, { status: 400 });
    }

    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      let code = generateCode();
      let attempts = 0;

      while (attempts < 10) {
        try {
          await query(
            `INSERT INTO access_codes (code, presentation_id, valid_days) VALUES ($1, $2, $3)`,
            [code, presentationId, validDays]
          );
          codes.push(code);
          break;
        } catch {
          code = generateCode();
          attempts++;
        }
      }
    }

    return NextResponse.json({ codes, ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const { codeId } = await req.json();
    await query(`UPDATE access_codes SET status = 'revoked' WHERE id = $1`, [codeId]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}