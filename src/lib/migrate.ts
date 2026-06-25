import 'dotenv/config'
import { query } from './db'

async function migrate() {
  console.log('Создаём таблицы...')

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      login VARCHAR(100) UNIQUE NOT NULL,
      code_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'student',
      secret_question VARCHAR(255) NOT NULL,
      secret_answer_hash VARCHAR(255) NOT NULL,
      added_by_teacher_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_login ON users(login)
  `)

  console.log('Готово! Таблицы созданы.')
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Ошибка:', err)
    process.exit(1)
  })