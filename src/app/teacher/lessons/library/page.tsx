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
  library_description: string | null
}

export default function LessonLibraryPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<LibraryLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addError, setAddError] = useState('')
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [descriptionLesson, setDescriptionLesson] = useState<LibraryLesson | null>(null)

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
    <div style={{ minHeight: '100vh', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif', color: 'var(--t-text)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Link href="/teacher/lessons" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>
            ← Мои уроки
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📖 Библиотека уроков</h1>
        </div>

        <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginBottom: '1.25rem' }}>
          Готовые уроки, которыми поделились репетиторы, включая твои собственные. Чужие можно добавить себе и
          назначить ученикам — менять содержимое нельзя, это может только автор. Свои можно редактировать
          и убирать из библиотеки.
        </div>

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Поиск по названию или предмету..."
          style={{
            width: '100%', background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '8px',
            padding: '12px 16px', color: 'var(--t-text)', fontSize: '14px', marginBottom: '1.5rem', boxSizing: 'border-box',
          }}
        />

        {addError && <p style={{ color: 'var(--t-danger)', fontSize: '14px', marginBottom: '1rem' }}>{addError}</p>}

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && lessons.length === 0 && (
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: 'var(--t-text-muted)',
          }}>
            {q ? 'Ничего не найдено' : 'В библиотеке пока нет ни одного урока'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lessons.map(lesson => (
            <div key={lesson.id} style={{
              background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px',
              padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                  {lesson.title}
                  {lesson.is_own && (
                    <span style={{
                      marginLeft: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(var(--t-accent-rgb),0.15)', color: 'var(--t-accent)', whiteSpace: 'nowrap',
                    }}>
                      мой урок
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                  {' · '}{lesson.block_count} {lesson.block_count === 1 ? 'блок' : 'блоков'}
                  {!lesson.is_own && <> · автор: {lesson.author_name}</>}
                </div>
              </div>
              {lesson.is_own ? (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                  <button
                    onClick={() => setDescriptionLesson(lesson)}
                    style={{
                      background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
                      borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    📄 Описание
                  </button>
                  <Link
                    href={`/teacher/lessons/${lesson.id}`}
                    style={{
                      background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)',
                      borderRadius: '8px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none',
                    }}
                  >
                    ✏️ Редактировать
                  </Link>
                  <button
                    onClick={() => removeFromLibrary(lesson.id)}
                    disabled={removingId === lesson.id}
                    title="Убрать из библиотеки"
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--t-danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-text-secondary)')}
                    style={{
                      background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
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
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                  <button
                    onClick={() => setDescriptionLesson(lesson)}
                    style={{
                      background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
                      borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    📄 Описание
                  </button>
                  <button
                    onClick={() => addToMyLessons(lesson.id)}
                    disabled={addingId === lesson.id}
                    style={{
                      flexShrink: 0, background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)',
                      borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: addingId === lesson.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {addingId === lesson.id ? 'Добавляем...' : '➕ Добавить себе'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {descriptionLesson && (
        <div
          onClick={() => setDescriptionLesson(null)}
          style={{
            position: 'fixed', inset: 0, background: 'var(--t-overlay)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
              padding: '1.75rem', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{descriptionLesson.title}</div>
              <button
                onClick={() => setDescriptionLesson(null)}
                style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: 'var(--t-text)', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {descriptionLesson.library_description || 'Автор не оставил описание.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
