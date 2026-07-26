import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";

function checkAdmin(req: NextRequest): boolean {
  const session = req.cookies.get("stereo_admin_session");
  return session?.value === process.env.ADMIN_SECRET;
}

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-");
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT id, code, status, first_used_at, valid_days, created_at
       FROM stereo_access_codes
       ORDER BY created_at DESC`
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
    const { count = 1, validDays = 30 } = await req.json();

    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      let code = generateCode();
      let attempts = 0;

      while (attempts < 10) {
        try {
          await query(
            `INSERT INTO stereo_access_codes (code, valid_days) VALUES ($1, $2)`,
            [code, validDays]
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
    await query(`UPDATE stereo_access_codes SET status = 'revoked' WHERE id = $1`, [codeId]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
