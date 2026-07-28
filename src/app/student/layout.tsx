'use client'
import { LogoutButton } from '@/components/LogoutButton'

// Общая шапка для всех страниц кабинета ученика — кнопка выхода видна
// везде, а не только на главном экране
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: '#0f1117', borderBottom: '1px solid #1a1d27',
        padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
      }}>
        <LogoutButton />
      </div>
      {children}
    </div>
  )
}
