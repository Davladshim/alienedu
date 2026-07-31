'use client'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { PlanWidget } from '@/components/PlanWidget'
import { TimezoneWidget } from '@/components/TimezoneWidget'

// Общая шапка для всех страниц кабинета репетитора — тариф/код, ссылка на
// тарифы и выход видны везде, а не только на главном экране
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'var(--t-bg)', borderBottom: '1px solid var(--t-card)',
        padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '18px',
      }}>
        <PlanWidget />
        <TimezoneWidget />
        <Link href="/teacher/tariffs" style={{ color: 'var(--t-text-muted)', fontSize: '13px', textDecoration: 'none' }}>
          Тарифы
        </Link>
        <Link href="/account" style={{ color: 'var(--t-text-muted)', fontSize: '13px', textDecoration: 'none' }}>
          Аккаунт
        </Link>
        <LogoutButton />
      </div>
      {children}
    </div>
  )
}
