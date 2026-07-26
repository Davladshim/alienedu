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

interface ResultEntry {
  block: LessonBlockData
  isCorrect: boolean | null
}

export default function StudentLessonPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [blocks, setBlocks] = useState<LessonBlockData[]>([])

  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [gradableCount, setGradableCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [results, setResults] = useState<ResultEntry[]>([])

  useEffect(() => {
    fetch(`/api/lessons/${id}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return }
        const data = await r.json()
        setLessonTitle(data.lesson.title)
        setBlocks((data.blocks || []).map((b: any) => ({ id: String(b.id), type: b.type, content: b.content })))
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

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
        <Link href="/student" style={{ color: '#4f8ef7', fontSize: '14px' }}>← Мои уроки</Link>
      </div>
    )
  }

  if (finished) {
    const gradableResults = results.filter(r => r.isCorrect !== null)
    const skippedCount = 0 // пропуск заданий появится отдельной доработкой
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
            <button onClick={() => router.push('/student')} style={submitButtonStyle}>
              ← Мои уроки
            </button>
          </div>

          {gradableResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Разбор ответов</div>
              {gradableResults.map((r, i) => {
                const def = blockRegistry[r.block.type]
                return (
                  <div key={i} style={{
                    background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px', padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px' }}>{r.isCorrect ? '✅' : '❌'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', marginBottom: r.isCorrect ? 0 : '6px' }}>
                          <Formula text={promptFor(r.block)} />
                        </div>
                        {!r.isCorrect && def.describeAnswer && (
                          <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                            Правильный ответ: <Formula text={def.describeAnswer(r.block.content)} />
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

  async function handleSubmit(answer: any) {
    const isCorrect = def.checkAnswer ? def.checkAnswer(block.content, answer) : null
    setLastCorrect(isCorrect)
    setAnswered(true)
    setResults(r => [...r, { block, isCorrect }])
    if (isCorrect !== null) {
      setGradableCount(c => c + 1)
      if (isCorrect) setCorrectCount(c => c + 1)
    }

    fetch(`/api/lessons/${id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_id: Number(block.id), answer, is_correct: isCorrect }),
    }).catch(() => {})
  }

  function next() {
    if (def.checkAnswer === null) {
      // Блоки без проверки (теория) тоже логируем как пройденные,
      // иначе answered_blocks никогда не сравняется с total_blocks
      // и урок будет вечно висеть в статусе "в процессе"
      fetch(`/api/lessons/${id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_id: Number(block.id), answer: null, is_correct: null }),
      }).catch(() => {})
    }
    if (isLast) { setFinished(true); return }
    setIndex(i => i + 1)
    setAnswered(false)
    setLastCorrect(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link href="/student" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Мои уроки
          </Link>
          <div style={{ color: '#6b7280', fontSize: '13px' }}>{index + 1} / {blocks.length}</div>
        </div>

        <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '1rem' }}>{lessonTitle}</h1>

        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.75rem' }}>
          {def.checkAnswer === null ? (
            <Player content={block.content} />
          ) : (
            <Player content={block.content} disabled={answered} onSubmit={handleSubmit} />
          )}

          {answered && lastCorrect !== null && (
            <div style={{
              marginTop: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
              background: lastCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: lastCorrect ? '#34d399' : '#f87171',
            }}>
              {lastCorrect ? '✅ Правильно!' : '❌ Неверно'}
            </div>
          )}

          {(def.checkAnswer === null || answered) && (
            <button onClick={next} style={{ ...submitButtonStyle, marginTop: '16px' }}>
              {isLast ? 'Завершить' : 'Далее →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
