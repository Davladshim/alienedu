'use client'
import { useState } from 'react'
import { blockRegistry, groupBlocksIntoPages, Formula, type LessonBlockData } from '@/components/lesson-blocks'
import { submitButtonStyle } from '@/components/lesson-blocks/styles'

interface BlockState {
  attempts: number
  lastCorrect: boolean | null
}

const EMPTY_STATE: BlockState = { attempts: 0, lastCorrect: null }

function isBlockReady(block: LessonBlockData, state: BlockState): boolean {
  const def = blockRegistry[block.type]
  if (def.checkAnswer === null) return true
  const answered = state.attempts > 0
  const retryable = !!block.content.retryable
  const maxAttempts = block.content.maxAttempts ?? 2
  const awaitingRetry = answered && state.lastCorrect === false && retryable && state.attempts < maxAttempts
  return answered && !awaitingRetry
}

export function LessonPreview({ blocks, onExit }: {
  blocks: LessonBlockData[]
  onExit: () => void
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [states, setStates] = useState<Record<string, BlockState>>({})

  if (blocks.length === 0) return null

  const pages = groupBlocksIntoPages(blocks)
  const page = pages[pageIndex]
  const isLast = pageIndex === pages.length - 1
  const pageReady = page.every(b => isBlockReady(b, states[b.id] || EMPTY_STATE))

  function handleSubmit(block: LessonBlockData, answer: any) {
    const def = blockRegistry[block.type]
    const isCorrect = def.checkAnswer ? def.checkAnswer(block.content, answer) : null
    setStates(s => ({ ...s, [block.id]: { attempts: (s[block.id]?.attempts || 0) + 1, lastCorrect: isCorrect } }))
  }

  function next() {
    if (isLast) { onExit(); return }
    setPageIndex(i => i + 1)
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '14px' }}>
            ✕ Выйти из предпросмотра
          </button>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>{pageIndex + 1} / {pages.length}</div>
        </div>

        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {page.map((block, i) => {
              const def = blockRegistry[block.type]
              const Player = def.Player
              const state = states[block.id] || EMPTY_STATE
              const answered = state.attempts > 0
              const retryable = !!block.content.retryable
              const maxAttempts = block.content.maxAttempts ?? 2
              const awaitingRetry = answered && state.lastCorrect === false && retryable && state.attempts < maxAttempts
              const done = answered && !awaitingRetry

              return (
                <div key={block.id} style={i > 0 ? { paddingTop: '1.75rem', borderTop: '1px solid var(--t-border)' } : undefined}>
                  {def.checkAnswer === null ? (
                    <Player content={block.content} />
                  ) : (
                    <Player content={block.content} disabled={done} onSubmit={(answer: any) => handleSubmit(block, answer)} />
                  )}

                  {answered && state.lastCorrect !== null && (
                    <div style={{
                      marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
                      background: state.lastCorrect ? 'rgba(var(--t-success2-rgb),0.15)' : 'rgba(var(--t-danger-rgb),0.15)',
                      color: state.lastCorrect ? 'var(--t-success)' : 'var(--t-danger-soft)',
                    }}>
                      {state.lastCorrect
                        ? '✅ Правильно!'
                        : awaitingRetry
                          ? `❌ Неверно — попробуй ещё раз (попытка ${state.attempts} из ${maxAttempts})`
                          : '❌ Неверно'}
                    </div>
                  )}

                  {done && state.lastCorrect === false && block.content.explanation && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', background: 'rgba(var(--t-warning-rgb),0.1)', color: 'var(--t-warning)' }}>
                      Объяснение: <Formula text={block.content.explanation} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {pageReady && (
            <button onClick={next} style={{ ...submitButtonStyle, marginTop: '20px' }}>
              {isLast ? 'Завершить' : 'Далее →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
