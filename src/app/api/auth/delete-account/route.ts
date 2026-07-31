import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { requestAccountDeletion, DELETION_GRACE_DAYS } from '@/lib/accountDeletion'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    await requestAccountDeletion(decoded.id)

    const response = NextResponse.json({ success: true, graceDays: DELETION_GRACE_DAYS })
    response.cookies.delete('token')
    return response
  } catch (error) {
    console.error('Ошибка удаления аккаунта:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
