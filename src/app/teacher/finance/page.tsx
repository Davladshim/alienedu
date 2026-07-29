'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { submitButtonStyle } from '@/components/lesson-blocks/styles'

function formatMoney(n: any): string {
  const num = Number(n) || 0
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

// Один и тот же порядок и цвета для уроков и денег, чтобы счётчики читались
// зеркально: по шаблону / внеплановые / отмены / всего
const COUNTER_GROUPS = [
  { key: 'template', label: 'по шаблону', color: 'var(--t-accent)' },
  { key: 'unplanned', label: 'внеплановые', color: 'var(--t-warning)' },
  { key: 'cancelled', label: 'отмены', color: 'var(--t-danger-soft)' },
  { key: 'total', label: 'всего', color: 'var(--t-success)' },
] as const

export default function FinancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingId, setMarkingId] = useState<number | null>(null)

  function load() {
    fetch('/api/finance/overview')
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) {
          setError(d.error || 'Не удалось загрузить финансы')
          setLoading(false)
          return
        }
        setError('')
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError('Не удалось загрузить финансы')
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
      minHeight: '100vh', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif',
      color: 'var(--t-text)', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Link href="/teacher" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>💰 Финансы</h1>
        </div>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && error && (
          <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-danger-soft)', borderRadius: '16px', padding: '1.25rem', color: 'var(--t-danger-soft)' }}>
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '6px' }}>Пополнено в этом месяце</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--t-success)' }}>{formatMoney(data.monthIncome)} ₽</div>
              </div>
              <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '6px' }}>Общий баланс всех учеников</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: Number(data.totalBalance) < 0 ? 'var(--t-danger-soft)' : 'var(--t-text)' }}>{formatMoney(data.totalBalance)} ₽</div>
              </div>
            </div>

            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Уроки в этом месяце</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '14px' }}>
                {COUNTER_GROUPS.map(g => (
                  <div key={g.key}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: g.color }}>{data.lessonStats[`${g.key}Count`]}</div>
                    <div style={{ color: 'var(--t-text-muted)', fontSize: '12px' }}>{g.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Деньги в этом месяце</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '14px' }}>
                {COUNTER_GROUPS.map(g => (
                  <div key={g.key}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: g.color }}>{formatMoney(data.moneyStats[`${g.key}Money`])} ₽</div>
                    <div style={{ color: 'var(--t-text-muted)', fontSize: '12px' }}>{g.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>Нужно напомнить об оплате</div>
                {data.unpaidLessons.length > 0 && (
                  <span style={{ color: 'var(--t-danger-soft)', fontSize: '14px' }}>Итого: {formatMoney(data.unpaidTotal)} ₽</span>
                )}
              </div>

              {data.unpaidLessons.length === 0 && (
                <div style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>Все проведённые занятия оплачены 🎉</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.unpaidLessons.map((l: any) => (
                  <div key={l.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '10px',
                  }}>
                    <div style={{ fontSize: '14px' }}>
                      {l.student_name} <span style={{ color: 'var(--t-text-muted)' }}>· {new Date(l.date).toLocaleDateString('ru-RU')} {l.time} · {formatMoney(l.price)} ₽</span>
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
