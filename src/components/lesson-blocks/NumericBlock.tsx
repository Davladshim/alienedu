'use client'
import { useState } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { FormulaTextInput } from './FormulaTextInput'
import { labelStyle, inputStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface NumericContent {
  question: string
  correctValue: number
  tolerance: number
  unit?: string
}

export const numericDefault: NumericContent = { question: '', correctValue: 0, tolerance: 0, unit: '' }

export function checkNumeric(content: NumericContent, answer: number): boolean {
  if (Number.isNaN(answer)) return false
  return Math.abs(answer - content.correctValue) <= content.tolerance
}

export function describeNumericAnswer(content: NumericContent): string {
  const tolerance = content.tolerance ? ` ± ${content.tolerance}` : ''
  const unit = content.unit ? ` ${content.unit}` : ''
  return `${content.correctValue}${tolerance}${unit}`
}

export function NumericEditor({ content, onChange }: {
  content: NumericContent
  onChange: (content: NumericContent) => void
}) {
  // Локальный текст вместо number-инпута, привязанного напрямую к content —
  // иначе поле нельзя нормально очистить (снова превращается в "0" на каждый ввод)
  const [correctValueText, setCorrectValueText] = useState(String(content.correctValue ?? ''))
  const [toleranceText, setToleranceText] = useState(String(content.tolerance ?? ''))

  function handleCorrectValueChange(v: string) {
    setCorrectValueText(v)
    const num = Number(v.replace(',', '.'))
    if (v.trim() !== '' && !Number.isNaN(num)) onChange({ ...content, correctValue: num })
  }
  function handleToleranceChange(v: string) {
    setToleranceText(v)
    const num = Number(v.replace(',', '.'))
    if (v.trim() !== '' && !Number.isNaN(num)) onChange({ ...content, tolerance: num })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Вопрос</label>
      <FormulaTextarea
        value={content.question}
        onChange={question => onChange({ ...content, question })}
        rows={3}
        placeholder="Например: Чему равно ускорение свободного падения на Земле, м/с²?"
      />
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Правильный ответ</label>
          <input
            type="text"
            inputMode="decimal"
            value={correctValueText}
            onChange={e => handleCorrectValueChange(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Допустимая погрешность (±)</label>
          <input
            type="text"
            inputMode="decimal"
            value={toleranceText}
            onChange={e => handleToleranceChange(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Единица измерения</label>
          <FormulaTextInput
            value={content.unit || ''}
            onChange={unit => onChange({ ...content, unit })}
            placeholder="м/с²"
            iconOnly
          />
        </div>
      </div>
    </div>
  )
}

export function NumericPlayer({ content, onSubmit, disabled }: {
  content: NumericContent
  onSubmit: (answer: number) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')
  const parsed = Number(value.replace(',', '.'))
  const isValid = value.trim() !== '' && !Number.isNaN(parsed)

  return (
    <div>
      <div style={{ marginBottom: '14px', lineHeight: 1.6, fontSize: '15px' }}>
        <Formula text={content.question} />
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={disabled}
          style={{ ...inputStyle, maxWidth: '200px' }}
          placeholder="Число"
          inputMode="decimal"
        />
        {content.unit && <span style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>{content.unit}</span>}
      </div>
      <button
        disabled={!isValid || disabled}
        onClick={() => onSubmit(parsed)}
        style={{ ...(!isValid || disabled ? submitButtonDisabledStyle : submitButtonStyle), marginTop: '14px' }}
      >
        Ответить
      </button>
    </div>
  )
}
