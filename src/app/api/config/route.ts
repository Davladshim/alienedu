import { NextResponse } from 'next/server'

// Публичная конфигурация для клиента отдаётся через API-роут, а не через
// NEXT_PUBLIC_* напрямую в бандле — на Amvera переменные окружения
// недоступны на этапе сборки Docker-образа, поэтому next build "запекает"
// NEXT_PUBLIC_* в клиентский код пустыми строками. Серверные роуты читают
// process.env в рантайме запроса, когда переменные уже доступны
export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  })
}
