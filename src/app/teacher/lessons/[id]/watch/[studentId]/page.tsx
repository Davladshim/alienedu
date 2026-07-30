'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { blockRegistry, Formula, type LessonBlockData } from '@/components/lesson-blocks'
import { LiveTeacherBoard } from '@/components/lesson-blocks/LiveTeacherBoard'
import { useLiveChannel } from '@/components/lesson-blocks/useLiveChannel'

interface BlockStatus {
  done: boolean
  isCorrect: boolean | null
  skipped: boolean
  attempts: number
}

interface Attempt {
  block_id: string | number
  answer: unknown
  is_correct: boolean | null
}

const EMPTY_STATUS: BlockStatus = { done: false, isCorrect: null, skipped: false, attempts: 0 }

function blockPreview(block: LessonBlockData): string {
  const c = block.content as any
  if (typeof c.question === 'string' && c.question) return c.question
  if (typeof c.instruction === 'string' && c.instruction) return c.instruction
  if (typeof c.template === 'string' && c.template) return c.template
  return blockRegistry[block.type].label
}

function statusBadge(status: BlockStatus): { text: string; color: string; bg: string } {
  if (!status.attempts && !status.done) return { text: 'не начат', color: 'var(--t-text-muted)', bg: 'rgba(107,114,128,0.12)' }
  if (status.skipped) return { text: 'пропущено', color: 'var(--t-text-secondary)', bg: 'rgba(107,114,128,0.15)' }
  if (!status.done) return { text: 'в процессе', color: 'var(--t-warning)', bg: 'rgba(var(--t-warning-rgb),0.15)' }
  if (status.isCorrect === true) return { text: 'верно', color: 'var(--t-success)', bg: 'rgba(var(--t-success2-rgb),0.15)' }
  if (status.isCorrect === false) return { text: 'неверно', color: 'var(--t-pink)', bg: 'rgba(var(--t-pink-rgb),0.15)' }
  return { text: 'отправлено', color: 'var(--t-info)', bg: 'rgba(var(--t-info-rgb),0.15)' }
}

export default function WatchLessonPage() {
  const params = useParams()
  const lessonId = params.id as string
  const studentId = params.studentId as string

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [studentName, setStudentName] = useState('')
  const [blocks, setBlocks] = useState<LessonBlockData[]>([])
  const [liveChannelId, setLiveChannelId] = useState<string | null>(null)

  const [statuses, setStatuses] = useState<Record<string, BlockStatus>>({})
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [studentOnline, setStudentOnline] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [boardOpen, setBoardOpen] = useState(false)
  const [liveTimedOut, setLiveTimedOut] = useState(false)

  const live = useLiveChannel(liveChannelId, {
    onBroadcast: {
      progress: payload => {
        const p = payload as { index: number; finished: boolean; statuses: Record<string, BlockStatus> }
        setCurrentIndex(p.finished ? null : p.index)
        setStatuses(p.statuses || {})
      },
    },
    onPresenceSync: states => setStudentOnline(states.length > 0),
  })
  const boardOpenRef = useRef(false)
  useEffect(() => {
    boardOpenRef.current = boardOpen
  }, [boardOpen])

  // Показ решения/доски работает через тот же живой канал, что и трансляция
  // прогресса — если он не смог подключиться (например, не настроен Supabase
  // на сервере), кнопки будут молча ничего не делать. Явно предупреждаем,
  // а не оставляем репетитора гадать, почему "ничего не происходит"
  const liveReadyRef = useRef(false)
  useEffect(() => { liveReadyRef.current = live.ready }, [live.ready])
  useEffect(() => {
    if (!liveChannelId) return
    queueMicrotask(() => setLiveTimedOut(false))
    const timer = setTimeout(() => {
      if (!liveReadyRef.current) setLiveTimedOut(true)
    }, 6000)
    return () => clearTimeout(timer)
  }, [liveChannelId])

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/watch?student_id=${studentId}`)
      .then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          setErrorMsg(data.error || 'Не удалось загрузить')
          setLoading(false)
          return
        }
        const data = await r.json()
        const loadedBlocks: LessonBlockData[] = (data.blocks || []).map((b: any) => ({ id: String(b.id), type: b.type, content: b.content }))
        setLessonTitle(data.lesson.title)
        setStudentName(data.student.full_name)
        setBlocks(loadedBlocks)
        setLiveChannelId(data.live_channel)

        const byBlock: Record<string, Attempt[]> = {}
        for (const a of (data.attempts || []) as Attempt[]) {
          const key = String(a.block_id)
          if (!byBlock[key]) byBlock[key] = []
          byBlock[key].push(a)
        }
        const initial: Record<string, BlockStatus> = {}
        for (const b of loadedBlocks) {
          const rows = byBlock[b.id]
          if (!rows || rows.length === 0) continue
          const last = rows[rows.length - 1]
          const isSkip = last.answer === null && last.is_correct === false
          initial[b.id] = { done: true, isCorrect: isSkip ? null : last.is_correct, skipped: isSkip, attempts: rows.length }
        }
        setStatuses(initial)
        setLoading(false)
      })
      .catch(() => { setErrorMsg('Не удалось загрузить'); setLoading(false) })
  }, [lessonId, studentId])

  // Если учитель уходит со страницы, пока доска открыта — гасим её и у
  // ученика, а не оставляем висеть окошко без ведущего
  useEffect(() => {
    return () => {
      if (boardOpenRef.current) live.broadcast('hide-board', {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleSolution(blockId: string) {
    const next = !revealed[blockId]
    setRevealed(s => ({ ...s, [blockId]: next }))
    live.broadcast(next ? 'show-solution' : 'hide-solution', { blockId })
  }

  function toggleBoard() {
    const next = !boardOpen
    setBoardOpen(next)
    live.broadcast(next ? 'show-board' : 'hide-board', {})
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Загрузка...
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div>{errorMsg}</div>
        <Link href={`/teacher/lessons/${lessonId}`} style={{ color: 'var(--t-accent)', fontSize: '14px' }}>← К уроку</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif', color: 'var(--t-text)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <Link href={`/teacher/lessons/${lessonId}`} style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>
          ← {lessonTitle}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 4px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>👁 {studentName}</h1>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            color: studentOnline ? 'var(--t-success)' : 'var(--t-text-muted)',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: studentOnline ? 'var(--t-success)' : 'var(--t-text-faint)' }} />
            {studentOnline ? 'ученик сейчас в уроке' : 'ученик офлайн'}
          </span>
        </div>
        <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginBottom: '1.25rem' }}>
          Показ решения и доски видны только ученику прямо сейчас — ничего не сохраняется.
        </div>

        {liveTimedOut && !live.ready && (
          <div style={{
            color: 'var(--t-warning)', fontSize: '13px', marginBottom: '1.25rem', padding: '10px 14px',
            background: 'rgba(var(--t-warning-rgb),0.1)', border: '1px solid rgba(var(--t-warning-rgb),0.4)', borderRadius: '8px',
          }}>
            ⚠ Живое соединение не установилось — «Показать решение» и доска сейчас не дойдут до ученика.
            Прогресс тоже не обновляется. Обычно причина на стороне сервера (не настроен или недоступен Supabase) —
            если это повторяется, стоит проверить его настройки.
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={toggleBoard}
            style={{
              background: boardOpen ? 'rgba(var(--t-accent2-rgb),0.25)' : 'rgba(var(--t-accent-rgb),0.15)',
              border: `1px solid ${boardOpen ? 'var(--t-accent2)' : 'var(--t-accent)'}`, color: 'var(--t-text)',
              borderRadius: '8px', padding: '10px 18px', fontSize: '14px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {boardOpen ? '✕ Закрыть доску' : '🖊 Показать доску'}
          </button>
          {boardOpen && (
            <div style={{ marginTop: '12px' }}>
              <LiveTeacherBoard onBoardChange={base64 => live.broadcast('board-state', { base64 })} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {blocks.map((b, i) => {
            const status = statuses[b.id] || EMPTY_STATUS
            const badge = statusBadge(status)
            const isCurrent = i === currentIndex
            const hasExplanation = !!(b.content as any).explanation
            return (
              <div
                key={b.id}
                style={{
                  background: 'var(--t-card)', border: `1px solid ${isCurrent ? 'var(--t-accent)' : 'var(--t-border)'}`,
                  borderRadius: '12px', padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    flexShrink: 0, width: '26px', height: '26px', borderRadius: '8px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    background: isCurrent ? 'var(--t-accent)' : 'var(--t-border)', color: isCurrent ? '#fff' : 'var(--t-text-secondary)',
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--t-text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>
                      {blockRegistry[b.type].icon} {blockRegistry[b.type].label}
                      {isCurrent && <span style={{ color: 'var(--t-accent)', marginLeft: '8px' }}>● сейчас здесь</span>}
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      <Formula text={blockPreview(b)} />
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: '11px', padding: '3px 10px', borderRadius: '20px', color: badge.color, background: badge.bg, whiteSpace: 'nowrap' }}>
                    {badge.text}
                  </span>
                </div>
                {hasExplanation && (
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => toggleSolution(b.id)}
                      style={{
                        background: revealed[b.id] ? 'rgba(var(--t-warning-rgb),0.2)' : 'transparent',
                        border: `1px solid ${revealed[b.id] ? 'var(--t-warning)' : 'var(--t-border)'}`,
                        color: revealed[b.id] ? 'var(--t-warning)' : 'var(--t-text-secondary)',
                        borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      {revealed[b.id] ? '✕ Скрыть решение у ученика' : '💡 Показать решение'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
