'use client'
import { useEffect, useState } from 'react'
import { LogoutButton } from '@/components/LogoutButton'
import { TimezoneWidget } from '@/components/TimezoneWidget'

// Общая шапка для всех страниц кабинета ученика — имя и класс видны везде,
// чтобы не потеряться, если несколько учеников заходят с одного компьютера
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<{ full_name: string; grade: number | null } | null>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => setMe({ full_name: data.full_name, grade: data.grade })).catch(() => {})
  }, [])

  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'var(--t-bg)', borderBottom: '1px solid var(--t-card)',
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px',
      }}>
        <div style={{ color: 'var(--t-text)', fontSize: '13px', fontWeight: 600 }}>
          {me && `${me.full_name}${me.grade ? ` · ${me.grade} класс` : ''}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <TimezoneWidget />
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
