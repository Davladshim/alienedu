'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { submitButtonStyle } from '@/components/lesson-blocks/styles'

function formatMoney(n: any): string {
  const num = Number(n) || 0
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function FinancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<number | null>(null)

  function load() {
    fetch('/api/finance/overview')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  async function markPaid(id: number) {
    setMarkingId(id)
    await fetch(`/api/schedule/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_paid: true }),
    })
    setMarkingId(null)
    load()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif',
      color: '#fff', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>💰 Финансы</h1>
        </div>

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        {!loading && data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
              <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>Пополнено в этом месяце</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#34d399' }}>{formatMoney(data.monthIncome)} ₽</div>
              </div>
              <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>Проведено уроков в этом месяце</div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>{data.monthCompletedCount} <span style={{ fontSize: '14px', color: '#6b7280' }}>на {formatMoney(data.monthCompletedTotal)} ₽</span></div>
              </div>
              <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>Общий баланс всех учеников</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: Number(data.totalBalance) < 0 ? '#f87171' : '#fff' }}>{formatMoney(data.totalBalance)} ₽</div>
              </div>
            </div>

            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>Нужно напомнить об оплате</div>
                {data.unpaidLessons.length > 0 && (
                  <span style={{ color: '#f87171', fontSize: '14px' }}>Итого: {formatMoney(data.unpaidTotal)} ₽</span>
                )}
              </div>

              {data.unpaidLessons.length === 0 && (
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Все проведённые занятия оплачены 🎉</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.unpaidLessons.map((l: any) => (
                  <div key={l.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: '#0f1117', border: '1px solid #2a2d3d', borderRadius: '10px',
                  }}>
                    <div style={{ fontSize: '14px' }}>
                      {l.student_name} <span style={{ color: '#6b7280' }}>· {new Date(l.date).toLocaleDateString('ru-RU')} {l.time} · {formatMoney(l.price)} ₽</span>
                    </div>
                    <button onClick={() => markPaid(l.id)} disabled={markingId === l.id} style={{ ...submitButtonStyle, padding: '6px 14px', fontSize: '12px' }}>
                      {markingId === l.id ? '...' : '💰 Отметить оплаченным'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
