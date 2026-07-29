'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { blockRegistry, Formula, type LessonBlockData } from '@/components/lesson-blocks'
import { submitButtonStyle, resizeHandleStyle, dragHandleStyle, GEOGEBRA_ZOOM_RESET } from '@/components/lesson-blocks/styles'
import { useLiveChannel } from '@/components/lesson-blocks/useLiveChannel'
import { LiveStudentBoardViewer, type LiveStudentBoardViewerHandle } from '@/components/lesson-blocks/LiveStudentBoardViewer'
import { useResizableBoard, useDraggableBoard } from '@/components/lesson-blocks/useResizableBoard'

function promptFor(block: LessonBlockData): string {
  const c = block.content
  switch (block.type) {
    case 'matching': return 'Сопоставление пар'
    case 'ordering': return c.instruction || 'Расставь шаги по порядку'
    case 'fill-blank': return (c.template || '').replace(/___/g, '…')
    default: return c.question || ''
  }
}

interface BlockState {
  attempts: number
  isCorrect: boolean | null
  skipped: boolean
  done: boolean
}

interface Attempt {
  block_id: string | number
  answer: unknown
  is_correct: boolean | null
  completed_at: string
}

const EMPTY_STATE: BlockState = { attempts: 0, isCorrect: null, skipped: false, done: false }

export default function StudentLessonPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [mode, setMode] = useState<'quiz' | 'exam'>('quiz')
  const [blocks, setBlocks] = useState<LessonBlockData[]>([])

  const [index, setIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const [blockStates, setBlockStates] = useState<Record<string, BlockState>>({})
  // Счётчик "перерешиваний" по блоку — меняет key у Player'а, чтобы при
  // повторной попытке поле ввода очищалось, а не показывало старый неверный ответ
  const [retryNonce, setRetryNonce] = useState<Record<string, number>>({})

  // Живое наблюдение учителя: канал приходит с сервера только для
  // проверочных уроков (см. GET /api/lessons/[id]) — на контрольной остаётся null
  const [liveChannelId, setLiveChannelId] = useState<string | null>(null)
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({})
  const [boardVisible, setBoardVisible] = useState(false)
  const [boardBase64, setBoardBase64] = useState<string | null>(null)
  const boardViewerRef = useRef<LiveStudentBoardViewerHandle>(null)
  const boardElementRef = useRef<HTMLDivElement>(null)
  const boardResize = useResizableBoard({ width: 340, height: 260 }, ({ width, height }) => boardViewerRef.current?.setSize(width, height))
  const boardDrag = useDraggableBoard(boardElementRef)
  const live = useLiveChannel(liveChannelId, {
    onBroadcast: {
      'show-solution': payload => setRevealedSolutions(s => ({ ...s, [String(payload.blockId)]: true })),
      'hide-solution': payload => setRevealedSolutions(s => ({ ...s, [String(payload.blockId)]: false })),
      'show-board': () => setBoardVisible(true),
      'hide-board': () => { setBoardVisible(false); setBoardBase64(null) },
      'board-state': payload => setBoardBase64(payload.base64 as string),
    },
  })

  useEffect(() => {
    fetch(`/api/lessons/${id}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return }
        const data = await r.json()
        const lessonMode = data.lesson.mode === 'exam' ? 'exam' : 'quiz'
        const loadedBlocks: LessonBlockData[] = (data.blocks || []).map((b: any) => ({ id: String(b.id), type: b.type, content: b.content }))
        setLessonTitle(data.lesson.title)
        setMode(lessonMode)
        setBlocks(loadedBlocks)
        setLiveChannelId(data.live_channel || null)

        // Восстанавливаем прогресс из прошлых попыток — иначе перезагрузка
        // страницы сбрасывала бы все уже зафиксированные ответы
        const attemptsByBlock: Record<string, Attempt[]> = {}
        for (const a of (data.attempts || []) as Attempt[]) {
          const key = String(a.block_id)
          if (!attemptsByBlock[key]) attemptsByBlock[key] = []
          attemptsByBlock[key].push(a)
        }
        const restored: Record<string, BlockState> = {}
        for (const b of loadedBlocks) {
          const rows = attemptsByBlock[b.id]
          if (!rows || rows.length === 0) continue
          const def = blockRegistry[b.type]
          if (def.checkAnswer === null) {
            restored[b.id] = { ...EMPTY_STATE, done: true }
            continue
          }
          const last = rows[rows.length - 1]
          const isSkip = last.answer === null && last.is_correct === false
          if (isSkip) {
            restored[b.id] = { attempts: rows.length, isCorrect: false, skipped: true, done: true }
            continue
          }
          const isCorrect = last.is_correct === true
          const retryable = !!b.content.retryable
          const maxAttempts = b.content.maxAttempts ?? 2
          const done = isCorrect || lessonMode === 'exam' || !retryable || rows.length >= maxAttempts
          restored[b.id] = { attempts: rows.length, isCorrect: last.is_correct, skipped: false, done }
        }
        setBlockStates(restored)

        if (loadedBlocks.length > 0 && loadedBlocks.every(b => restored[b.id]?.done)) {
          setFinished(true)
        } else {
          const resumeIndex = loadedBlocks.findIndex(b => !restored[b.id]?.done)
          setIndex(resumeIndex === -1 ? 0 : resumeIndex)
        }

        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  // Сообщаем о себе присутствие — сам факт открытого урока говорит
  // учителю "ученик сейчас здесь"
  useEffect(() => {
    if (live.ready) live.track({ online: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.ready])

  // Транслируем учителю живой прогресс — на каком блоке ученик сейчас
  // и что уже отправлено по каждому блоку
  useEffect(() => {
    if (!liveChannelId || !live.ready) return
    live.broadcast('progress', {
      index,
      finished,
      statuses: Object.fromEntries(
        blocks.map(b => {
          const st = blockStates[b.id] || EMPTY_STATE
          return [b.id, { done: st.done, isCorrect: st.isCorrect, skipped: st.skipped, attempts: st.attempts }]
        })
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveChannelId, live.ready, index, finished, blockStates, blocks])

  function logAttempt(blockId: string, answer: any, isCorrect: boolean | null) {
    fetch(`/api/lessons/${id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_id: Number(blockId), answer, is_correct: isCorrect }),
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--t-bg)', color: 'var(--t-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Загрузка...
      </div>
    )
  }

  if (notFound || blocks.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--t-bg)', color: 'var(--t-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div>Урок недоступен</div>
        <Link href="/student/lessons" style={{ color: 'var(--t-accent)', fontSize: '14px' }}>← Мои уроки</Link>
      </div>
    )
  }

  // Пассивные блоки (сейчас — только теория) проходятся без явного действия:
  // достаточно просто прочитать и уйти дальше. Блоки "с проверкой вручную"
  // (геометрия) тоже не оцениваются автоматически, но требуют явной отправки
  // ответа — как обычные проверяемые блоки, просто без "верно/неверно".
  function finalizeTheoryIfNeeded(b: LessonBlockData) {
    const def = blockRegistry[b.type]
    if (def.checkAnswer !== null || def.manualReview) return
    if (blockStates[b.id]?.done) return
    setBlockStates(s => ({ ...s, [b.id]: { ...EMPTY_STATE, done: true } }))
    logAttempt(b.id, null, null)
  }

  function finishLesson() {
    const updates: Record<string, BlockState> = {}
    for (const b of blocks) {
      const def = blockRegistry[b.type]
      const st = blockStates[b.id]
      if (st?.done) continue
      if (def.checkAnswer === null && !def.manualReview) {
        updates[b.id] = { ...EMPTY_STATE, done: true }
        logAttempt(b.id, null, null)
      } else {
        updates[b.id] = { ...EMPTY_STATE, attempts: st?.attempts || 0, isCorrect: false, skipped: true, done: true }
        logAttempt(b.id, null, false)
      }
    }
    if (Object.keys(updates).length > 0) setBlockStates(s => ({ ...s, ...updates }))
    setFinished(true)
  }

  function goTo(newIndex: number) {
    finalizeTheoryIfNeeded(blocks[index])
    if (newIndex >= blocks.length) { finishLesson(); return }
    if (newIndex < 0) return
    setIndex(newIndex)
  }

  if (finished) {
    const gradableResults = blocks
      .map(b => ({ block: b, state: blockStates[b.id] || EMPTY_STATE }))
      .filter(x => blockRegistry[x.block.type].checkAnswer !== null)
    const correctCount = gradableResults.filter(r => r.state.isCorrect === true).length
    const skippedCount = gradableResults.filter(r => r.state.skipped).length
    const gradableCount = gradableResults.length
    const percent = gradableCount > 0 ? Math.round((correctCount / gradableCount) * 100) : 0

    return (
      <div style={{ minHeight: '100vh', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
          <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Урок пройден!</div>

            {gradableCount > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
                marginBottom: '20px', textAlign: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{gradableCount}</div>
                  <div style={{ color: 'var(--t-text-muted)', fontSize: '12px' }}>всего</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t-success)' }}>{correctCount}</div>
                  <div style={{ color: 'var(--t-text-muted)', fontSize: '12px' }}>верно</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t-text-secondary)' }}>{skippedCount}</div>
                  <div style={{ color: 'var(--t-text-muted)', fontSize: '12px' }}>пропущено</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{percent}%</div>
                  <div style={{ color: 'var(--t-text-muted)', fontSize: '12px' }}>верных</div>
                </div>
              </div>
            )}
            <button onClick={() => router.push('/student/lessons')} style={submitButtonStyle}>
              ← Мои уроки
            </button>
          </div>

          {gradableResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Разбор ответов</div>
              {gradableResults.map((r, i) => {
                const def = blockRegistry[r.block.type]
                const icon = r.state.skipped ? '⏭' : r.state.isCorrect ? '✅' : '❌'
                const wrong = !r.state.isCorrect
                return (
                  <div key={i} style={{
                    background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px' }}>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', marginBottom: wrong ? 0 : '6px' }}>
                          <Formula text={promptFor(r.block)} />
                        </div>
                        {wrong && def.describeAnswer && (
                          <div style={{ color: 'var(--t-text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                            Правильный ответ: <Formula text={def.describeAnswer(r.block.content)} />
                          </div>
                        )}
                        {wrong && r.block.content.explanation && (
                          <div style={{ color: 'var(--t-warning)', fontSize: '13px', marginTop: '6px' }}>
                            Объяснение: <Formula text={r.block.content.explanation} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const block = blocks[index]
  const def = blockRegistry[block.type]
  const Player = def.Player
  const isLast = index === blocks.length - 1
  const isGradable = def.checkAnswer !== null
  const isManualReview = !!def.manualReview
  const interactive = isGradable || isManualReview
  const state = blockStates[block.id] || EMPTY_STATE
  const awaitingRetry = isGradable && state.attempts > 0 && !state.done
  // Пока остались попытки, плеер не блокируется — можно сразу поменять
  // ответ и отправить снова, без отдельной кнопки "повторить"
  const playerDisabled = state.done
  const retryable = !!block.content.retryable
  const maxAttempts = block.content.maxAttempts ?? 2

  function skipBlock() {
    setBlockStates(s => ({ ...s, [block.id]: { ...(s[block.id] || EMPTY_STATE), skipped: true, isCorrect: false, done: true } }))
    logAttempt(block.id, null, false)
  }

  function retryBlock() {
    setRetryNonce(n => ({ ...n, [block.id]: (n[block.id] || 0) + 1 }))
  }

  function handleSubmit(answer: any) {
    const isCorrect = def.checkAnswer ? def.checkAnswer(block.content, answer) : null
    const attempts = state.attempts + 1
    const done = isCorrect === true || mode === 'exam' || !retryable || attempts >= maxAttempts
    setBlockStates(s => ({ ...s, [block.id]: { ...state, attempts, isCorrect, done } }))
    logAttempt(block.id, answer, isCorrect)
  }

  function dotStatus(b: LessonBlockData, i: number): { bg: string; color: string } {
    if (i === index) return { bg: 'var(--t-accent)', color: 'var(--t-text)' }
    const st = blockStates[b.id]
    if (!st?.done && !(st && st.attempts > 0)) return { bg: 'var(--t-card)', color: 'var(--t-text-muted)' }
    if (mode === 'exam') return { bg: 'var(--t-border)', color: 'var(--t-text-secondary)' } // не выдаём правильность заранее
    if (blockRegistry[b.type].checkAnswer === null) return { bg: 'var(--t-border)', color: 'var(--t-text-secondary)' }
    if (st?.skipped) return { bg: 'rgba(107,114,128,0.3)', color: 'var(--t-text-secondary)' }
    if (st?.isCorrect) return { bg: 'rgba(16,185,129,0.25)', color: 'var(--t-success)' }
    return { bg: 'rgba(244,114,182,0.25)', color: 'var(--t-pink)' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href="/student/lessons" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>
            ← Мои уроки
          </Link>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>{index + 1} / {blocks.length}{mode === 'exam' && ' · Контрольная'}</div>
        </div>

        <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '1rem' }}>{lessonTitle}</h1>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {blocks.map((b, i) => {
            const s = dotStatus(b, i)
            return (
              <button
                key={b.id}
                onClick={() => goTo(i)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                  background: s.bg, color: s.color, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.75rem' }}>
          {!interactive ? (
            <Player content={block.content} />
          ) : (
            <Player key={`${block.id}-${retryNonce[block.id] || 0}`} content={block.content} disabled={playerDisabled} onSubmit={handleSubmit} />
          )}

          {isGradable && mode === 'quiz' && state.attempts > 0 && (
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
              background: state.skipped ? 'rgba(107,114,128,0.15)' : state.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(244,114,182,0.15)',
              color: state.skipped ? 'var(--t-text-secondary)' : state.isCorrect ? 'var(--t-success)' : 'var(--t-pink)',
            }}>
              <span>
                {state.skipped
                  ? '⏭ Пропущено'
                  : state.isCorrect
                    ? '✅ Правильно!'
                    : awaitingRetry
                      ? `❌ Неверно — осталось попыток: ${maxAttempts - state.attempts} (из ${maxAttempts})`
                      : '❌ Неверно'}
              </span>
              {awaitingRetry && (
                <button
                  onClick={retryBlock}
                  style={{
                    background: 'rgba(244,114,182,0.2)', border: '1px solid var(--t-pink)', color: 'var(--t-pink)',
                    borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  🔁 Перерешать
                </button>
              )}
            </div>
          )}

          {isGradable && mode === 'quiz' && state.done && state.isCorrect === false && !state.skipped && block.content.explanation && (
            <div style={{
              marginTop: '14px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px',
              background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.4)', color: 'var(--t-info)',
            }}>
              💡 Решение:<br />
              <Formula text={block.content.explanation} />
            </div>
          )}

          {isGradable && mode === 'exam' && state.attempts > 0 && (
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', background: 'rgba(96,165,250,0.15)', color: 'var(--t-info)' }}>
              Ответ сохранён
            </div>
          )}

          {isManualReview && state.attempts > 0 && (
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
              background: state.skipped ? 'rgba(107,114,128,0.15)' : 'rgba(96,165,250,0.15)',
              color: state.skipped ? 'var(--t-text-secondary)' : 'var(--t-info)',
            }}>
              {state.skipped ? '⏭ Пропущено' : '✅ Решение отправлено — учитель проверит вручную'}
            </div>
          )}

          {revealedSolutions[block.id] && block.content.explanation && (
            <div style={{
              marginTop: '14px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px',
              background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', color: 'var(--t-warning)',
            }}>
              💡 Учитель показал решение:<br />
              <Formula text={block.content.explanation} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            {interactive && !state.done && (
              <button
                onClick={skipBlock}
                style={{ background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}
              >
                Пропустить
              </button>
            )}
            <button onClick={() => goTo(index - 1)} disabled={index === 0} style={{
              background: 'transparent', border: '1px solid var(--t-border)', color: index === 0 ? 'var(--t-border)' : 'var(--t-text-secondary)',
              borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: index === 0 ? 'not-allowed' : 'pointer',
            }}>
              ← Назад
            </button>
            <button onClick={() => goTo(index + 1)} style={{ ...submitButtonStyle, marginLeft: 'auto' }}>
              {isLast ? 'Завершить' : 'Далее →'}
            </button>
          </div>
        </div>
      </div>

      {boardVisible && (
        <div
          ref={boardElementRef}
          style={{
            position: 'fixed', zIndex: 200,
            width: `${boardResize.size.width}px`,
            ...(boardDrag.position
              ? { left: `${boardDrag.position.left}px`, top: `${boardDrag.position.top}px` }
              : { bottom: '20px', right: '20px' }),
            background: 'var(--t-card)', border: '1px solid var(--t-accent)', borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '10px',
            ...GEOGEBRA_ZOOM_RESET,
          }}
        >
          <div
            onMouseDown={boardDrag.onHandleMouseDown}
            style={{ fontSize: '13px', color: 'var(--t-accent)', marginBottom: '8px', fontWeight: 600, ...dragHandleStyle }}
          >
            🧑‍🏫 Учитель объясняет на доске
          </div>
          <div style={{ position: 'relative', width: '100%', height: `${boardResize.size.height}px` }}>
            <LiveStudentBoardViewer ref={boardViewerRef} base64={boardBase64} height={boardResize.size.height} />
            <div onMouseDown={boardResize.onHandleMouseDown} title="Изменить размер доски" style={resizeHandleStyle} />
          </div>
        </div>
      )}
    </div>
  )
}
