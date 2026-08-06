'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { PlanWidget } from '@/components/PlanWidget'
import { TimezoneWidget } from '@/components/TimezoneWidget'

// На узких экранах шапка (тариф+код, часовой пояс, "Тарифы", "Аккаунт",
// "Выйти" — пять элементов подряд) переставала помещаться и уезжала за
// край экрана. Высоту шапки трогать нельзя, поэтому вместо переноса на
// вторую строку — часовой пояс, "Тарифы", "Аккаунт" и "Выйти" прячутся
// за кнопку-меню (⋮), а тариф с полем для кода остаётся виден всегда
function useNarrowScreen(breakpoint = 700): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return narrow
}

function HeaderMenu() {
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
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Меню"
        style={{
          background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
          borderRadius: '8px', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer', lineHeight: 1,
        }}
      >
        ⋮
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200,
          background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '10px',
          padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <TimezoneWidget />
          <Link href="/teacher/tariffs" onClick={() => setOpen(false)} style={{ color: 'var(--t-text-secondary)', fontSize: '13px', textDecoration: 'none' }}>
            Тарифы
          </Link>
          <Link href="/account" onClick={() => setOpen(false)} style={{ color: 'var(--t-text-secondary)', fontSize: '13px', textDecoration: 'none' }}>
            Аккаунт
          </Link>
          <LogoutButton />
        </div>
      )}
    </div>
  )
}

// Общая шапка для всех страниц кабинета репетитора — тариф/код, ссылка на
// тарифы и выход видны везде, а не только на главном экране
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const narrow = useNarrowScreen()

  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'var(--t-bg)', borderBottom: '1px solid var(--t-card)',
        padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '18px',
      }}>
        <PlanWidget />
        {narrow ? (
          <HeaderMenu />
        ) : (
          <>
            <TimezoneWidget />
            <Link href="/teacher/tariffs" style={{ color: 'var(--t-text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Тарифы
            </Link>
            <Link href="/account" style={{ color: 'var(--t-text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Аккаунт
            </Link>
            <LogoutButton />
          </>
        )}
      </div>
      {children}
    </div>
  )
}
