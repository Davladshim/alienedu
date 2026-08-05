<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Правило: изменения схемы БД — отдельной SQL-командой

Анна применяет правки через патч-файлы (`git am`), а не `git push` — доступ
к пушу в этом репозитории не восстановлен. Изменения в БД она вносит вручную
через SQL-редактор (Amvera/Supabase), автоматической миграции нет.

Поэтому: если патч меняет `database/schema.sql` (новая таблица, колонка,
индекс) — SQL для этого изменения нужно прислать Анне **отдельным
копируемым блоком**, который она сначала прогоняет в SQL-редакторе, и только
потом применяет сам патч (`git am`). Не полагаться на то, что она сама
выведет нужный SQL из diff по `schema.sql` — присылать готовую команду.
Предпочтительно писать её идемпотентной (`CREATE TABLE IF NOT EXISTS`,
`ADD COLUMN IF NOT EXISTS` и т.п.), чтобы повторный запуск был безопасен.
