'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Не начат', color: 'var(--t-text-secondary)', bg: 'rgba(107,114,128,0.15)' },
  in_progress: { label: 'В процессе', color: 'var(--t-warning)', bg: 'rgba(var(--t-warning-rgb),0.15)' },
  completed: { label: 'Пройден', color: 'var(--t-success)', bg: 'rgba(var(--t-success2-rgb),0.15)' },
}

export default function LessonsPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [matrixStudents, setMatrixStudents] = useState<any[]>([])
  const [matrixLessons, setMatrixLessons] = useState<any[]>([])
  const [matrixCells, setMatrixCells] = useState<any[]>([])
  const [matrixLoading, setMatrixLoading] = useState(true)
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)

  useEffect(() => {
    fetch('/api/lessons')
      .then(r => r.json())
      .then(data => {
        setLessons(data.lessons || [])
        setLoading(false)
      })
    fetch('/api/lessons/assignment-matrix')
      .then(r => r.json())
      .then(data => {
        setMatrixStudents(data.students || [])
        setMatrixLessons(data.lessons || [])
        setMatrixCells(data.cells || [])
        setMatrixLoading(false)
      })
    fetch('/api/me').then(r => r.json()).then(data => setPlan(data.plan === 'pro' ? 'pro' : 'free'))
  }, [])

  const ownLessonsCount = lessons.filter(l => !l.locked).length
  const libraryLessonsCount = lessons.filter(l => l.locked).length

  function cellStatus(studentId: number, lessonId: number): string | null {
    const cell = matrixCells.find(c => c.student_id === studentId && c.lesson_id === lessonId)
    return cell ? cell.status : null
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif',
      color: 'var(--t-text)', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Link href="/teacher" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>
            ← Кабинет
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📚 Мои уроки</h1>
        </div>

        {!matrixLoading && matrixStudents.length > 0 && matrixLessons.length > 0 && (
          <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Кто что прошёл</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--t-text-secondary)', position: 'sticky', left: 0, background: 'var(--t-card)' }}>Ученик</th>
                    {matrixLessons.map(l => (
                      <th key={l.id} title={l.title} style={{ padding: '6px 10px', color: 'var(--t-text-secondary)', fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixStudents.map(s => (
                    <tr key={s.id}>
                      <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--t-card)' }}>{s.full_name}</td>
                      {matrixLessons.map(l => {
                        const status = cellStatus(s.id, l.id)
                        const st = status ? STATUS_LABEL[status] : null
                        const canWatch = status && status !== 'completed' && l.mode === 'quiz'
                        return (
                          <td key={l.id} style={{ padding: '6px 10px', textAlign: 'center' }}>
                            {!st && <span style={{ color: 'var(--t-text-faint)' }}>—</span>}
                            {st && !canWatch && (
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: st.color }} title={st.label} />
                            )}
                            {st && canWatch && (
                              <Link
                                href={`/teacher/lessons/${l.id}/watch/${s.id}`}
                                title={`${st.label} · смотреть, как решает`}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', textDecoration: 'none' }}
                              >
                                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: st.color, boxShadow: '0 0 0 2px rgba(var(--t-accent-rgb),0.4)' }} />
                              </Link>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--t-text-secondary)', flexWrap: 'wrap' }}>
              {Object.values(STATUS_LABEL).map(st => (
                <span key={st.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                  {st.label}
                </span>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>— не назначен</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--t-text-faint)', boxShadow: '0 0 0 2px rgba(var(--t-accent-rgb),0.4)', display: 'inline-block' }} />
                кружок с ободком — нажми, чтобы посмотреть процесс вживую
              </span>
            </div>
          </div>
        )}

        {plan === 'free' && !loading && (
          <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginBottom: '1rem', textAlign: 'right' }}>
            Бесплатный тариф: {ownLessonsCount} из 1 своего урока, {libraryLessonsCount} из 5 из библиотеки.{' '}
            <Link href="/teacher/tariffs" style={{ color: 'var(--t-accent)' }}>Перейти на Pro</Link>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '1.5rem' }}>
          <button
            onClick={() => router.push('/teacher/lessons/library')}
            style={{
              background: 'transparent', color: 'var(--t-info)', border: '1px solid rgba(var(--t-info-rgb),0.4)',
              borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            📖 Библиотека уроков
          </button>
          <button
            onClick={() => router.push('/teacher/lessons/new')}
            style={{
              background: 'linear-gradient(135deg, var(--t-accent), var(--t-accent2))', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Новый урок
          </button>
        </div>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && lessons.length === 0 && (
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: 'var(--t-text-muted)',
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
                background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px',
                padding: '14px 18px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{lesson.title}</span>
                  {lesson.locked && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(var(--t-info-rgb),0.15)', color: 'var(--t-info)', whiteSpace: 'nowrap',
                    }}>
                      📖 Из библиотеки{lesson.author_name ? ` · ${lesson.author_name}` : ''}
                    </span>
                  )}
                  {!lesson.locked && lesson.is_public && lesson.status === 'published' && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(var(--t-success-rgb),0.15)', color: 'var(--t-success)', whiteSpace: 'nowrap',
                    }}>
                      🌐 В библиотеке
                    </span>
                  )}
                  {!lesson.locked && lesson.is_public && lesson.status !== 'published' && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(var(--t-warning-rgb),0.15)', color: 'var(--t-warning)', whiteSpace: 'nowrap',
                    }}>
                      ⏳ Появится в библиотеке после публикации
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                  {Number(lesson.assigned_count) > 0 && ` · прошли ${lesson.completed_count} из ${lesson.assigned_count}`}
                </div>
              </div>
              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                background: lesson.status === 'published' ? 'rgba(var(--t-success2-rgb),0.15)' : 'rgba(107,114,128,0.15)',
                color: lesson.status === 'published' ? 'var(--t-success)' : 'var(--t-text-secondary)',
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
