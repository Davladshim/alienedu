'use client'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { PlanWidget } from '@/components/PlanWidget'

// Общая шапка для всех страниц кабинета репетитора — тариф/код, ссылка на
// тарифы и выход видны везде, а не только на главном экране
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: '#0f1117', borderBottom: '1px solid #1a1d27',
        padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '18px',
      }}>
        <PlanWidget />
        <Link href="/teacher/tariffs" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>
          Тарифы
        </Link>
        <LogoutButton />
      </div>
      {children}
    </div>
  )
}
