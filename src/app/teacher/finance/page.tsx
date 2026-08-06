'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { submitButtonStyle, submitButtonDisabledStyle, inputStyle } from '@/components/lesson-blocks/styles'

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

// Ключ должника — ученик и семья используют разные id-пространства
function debtorKey(d: any): string {
  return d.kind === 'family' ? `family-${d.familyId}` : `student-${d.teacherStudentId}`
}

export default function FinancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [payingKey, setPayingKey] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payDescription, setPayDescription] = useState('')
  const [paying, setPaying] = useState(false)
  const [history, setHistory] = useState<any[] | null>(null)

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

  function togglePay(d: any) {
    const key = debtorKey(d)
    setPayingKey(payingKey === key ? null : key)
    setPayAmount('')
    setPayDescription('')
    setHistory(null)
  }

  function loadHistory(d: any) {
    const query = d.kind === 'family' ? `family_id=${d.familyId}` : `teacher_student_id=${d.teacherStudentId}`
    fetch(`/api/payments?${query}`)
      .then(r => r.json())
      .then(data => setHistory(data.payments || []))
  }

  // Дублирует "Пополнить баланс" из /teacher/students — независимая копия,
  // которая просто зовёт тот же POST /api/payments, что и там. Ничего не
  // блокирует и не пересекается с формой на странице учеников — это два
  // равноправных места, откуда удобно пополнять один и тот же баланс
  async function submitPay(d: any) {
    if (!payAmount || Number.isNaN(Number(payAmount))) return
    setPaying(true)
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_student_id: d.kind === 'student' ? d.teacherStudentId : undefined,
        family_id: d.kind === 'family' ? d.familyId : undefined,
        amount: Number(payAmount),
        description: payDescription || null,
      }),
    })
    setPaying(false)
    setPayingKey(null)
    load()
  }

  return (
    <div style={{
      minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif',
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
                <div style={{ fontWeight: 600, fontSize: '15px' }}>Не оплачено</div>
                {data.debtors.length > 0 && (
                  <span style={{ color: 'var(--t-danger-soft)', fontSize: '14px' }}>Итого: {formatMoney(data.debtTotal)} ₽</span>
                )}
              </div>

              {data.debtors.length === 0 && (
                <div style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>Всё оплачено 🎉</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.debtors.map((d: any) => {
                  const key = debtorKey(d)
                  const isPaying = payingKey === key
                  return (
                    <div key={key} style={{ background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '10px', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ fontSize: '14px' }}>
                          {d.name}{d.kind === 'family' && <span style={{ color: 'var(--t-text-muted)' }}> · семья</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--t-danger-soft)', fontSize: '14px', whiteSpace: 'nowrap' }}>{formatMoney(d.balance)} ₽</span>
                          <button onClick={() => togglePay(d)} style={{ ...submitButtonStyle, padding: '6px 14px', fontSize: '12px' }}>
                            💰 Пополнить баланс
                          </button>
                        </div>
                      </div>
                      {isPaying && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--t-border)' }}>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={{ ...inputStyle, width: '120px' }} placeholder="Сумма" />
                            <input value={payDescription} onChange={e => setPayDescription(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '160px' }} placeholder="Комментарий (необязательно)" />
                            <button onClick={() => submitPay(d)} disabled={paying || !payAmount} style={paying || !payAmount ? submitButtonDisabledStyle : submitButtonStyle}>
                              {paying ? 'Сохраняем...' : '+ Оплата'}
                            </button>
                          </div>

                          {history === null ? (
                            <button onClick={() => loadHistory(d)} style={{ background: 'none', border: 'none', color: 'var(--t-accent)', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                              Показать историю пополнений
                            </button>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {history.length === 0 && <div style={{ color: 'var(--t-text-faint)', fontSize: '13px' }}>Платежей ещё не было</div>}
                              {history.map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--t-text-secondary)' }}>
                                  <span>{p.description || 'Пополнение'} · {new Date(p.payment_date).toLocaleDateString('ru-RU')}</span>
                                  <span style={{ color: 'var(--t-success)' }}>+{formatMoney(p.amount)} ₽</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
