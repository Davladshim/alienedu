import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
let _pending: Promise<SupabaseClient> | null = null

// Асинхронно и через /api/config, а не process.env.NEXT_PUBLIC_* напрямую —
// на Amvera переменные окружения недоступны на этапе сборки Docker-образа,
// поэтому next build "запекает" их в клиентский бандл пустыми строками.
// /api/config читает process.env на сервере в рантайме запроса, где
// переменные уже доступны
export function getSupabase(): Promise<SupabaseClient> {
  if (_supabase) return Promise.resolve(_supabase)
  if (_pending) return _pending

  _pending = fetch('/api/config')
    .then(res => res.json())
    .then(({ supabaseUrl, supabaseAnonKey }) => {
      _supabase = createClient(supabaseUrl, supabaseAnonKey)
      return _supabase
    })
    .finally(() => {
      _pending = null
    })

  return _pending
}