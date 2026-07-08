import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 600000,
  max: 3,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
})

// Поддерживаем соединение живым
pool.on('error', (err) => {
  console.error('Pool error:', err.message)
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
      await new Promise(r => setTimeout(r, 1000))
    } finally {
      if (client) client.release()
    }
  }
  throw new Error('Не удалось выполнить запрос')
}

export default pool