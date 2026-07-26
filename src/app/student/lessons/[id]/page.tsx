'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { blockRegistry, Formula, type LessonBlockData } from '@/components/lesson-blocks'
import { submitButtonStyle } from '@/components/lesson-blocks/styles'

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

  function logAttempt(blockId: string, answer: any, isCorrect: boolean | null) {
    fetch(`/api/lessons/${id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_id: Number(blockId), answer, is_correct: isCorrect }),
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Загрузка...
      </div>
    )
  }

  if (notFound || blocks.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div>Урок недоступен</div>
        <Link href="/student/lessons" style={{ color: '#4f8ef7', fontSize: '14px' }}>← Мои уроки</Link>
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
      <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
          <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Урок пройден!</div>

            {gradableCount > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
                marginBottom: '20px', textAlign: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{gradableCount}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>всего</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>{correctCount}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>верно</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#9ca3af' }}>{skippedCount}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>пропущено</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{percent}%</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>верных</div>
                </div>
              </div>
            )}
            <button onClick={() => router.push('/student/lessons')} style={submitButtonStyle}>
              ← Мои уроки
            </button>
          </div>

          {gradableResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Разбор ответов</div>
              {gradableResults.map((r, i) => {
                const def = blockRegistry[r.block.type]
                const icon = r.state.skipped ? '⏭' : r.state.isCorrect ? '✅' : '❌'
                const wrong = !r.state.isCorrect
                return (
                  <div key={i} style={{
                    background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px', padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px' }}>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', marginBottom: wrong ? 0 : '6px' }}>
                          <Formula text={promptFor(r.block)} />
                        </div>
                        {wrong && def.describeAnswer && (
                          <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '6px' }}>
                            Правильный ответ: <Formula text={def.describeAnswer(r.block.content)} />
                          </div>
                        )}
                        {wrong && r.block.content.explanation && (
                          <div style={{ color: '#fbbf24', fontSize: '13px', marginTop: '6px' }}>
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

  function handleSubmit(answer: any) {
    const isCorrect = def.checkAnswer ? def.checkAnswer(block.content, answer) : null
    const attempts = state.attempts + 1
    const done = isCorrect === true || mode === 'exam' || !retryable || attempts >= maxAttempts
    setBlockStates(s => ({ ...s, [block.id]: { ...state, attempts, isCorrect, done } }))
    logAttempt(block.id, answer, isCorrect)
  }

  function dotStatus(b: LessonBlockData, i: number): { bg: string; color: string } {
    if (i === index) return { bg: '#4f8ef7', color: '#fff' }
    const st = blockStates[b.id]
    if (!st?.done && !(st && st.attempts > 0)) return { bg: '#1a1d27', color: '#6b7280' }
    if (mode === 'exam') return { bg: '#2a2d3d', color: '#9ca3af' } // не выдаём правильность заранее
    if (blockRegistry[b.type].checkAnswer === null) return { bg: '#2a2d3d', color: '#9ca3af' }
    if (st?.skipped) return { bg: 'rgba(107,114,128,0.3)', color: '#9ca3af' }
    if (st?.isCorrect) return { bg: 'rgba(16,185,129,0.25)', color: '#34d399' }
    return { bg: 'rgba(244,114,182,0.25)', color: '#f472b6' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href="/student/lessons" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Мои уроки
          </Link>
          <div style={{ color: '#6b7280', fontSize: '13px' }}>{index + 1} / {blocks.length}{mode === 'exam' && ' · Контрольная'}</div>
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

        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.75rem' }}>
          {!interactive ? (
            <Player content={block.content} />
          ) : (
            <Player content={block.content} disabled={playerDisabled} onSubmit={handleSubmit} />
          )}

          {isGradable && mode === 'quiz' && state.attempts > 0 && (
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
              background: state.skipped ? 'rgba(107,114,128,0.15)' : state.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(244,114,182,0.15)',
              color: state.skipped ? '#9ca3af' : state.isCorrect ? '#34d399' : '#f472b6',
            }}>
              {state.skipped
                ? '⏭ Пропущено'
                : state.isCorrect
                  ? '✅ Правильно!'
                  : awaitingRetry
                    ? `❌ Неверно — попробуй ещё раз (попытка ${state.attempts} из ${maxAttempts})`
                    : '❌ Неверно'}
            </div>
          )}

          {isGradable && mode === 'exam' && state.attempts > 0 && (
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
              Ответ сохранён
            </div>
          )}

          {isManualReview && state.attempts > 0 && (
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
              background: state.skipped ? 'rgba(107,114,128,0.15)' : 'rgba(96,165,250,0.15)',
              color: state.skipped ? '#9ca3af' : '#60a5fa',
            }}>
              {state.skipped ? '⏭ Пропущено' : '✅ Решение отправлено — учитель проверит вручную'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            {interactive && !state.done && (
              <button
                onClick={skipBlock}
                style={{ background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}
              >
                Пропустить
              </button>
            )}
            <button onClick={() => goTo(index - 1)} disabled={index === 0} style={{
              background: 'transparent', border: '1px solid #2a2d3d', color: index === 0 ? '#374151' : '#9ca3af',
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
    </div>
  )
}
