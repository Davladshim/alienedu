'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Запланирован', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  completed: { label: 'Проведён', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  cancelled: { label: 'Отменён', color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
}

function lessonStatus(lesson: any): { label: string; color: string; bg: string } {
  const total = Number(lesson.total_blocks) || 0
  const answered = Number(lesson.answered_blocks) || 0
  if (total === 0 || answered === 0) return { label: 'Не начат', color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' }
  if (answered < total) return { label: 'В процессе', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' }
  return { label: 'Пройден', color: '#34d399', bg: 'rgba(16,185,129,0.15)' }
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
      minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif',
      color: '#fff', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
              🪐 Кабинет ученика
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Alien<span style={{ color: '#4f8ef7' }}>Edu</span> — платформа для интерактивных уроков
            </p>
          </div>
          <LogoutButton />
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          <span style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
            background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7', color: '#4f8ef7', fontWeight: 600,
          }}>
            📅 Расписание
          </span>
          <Link href="/student/lessons" style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
            background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            📚 Мои уроки
            {pendingCount > 0 && (
              <span style={{ background: '#4f8ef7', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </Link>
        </div>

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        {!loading && lessons.length === 0 && (
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: '#6b7280',
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
                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  {WEEKDAYS[(d.getDay() + 6) % 7]}, {d.getDate()} {MONTHS[d.getMonth()]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayLessons.map(lesson => {
                    const status = STATUS_LABEL[lesson.status] || STATUS_LABEL.scheduled
                    return (
                      <div key={lesson.id} style={{
                        background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px',
                        padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', width: '42px' }}>{lesson.time}</span>
                          <div>
                            <div style={{ fontSize: '14px' }}>{lesson.teacher_name}</div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
                              {[lesson.subject, `${lesson.duration_minutes} мин`].filter(Boolean).join(' · ')}
                              {lesson.original_date && ' · перенесён'}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: status.bg, color: status.color, flexShrink: 0 }}>
                          {status.label}
                        </span>
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
