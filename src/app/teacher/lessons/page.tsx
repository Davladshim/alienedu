'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LessonsPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/lessons')
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Кабинет
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📚 Мои уроки</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <button
            onClick={() => router.push('/teacher/lessons/new')}
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Новый урок
          </button>
        </div>

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        {!loading && lessons.length === 0 && (
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: '#6b7280',
          }}>
            Пока нет ни одного урока — нажми «Новый урок»
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              onClick={() => router.push(`/teacher/lessons/${lesson.id}`)}
              style={{
                background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px',
                padding: '14px 18px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{lesson.title}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                  {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                </div>
              </div>
              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                background: lesson.status === 'published' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                color: lesson.status === 'published' ? '#34d399' : '#9ca3af',
              }}>
                {lesson.status === 'published' ? 'Опубликован' : 'Черновик'}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
