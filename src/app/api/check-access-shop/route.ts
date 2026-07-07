import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const presentationId = req.nextUrl.searchParams.get("presentationId");
  
  if (!presentationId) {
    return NextResponse.json({ hasAccess: false });
  }

  const isAdmin = req.cookies.get("admin_session_shop")?.value === process.env.ADMIN_SECRET;
  const hasAccess = req.cookies.get(`access_shop_${presentationId}`)?.value === "granted";

  return NextResponse.json({ hasAccess: isAdmin || hasAccess });
}