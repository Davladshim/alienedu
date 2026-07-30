'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { blockRegistry, Formula, type LessonBlockData } from '@/components/lesson-blocks'

interface Attempt {
  block_id: string | number
  answer: any
  is_correct: boolean | null
  completed_at: string
}

function blockPrompt(block: LessonBlockData): string {
  const c = block.content as any
  if (block.type === 'ordering') return c.instruction || 'Расставь шаги по порядку'
  if (block.type === 'fill-blank') return (c.template || '').replace(/___/g, '…')
  if (typeof c.question === 'string' && c.question) return c.question
  return blockRegistry[block.type].label
}

// Человекочитаемый ответ ученика по типу блока — в отличие от describeAnswer
// (правильный ответ из содержимого блока), тут показываем то, что реально
// прислал ученик
function StudentAnswer({ block, answer }: { block: LessonBlockData; answer: any }) {
  const c = block.content as any
  switch (block.type) {
    case 'single-choice':
      return <Formula text={typeof answer === 'number' ? (c.options[answer] ?? '—') : '—'} />
    case 'multi-choice': {
      const idxs: number[] = Array.isArray(answer) ? answer : []
      const text = idxs.map(i => c.options[i]).filter(Boolean).join('; ') || '—'
      return <Formula text={text} />
    }
    case 'short-text':
      return <Formula text={typeof answer === 'string' && answer ? answer : '—'} />
    case 'numeric':
      return <Formula text={answer !== null && answer !== undefined && answer !== '' ? `${answer}${c.unit ? ' ' + c.unit : ''}` : '—'} />
    case 'matching': {
      if (!Array.isArray(answer)) return <span>—</span>
      const lines = c.pairs.map((p: any, i: number) => {
        const chosen = c.pairs[answer[i]]?.definition ?? '—'
        return `${p.term} → ${chosen}`
      })
      return <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>{lines.map((l: string, i: number) => <Formula key={i} text={l} />)}</div>
    }
    case 'ordering': {
      if (!Array.isArray(answer)) return <span>—</span>
      const lines = answer.map((origIdx: number, pos: number) => `${pos + 1}. ${c.steps[origIdx] ?? '—'}`)
      return <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>{lines.map((l: string, i: number) => <Formula key={i} text={l} />)}</div>
    }
    case 'fill-blank': {
      if (!Array.isArray(answer)) return <span>—</span>
      let i = 0
      const filled = (c.template || '').replace(/___/g, () => answer[i++] ?? '…')
      return <Formula text={filled} />
    }
    case 'geometry':
    case 'algebra': {
      const a = answer || {}
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {a.solutionText && (
            <div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '2px' }}>Решение текстом:</div>
              <Formula text={a.solutionText} />
            </div>
          )}
          {a.drawing && (
            <div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Чертёж:</div>
              <img src={a.drawing} alt="Чертёж" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', border: '1px solid var(--t-border)' }} />
            </div>
          )}
          {a.photo && (
            <div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Фото решения:</div>
              <img src={a.photo} alt="Фото решения" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', border: '1px solid var(--t-border)' }} />
            </div>
          )}
          {!a.solutionText && !a.drawing && !a.photo && <span style={{ color: 'var(--t-text-muted)' }}>Решение не отправлено</span>}
        </div>
      )
    }
    default:
      return <span style={{ color: 'var(--t-text-muted)' }}>—</span>
  }
}

export default function LessonResultsPage() {
  const params = useParams()
  const lessonId = params.id as string
  const studentId = params.studentId as string

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [studentName, setStudentName] = useState('')
  const [blocks, setBlocks] = useState<LessonBlockData[]>([])
  const [attemptsByBlock, setAttemptsByBlock] = useState<Record<string, Attempt[]>>({})

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/results?student_id=${studentId}`)
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

        const byBlock: Record<string, Attempt[]> = {}
        for (const a of (data.attempts || []) as Attempt[]) {
          const key = String(a.block_id)
          if (!byBlock[key]) byBlock[key] = []
          byBlock[key].push(a)
        }
        setAttemptsByBlock(byBlock)
        setLoading(false)
      })
      .catch(() => { setErrorMsg('Не удалось загрузить'); setLoading(false) })
  }, [lessonId, studentId])

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
        <Link href="/teacher/lessons" style={{ color: 'var(--t-accent)', fontSize: '14px' }}>← Мои уроки</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif', color: 'var(--t-text)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <Link href="/teacher/lessons" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>
          ← Мои уроки
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '10px 0 4px' }}>📋 {lessonTitle}</h1>
        <div style={{ color: 'var(--t-text-muted)', fontSize: '14px', marginBottom: '1.5rem' }}>
          Результаты — {studentName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {blocks.map((b, i) => {
            const rows = attemptsByBlock[b.id] || []
            const last = rows[rows.length - 1]
            const def = blockRegistry[b.type]
            const hasAnswer = def.checkAnswer !== null || def.manualReview
            return (
              <div key={b.id} style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                  <span style={{
                    flexShrink: 0, width: '26px', height: '26px', borderRadius: '8px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    background: 'var(--t-border)', color: 'var(--t-text-secondary)',
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--t-text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>
                      {def.icon} {def.label}
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      <Formula text={blockPrompt(b)} />
                    </div>
                  </div>
                  {hasAnswer && (
                    <span style={{
                      flexShrink: 0, fontSize: '11px', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
                      color: last?.is_correct === true ? 'var(--t-success)' : last?.is_correct === false && last?.answer !== null ? 'var(--t-pink)' : 'var(--t-info)',
                      background: last?.is_correct === true ? 'rgba(var(--t-success2-rgb),0.15)' : last?.is_correct === false && last?.answer !== null ? 'rgba(var(--t-pink-rgb),0.15)' : 'rgba(var(--t-info-rgb),0.15)',
                    }}>
                      {rows.length === 0 ? 'не отвечено' : last.answer === null ? 'пропущено' : last.is_correct === true ? 'верно' : last.is_correct === false ? 'неверно' : 'отправлено'}
                      {rows.length > 0 && ` · попыток: ${rows.length}`}
                    </span>
                  )}
                </div>
                {hasAnswer && rows.length > 0 && last.answer !== null && (
                  <div style={{ marginLeft: '36px', fontSize: '14px' }}>
                    <StudentAnswer block={b} answer={last.answer} />
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
