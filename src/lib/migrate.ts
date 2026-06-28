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

  console.log('Создаём таблицы квестов...')

  await query(`
    CREATE TABLE IF NOT EXISTS quest_sessions (
      id SERIAL PRIMARY KEY,
      teacher_id INTEGER NOT NULL REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'waiting',
      created_at TIMESTAMP DEFAULT NOW(),
      finished_at TIMESTAMP
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS quest_rooms (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES quest_sessions(id),
      room_number INTEGER NOT NULL,
      max_players INTEGER NOT NULL DEFAULT 1,
      hint TEXT,
      key_task TEXT,
      key_answer VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS quest_players (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES quest_sessions(id),
      access_code VARCHAR(64) UNIQUE NOT NULL,
      player_name VARCHAR(255),
      current_room_id INTEGER REFERENCES quest_rooms(id),
      status VARCHAR(50) NOT NULL DEFAULT 'waiting',
      joined_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS quest_progress (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES quest_players(id),
      room_id INTEGER NOT NULL REFERENCES quest_rooms(id),
      answer_given VARCHAR(255),
      is_correct BOOLEAN DEFAULT false,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await query(`
    CREATE INDEX IF NOT EXISTS idx_quest_players_code ON quest_players(access_code)
  `)

  await query(`
    CREATE INDEX IF NOT EXISTS idx_quest_progress_player ON quest_progress(player_id)
  `)

  console.log('Готово! Все таблицы созданы.')
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Ошибка:', err)
    process.exit(1)
  })