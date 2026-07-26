-- ============================================================================
-- AlienEdu — Единая схема базы данных
-- ============================================================================
-- ВАЖНО: это единственный источник правды о структуре базы данных.
-- Платформа и Магазин читают и обновляют ЭТОТ файл при любом изменении схемы.
-- Перед началом работы в любом из двух чатов — сверяйтесь с этим файлом
-- (git pull + открыть файл), чтобы видеть последние изменения от другого модуля.
--
-- Последнее обновление: 26.07.2026
-- Обновлено модулем: platform (добавлена lesson_templates — шаблон недели)
-- ============================================================================


-- ============================================================================
-- ОБЩИЕ ТАБЛИЦЫ (используются и платформой, и магазином)
-- ============================================================================

-- Пользователи платформы (преподаватели, ученики, админы)
-- Магазин может ссылаться на эту таблицу, если покупатель залогинен на платформе
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    login VARCHAR(255) UNIQUE NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    secret_question VARCHAR(255),
    secret_answer_hash VARCHAR(255),
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

-- Интерактивные уроки (конструктор блоков — аналог ProgressMe)
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    grade INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'published'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Блоки контента внутри урока — универсальные компоненты,
-- те же типы блоков переиспользует квест-модуль (src/components/lesson-blocks/)
CREATE TABLE IF NOT EXISTS lesson_blocks (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL, -- 'theory', 'single-choice', 'multi-choice', 'short-text', 'numeric'
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ответы учеников на блоки урока
CREATE TABLE IF NOT EXISTS lesson_attempts (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    block_id INTEGER NOT NULL REFERENCES lesson_blocks(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id),
    answer JSONB,
    is_correct BOOLEAN,
    completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson ON lesson_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_lesson_student ON lesson_attempts(lesson_id, student_id);

-- Семьи — группировка учеников с общим балансом (например, братья/сёстры)
CREATE TABLE IF NOT EXISTS families (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Постоянная связь преподаватель-ученик (ростер)
CREATE TABLE IF NOT EXISTS teacher_students (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    lesson_price DECIMAL(10, 2), -- стоимость одного занятия для этого ученика
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0, -- личный баланс (не используется, если есть family_id)
    family_id INTEGER REFERENCES families(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, student_id)
);

-- Пополнения баланса (истории платежей — привязаны к ученику,
-- но фактически увеличивают семейный баланс, если ученик состоит в семье)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    teacher_student_id INTEGER NOT NULL REFERENCES teacher_students(id),
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    payment_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_teacher_student ON payments(teacher_student_id);

-- Каким ученикам назначен урок (шэринг урока конкретным ученикам)
CREATE TABLE IF NOT EXISTS lesson_assignments (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (lesson_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_lesson ON lesson_assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_student ON lesson_assignments(student_id);

-- Расписание — запланированные занятия репетитора с учениками
-- (не путать с lessons/lesson_blocks — это интерактивный контент-урок,
--  а schedule_lessons — просто время+ученик в календаре преподавателя)
CREATE TABLE IF NOT EXISTS schedule_lessons (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    time VARCHAR(5) NOT NULL, -- 'HH:MM'
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    subject VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    price DECIMAL(10, 2), -- копия lesson_price ученика на момент создания занятия (можно менять точечно)
    is_paid BOOLEAN NOT NULL DEFAULT false, -- списано ли price с баланса ученика/семьи
    notes TEXT,
    original_date DATE, -- заполняется при первом переносе — откуда перенесли
    original_time VARCHAR(5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_lessons_teacher_date ON schedule_lessons(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_lessons_student ON schedule_lessons(student_id);

-- Шаблон недели — повторяющийся еженедельный слот ученика,
-- из которого генерируются реальные строки schedule_lessons
CREATE TABLE IF NOT EXISTS lesson_templates (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    day_of_week INTEGER NOT NULL, -- 0=понедельник ... 6=воскресенье
    time VARCHAR(5) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    subject VARCHAR(100),
    price DECIMAL(10, 2),
    start_date DATE NOT NULL,
    end_date DATE, -- NULL = бессрочно
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_templates_teacher ON lesson_templates(teacher_id);


-- ============================================================================
-- МОДУЛЬ: SHOP (магазин презентаций)
-- ============================================================================

-- Презентации, доступные для продажи
CREATE TABLE IF NOT EXISTS presentations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    content_path VARCHAR(500) NOT NULL, -- путь к HTML файлу в Supabase Storage
    preview_image VARCHAR(500),         -- превью для карточки в магазине
    subject VARCHAR(100),               -- предмет (Математика, Физика и т.д.)
    grade INTEGER,                      -- класс (5-11)
    topic VARCHAR(255),                 -- тема презентации
    slides_data JSONB,                  -- данные слайдов для превью (опционально)
    content_description TEXT,           -- содержание презентации для карточки в магазине
    is_active BOOLEAN DEFAULT true,     -- показывать в магазине
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

-- Зоны взаимодействия в комнатах квеста
CREATE TABLE IF NOT EXISTS quest_room_zones (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES quest_rooms(id) ON DELETE CASCADE,
    view VARCHAR(10) NOT NULL DEFAULT 'center',
    x DECIMAL NOT NULL,
    y DECIMAL NOT NULL,
    width DECIMAL NOT NULL DEFAULT 8,
    height DECIMAL NOT NULL DEFAULT 12,
    item_image VARCHAR(100) NOT NULL DEFAULT 'envelope.png',
    zone_type VARCHAR(20) NOT NULL DEFAULT 'task',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- МОДУЛЬ: STEREO (StereoSpace — банк задач по стереометрии)
-- ============================================================================
-- Обновлено модулем: stereo (20.07.2026)

-- Задачи по стереометрии
CREATE TABLE IF NOT EXISTS stereo_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    condition TEXT NOT NULL,              -- условие задачи
    solution TEXT NOT NULL,               -- решение (скрыто до нажатия)
    answer VARCHAR(255),                  -- краткий ответ
    model_url VARCHAR(500) NOT NULL,      -- путь к .glb файлу в Supabase Storage
    topic VARCHAR(255),                   -- тема (призма, пирамида, сечения и т.д.)
    grade INTEGER,
    difficulty INTEGER DEFAULT 1,
    is_free BOOLEAN DEFAULT false,        -- бесплатная задача, доступна без кода
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Коды доступа к StereoSpace — один код открывает весь банк задач (подписка)
CREATE TABLE IF NOT EXISTS stereo_access_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),

    first_used_at TIMESTAMP,
    valid_days INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stereo_access_codes_code ON stereo_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_stereo_tasks_topic ON stereo_tasks(topic);
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
