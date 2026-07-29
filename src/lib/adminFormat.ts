// Общие мелочи форматирования для админ-панелей (платформа, магазин,
// StereoSpace) — чтобы не дублировать в каждой

export function daysWord(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}

export function daysLeftFrom(firstUsedAt: string, validDays: number): number {
  const expiresAt = new Date(firstUsedAt).getTime() + validDays * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
}
