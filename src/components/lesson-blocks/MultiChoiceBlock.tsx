'use client'
import { useState } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { labelStyle, inputStyle, smallButtonStyle, removeButtonStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface MultiChoiceContent {
  question: string
  options: string[]
  correctIndexes: number[]
}

export const multiChoiceDefault: MultiChoiceContent = {
  question: '', options: ['', ''], correctIndexes: [],
}

export function checkMultiChoice(content: MultiChoiceContent, answer: number[]): boolean {
  const correct = [...content.correctIndexes].sort()
  const given = [...answer].sort()
  return correct.length === given.length && correct.every((v, i) => v === given[i])
}

export function describeMultiChoiceAnswer(content: MultiChoiceContent): string {
  return content.correctIndexes.map(i => content.options[i]).filter(Boolean).join(', ')
}

export function MultiChoiceEditor({ content, onChange }: {
  content: MultiChoiceContent
  onChange: (content: MultiChoiceContent) => void
}) {
  function updateOption(i: number, value: string) {
    const options = [...content.options]
    options[i] = value
    onChange({ ...content, options })
  }
  function addOption() {
    onChange({ ...content, options: [...content.options, ''] })
  }
  function removeOption(i: number) {
    const options = content.options.filter((_, idx) => idx !== i)
    const correctIndexes = content.correctIndexes.filter(ci => ci !== i).map(ci => (ci > i ? ci - 1 : ci))
    onChange({ ...content, options, correctIndexes })
  }
  function toggleCorrect(i: number) {
    const correctIndexes = content.correctIndexes.includes(i)
      ? content.correctIndexes.filter(ci => ci !== i)
      : [...content.correctIndexes, i]
    onChange({ ...content, correctIndexes })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Вопрос</label>
      <FormulaTextarea
        value={content.question}
        onChange={question => onChange({ ...content, question })}
        rows={2}
        placeholder="Например: Какие из чисел — простые?"
      />
      <label style={labelStyle}>Варианты ответа (отметь все правильные)</label>
      {content.options.map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="checkbox" checked={content.correctIndexes.includes(i)} onChange={() => toggleCorrect(i)} />
          <input
            value={opt}
            onChange={e => updateOption(i, e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder={`Вариант ${i + 1}`}
          />
          {content.options.length > 2 && (
            <button type="button" onClick={() => removeOption(i)} style={removeButtonStyle}>✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addOption} style={{ ...smallButtonStyle, alignSelf: 'flex-start' }}>+ Вариант</button>
    </div>
  )
}

export function MultiChoicePlayer({ content, onSubmit, disabled }: {
  content: MultiChoiceContent
  onSubmit: (answer: number[]) => void
  disabled?: boolean
}) {
  const [selected, setSelected] = useState<number[]>([])

  function toggle(i: number) {
    setSelected(sel => sel.includes(i) ? sel.filter(s => s !== i) : [...sel, i])
  }

  return (
    <div>
      <div style={{ marginBottom: '14px', lineHeight: 1.6, fontSize: '15px' }}>
        <Formula text={content.question} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {content.options.map((opt, i) => (
          <label key={i} style={{
            display: 'flex', gap: '10px', alignItems: 'center',
            padding: '10px 14px', border: '1px solid var(--t-border)', borderRadius: '8px',
            cursor: disabled ? 'default' : 'pointer',
            background: selected.includes(i) ? 'rgba(var(--t-accent-rgb),0.1)' : 'transparent',
          }}>
            <input type="checkbox" checked={selected.includes(i)} disabled={disabled} onChange={() => toggle(i)} />
            <Formula text={opt} />
          </label>
        ))}
      </div>
      <button
        disabled={selected.length === 0 || disabled}
        onClick={() => onSubmit(selected)}
        style={{ ...(selected.length === 0 || disabled ? submitButtonDisabledStyle : submitButtonStyle), marginTop: '14px' }}
      >
        Ответить
      </button>
    </div>
  )
}
