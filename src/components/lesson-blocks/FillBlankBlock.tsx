'use client'
import { useState } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { FormulaTextInput } from './FormulaTextInput'
import { labelStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface FillBlankContent {
  template: string // пропуски отмечаются как ___
  blanks: string[] // правильный ответ для каждого ___ по порядку
}

export const fillBlankDefault: FillBlankContent = { template: '', blanks: [] }

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function countBlanks(template: string): number {
  return (template.match(/___/g) || []).length
}

export function checkFillBlank(content: FillBlankContent, answer: string[]): boolean {
  if (!Array.isArray(answer) || answer.length !== content.blanks.length) return false
  return content.blanks.every((correct, i) => normalize(correct) === normalize(answer[i] || ''))
}

export function describeFillBlankAnswer(content: FillBlankContent): string {
  return content.blanks.filter(Boolean).join(', ')
}

export function FillBlankEditor({ content, onChange }: {
  content: FillBlankContent
  onChange: (content: FillBlankContent) => void
}) {
  function updateTemplate(template: string) {
    const n = countBlanks(template)
    const blanks = Array.from({ length: n }, (_, i) => content.blanks[i] || '')
    onChange({ template, blanks })
  }
  function updateBlank(i: number, value: string) {
    const blanks = [...content.blanks]
    blanks[i] = value
    onChange({ ...content, blanks })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Текст с пропусками — отмечай пропуск как <code>___</code> (три подчёркивания)</label>
      <FormulaTextarea
        value={content.template}
        onChange={updateTemplate}
        rows={3}
        placeholder="Например: Единица измерения силы — ___, обозначается ___."
      />
      {content.blanks.length > 0 && (
        <>
          <label style={labelStyle}>Правильные ответы для пропусков (по порядку)</label>
          {content.blanks.map((b, i) => (
            <FormulaTextInput
              key={i}
              value={b}
              onChange={value => updateBlank(i, value)}
              placeholder={`Ответ для пропуска ${i + 1}`}
            />
          ))}
        </>
      )}
    </div>
  )
}

export function FillBlankPlayer({ content, onSubmit, disabled }: {
  content: FillBlankContent
  onSubmit: (answer: string[]) => void
  disabled?: boolean
}) {
  const segments = content.template.split('___')
  const [values, setValues] = useState<string[]>(() => Array(content.blanks.length).fill(''))

  function updateValue(i: number, value: string) {
    setValues(v => { const copy = [...v]; copy[i] = value; return copy })
  }

  const allFilled = values.every(v => v.trim() !== '')

  return (
    <div>
      <div style={{ lineHeight: 2.2, fontSize: '15px' }}>
        {segments.map((segment, i) => (
          <span key={i}>
            <Formula text={segment} />
            {i < segments.length - 1 && (
              <FormulaTextInput
                value={values[i] || ''}
                onChange={value => updateValue(i, value)}
                disabled={disabled}
                iconOnly
                style={{ display: 'inline-flex', width: '140px', margin: '0 6px', verticalAlign: 'middle' }}
              />
            )}
          </span>
        ))}
      </div>
      <button
        disabled={!allFilled || disabled}
        onClick={() => onSubmit(values)}
        style={{ ...(!allFilled || disabled ? submitButtonDisabledStyle : submitButtonStyle), marginTop: '16px' }}
      >
        Ответить
      </button>
    </div>
  )
}
