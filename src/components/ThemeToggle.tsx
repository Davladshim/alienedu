'use client'
import { useState } from 'react'

const STORAGE_KEY = 'alienedu-theme'

// Ленивая инициализация читает уже выставленный синхронным скриптом в
// <head> атрибут data-theme — совпадает с тем, что реально отрисовано на
// экране, поэтому лишний useEffect для синхронизации после монтирования
// не нужен (и не будет вспышки неверной иконки на старте)
function getInitialTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <button
      onClick={toggle}
      suppressHydrationWarning
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '1px solid var(--t-border)',
        background: 'var(--t-card)',
        color: 'var(--t-text)',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 12px var(--t-shadow)',
      }}
    >
      {theme === 'dark' ? '🌙' : '🌞'}
    </button>
  )
}
