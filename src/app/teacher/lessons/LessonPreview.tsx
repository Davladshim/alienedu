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
    <div style={{ minHeight: '100vh', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '14px' }}>
            ✕ Выйти из предпросмотра
          </button>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>{index + 1} / {blocks.length}</div>
        </div>

        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.75rem' }}>
          {def.checkAnswer === null ? (
            <Player content={block.content} />
          ) : (
            <Player content={block.content} disabled={done} onSubmit={handleSubmit} />
          )}

          {answered && lastCorrect !== null && (
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
              background: lastCorrect ? 'rgba(var(--t-success2-rgb),0.15)' : 'rgba(var(--t-danger-rgb),0.15)',
              color: lastCorrect ? 'var(--t-success)' : 'var(--t-danger-soft)',
            }}>
              {lastCorrect
                ? '✅ Правильно!'
                : awaitingRetry
                  ? `❌ Неверно — попробуй ещё раз (попытка ${attempts} из ${maxAttempts})`
                  : '❌ Неверно'}
            </div>
          )}

          {done && lastCorrect === false && block.content.explanation && (
            <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', background: 'rgba(var(--t-warning-rgb),0.1)', color: 'var(--t-warning)' }}>
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
