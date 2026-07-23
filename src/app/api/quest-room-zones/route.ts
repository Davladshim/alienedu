import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

function checkAuth(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return false
  try {
    jwt.verify(token, process.env.JWT_SECRET!)
    return true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const roomId = req.nextUrl.searchParams.get('room_id')
  const view = req.nextUrl.searchParams.get('view') || 'center'

  try {
    const result = await query(
      `SELECT * FROM quest_room_zones WHERE room_id = $1 AND view = $2 ORDER BY id ASC`,
      [roomId, view]
    )
    return NextResponse.json({ zones: result.rows })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const { room_id, view, zones } = await req.json()

    // Удаляем старые зоны для этой комнаты и ракурса
    await query(
      `DELETE FROM quest_room_zones WHERE room_id = $1 AND view = $2`,
      [room_id, view]
    )

    // Вставляем новые
    for (const zone of zones) {
      await query(
        `INSERT INTO quest_room_zones (room_id, view, x, y, width, height, item_image, zone_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [room_id, view, zone.x, zone.y, zone.width, zone.height, zone.item_image, zone.zone_type]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}