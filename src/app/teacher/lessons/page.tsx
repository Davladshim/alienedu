'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Не начат', color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' },
  in_progress: { label: 'В процессе', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  completed: { label: 'Пройден', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
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

        {!matrixLoading && matrixStudents.length > 0 && matrixLessons.length > 0 && (
          <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Кто что прошёл</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 10px', color: '#9ca3af', position: 'sticky', left: 0, background: '#1a1d27' }}>Ученик</th>
                    {matrixLessons.map(l => (
                      <th key={l.id} title={l.title} style={{ padding: '6px 10px', color: '#9ca3af', fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixStudents.map(s => (
                    <tr key={s.id}>
                      <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#1a1d27' }}>{s.full_name}</td>
                      {matrixLessons.map(l => {
                        const status = cellStatus(s.id, l.id)
                        const st = status ? STATUS_LABEL[status] : null
                        const canWatch = status && status !== 'completed' && l.mode === 'quiz'
                        return (
                          <td key={l.id} style={{ padding: '6px 10px', textAlign: 'center' }}>
                            {!st && <span style={{ color: '#374151' }}>—</span>}
                            {st && !canWatch && (
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: st.color }} title={st.label} />
                            )}
                            {st && canWatch && (
                              <Link
                                href={`/teacher/lessons/${l.id}/watch/${s.id}`}
                                title={`${st.label} · смотреть, как решает`}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', textDecoration: 'none' }}
                              >
                                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: st.color, boxShadow: '0 0 0 2px rgba(79,142,247,0.4)' }} />
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
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
              {Object.values(STATUS_LABEL).map(st => (
                <span key={st.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                  {st.label}
                </span>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>— не назначен</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4b5563', boxShadow: '0 0 0 2px rgba(79,142,247,0.4)', display: 'inline-block' }} />
                кружок с ободком — нажми, чтобы посмотреть процесс вживую
              </span>
            </div>
          </div>
        )}

        {plan === 'free' && !loading && (
          <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '1rem', textAlign: 'right' }}>
            Бесплатный тариф: {ownLessonsCount} из 1 своего урока, {libraryLessonsCount} из 5 из библиотеки.{' '}
            <Link href="/teacher/tariffs" style={{ color: '#4f8ef7' }}>Перейти на Pro</Link>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '1.5rem' }}>
          <button
            onClick={() => router.push('/teacher/lessons/library')}
            style={{
              background: 'transparent', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.4)',
              borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            📖 Библиотека уроков
          </button>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{lesson.title}</span>
                  {lesson.locked && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(96,165,250,0.15)', color: '#93c5fd', whiteSpace: 'nowrap',
                    }}>
                      📖 Из библиотеки{lesson.author_name ? ` · ${lesson.author_name}` : ''}
                    </span>
                  )}
                  {!lesson.locked && lesson.is_public && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(52,211,153,0.15)', color: '#34d399', whiteSpace: 'nowrap',
                    }}>
                      🌐 В библиотеке
                    </span>
                  )}
                </div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                  {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                  {Number(lesson.assigned_count) > 0 && ` · прошли ${lesson.completed_count} из ${lesson.assigned_count}`}
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
