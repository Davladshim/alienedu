'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { subjectColor, SubjectIcon } from '@/components/subjects'

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Запланирован', color: 'var(--t-info)', bg: 'rgba(96,165,250,0.15)' },
  completed: { label: 'Проведён', color: 'var(--t-success)', bg: 'rgba(16,185,129,0.15)' },
  cancelled: { label: 'Отменён', color: 'var(--t-pink)', bg: 'rgba(244,114,182,0.15)' },
}

function lessonStatus(lesson: any): { label: string; color: string; bg: string } {
  const total = Number(lesson.total_blocks) || 0
  const answered = Number(lesson.answered_blocks) || 0
  if (total === 0 || answered === 0) return { label: 'Не начат', color: 'var(--t-text-secondary)', bg: 'rgba(107,114,128,0.15)' }
  if (answered < total) return { label: 'В процессе', color: 'var(--t-warning)', bg: 'rgba(251,191,36,0.15)' }
  return { label: 'Пройден', color: 'var(--t-success)', bg: 'rgba(16,185,129,0.15)' }
}

export default function StudentSchedulePage() {
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch('/api/student/schedule').then(r => r.json()).then(data => {
      setLessons(data.lessons || [])
      setLoading(false)
    })
    fetch('/api/student/lessons').then(r => r.json()).then(data => {
      const list = data.lessons || []
      setPendingCount(list.filter((l: any) => lessonStatus(l).label !== 'Пройден').length)
    })
  }, [])

  const byDate: Record<string, any[]> = {}
  for (const lesson of lessons) {
    const key = String(lesson.date).slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(lesson)
  }
  const dateKeys = Object.keys(byDate).sort()

  return (
    <div style={{
      minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif',
      color: 'var(--t-text)', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            🪐 Кабинет ученика
          </h1>
          <p style={{ color: 'var(--t-text-muted)', fontSize: '14px', margin: 0 }}>
            Alien<span style={{ color: 'var(--t-accent)' }}>Edu</span> — платформа для интерактивных уроков
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          <span style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
            background: 'rgba(79,142,247,0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)', fontWeight: 600,
          }}>
            📅 Расписание
          </span>
          <Link href="/student/lessons" style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
            background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            📚 Мои уроки
            {pendingCount > 0 && (
              <span style={{ background: 'var(--t-accent)', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </Link>
        </div>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && lessons.length === 0 && (
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: 'var(--t-text-muted)',
          }}>
            Ближайших занятий пока нет
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {dateKeys.map(dateKey => {
            const d = new Date(dateKey + 'T00:00:00')
            const dayLessons = byDate[dateKey]
            return (
              <div key={dateKey}>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  {WEEKDAYS[(d.getDay() + 6) % 7]}, {d.getDate()} {MONTHS[d.getMonth()]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayLessons.map(lesson => {
                    const status = STATUS_LABEL[lesson.status] || STATUS_LABEL.scheduled
                    const color = subjectColor(lesson.subject)
                    return (
                      <div key={lesson.id} style={{
                        background: 'var(--t-card)', border: `2px solid ${color}`, borderRadius: '12px',
                        padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap' }}>{lesson.time} · {lesson.end_time}</span>
                          <div>
                            <div style={{ fontSize: '14px' }}>{lesson.teacher_name}</div>
                            <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {lesson.subject && (
                                <span style={{ color, display: 'flex', lineHeight: 0 }}>
                                  <SubjectIcon subject={lesson.subject} size={12} />
                                </span>
                              )}
                              <span>
                                {[lesson.subject, `${lesson.duration_minutes} мин`].filter(Boolean).join(' · ')}
                                {lesson.original_date && ' · перенесён'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {lesson.call_link && (
                            <a
                              href={lesson.call_link} target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: '12px', padding: '5px 12px', borderRadius: '8px', textDecoration: 'none',
                                background: 'rgba(79,142,247,0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)',
                              }}
                            >
                              Перейти по ссылке урока
                            </a>
                          )}
                          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: status.bg, color: status.color, flexShrink: 0 }}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
