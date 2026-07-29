'use client'
import { useState } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { labelStyle, inputStyle, smallButtonStyle, removeButtonStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface SingleChoiceContent {
  question: string
  options: string[]
  correctIndex: number
}

export const singleChoiceDefault: SingleChoiceContent = {
  question: '', options: ['', ''], correctIndex: 0,
}

export function checkSingleChoice(content: SingleChoiceContent, answer: number): boolean {
  return answer === content.correctIndex
}

export function describeSingleChoiceAnswer(content: SingleChoiceContent): string {
  return content.options[content.correctIndex] ?? ''
}

export function SingleChoiceEditor({ content, onChange }: {
  content: SingleChoiceContent
  onChange: (content: SingleChoiceContent) => void
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
    const correctIndex = content.correctIndex >= options.length ? 0 : content.correctIndex
    onChange({ ...content, options, correctIndex })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Вопрос</label>
      <FormulaTextarea
        value={content.question}
        onChange={question => onChange({ ...content, question })}
        rows={3}
        placeholder="Например: Чему равен $2+2$?"
      />
      <label style={labelStyle}>Варианты ответа (отметь правильный кружком)</label>
      {content.options.map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="radio" checked={content.correctIndex === i} onChange={() => onChange({ ...content, correctIndex: i })} />
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

export function SingleChoicePlayer({ content, onSubmit, disabled }: {
  content: SingleChoiceContent
  onSubmit: (answer: number) => void
  disabled?: boolean
}) {
  const [selected, setSelected] = useState<number | null>(null)

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
            background: selected === i ? 'rgba(var(--t-accent-rgb),0.1)' : 'transparent',
          }}>
            <input type="radio" name="single-choice" checked={selected === i} disabled={disabled} onChange={() => setSelected(i)} />
            <Formula text={opt} />
          </label>
        ))}
      </div>
      <button
        disabled={selected === null || disabled}
        onClick={() => selected !== null && onSubmit(selected)}
        style={{ ...(selected === null || disabled ? submitButtonDisabledStyle : submitButtonStyle), marginTop: '14px' }}
      >
        Ответить
      </button>
    </div>
  )
}
