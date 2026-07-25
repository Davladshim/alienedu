'use client'
import { useState } from 'react'
import { Formula } from './Formula'
import { labelStyle, textareaStyle, inputStyle, smallButtonStyle, removeButtonStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface ShortTextContent {
  question: string
  correctAnswers: string[]
}

export const shortTextDefault: ShortTextContent = { question: '', correctAnswers: [''] }

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function checkShortText(content: ShortTextContent, answer: string): boolean {
  const given = normalize(answer)
  return content.correctAnswers.some(a => normalize(a) === given)
}

export function ShortTextEditor({ content, onChange }: {
  content: ShortTextContent
  onChange: (content: ShortTextContent) => void
}) {
  function updateAnswer(i: number, value: string) {
    const correctAnswers = [...content.correctAnswers]
    correctAnswers[i] = value
    onChange({ ...content, correctAnswers })
  }
  function addAnswer() {
    onChange({ ...content, correctAnswers: [...content.correctAnswers, ''] })
  }
  function removeAnswer(i: number) {
    onChange({ ...content, correctAnswers: content.correctAnswers.filter((_, idx) => idx !== i) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Вопрос</label>
      <textarea
        value={content.question}
        onChange={e => onChange({ ...content, question: e.target.value })}
        rows={2}
        style={textareaStyle}
        placeholder="Например: Как называется раздел физики, изучающий движение?"
      />
      <label style={labelStyle}>Правильные варианты ответа (регистр и пробелы не важны)</label>
      {content.correctAnswers.map((a, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={a}
            onChange={e => updateAnswer(i, e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="кинематика"
          />
          {content.correctAnswers.length > 1 && (
            <button type="button" onClick={() => removeAnswer(i)} style={removeButtonStyle}>✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addAnswer} style={{ ...smallButtonStyle, alignSelf: 'flex-start' }}>+ Ещё вариант написания</button>
    </div>
  )
}

export function ShortTextPlayer({ content, onSubmit, disabled }: {
  content: ShortTextContent
  onSubmit: (answer: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  return (
    <div>
      <div style={{ marginBottom: '14px', lineHeight: 1.6, fontSize: '15px' }}>
        <Formula text={content.question} />
      </div>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={disabled}
        style={inputStyle}
        placeholder="Твой ответ..."
      />
      <button
        disabled={!value.trim() || disabled}
        onClick={() => onSubmit(value)}
        style={{ ...(!value.trim() || disabled ? submitButtonDisabledStyle : submitButtonStyle), marginTop: '14px' }}
      >
        Ответить
      </button>
    </div>
  )
}
