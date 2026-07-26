'use client'
import { useState } from 'react'
import { blockRegistry, type LessonBlockData } from '@/components/lesson-blocks'
import { submitButtonStyle } from '@/components/lesson-blocks/styles'

export function LessonPreview({ blocks, onExit }: {
  blocks: LessonBlockData[]
  onExit: () => void
}) {
  const [index, setIndex] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)

  if (blocks.length === 0) return null

  const block = blocks[index]
  const def = blockRegistry[block.type]
  const Player = def.Player
  const isLast = index === blocks.length - 1
  const retryable = !!block.content.retryable
  const maxAttempts = block.content.maxAttempts ?? 2
  const answered = attempts > 0
  const awaitingRetry = answered && lastCorrect === false && retryable && attempts < maxAttempts
  const done = answered && !awaitingRetry

  function handleSubmit(answer: any) {
    const isCorrect = def.checkAnswer ? def.checkAnswer(block.content, answer) : null
    setLastCorrect(isCorrect)
    setAttempts(a => a + 1)
  }

  function next() {
    if (isLast) { onExit(); return }
    setIndex(i => i + 1)
    setAttempts(0)
    setLastCorrect(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>
            ✕ Выйти из предпросмотра
          </button>
          <div style={{ color: '#6b7280', fontSize: '13px' }}>{index + 1} / {blocks.length}</div>
        </div>

        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.75rem' }}>
          {def.checkAnswer === null ? (
            <Player content={block.content} />
          ) : (
            <Player content={block.content} disabled={done} onSubmit={handleSubmit} />
          )}

          {answered && lastCorrect !== null && (
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
              background: lastCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: lastCorrect ? '#34d399' : '#f87171',
            }}>
              {lastCorrect
                ? '✅ Правильно!'
                : awaitingRetry
                  ? `❌ Неверно — попробуй ещё раз (попытка ${attempts} из ${maxAttempts})`
                  : '❌ Неверно'}
            </div>
          )}

          {done && lastCorrect === false && block.content.explanation && (
            <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
              Объяснение: {block.content.explanation}
            </div>
          )}

          {(def.checkAnswer === null || done) && (
            <button onClick={next} style={{ ...submitButtonStyle, marginTop: '16px' }}>
              {isLast ? 'Завершить' : 'Далее →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
