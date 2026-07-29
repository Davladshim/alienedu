'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

function lessonStatus(lesson: any): { label: string; color: string; bg: string } {
  const total = Number(lesson.total_blocks) || 0
  const answered = Number(lesson.answered_blocks) || 0
  if (total === 0 || answered === 0) return { label: 'Не начат', color: 'var(--t-text-secondary)', bg: 'rgba(107,114,128,0.15)' }
  if (answered < total) return { label: 'В процессе', color: 'var(--t-warning)', bg: 'rgba(251,191,36,0.15)' }
  return { label: 'Пройден', color: 'var(--t-success)', bg: 'rgba(16,185,129,0.15)' }
}

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/student/lessons').then(r => r.json()),
      fetch('/api/student/progress').then(r => r.json()),
    ]).then(([lessonsData, progressData]) => {
      setLessons(lessonsData.lessons || [])
      setProgress(progressData)
      setLoading(false)
    })
  }, [])

  const completedCount = lessons.filter(l => {
    const total = Number(l.total_blocks) || 0
    const answered = Number(l.answered_blocks) || 0
    return total > 0 && answered >= total
  }).length
  const pendingCount = lessons.length - completedCount

  const overallCorrect = Number(progress?.overall?.correct) || 0
  const overallGradable = Number(progress?.overall?.gradable) || 0
  const overallPercent = overallGradable > 0 ? Math.round((overallCorrect / overallGradable) * 100) : null

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif',
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
          <Link href="/student" style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
            background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
          }}>
            📅 Расписание
          </Link>
          <span style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
            background: 'rgba(79,142,247,0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            📚 Мои уроки
            {pendingCount > 0 && (
              <span style={{ background: 'var(--t-accent)', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </span>
        </div>

        {!loading && lessons.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px',
            marginBottom: '1.5rem',
          }}>
            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '6px' }}>Пройдено уроков</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{completedCount} / {lessons.length}</div>
            </div>
            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '6px' }}>Средний процент правильных</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{overallPercent === null ? '—' : `${overallPercent}%`}</div>
            </div>
          </div>
        )}

        {!loading && progress?.bySubject?.length > 0 && (
          <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Прогресс по предметам</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {progress.bySubject.map((s: any) => {
                const correct = Number(s.correct) || 0
                const gradable = Number(s.gradable) || 0
                const percent = gradable > 0 ? Math.round((correct / gradable) * 100) : 0
                return (
                  <div key={s.subject}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>{s.subject}</span>
                      <span style={{ color: 'var(--t-text-muted)' }}>{gradable > 0 ? `${percent}% (${correct}/${gradable})` : '—'}</span>
                    </div>
                    <div style={{ background: 'var(--t-bg)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--t-accent)', height: '100%', width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem' }}>📚 Мои уроки</h2>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && lessons.length === 0 && (
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: 'var(--t-text-muted)',
          }}>
            Пока нет назначенных уроков — обратись к своему преподавателю
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lessons.map(lesson => {
            const status = lessonStatus(lesson)
            const gradable = Number(lesson.gradable_count) || 0
            const correct = Number(lesson.correct_count) || 0
            const isDone = status.label === 'Пройден'
            return (
              <Link key={lesson.id} href={`/student/lessons/${lesson.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px',
                  padding: '14px 18px', cursor: 'pointer', color: 'var(--t-text)', opacity: isDone ? 0.6 : 1,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{lesson.title}</div>
                    <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                      {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ')}
                      {lesson.teacher_name ? ` · ${lesson.teacher_name}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {isDone && gradable > 0 && (
                      <span style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>{correct}/{gradable}</span>
                    )}
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}
