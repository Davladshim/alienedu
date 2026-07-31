'use client'
import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react'

export interface Subject {
  label: string
  icon: (props: { size: number }) => ReactElement
  color: string
}

function Triangle({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3 L21 20 H3 Z" /></svg>
}
function Atom({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <ellipse cx="12" cy="12" rx="9" ry="3.5" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
function Flask({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M9 3 H15 M10 3 V9 L4.5 19 A2 2 0 0 0 6.3 21 H17.7 A2 2 0 0 0 19.5 19 L14 9 V3" />
    </svg>
  )
}
function Pencil({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 20 L5 15.5 L16 4.5 A2 2 0 0 1 19 7.5 L8 18.5 Z M14 6.5 L17.5 10" />
    </svg>
  )
}
function Book({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6 C7 4 9 4 12 6 C15 4 17 4 20 6 V18 C17 16 15 16 12 18 C9 16 7 16 4 18 Z M12 6 V18" />
    </svg>
  )
}
function EnBadge({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <text x="12" y="15.5" fontSize="8" fontWeight="700" textAnchor="middle" fill="currentColor" stroke="none">EN</text>
    </svg>
  )
}
function Leaf({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 3 C18 3 20 9 20 13 C20 18 16 21 12 21 C8 21 4 18 4 13 C4 9 6 3 12 3 Z M12 5 V19" />
    </svg>
  )
}
function Hourglass({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M6 3 H18 L12 12 L18 21 H6 L12 12 Z" />
    </svg>
  )
}
function Globe({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}
function CodeBrackets({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 8 L4 12 L9 16 M15 8 L20 12 L15 16" />
    </svg>
  )
}
function Columns({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21 V10 M9 21 V6 M15 21 V6 M20 21 V10 M2 21 H22 M12 3 L20 7 H4 Z" />
    </svg>
  )
}
// Значок по умолчанию — для предметов, введённых вручную через "Другое"
function OtherIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export const SUBJECTS: Subject[] = [
  { label: 'Математика', icon: Triangle, color: '#60a5fa' },
  { label: 'Физика', icon: Atom, color: '#a78bfa' },
  { label: 'Химия', icon: Flask, color: '#34d399' },
  { label: 'Русский язык', icon: Pencil, color: '#f472b6' },
  { label: 'Литература', icon: Book, color: '#fb923c' },
  { label: 'Английский язык', icon: EnBadge, color: '#22d3ee' },
  { label: 'Биология', icon: Leaf, color: '#84cc16' },
  { label: 'История', icon: Hourglass, color: '#fbbf24' },
  { label: 'Обществознание', icon: Columns, color: '#fb7185' },
  { label: 'География', icon: Globe, color: '#2dd4bf' },
  { label: 'Информатика', icon: CodeBrackets, color: '#818cf8' },
]

const DEFAULT_SUBJECT_COLOR = '#6b7280'

// Палитра для предметов, введённых вручную через "Другое" (не входят в SUBJECTS).
// Цвет выбирается детерминированно по названию — один и тот же кастомный
// предмет всегда получает один и тот же цвет, без какого-либо хранения
const CUSTOM_SUBJECT_PALETTE = [
  '#eab308', '#ef4444', '#14b8a6', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f97316',
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function customSubjectColor(subject: string): string {
  return CUSTOM_SUBJECT_PALETTE[hashString(subject) % CUSTOM_SUBJECT_PALETTE.length]
}

export function SubjectIcon({ subject, size = 14 }: { subject?: string; size?: number }) {
  if (!subject) return null
  const found = SUBJECTS.find(s => s.label === subject)
  const Icon = found ? found.icon : OtherIcon
  return <Icon size={size} />
}

export function subjectColor(subject?: string): string {
  if (!subject) return DEFAULT_SUBJECT_COLOR
  const found = SUBJECTS.find(s => s.label === subject)
  return found ? found.color : customSubjectColor(subject)
}

const pickerButtonStyle: CSSProperties = {
  width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)',
  borderRadius: '8px', padding: '10px 14px', color: 'var(--t-text)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
}

// Кастомный выпадающий список — обычный <select> не умеет показывать SVG
// внутри <option>, поэтому список строим сами
export function SubjectPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customText, setCustomText] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function toggleOpen() {
    setOpen(o => {
      const next = !o
      if (next) {
        // Если сейчас выбран предмет, которого нет в фиксированном списке —
        // это ранее введённый вручную предмет, сразу открываем поле для его правки
        const isCustom = !!value && !SUBJECTS.some(s => s.label === value)
        setCustomOpen(isCustom)
        setCustomText(isCustom ? value : '')
      }
      return next
    })
  }

  function confirmCustom() {
    const trimmed = customText.trim()
    if (!trimmed) return
    onChange(trimmed)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={toggleOpen} style={pickerButtonStyle}>
        {value ? <SubjectIcon subject={value} /> : <span style={{ color: 'var(--t-text-muted)' }} />}
        <span style={{ color: value ? 'var(--t-text)' : 'var(--t-text-muted)' }}>{value || 'Выбери предмет'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
          background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '8px',
          padding: '4px', maxHeight: '340px', overflowY: 'auto',
        }}>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              style={{ ...pickerButtonStyle, background: 'transparent', border: 'none', color: 'var(--t-text-muted)', padding: '8px 10px' }}
            >
              Без предмета
            </button>
          )}
          {SUBJECTS.map(s => (
            <button
              key={s.label}
              type="button"
              onClick={() => { onChange(s.label); setOpen(false) }}
              style={{ ...pickerButtonStyle, background: value === s.label ? 'rgba(var(--t-accent-rgb),0.15)' : 'transparent', border: 'none', padding: '8px 10px' }}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
          {!customOpen && (
            <button
              type="button"
              onClick={() => { setCustomOpen(true); setCustomText('') }}
              style={{ ...pickerButtonStyle, background: 'transparent', border: 'none', padding: '8px 10px' }}
            >
              <OtherIcon size={16} />
              Другое...
            </button>
          )}
          {customOpen && (
            <div style={{ display: 'flex', gap: '6px', padding: '6px 8px' }}>
              <input
                autoFocus
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmCustom() } }}
                placeholder="Название предмета"
                style={{
                  flex: 1, background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '6px',
                  padding: '7px 10px', color: 'var(--t-text)', fontSize: '13px', outline: 'none', minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={confirmCustom}
                disabled={!customText.trim()}
                style={{
                  flexShrink: 0, background: 'var(--t-accent)', border: 'none', borderRadius: '6px', color: '#fff',
                  padding: '0 12px', fontSize: '13px', cursor: customText.trim() ? 'pointer' : 'not-allowed',
                  opacity: customText.trim() ? 1 : 0.6,
                }}
              >
                ✓
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
