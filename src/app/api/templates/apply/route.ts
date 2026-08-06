import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}
function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}
// pg возвращает колонки DATE как Date-объект в UTC-полночь, а даты, с
// которыми мы тут считаем (today/targetDate), строятся в локальной
// полночи сервера — сравнивать их как Date напрямую нельзя (в любом
// часовом поясе, кроме UTC, это на несколько часов сдвигает результат
// и может исключить ближайшую к start_date неделю). Поэтому везде
// сравниваем только строки 'YYYY-MM-DD'.
function toISODateStr(value: unknown): string {
  if (value instanceof Date) return toISODate(value)
  return String(value).slice(0, 10)
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { weeks, endDate } = await request.json()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = toISODate(today)
    const currentWeekStart = startOfWeek(today)

    // weekCount — верхняя граница числа итераций на каждый шаблон. Раньше
    // недели считались календарно от понедельника ТЕКУЩЕЙ недели: если день
    // недели шаблона в этой неделе уже прошёл (например, сегодня четверг,
    // а урок по понедельникам), эта неделя вхолостую "съедала" одну из N
    // недель, не породив ни одного занятия — на выходе получалось N-1
    // занятие вместо N. Теперь для каждого шаблона первое занятие ищется
    // от сегодняшнего дня (а не от начала недели), поэтому такой недостачи
    // больше не бывает — см. цикл ниже
    let weekCount: number
    if (endDate) {
      const end = new Date(`${endDate}T00:00:00`)
      const diffDays = Math.ceil((end.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24))
      // +1 неделя про запас: якорь первого занятия шаблона теперь считается
      // от today, а не от currentWeekStart, и может уйти на до 13 дней позже
      // currentWeekStart — без запаса можно не дотянуть до endDate ровно на
      // одно занятие. Настоящая отсечка всё равно ниже, по самой дате endDate
      weekCount = Math.min(Math.max(Math.ceil((diffDays + 1) / 7) + 1, 1), 121)
    } else {
      weekCount = Math.min(Math.max(Number(weeks) || 4, 1), 120)
    }

    const templatesResult = await query(
      `SELECT * FROM lesson_templates WHERE teacher_id = $1`,
      [decoded.id]
    )
    const templates = templatesResult.rows

    let created = 0
    let skipped = 0

    for (const tpl of templates) {
      const startDateStr = toISODateStr(tpl.start_date)
      const effectiveStartStr = startDateStr > todayStr ? startDateStr : todayStr
      const effectiveStart = new Date(`${effectiveStartStr}T00:00:00`)
      const effectiveStartDow = (effectiveStart.getDay() + 6) % 7 // 0=понедельник, как и tpl.day_of_week
      const daysUntilFirst = (tpl.day_of_week - effectiveStartDow + 7) % 7
      const firstOccurrence = addDays(effectiveStart, daysUntilFirst)

      for (let w = 0; w < weekCount; w++) {
        const targetDate = addDays(firstOccurrence, w * 7)
        const dateStr = toISODate(targetDate)

        // Даты только растут с каждой итерацией — как только упёрлись
        // в end_date шаблона (если задан) или в дедлайн из endDate пресета,
        // дальше для этого шаблона смысла продолжать нет
        if (tpl.end_date && dateStr > toISODateStr(tpl.end_date)) break
        if (endDate && dateStr > endDate) break

        // Тот же слот уже занят — либо ровно на этом месте (неперенесённый урок или
        // конфликт с чем-то ещё), либо этот же шаблон уже породил занятие на эту дату,
        // но его потом перенесли на другое время (original_date/time хранит, откуда) —
        // такое занятие всё равно "закрывает" эту неделю шаблона, повторно создавать не нужно
        const existing = await query(
          `SELECT 1 FROM schedule_lessons
           WHERE teacher_id = $1 AND student_id = $2
             AND ((date = $3 AND time = $4) OR (template_id = $5 AND original_date = $3 AND original_time = $4))`,
          [decoded.id, tpl.student_id, dateStr, tpl.time, tpl.id]
        )
        if (existing.rows.length > 0) {
          skipped++
          continue
        }

        await query(
          `INSERT INTO schedule_lessons (teacher_id, student_id, date, time, duration_minutes, subject, price, template_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [decoded.id, tpl.student_id, dateStr, tpl.time, tpl.duration_minutes, tpl.subject, tpl.price, tpl.id]
        )
        created++
      }
    }

    return NextResponse.json({ success: true, created, skipped })
  } catch (error) {
    console.error('Ошибка применения шаблона:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
