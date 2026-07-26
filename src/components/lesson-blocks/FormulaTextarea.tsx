'use client'
import { useRef, useState } from 'react'
import { textareaStyle } from './styles'

const SYMBOLS: { label: string; snippet: string }[] = [
  { label: 'дробь', snippet: '\\frac{a}{b}' },
  { label: 'степень', snippet: 'x^{2}' },
  { label: 'корень', snippet: '\\sqrt{x}' },
  { label: '±', snippet: '\\pm' },
  { label: '≤', snippet: '\\leq' },
  { label: '≥', snippet: '\\geq' },
  { label: '≠', snippet: '\\neq' },
  { label: 'π', snippet: '\\pi' },
  { label: '∆', snippet: '\\Delta' },
  { label: '°', snippet: '^{\\circ}' },
  { label: '∞', snippet: '\\infty' },
  { label: 'индекс', snippet: 'x_{1}' },
]

// Textarea с кнопками вставки формул — оборачивает выделенный/введённый
// фрагмент в $...$ (или $$...$$ для формулы по центру), не требуя от
// преподавателя знания синтаксиса LaTeX
export function FormulaTextarea({ value, onChange, rows = 2, placeholder }: {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [centered, setCentered] = useState(false)

  function insert(snippet: string) {
    const wrap = centered ? '$$' : '$'
    const wrapped = `${wrap}${snippet}${wrap}`
    const el = ref.current
    if (!el) {
      onChange(value + wrapped)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = value.slice(0, start) + wrapped + value.slice(end)
    onChange(next)
    const cursorPos = start + wrapped.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursorPos, cursorPos)
    })
  }

  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        style={textareaStyle}
        placeholder={placeholder}
      />
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
        {SYMBOLS.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => insert(s.snippet)}
            style={{
              background: '#0f1117', border: '1px solid #2a2d3d', color: '#9ca3af',
              borderRadius: '6px', padding: '3px 9px', fontSize: '12px', cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280', marginLeft: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={centered} onChange={e => setCentered(e.target.checked)} />
          формула по центру
        </label>
      </div>
    </div>
  )
}
