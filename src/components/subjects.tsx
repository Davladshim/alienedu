'use client'
import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react'

export interface Subject {
  label: string
  icon: (props: { size: number }) => ReactElement
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

export const SUBJECTS: Subject[] = [
  { label: 'Математика', icon: Triangle },
  { label: 'Физика', icon: Atom },
  { label: 'Химия', icon: Flask },
  { label: 'Русский язык', icon: Pencil },
  { label: 'Литература', icon: Book },
  { label: 'Английский язык', icon: EnBadge },
  { label: 'Биология', icon: Leaf },
  { label: 'История', icon: Hourglass },
  { label: 'География', icon: Globe },
  { label: 'Информатика', icon: CodeBrackets },
]

export function SubjectIcon({ subject, size = 14 }: { subject?: string; size?: number }) {
  const found = SUBJECTS.find(s => s.label === subject)
  if (!found) return null
  const Icon = found.icon
  return <Icon size={size} />
}

const pickerButtonStyle: CSSProperties = {
  width: '100%', background: '#0f1117', border: '1px solid #2a2d3d',
  borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
}

// Кастомный выпадающий список — обычный <select> не умеет показывать SVG
// внутри <option>, поэтому список строим сами
export function SubjectPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={pickerButtonStyle}>
        {value ? <SubjectIcon subject={value} /> : <span style={{ color: '#6b7280' }} />}
        <span style={{ color: value ? '#fff' : '#6b7280' }}>{value || 'Выбери предмет'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
          background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '8px',
          padding: '4px', maxHeight: '280px', overflowY: 'auto',
        }}>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              style={{ ...pickerButtonStyle, background: 'transparent', border: 'none', color: '#6b7280', padding: '8px 10px' }}
            >
              Без предмета
            </button>
          )}
          {SUBJECTS.map(s => (
            <button
              key={s.label}
              type="button"
              onClick={() => { onChange(s.label); setOpen(false) }}
              style={{ ...pickerButtonStyle, background: value === s.label ? 'rgba(79,142,247,0.15)' : 'transparent', border: 'none', padding: '8px 10px' }}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
