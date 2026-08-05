'use client'
import { useEffect, useState } from 'react'
import { LogoutButton } from '@/components/LogoutButton'

// Общая шапка для кабинета родителя — по образцу src/app/student/layout.tsx
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<{ full_name: string } | null>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => setMe({ full_name: data.full_name })).catch(() => {})
  }, [])

  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'var(--t-bg)', borderBottom: '1px solid var(--t-card)',
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px',
      }}>
        <div style={{ color: 'var(--t-text)', fontSize: '13px', fontWeight: 600 }}>
          {me && me.full_name}
        </div>
        <LogoutButton />
      </div>
      {children}
    </div>
  )
}
