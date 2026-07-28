'use client'
import { useRef, useState } from 'react'
import { textareaStyle } from './styles'
import { FormulaEditorModal } from './FormulaEditorModal'

const formatBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
  borderRadius: '6px', width: '28px', height: '26px', fontSize: '13px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

// Textarea с визуальным конструктором формул и простым форматированием
// текста (жирный/курсив/подчёркнутый/цвет) — открывает окно для формулы,
// готовый LaTeX оборачивается в $...$ (или $$...$$ для формулы по центру);
// форматирование оборачивает выделенный текст в **...**/__...__/*...*/
// [color=...]...[/color] — см. разбор разметки в Formula.tsx
export function FormulaTextarea({ value, onChange, rows = 2, placeholder }: {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [centered, setCentered] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [color, setColor] = useState('#f472b6')

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

  function wrapSelection(before: string, after: string) {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const selected = value.slice(start, end)
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    const cursorStart = start + before.length
    const cursorEnd = cursorStart + selected.length
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(cursorEnd, cursorEnd)
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
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
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

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button type="button" title="Жирный" onClick={() => wrapSelection('**', '**')} style={{ ...formatBtnStyle, fontWeight: 700 }}>
            Ж
          </button>
          <button type="button" title="Курсив" onClick={() => wrapSelection('*', '*')} style={{ ...formatBtnStyle, fontStyle: 'italic' }}>
            К
          </button>
          <button type="button" title="Подчёркнутый" onClick={() => wrapSelection('__', '__')} style={{ ...formatBtnStyle, textDecoration: 'underline' }}>
            Ч
          </button>
          <button
            type="button"
            title="Цвет текста"
            onClick={() => wrapSelection(`[color=${color}]`, '[/color]')}
            style={{ ...formatBtnStyle, padding: 0 }}
          >
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: color, display: 'block' }} />
          </button>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            title="Выбрать цвет"
            style={{ width: '22px', height: '22px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </div>

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
