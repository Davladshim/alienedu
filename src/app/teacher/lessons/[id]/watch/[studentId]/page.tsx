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
  if (!status.attempts && !status.done) return { text: 'не начат', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' }
  if (status.skipped) return { text: 'пропущено', color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' }
  if (!status.done) return { text: 'в процессе', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' }
  if (status.isCorrect === true) return { text: 'верно', color: '#34d399', bg: 'rgba(16,185,129,0.15)' }
  if (status.isCorrect === false) return { text: 'неверно', color: '#f472b6', bg: 'rgba(244,114,182,0.15)' }
  return { text: 'отправлено', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' }
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
      <div style={{ minHeight: '100vh', background: '#0f1117', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Загрузка...
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div>{errorMsg}</div>
        <Link href={`/teacher/lessons/${lessonId}`} style={{ color: '#4f8ef7', fontSize: '14px' }}>← К уроку</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif', color: '#fff', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <Link href={`/teacher/lessons/${lessonId}`} style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
          ← {lessonTitle}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 4px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>👁 {studentName}</h1>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            color: studentOnline ? '#34d399' : '#6b7280',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: studentOnline ? '#34d399' : '#4b5563' }} />
            {studentOnline ? 'ученик сейчас в уроке' : 'ученик офлайн'}
          </span>
        </div>
        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '1.25rem' }}>
          Показ решения и доски видны только ученику прямо сейчас — ничего не сохраняется.
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={toggleBoard}
            style={{
              background: boardOpen ? 'rgba(124,58,237,0.25)' : 'rgba(79,142,247,0.15)',
              border: `1px solid ${boardOpen ? '#7c3aed' : '#4f8ef7'}`, color: '#fff',
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
                  background: '#1a1d27', border: `1px solid ${isCurrent ? '#4f8ef7' : '#2a2d3d'}`,
                  borderRadius: '12px', padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    flexShrink: 0, width: '26px', height: '26px', borderRadius: '8px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    background: isCurrent ? '#4f8ef7' : '#2a2d3d', color: isCurrent ? '#fff' : '#9ca3af',
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>
                      {blockRegistry[b.type].icon} {blockRegistry[b.type].label}
                      {isCurrent && <span style={{ color: '#4f8ef7', marginLeft: '8px' }}>● сейчас здесь</span>}
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
                        background: revealed[b.id] ? 'rgba(251,191,36,0.2)' : 'transparent',
                        border: `1px solid ${revealed[b.id] ? '#fbbf24' : '#2a2d3d'}`,
                        color: revealed[b.id] ? '#fbbf24' : '#9ca3af',
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
