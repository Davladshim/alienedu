'use client'
import { useState, type CSSProperties } from 'react'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12 C4 6 8 3 12 3 C16 3 20 6 23 12 C20 18 16 21 12 21 C8 21 4 18 1 12 Z" />
      <circle cx="12" cy="12" r="3.2" />
      {!open && <line x1="3" y1="21" x2="21" y2="3" />}
    </svg>
  )
}

// Поле пароля с иконкой-глазиком для показа/скрытия введённого текста —
// используется в формах входа, регистрации и восстановления доступа
export function PasswordInput({
  value, onChange, placeholder, name, required, style, autoComplete,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  name?: string
  required?: boolean
  style: CSSProperties
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        style={{ ...style, paddingRight: '42px' }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer',
          padding: 0, display: 'flex', alignItems: 'center',
        }}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  )
}
