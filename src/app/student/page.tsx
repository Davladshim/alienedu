'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function StudentPage() {
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/lessons')
      .then(r => r.json())
      .then(data => {
        setLessons(data.lessons || [])
        setLoading(false)
      })
  }, [])

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
          {lessons.map(lesson => (
            <Link key={lesson.id} href={`/student/lessons/${lesson.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px',
                padding: '14px 18px', cursor: 'pointer', color: '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{lesson.title}</div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                    {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ')}
                    {lesson.teacher_name ? ` · ${lesson.teacher_name}` : ''}
                  </div>
                </div>
                <span style={{ color: '#4f8ef7', fontSize: '13px' }}>Пройти →</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
