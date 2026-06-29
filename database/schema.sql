-- ============================================================================
-- AlienEdu — Единая схема базы данных
-- ============================================================================
-- ВАЖНО: это единственный источник правды о структуре базы данных.
-- Платформа и Магазин читают и обновляют ЭТОТ файл при любом изменении схемы.
-- Перед началом работы в любом из двух чатов — сверяйтесь с этим файлом
-- (git pull + открыть файл), чтобы видеть последние изменения от другого модуля.
--
-- Последнее обновление: 20.06.2026
-- Обновлено модулем: platform (первичная заготовка)
-- ============================================================================


-- ============================================================================
-- ОБЩИЕ ТАБЛИЦЫ (используются и платформой, и магазином)
-- ============================================================================

-- Пользователи платформы (преподаватели, ученики, админы)
-- Магазин может ссылаться на эту таблицу, если покупатель залогинен на платформе
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'student', -- 'student', 'teacher', 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- ============================================================================
-- МОДУЛЬ: PLATFORM (платформа AlienEdu — квесты, календарь и т.д.)
-- ============================================================================

-- Квест-сессии (одна запись = один запущенный урок-квест)
CREATE TABLE IF NOT EXISTS quest_sessions (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'finished'
    player_count INTEGER NOT NULL DEFAULT 10,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP
);

-- Комнаты внутри квеста
CREATE TABLE IF NOT EXISTS quest_rooms (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES quest_sessions(id),
    room_number INTEGER NOT NULL,
    room_type VARCHAR(20) NOT NULL DEFAULT 'solo', -- 'solo', 'shared', 'final'
    max_players INTEGER NOT NULL DEFAULT 1,
    hint TEXT,
    key_task TEXT,
    key_answer VARCHAR(255),
    bonus_tasks JSONB DEFAULT '[]', -- доп. задания для быстрых в совместных комнатах
    created_at TIMESTAMP DEFAULT NOW()
);

-- Игроки в квесте
CREATE TABLE IF NOT EXISTS quest_players (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES quest_sessions(id),
    access_code VARCHAR(64) UNIQUE NOT NULL,
    player_name VARCHAR(255),
    current_room_id INTEGER REFERENCES quest_rooms(id),
    status VARCHAR(50) NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
    is_excluded BOOLEAN DEFAULT false,
    excluded_at TIMESTAMP,
    joined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Прогресс игрока по комнатам
CREATE TABLE IF NOT EXISTS quest_progress (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES quest_players(id),
    room_id INTEGER NOT NULL REFERENCES quest_rooms(id),
    answer_given VARCHAR(255),
    is_correct BOOLEAN DEFAULT false,
    bonus_completed JSONB DEFAULT '[]', -- выполненные бонусные задания
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quest_players_code ON quest_players(access_code);
CREATE INDEX IF NOT EXISTS idx_quest_progress_player ON quest_progress(player_id);


-- ============================================================================
-- МОДУЛЬ: SHOP (магазин презентаций)
-- ============================================================================

-- Презентации, доступные для продажи
CREATE TABLE IF NOT EXISTS presentations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    content_path VARCHAR(500) NOT NULL, -- путь/ссылка на саму презентацию
    preview_image VARCHAR(500), -- превью для карточки на лендинге
    is_active BOOLEAN DEFAULT true, -- можно скрыть из продажи, не удаляя
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Коды доступа — один код = один доступ к одной презентации
CREATE TABLE IF NOT EXISTS access_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL, -- сам код-ключ
    presentation_id INTEGER NOT NULL REFERENCES presentations(id),

    -- Если покупатель был залогинен на платформе в момент покупки — связь с его аккаунтом.
    -- Может быть NULL для анонимных покупок (просто код, без привязки к платформе).
    user_id INTEGER REFERENCES users(id),

    first_used_at TIMESTAMP, -- NULL пока не введён ни разу; таймер запуска отсчёта начинается отсюда
    valid_days INTEGER NOT NULL DEFAULT 30, -- срок действия в днях с момента первого ввода
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'revoked'

    created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска кода при проверке доступа
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);


-- ============================================================================
-- ЗАМЕТКИ НА БУДУЩЕЕ (не таблицы, просто план)
-- ============================================================================
-- 1. Когда платформа разовьётся, presentations может получить поле
--    teacher_id (если разные преподаватели смогут продавать свои презентации)
-- 2. access_codes.user_id уже сейчас предусмотрен для автоматической выдачи
--    доступа залогиненным пользователям платформы в будущем —
--    НЕ ТРЕБУЕТ изменения схемы, только изменения логики на бэкенде
-- 3. Таблицы платформы (квесты, календарь и т.д.) будут добавляться сюда же
--    по мере разработки — секция "МОДУЛЬ: PLATFORM" выше
-- ============================================================================
