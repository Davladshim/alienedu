'use client'
import { useState, useEffect } from 'react'

// Тихий индикатор тарифа + поле ввода кода — виден в шапке кабинета
// репетитора на любой странице, специально сделан неярким (просто текст +
// маленькое поле), чтобы не выглядеть навязчивой рекламой
export function PlanWidget() {
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => setPlan(data.plan === 'pro' ? 'pro' : 'free')).catch(() => {})
  }, [])

  async function redeem() {
    if (!code.trim()) return
    setBusy(true)
    setMsg(null)
    const res = await fetch('/api/plan/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    setBusy(false)
    if (res.ok) {
      setPlan(data.plan === 'pro' ? 'pro' : 'free')
      setCode('')
      setMsg({ text: 'Тариф обновлён', ok: true })
    } else {
      setMsg({ text: data.error || 'Ошибка', ok: false })
    }
  }

  if (plan === null) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
      <span>Тариф: {plan === 'pro' ? 'Pro' : 'Free'}</span>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && redeem()}
        placeholder="Код"
        style={{
          width: '80px', background: '#161822', border: '1px solid #2a2d3d', borderRadius: '6px',
          padding: '4px 8px', color: '#9ca3af', fontSize: '12px',
        }}
      />
      <button
        onClick={redeem}
        disabled={busy || !code.trim()}
        style={{
          background: 'none', border: '1px solid #2a2d3d', borderRadius: '6px', padding: '4px 10px',
          color: busy || !code.trim() ? '#4b5563' : '#9ca3af', fontSize: '12px',
          cursor: busy || !code.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        Ввести
      </button>
      {msg && <span style={{ color: msg.ok ? '#34d399' : '#f87171' }}>{msg.text}</span>}
    </div>
  )
}
