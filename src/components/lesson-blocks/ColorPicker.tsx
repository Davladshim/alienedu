'use client'
import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'alienedu-recent-text-colors'
const MAX_RECENT = 12

// Недавние цвета хранятся в localStorage — общие для всех уроков и блоков
// на этом устройстве, а не привязаны к конкретному уроку
function loadRecentColors(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRecentColor(hex: string) {
  if (typeof window === 'undefined') return
  const current = loadRecentColors().filter(c => c.toLowerCase() !== hex.toLowerCase())
  const next = [hex, ...current].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — не критично
  }
}

function normalizeHex(input: string): string | null {
  let v = input.trim()
  if (!v.startsWith('#')) v = '#' + v
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    v = '#' + v.slice(1).split('').map(c => c + c).join('')
  }
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase()
  return null
}

// Выпадающий выбор цвета текста: цветовой пикер, ввод hex-кода вручную и
// плитка недавно использованных цветов (общая для всех уроков)
export function ColorPicker({ color, onApply }: {
  color: string
  onApply: (color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pickerColor, setPickerColor] = useState(color)
  const [hexInput, setHexInput] = useState(color)
  const [recent, setRecent] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  function toggleOpen() {
    setOpen(o => {
      const next = !o
      if (next) {
        setRecent(loadRecentColors())
        setPickerColor(color)
        setHexInput(color)
      }
      return next
    })
  }

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function apply(hex: string) {
    saveRecentColor(hex)
    onApply(hex)
    setOpen(false)
  }

  function handleHexSubmit() {
    const normalized = normalizeHex(hexInput)
    if (normalized) apply(normalized)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        title="Цвет текста"
        onClick={toggleOpen}
        style={{
          background: 'transparent', border: '1px solid var(--t-border)', borderRadius: '6px',
          width: '28px', height: '26px', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: color, display: 'block' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '32px', left: 0, zIndex: 20,
          background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '10px',
          padding: '10px', width: '200px', boxShadow: '0 8px 24px var(--t-shadow)',
        }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="color"
              value={pickerColor}
              onChange={e => { setPickerColor(e.target.value); setHexInput(e.target.value) }}
              style={{ width: '28px', height: '28px', padding: 0, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              value={hexInput}
              onChange={e => setHexInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleHexSubmit() } }}
              placeholder="#000000"
              style={{
                flex: 1, minWidth: 0, background: 'var(--t-bg)', border: '1px solid var(--t-border)',
                borderRadius: '6px', padding: '5px 8px', color: 'var(--t-text)', fontSize: '12px', outline: 'none',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleHexSubmit}
            style={{
              width: '100%', background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)',
              color: 'var(--t-accent)', borderRadius: '6px', padding: '5px 0', fontSize: '12px', cursor: 'pointer',
              marginBottom: recent.length ? '8px' : 0,
            }}
          >
            Применить цвет
          </button>
          {recent.length > 0 && (
            <div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '11px', marginBottom: '4px' }}>Недавние цвета</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {recent.map(c => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => apply(c)}
                    style={{
                      width: '20px', height: '20px', borderRadius: '4px', background: c,
                      border: c.toLowerCase() === color.toLowerCase() ? '2px solid var(--t-accent)' : '1px solid var(--t-border)',
                      cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
