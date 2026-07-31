'use client'
import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { inputStyle as baseInputStyle } from './styles'
import { FormulaEditorModal } from './FormulaEditorModal'

// Компактный аналог FormulaTextarea для однострочных полей (варианты
// ответа, термины, шаги, короткие ответы) — без выбора "формула по
// центру" (для инлайн-текста она не нужна): поле по ширине уступает
// место кнопке вставки формулы рядом с собой
export function FormulaTextInput({ value, onChange, placeholder, style, inputStyle: inputStyleOverride, iconOnly, disabled }: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: CSSProperties
  inputStyle?: CSSProperties
  iconOnly?: boolean
  disabled?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  function insert(latex: string) {
    const wrapped = `$${latex}$`
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
    <div style={{ display: 'flex', gap: '6px', ...style }}>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...baseInputStyle, ...inputStyleOverride, flex: 1, minWidth: 0 }}
      />
      <button
        type="button"
        onClick={() => setEditorOpen(true)}
        disabled={disabled}
        title="Вставить формулу"
        style={{
          background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)',
          borderRadius: '8px', padding: iconOnly ? '0 8px' : '0 12px', fontSize: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {iconOnly ? '🧮' : '🧮 Формула'}
      </button>

      {editorOpen && (
        <FormulaEditorModal onInsert={insert} onClose={() => setEditorOpen(false)} />
      )}
    </div>
  )
}
