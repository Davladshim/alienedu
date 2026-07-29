-- ============================================================================
-- AlienEdu — Единая схема базы данных
-- ============================================================================
-- ВАЖНО: это единственный источник правды о структуре базы данных.
-- Платформа и Магазин читают и обновляют ЭТОТ файл при любом изменении схемы.
-- Перед началом работы в любом из двух чатов — сверяйтесь с этим файлом
-- (git pull + открыть файл), чтобы видеть последние изменения от другого модуля.
--
-- Последнее обновление: 28.07.2026
-- Обновлено модулем: platform (users: класс+часовой пояс, teacher_students: ссылка на звонок)
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
    grade INTEGER, -- класс ученика, указывается при регистрации (только role='student')
    -- IANA-имя часового пояса пользователя (например 'Europe/Samara') — по
    -- умолчанию МСК, дальше уточняется автоопределением в браузере или вручную
    timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/Moscow',
    -- заглушка вместо реального аккаунта: репетитор завёл карточку ученика
    -- в ростере до того, как тот сам зарегистрировался; login/code_hash —
    -- случайные и нерабочие, вход под таким аккаунтом всегда отклоняется
    is_placeholder BOOLEAN NOT NULL DEFAULT false,
    -- Тариф репетитора на самой платформе AlienEdu (не путать с access_codes/
    -- stereo_access_codes — те про магазин презентаций и StereoSpace)
    plan VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'pro'
    plan_expires_at TIMESTAMP, -- NULL пока free; для pro — когда истекает текущий код
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
    mode VARCHAR(20) NOT NULL DEFAULT 'quiz', -- 'quiz' (Проверочная — сразу видно верно/неверно), 'exam' (Контрольная — без подсказок по ходу, разбор в конце)
    is_public BOOLEAN NOT NULL DEFAULT false, -- виден в общей библиотеке готовых уроков другим репетиторам
    library_description TEXT, -- описание урока для карточки в библиотеке, обязательно при is_public = true
    locked BOOLEAN NOT NULL DEFAULT false, -- это копия чужого урока из библиотеки — нередактируема, можно только назначать своим ученикам
    source_lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL, -- на какой урок в библиотеке ссылается копия
    author_name VARCHAR(255), -- имя автора оригинала, снимок на момент копирования — для карточки копии в чужом списке
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
    -- Пул ещё не распределённых между детьми денег — всегда >= 0.
    -- Долги за конкретные проведённые занятия сюда не входят, они личные
    -- у каждого ученика (см. teacher_students.balance)
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Постоянная связь преподаватель-ученик (ростер)
CREATE TABLE IF NOT EXISTS teacher_students (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    lesson_price DECIMAL(10, 2), -- стоимость одного занятия для этого ученика
    grade INTEGER, -- класс ученика
    parent_name VARCHAR(255), -- имя родителя, для удобства (кто платит/на связи)
    -- Если family_id задан — это только долг (<= 0) за проведённые занятия,
    -- положительный остаток в этом случае живёт в families.balance.
    -- Без семьи — обычный личный баланс, может быть и + и -
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    family_id INTEGER REFERENCES families(id),
    call_link VARCHAR(500), -- необязательная ссылка на звонок (Zoom/Telemost/Telegram и т.д.)
    -- Локальное отображаемое имя ученика для этого конкретного репетитора —
    -- ученик мог указать при регистрации что угодно, а репетитору удобнее
    -- видеть своё. NULL — показываем настоящее имя из users.full_name
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, student_id)
);

-- Пополнения баланса (история платежей). Привязан либо к конкретному ученику
-- без семьи (teacher_student_id), либо к семье целиком (family_id) — деньги,
-- пополняющие семью, ещё не распределены между её учениками
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    teacher_student_id INTEGER REFERENCES teacher_students(id) ON DELETE SET NULL,
    family_id INTEGER REFERENCES families(id) ON DELETE SET NULL,
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

-- Расписание — запланированные занятия репетитора с учениками
-- (не путать с lessons/lesson_blocks — это интерактивный контент-урок,
--  а schedule_lessons — просто время+ученик в календаре преподавателя)
CREATE TABLE IF NOT EXISTS schedule_lessons (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    -- NULL допустим только для пробных уроков (is_trial=true) без карточки в ростере —
    -- тогда имя берётся из student_name
    student_id INTEGER REFERENCES users(id),
    student_name VARCHAR(255), -- имя для пробного урока без привязки к ростеру
    is_trial BOOLEAN NOT NULL DEFAULT false, -- бесплатный пробный урок
    date DATE NOT NULL,
    time VARCHAR(5) NOT NULL, -- 'HH:MM'
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    subject VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled' — меняется автоматически
    price DECIMAL(10, 2), -- копия lesson_price ученика на момент создания занятия (можно менять точечно)
    is_paid BOOLEAN NOT NULL DEFAULT false, -- списывается автоматически по завершении занятия
    notes TEXT,
    original_date DATE, -- заполняется при первом переносе — откуда перенесли
    original_time VARCHAR(5),
    -- NULL = занятие добавлено вручную (незапланированное), не NULL = сгенерировано из шаблона недели
    template_id INTEGER REFERENCES lesson_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_lessons_teacher_date ON schedule_lessons(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_lessons_student ON schedule_lessons(student_id);


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

-- Коды доступа — один код = один доступ к одной презентации,
-- presentation_id = NULL означает подписку на весь магазин (все презентации)
CREATE TABLE IF NOT EXISTS access_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL, -- сам код-ключ
    presentation_id INTEGER REFERENCES presentations(id), -- NULL = подписка на весь магазин

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

-- Коды для перехода репетитора на платный тариф AlienEdu (Pro) — та же
-- механика, что у access_codes/stereo_access_codes: код вводится один раз,
-- first_used_at запускает отсчёт valid_days
CREATE TABLE IF NOT EXISTS plan_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id), -- кто ввёл код
    plan VARCHAR(20) NOT NULL DEFAULT 'pro',
    first_used_at TIMESTAMP,
    valid_days INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plan_codes_code ON plan_codes(code);

-- Банк интерактивных моделей — HTML-виджеты (обычно с перетаскиваемыми
-- элементами), которые админ добавляет централизованно, а репетиторы
-- вставляют в свои уроки блоком типа interactive-model. frame_width/height —
-- размер окна показа модели, offset_x/y/scale — как расположен и
-- масштабирован html_code внутри этого окна (чтобы обрезать пустой фон)
CREATE TABLE IF NOT EXISTS interactive_models (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL DEFAULT '',
    html_code TEXT NOT NULL,
    frame_width INTEGER NOT NULL DEFAULT 500,
    frame_height INTEGER NOT NULL DEFAULT 400,
    offset_x INTEGER NOT NULL DEFAULT 0,
    offset_y INTEGER NOT NULL DEFAULT 0,
    scale NUMERIC(4,2) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interactive_models_subject ON interactive_models(subject);

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
