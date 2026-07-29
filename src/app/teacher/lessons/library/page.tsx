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
  is_own: boolean
}

export default function LessonLibraryPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<LibraryLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addError, setAddError] = useState('')
  const [removingId, setRemovingId] = useState<number | null>(null)

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

  async function removeFromLibrary(id: number) {
    if (!confirm('Убрать урок из библиотеки? Сам урок в твоём списке останется, просто перестанет быть виден другим репетиторам.')) return
    setAddError('')
    setRemovingId(id)
    const res = await fetch(`/api/lessons/library/${id}`, { method: 'DELETE' })
    setRemovingId(null)
    if (res.ok) {
      setLessons(ls => ls.filter(l => l.id !== id))
    } else {
      const data = await res.json().catch(() => ({}))
      setAddError(data.error || 'Не удалось убрать урок из библиотеки')
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
          Готовые уроки, которыми поделились репетиторы, включая твои собственные. Чужие можно добавить себе и
          назначить ученикам — менять содержимое нельзя, это может только автор. Свои можно редактировать
          и убирать из библиотеки.
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
                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                  {lesson.title}
                  {lesson.is_own && (
                    <span style={{
                      marginLeft: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(79,142,247,0.15)', color: '#4f8ef7', whiteSpace: 'nowrap',
                    }}>
                      мой урок
                    </span>
                  )}
                </div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                  {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                  {' · '}{lesson.block_count} {lesson.block_count === 1 ? 'блок' : 'блоков'}
                  {!lesson.is_own && <> · автор: {lesson.author_name}</>}
                </div>
              </div>
              {lesson.is_own ? (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                  <Link
                    href={`/teacher/lessons/${lesson.id}`}
                    style={{
                      background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7', color: '#4f8ef7',
                      borderRadius: '8px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none',
                    }}
                  >
                    ✏️ Редактировать
                  </Link>
                  <button
                    onClick={() => removeFromLibrary(lesson.id)}
                    disabled={removingId === lesson.id}
                    title="Убрать из библиотеки"
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    style={{
                      background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
                      borderRadius: '8px', padding: '8px 10px', cursor: removingId === lesson.id ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', transition: 'color 0.15s',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7 H20 M9 7 V4 A1 1 0 0 1 10 3 H14 A1 1 0 0 1 15 4 V7 M6 7 L7 20 A2 2 0 0 0 9 22 H15 A2 2 0 0 0 17 20 L18 7" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
