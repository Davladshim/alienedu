'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

function lessonStatus(lesson: any): { label: string; color: string; bg: string } {
  const total = Number(lesson.total_blocks) || 0
  const answered = Number(lesson.answered_blocks) || 0
  if (total === 0 || answered === 0) return { label: 'Не начат', color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' }
  if (answered < total) return { label: 'В процессе', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' }
  return { label: 'Пройден', color: '#34d399', bg: 'rgba(16,185,129,0.15)' }
}

export default function StudentPage() {
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

  const overallCorrect = Number(progress?.overall?.correct) || 0
  const overallGradable = Number(progress?.overall?.gradable) || 0
  const overallPercent = overallGradable > 0 ? Math.round((overallCorrect / overallGradable) * 100) : null

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif',
      color: '#fff', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            🪐 Кабинет ученика
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Alien<span style={{ color: '#4f8ef7' }}>Edu</span> — платформа для интерактивных уроков
          </p>
        </div>

        {!loading && lessons.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px',
            marginBottom: '1.5rem',
          }}>
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>Пройдено уроков</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{completedCount} / {lessons.length}</div>
            </div>
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>Средний процент правильных</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{overallPercent === null ? '—' : `${overallPercent}%`}</div>
            </div>
          </div>
        )}

        {!loading && progress?.bySubject?.length > 0 && (
          <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Прогресс по предметам</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {progress.bySubject.map((s: any) => {
                const correct = Number(s.correct) || 0
                const gradable = Number(s.gradable) || 0
                const percent = gradable > 0 ? Math.round((correct / gradable) * 100) : 0
                return (
                  <div key={s.subject}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>{s.subject}</span>
                      <span style={{ color: '#6b7280' }}>{gradable > 0 ? `${percent}% (${correct}/${gradable})` : '—'}</span>
                    </div>
                    <div style={{ background: '#0f1117', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ background: '#4f8ef7', height: '100%', width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem' }}>📚 Мои уроки</h2>

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        {!loading && lessons.length === 0 && (
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: '#6b7280',
          }}>
            Пока нет назначенных уроков — обратись к своему преподавателю
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lessons.map(lesson => {
            const status = lessonStatus(lesson)
            const gradable = Number(lesson.gradable_count) || 0
            const correct = Number(lesson.correct_count) || 0
            return (
              <Link key={lesson.id} href={`/student/lessons/${lesson.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px',
                  padding: '14px 18px', cursor: 'pointer', color: '#fff',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{lesson.title}</div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                      {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ')}
                      {lesson.teacher_name ? ` · ${lesson.teacher_name}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {status.label === 'Пройден' && gradable > 0 && (
                      <span style={{ color: '#6b7280', fontSize: '13px' }}>{correct}/{gradable}</span>
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
