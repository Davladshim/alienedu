import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

export const legalH2Style: CSSProperties = {
  fontSize: '18px', fontWeight: 700, color: 'var(--t-text)', margin: '2rem 0 0.75rem',
}

export const legalPStyle: CSSProperties = {
  margin: '0 0 0.9rem',
}

export const legalUlStyle: CSSProperties = {
  margin: '0 0 0.9rem', paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
}

export function LegalPageLayout({ title, updated, children }: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif', color: 'var(--t-text)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '760px', padding: '2rem' }}>
        <Link href="/" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>← На главную</Link>
        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '14px 0 4px' }}>{title}</h1>
        <p style={{ color: 'var(--t-text-muted)', fontSize: '13px', margin: '0 0 2rem' }}>Действует с {updated}</p>
        <div style={{ color: 'var(--t-text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
