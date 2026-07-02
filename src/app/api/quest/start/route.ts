import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json()

    await query(
      `UPDATE quest_sessions SET status = 'active' WHERE id = $1`,
      [session_id]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ошибка старта квеста:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}