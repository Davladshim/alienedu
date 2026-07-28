// Часовые пояса — все опорные регионы России (в России нет перехода на
// летнее время с 2014 года, поэтому смещение относительно МСК всегда
// постоянно, вычислять DST не нужно)
export const RUSSIAN_TIMEZONES: { tz: string; label: string }[] = [
  { tz: 'Europe/Kaliningrad', label: 'МСК−1 (Калининград)' },
  { tz: 'Europe/Moscow', label: 'МСК (Москва)' },
  { tz: 'Europe/Samara', label: 'МСК+1 (Самара, Ижевск)' },
  { tz: 'Asia/Yekaterinburg', label: 'МСК+2 (Екатеринбург)' },
  { tz: 'Asia/Omsk', label: 'МСК+3 (Омск)' },
  { tz: 'Asia/Krasnoyarsk', label: 'МСК+4 (Красноярск)' },
  { tz: 'Asia/Irkutsk', label: 'МСК+5 (Иркутск)' },
  { tz: 'Asia/Yakutsk', label: 'МСК+6 (Якутск)' },
  { tz: 'Asia/Vladivostok', label: 'МСК+7 (Владивосток)' },
  { tz: 'Asia/Magadan', label: 'МСК+8 (Магадан)' },
  { tz: 'Asia/Kamchatka', label: 'МСК+9 (Камчатка)' },
]

export const DEFAULT_TIMEZONE = 'Europe/Moscow'

// Постгрес-строки date (тип DATE) драйвер pg по умолчанию превращает в
// JS Date — обычный String(date) даёт локальный формат ("Wed Jul 29 2026..."),
// а не "YYYY-MM-DD", поэтому явно берём именно календарную дату в UTC
export function toDateOnlyString(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// Смещение таймзоны от UTC в минутах в момент времени `at`
// (учитывает переход на летнее время там, где он есть — хотя в России его нет)
function getTimezoneOffsetMinutes(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = dtf.formatToParts(at)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const hour = map.hour === '24' ? '00' : map.hour
  const asUTC = Date.UTC(+map.year, +map.month - 1, +map.day, +hour, +map.minute, +map.second)
  return Math.round((asUTC - at.getTime()) / 60000)
}

// Переводит "настенное" время date+time в поясе timeZone в абсолютный
// момент времени (мс с начала эпохи) — нужно, чтобы сравнивать занятия
// разных репетиторов в разных поясах на пересечение по единому мировому времени
export function wallTimeToUtcMs(dateStr: string, timeStr: string, timeZone: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  const naiveUtc = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const offset = getTimezoneOffsetMinutes(timeZone, naiveUtc)
  return naiveUtc.getTime() - offset * 60000
}

// Переводит "настенное" время date+time, понимаемое как время в поясе
// fromTz, в соответствующее настенное время в поясе toTz — тот самый
// физический момент, но в других "часах на стене"
export function convertWallTime(
  dateStr: string, timeStr: string, fromTz: string, toTz: string
): { date: string; time: string } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  const naiveUtc = new Date(Date.UTC(year, month - 1, day, hour, minute))

  const offsetFrom = getTimezoneOffsetMinutes(fromTz, naiveUtc)
  const actualUtcMs = naiveUtc.getTime() - offsetFrom * 60000

  const offsetTo = getTimezoneOffsetMinutes(toTz, new Date(actualUtcMs))
  const localToMs = actualUtcMs + offsetTo * 60000
  const localTo = new Date(localToMs)

  const y = localTo.getUTCFullYear()
  const m = String(localTo.getUTCMonth() + 1).padStart(2, '0')
  const d = String(localTo.getUTCDate()).padStart(2, '0')
  const hh = String(localTo.getUTCHours()).padStart(2, '0')
  const mm = String(localTo.getUTCMinutes()).padStart(2, '0')

  return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` }
}

// Добавляет минуты к времени "HH:MM", с переносом даты при переходе через полночь
export function addMinutesToTime(dateStr: string, timeStr: string, minutesToAdd: number): { date: string; time: string } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  const base = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const result = new Date(base.getTime() + minutesToAdd * 60000)
  const y = result.getUTCFullYear()
  const m = String(result.getUTCMonth() + 1).padStart(2, '0')
  const d = String(result.getUTCDate()).padStart(2, '0')
  const hh = String(result.getUTCHours()).padStart(2, '0')
  const mm = String(result.getUTCMinutes()).padStart(2, '0')
  return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` }
}

export function timezoneLabel(tz: string): string {
  const found = RUSSIAN_TIMEZONES.find(z => z.tz === tz)
  if (found) return found.label
  return tz
}
