'use client'
import { useState, useMemo } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { labelStyle, inputStyle, smallButtonStyle, removeButtonStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface MatchingPair {
  term: string
  definition: string
}

export interface MatchingContent {
  question: string
  pairs: MatchingPair[]
}

export const matchingDefault: MatchingContent = {
  question: '', pairs: [{ term: '', definition: '' }, { term: '', definition: '' }],
}

// answer — массив выбранных индексов исходного определения, по одному на каждый термин (в порядке content.pairs)
export function checkMatching(content: MatchingContent, answer: number[]): boolean {
  if (!Array.isArray(answer) || answer.length !== content.pairs.length) return false
  return answer.every((defIndex, i) => defIndex === i)
}

export function describeMatchingAnswer(content: MatchingContent): string {
  return content.pairs.map(p => `${p.term} — ${p.definition}`).join('; ')
}

export function MatchingEditor({ content, onChange }: {
  content: MatchingContent
  onChange: (content: MatchingContent) => void
}) {
  function updatePair(i: number, field: keyof MatchingPair, value: string) {
    const pairs = [...content.pairs]
    pairs[i] = { ...pairs[i], [field]: value }
    onChange({ ...content, pairs })
  }
  function addPair() {
    onChange({ ...content, pairs: [...content.pairs, { term: '', definition: '' }] })
  }
  function removePair(i: number) {
    onChange({ ...content, pairs: content.pairs.filter((_, idx) => idx !== i) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Условие задания (необязательно)</label>
      <FormulaTextarea
        value={content.question || ''}
        onChange={question => onChange({ ...content, question })}
        rows={2}
        placeholder="Например: Сопоставь термины с определениями"
      />
      <label style={labelStyle}>Пары «термин — определение» (можно использовать формулы через $...$)</label>
      {content.pairs.map((pair, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={pair.term}
            onChange={e => updatePair(i, 'term', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Термин"
          />
          <span style={{ color: 'var(--t-text-faint)' }}>—</span>
          <input
            value={pair.definition}
            onChange={e => updatePair(i, 'definition', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Определение"
          />
          {content.pairs.length > 2 && (
            <button type="button" onClick={() => removePair(i)} style={removeButtonStyle}>✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addPair} style={{ ...smallButtonStyle, alignSelf: 'flex-start' }}>+ Пара</button>
    </div>
  )
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function MatchingPlayer({ content, onSubmit, disabled }: {
  content: MatchingContent
  onSubmit: (answer: number[]) => void
  disabled?: boolean
}) {
  const shuffledDefIndexes = useMemo(() => shuffle(content.pairs.map((_, i) => i)), [content.pairs])
  const [selected, setSelected] = useState<Record<number, number>>({})

  function selectDefinition(termIndex: number, defIndex: number) {
    setSelected(s => ({ ...s, [termIndex]: defIndex }))
  }

  const allSelected = content.pairs.every((_, i) => selected[i] !== undefined)

  return (
    <div>
      {content.question && (
        <div style={{ marginBottom: '14px', lineHeight: 1.6, fontSize: '15px' }}>
          <Formula text={content.question} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {content.pairs.map((pair, termIndex) => (
          <div key={termIndex} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--t-border)', borderRadius: '8px', fontSize: '14px' }}>
              <Formula text={pair.term} />
            </div>
            <span style={{ color: 'var(--t-text-faint)' }}>→</span>
            <select
              value={selected[termIndex] ?? ''}
              onChange={e => selectDefinition(termIndex, Number(e.target.value))}
              disabled={disabled}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="" disabled>Выбери определение</option>
              {shuffledDefIndexes.map(defIndex => (
                <option key={defIndex} value={defIndex}>{content.pairs[defIndex].definition}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button
        disabled={!allSelected || disabled}
        onClick={() => onSubmit(content.pairs.map((_, i) => selected[i]))}
        style={{ ...(!allSelected || disabled ? submitButtonDisabledStyle : submitButtonStyle), marginTop: '14px' }}
      >
        Ответить
      </button>
    </div>
  )
}
