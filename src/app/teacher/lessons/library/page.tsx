'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LibraryLesson {
  id: number
  title: string
  subject: string | null
  grade: number | null
  mode: 'quiz' | 'exam'
  author_name: string
  block_count: number
}

export default function LessonLibraryPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<LibraryLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addError, setAddError] = useState('')

  const load = useCallback((query: string) => {
    setLoading(true)
    fetch(`/api/lessons/library?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        setLessons(data.lessons || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Первая загрузка и поиск идут через один и тот же дебаунс — на пустом
  // q это просто короткая задержка перед начальной загрузкой библиотеки
  useEffect(() => {
    const timer = setTimeout(() => load(q), 300)
    return () => clearTimeout(timer)
  }, [q, load])

  async function addToMyLessons(id: number) {
    setAddError('')
    setAddingId(id)
    const res = await fetch(`/api/lessons/library/${id}/copy`, { method: 'POST' })
    const data = await res.json()
    setAddingId(null)
    if (res.ok) {
      router.push(`/teacher/lessons/${data.lesson_id}`)
    } else {
      setAddError(data.error || 'Не удалось добавить урок')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif', color: '#fff', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Link href="/teacher/lessons" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Мои уроки
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📖 Библиотека уроков</h1>
        </div>

        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '1.25rem' }}>
          Готовые уроки, которыми поделились другие репетиторы. Можно добавить себе и назначить ученикам —
          менять содержимое нельзя, это может только автор.
        </div>

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Поиск по названию или предмету..."
          style={{
            width: '100%', background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '8px',
            padding: '12px 16px', color: '#fff', fontSize: '14px', marginBottom: '1.5rem', boxSizing: 'border-box',
          }}
        />

        {addError && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '1rem' }}>{addError}</p>}

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        {!loading && lessons.length === 0 && (
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: '#6b7280',
          }}>
            {q ? 'Ничего не найдено' : 'В библиотеке пока нет ни одного урока'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lessons.map(lesson => (
            <div key={lesson.id} style={{
              background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px',
              padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{lesson.title}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                  {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                  {' · '}{lesson.block_count} {lesson.block_count === 1 ? 'блок' : 'блоков'}
                  {' · '}автор: {lesson.author_name}
                </div>
              </div>
              <button
                onClick={() => addToMyLessons(lesson.id)}
                disabled={addingId === lesson.id}
                style={{
                  flexShrink: 0, background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7', color: '#4f8ef7',
                  borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: addingId === lesson.id ? 'not-allowed' : 'pointer',
                }}
              >
                {addingId === lesson.id ? 'Добавляем...' : '➕ Добавить себе'}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
