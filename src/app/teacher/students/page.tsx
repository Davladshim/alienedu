'use client'
import Link from 'next/link'

export default function StudentsPage() {
  return (
  <div style={{
    minHeight: '100vh',
    background: '#0f1117',
    fontFamily: 'system-ui, sans-serif',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
  }}>
  <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
          ← Кабинет
        </Link>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>👥 Мои ученики</h1>
      </div>

      <div style={{
        background: '#1a1d27', border: '1px solid #2a2d3d',
        borderRadius: '16px', padding: '3rem',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '300px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Список учеников</div>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          Здесь будет список всех твоих учеников — скоро
        </div>
      </div>
    </div>
  </div>
  )
}