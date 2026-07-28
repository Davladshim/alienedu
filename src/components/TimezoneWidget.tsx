'use client'
import { useEffect, useRef, useState } from 'react'
import { RUSSIAN_TIMEZONES, DEFAULT_TIMEZONE, timezoneLabel } from '@/lib/timezone'

// Тихий индикатор часового пояса в шапке кабинета — при первом заходе
// подхватывает пояс браузера автоматически (если у пользователя ещё стоит
// пояс по умолчанию), дальше можно поправить вручную из выпадающего списка
export function TimezoneWidget() {
  const [timezone, setTimezone] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => {
      const stored: string = data.timezone || DEFAULT_TIMEZONE
      setTimezone(stored)

      if (stored === DEFAULT_TIMEZONE) {
        let detected = ''
        try {
          detected = Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
          // Intl недоступен — оставляем пояс по умолчанию
        }
        if (detected && detected !== stored) {
          fetch('/api/me/timezone', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timezone: detected }),
          }).then(r => r.json()).then(res => {
            if (res.success) setTimezone(res.timezone)
          }).catch(() => {})
        }
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  async function selectTimezone(tz: string) {
    setOpen(false)
    setTimezone(tz)
    await fetch('/api/me/timezone', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: tz }),
    }).catch(() => {})
  }

  if (!timezone) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', color: '#6b7280', fontSize: '12px',
          cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px',
        }}
      >
        🕐 {timezoneLabel(timezone)}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
          background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '8px',
          padding: '4px', minWidth: '220px', maxHeight: '300px', overflowY: 'auto',
        }}>
          {RUSSIAN_TIMEZONES.map(z => (
            <button
              key={z.tz}
              type="button"
              onClick={() => selectTimezone(z.tz)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: timezone === z.tz ? 'rgba(79,142,247,0.15)' : 'transparent',
                border: 'none', color: timezone === z.tz ? '#4f8ef7' : '#e5e7eb',
                borderRadius: '6px', padding: '8px 10px', fontSize: '13px', cursor: 'pointer',
              }}
            >
              {z.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
