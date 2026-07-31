'use client'
import { useState } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { FormulaTextInput } from './FormulaTextInput'
import { labelStyle, smallButtonStyle, removeButtonStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface OrderingContent {
  instruction: string
  steps: string[]
}

export const orderingDefault: OrderingContent = {
  instruction: '', steps: ['', ''],
}

// answer — массив исходных индексов в том порядке, в котором их расставил ученик
export function checkOrdering(content: OrderingContent, answer: number[]): boolean {
  if (!Array.isArray(answer) || answer.length !== content.steps.length) return false
  return answer.every((originalIndex, position) => originalIndex === position)
}

export function describeOrderingAnswer(content: OrderingContent): string {
  return content.steps.map((s, i) => `${i + 1}. ${s}`).join('  ')
}

export function OrderingEditor({ content, onChange }: {
  content: OrderingContent
  onChange: (content: OrderingContent) => void
}) {
  function updateStep(i: number, value: string) {
    const steps = [...content.steps]
    steps[i] = value
    onChange({ ...content, steps })
  }
  function addStep() {
    onChange({ ...content, steps: [...content.steps, ''] })
  }
  function removeStep(i: number) {
    onChange({ ...content, steps: content.steps.filter((_, idx) => idx !== i) })
  }
  function moveStep(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= content.steps.length) return
    const steps = [...content.steps]
    ;[steps[i], steps[j]] = [steps[j], steps[i]]
    onChange({ ...content, steps })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Задание</label>
      <FormulaTextarea
        value={content.instruction}
        onChange={instruction => onChange({ ...content, instruction })}
        rows={2}
        placeholder="Например: Расставь шаги решения в правильном порядке"
      />
      <label style={labelStyle}>Шаги в правильном порядке</label>
      {content.steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: 'var(--t-text-muted)', fontSize: '13px', width: '18px' }}>{i + 1}.</span>
          <FormulaTextInput
            value={step}
            onChange={value => updateStep(i, value)}
            style={{ flex: 1 }}
            placeholder={`Шаг ${i + 1}`}
          />
          <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} style={removeButtonStyle}>↑</button>
          <button type="button" onClick={() => moveStep(i, 1)} disabled={i === content.steps.length - 1} style={removeButtonStyle}>↓</button>
          {content.steps.length > 2 && (
            <button type="button" onClick={() => removeStep(i)} style={removeButtonStyle}>✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addStep} style={{ ...smallButtonStyle, alignSelf: 'flex-start' }}>+ Шаг</button>
    </div>
  )
}

function shuffledIndexes(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function OrderingPlayer({ content, onSubmit, disabled }: {
  content: OrderingContent
  onSubmit: (answer: number[]) => void
  disabled?: boolean
}) {
  const [order, setOrder] = useState<number[]>(() => shuffledIndexes(content.steps.length))

  function move(position: number, dir: -1 | 1) {
    const target = position + dir
    if (target < 0 || target >= order.length) return
    const copy = [...order]
    ;[copy[position], copy[target]] = [copy[target], copy[position]]
    setOrder(copy)
  }

  return (
    <div>
      {content.instruction && (
        <div style={{ marginBottom: '14px', lineHeight: 1.6, fontSize: '15px' }}>
          <Formula text={content.instruction} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {order.map((originalIndex, position) => (
          <div key={originalIndex} style={{
            display: 'flex', gap: '10px', alignItems: 'center',
            padding: '10px 14px', border: '1px solid var(--t-border)', borderRadius: '8px',
          }}>
            <span style={{ color: 'var(--t-text-muted)', fontSize: '13px', width: '18px' }}>{position + 1}.</span>
            <div style={{ flex: 1 }}><Formula text={content.steps[originalIndex]} /></div>
            <button type="button" onClick={() => move(position, -1)} disabled={disabled || position === 0} style={removeButtonStyle}>↑</button>
            <button type="button" onClick={() => move(position, 1)} disabled={disabled || position === order.length - 1} style={removeButtonStyle}>↓</button>
          </div>
        ))}
      </div>
      <button
        disabled={disabled}
        onClick={() => onSubmit(order)}
        style={{ ...(disabled ? submitButtonDisabledStyle : submitButtonStyle), marginTop: '14px' }}
      >
        Ответить
      </button>
    </div>
  )
}
