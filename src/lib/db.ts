import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
  max: 1 // только одно соединение — лимит Supabase Session pooler
})

export async function query(text: string, params?: any[]) {
  let retries = 3
  while (retries > 0) {
    let client
    try {
      client = await pool.connect()
      const result = await client.query(text, params)
      return result
    } catch (error: any) {
      retries--
      if (retries === 0) throw error
      console.log(`Переподключение... попыток осталось: ${retries}`)
      await new Promise(r => setTimeout(r, 2000))
    } finally {
      if (client) client.release()
    }
  }
  throw new Error('Не удалось выполнить запрос')
}

export default pool