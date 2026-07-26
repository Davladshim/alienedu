'use client'
import { useRef, useState } from 'react'
import { textareaStyle } from './styles'
import { FormulaEditorModal } from './FormulaEditorModal'

// Textarea с визуальным конструктором формул — открывает окно, где формула
// вводится и сразу выглядит как формула (не как код), готовый LaTeX
// оборачивается в $...$ (или $$...$$ для формулы по центру) и вставляется
// в текст на месте курсора
export function FormulaTextarea({ value, onChange, rows = 2, placeholder }: {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [centered, setCentered] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  function insert(latex: string) {
    const wrap = centered ? '$$' : '$'
    const wrapped = `${wrap}${latex}${wrap}`
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
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          style={{
            background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7', color: '#4f8ef7',
            borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
          }}
        >
          🧮 Вставить формулу
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
          <input type="checkbox" checked={centered} onChange={e => setCentered(e.target.checked)} />
          формула по центру
        </label>
      </div>

      {editorOpen && (
        <FormulaEditorModal onInsert={insert} onClose={() => setEditorOpen(false)} />
      )}
    </div>
  )
}
