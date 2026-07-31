'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Не начат', color: 'var(--t-text-secondary)', bg: 'rgba(107,114,128,0.15)' },
  in_progress: { label: 'В процессе', color: 'var(--t-warning)', bg: 'rgba(var(--t-warning-rgb),0.15)' },
  completed: { label: 'Пройден', color: 'var(--t-success)', bg: 'rgba(var(--t-success2-rgb),0.15)' },
}

function formatDateTimeRu(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

export default function LessonsPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [assignments, setAssignments] = useState<any[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [finishingId, setFinishingId] = useState<number | null>(null)
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)

  useEffect(() => {
    fetch('/api/lessons')
      .then(r => r.json())
      .then(data => {
        setLessons(data.lessons || [])
        setLoading(false)
      })
    fetch('/api/lessons/assignments')
      .then(r => r.json())
      .then(data => {
        setAssignments(data.assignments || [])
        setAssignmentsLoading(false)
      })
      .catch(() => setAssignmentsLoading(false))
    fetch('/api/me').then(r => r.json()).then(data => setPlan(data.plan === 'pro' ? 'pro' : 'free'))
  }, [])

  const ownLessonsCount = lessons.filter(l => !l.locked).length
  const libraryLessonsCount = lessons.filter(l => l.locked).length

  async function finishAssignment(a: any) {
    if (!confirm(`Завершить урок «${a.lesson_title}» для ${a.student_name}?\n\nОн уйдёт из этой таблицы и будет считаться полностью пройденным и проверенным. Отменить это действие будет нельзя.`)) return
    setFinishingId(a.id)
    const res = await fetch(`/api/lessons/assignments/${a.id}/finish`, { method: 'POST' })
    setFinishingId(null)
    if (res.ok) setAssignments(list => list.filter(x => x.id !== a.id))
  }

  return (
    <div style={{
      minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif',
      color: 'var(--t-text)', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Link href="/teacher" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>
            ← Кабинет
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📚 Мои уроки</h1>
        </div>

        {!assignmentsLoading && assignments.length > 0 && (
          <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Назначенные уроки</div>
            <div style={{ overflowX: 'auto', maxHeight: '476px', overflowY: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '100%' }}>
                <thead>
                  <tr>
                    {['Ученик', 'Название урока', 'Дата назначения', 'Дата начала', 'Статус', 'Реальное время', 'Результаты', ''].map(h => (
                      <th key={h} style={{
                        textAlign: 'center', padding: '6px 10px', color: 'var(--t-text-secondary)', fontWeight: 600,
                        position: 'sticky', top: 0, background: 'var(--t-card)', whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => {
                    const st = STATUS_LABEL[a.status] || STATUS_LABEL.not_started
                    const canWatchLive = a.lesson_mode === 'quiz' && a.status !== 'completed'
                    const canViewResults = a.status === 'completed'
                    return (
                      <tr key={a.id} style={{ borderTop: '1px solid var(--t-border)' }}>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', textAlign: 'center' }}>{a.student_name}</td>
                        <td style={{ padding: '8px 10px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }} title={a.lesson_title}>
                          {a.lesson_title}
                        </td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: 'var(--t-text-secondary)', textAlign: 'center' }}>{formatDateTimeRu(a.assigned_at)}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: 'var(--t-text-secondary)', textAlign: 'center' }}>{formatDateTimeRu(a.started_at)}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', color: st.color, background: st.bg }}>{st.label}</span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {canWatchLive ? (
                            <Link href={`/teacher/lessons/${a.lesson_id}/watch/${a.student_id}`} style={{
                              color: 'var(--t-accent)', border: '1px solid var(--t-accent)', borderRadius: '6px',
                              padding: '4px 10px', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>
                              Просмотр
                            </Link>
                          ) : (
                            <span
                              title={a.lesson_mode !== 'quiz' ? 'Недоступно для контрольных уроков' : 'Урок уже завершён'}
                              style={{ color: 'var(--t-text-faint)', border: '1px solid var(--t-border)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                            >
                              Просмотр
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {canViewResults ? (
                            <Link href={`/teacher/lessons/${a.lesson_id}/results/${a.student_id}`} style={{
                              color: 'var(--t-accent)', border: '1px solid var(--t-accent)', borderRadius: '6px',
                              padding: '4px 10px', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>
                              Просмотр
                            </Link>
                          ) : (
                            <span
                              title="Доступно после завершения урока учеником"
                              style={{ color: 'var(--t-text-faint)', border: '1px solid var(--t-border)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                            >
                              Просмотр
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => finishAssignment(a)}
                            disabled={finishingId === a.id}
                            style={{
                              background: 'rgba(var(--t-danger-rgb),0.12)', border: '1px solid var(--t-danger)', color: 'var(--t-danger-soft)',
                              borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: finishingId === a.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                            }}
                          >
                            {finishingId === a.id ? '...' : 'Завершить'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
                  {!lesson.locked && lesson.is_public && lesson.status !== 'published' && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(var(--t-warning-rgb),0.15)', color: 'var(--t-warning)', whiteSpace: 'nowrap',
                    }}>
                      ⏳ Появится в библиотеке после публикации
                    </span>
                  )}
                  {!lesson.locked && lesson.is_public && lesson.status === 'published' && lesson.moderation_status === 'pending' && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(var(--t-warning-rgb),0.15)', color: 'var(--t-warning)', whiteSpace: 'nowrap',
                    }}>
                      ⏳ На модерации
                    </span>
                  )}
                  {!lesson.locked && lesson.is_public && lesson.status === 'published' && lesson.moderation_status === 'approved' && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(var(--t-success-rgb),0.15)', color: 'var(--t-success)', whiteSpace: 'nowrap',
                    }}>
                      🌐 В библиотеке
                    </span>
                  )}
                  {!lesson.locked && lesson.is_public && lesson.status === 'published' && lesson.moderation_status === 'rejected' && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(var(--t-danger-rgb),0.15)', color: 'var(--t-danger)', whiteSpace: 'nowrap',
                    }}>
                      ❌ Отклонён модератором
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  {[lesson.subject, lesson.grade ? `${lesson.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                  {Number(lesson.assigned_count) > 0 && ` · прошли ${lesson.completed_count} из ${lesson.assigned_count}`}
                </div>
                {!lesson.locked && lesson.moderation_status === 'rejected' && lesson.moderation_reason && (
                  <div style={{ color: 'var(--t-danger)', fontSize: '12px', marginTop: '4px' }}>
                    Причина: {lesson.moderation_reason}
                  </div>
                )}
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
