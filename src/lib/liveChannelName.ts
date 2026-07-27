import crypto from 'crypto'

// Имя канала Supabase Realtime для трансляции живого прогресса урока и
// команд учителя (показать решение/доску) конкретному ученику. Само имя —
// HMAC от пары урок+ученик, а не просто "lesson-{id}-{id}": id-шники в базе
// последовательные и легко угадываются, а канал без дополнительной
// авторизации на стороне Supabase доступен всем, кто знает его имя —
// поэтому имя канала само выступает секретом, известным только серверу
// (который отдаёт его только владельцу урока и назначенному ученику)
export function liveChannelName(lessonId: number | string, studentId: number | string): string {
  const hash = crypto
    .createHmac('sha256', process.env.JWT_SECRET!)
    .update(`lesson-live:${lessonId}:${studentId}`)
    .digest('hex')
    .slice(0, 32)
  return `lesson-live-${hash}`
}
