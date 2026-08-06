'use client'
import { useState, useEffect } from 'react'

function daysWord(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}

// Компактный режим (короче текст, уже поле кода) — нужен в шапке кабинета
// репетитора на узких экранах, где высоту шапки трогать нельзя: обычная
// подпись "Тариф: Pro (осталось N дней)" переносится на несколько строк
// и раздувает шапку. На /teacher/tariffs, где виджет стоит в отдельной
// карточке с запасом места, эта проблема не возникает вне зависимости
// от ширины экрана
function useNarrowScreen(breakpoint = 700): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return narrow
}

// Тихий индикатор тарифа + поле ввода кода — виден в шапке кабинета
// репетитора на любой странице, специально сделан неярким (просто текст +
// маленькое поле), чтобы не выглядеть навязчивой рекламой
export function PlanWidget() {
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const narrow = useNarrowScreen()

  function applyPlanData(data: { plan: string; plan_expires_at: string | null }) {
    setPlan(data.plan === 'pro' ? 'pro' : 'free')
    if (data.plan === 'pro' && data.plan_expires_at) {
      const msLeft = new Date(data.plan_expires_at).getTime() - Date.now()
      setDaysLeft(Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000))))
    } else {
      setDaysLeft(null)
    }
  }

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(applyPlanData).catch(() => {})
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
      applyPlanData({ plan: data.plan, plan_expires_at: data.expires_at })
      setCode('')
      setMsg({ text: 'Тариф обновлён', ok: true })
    } else {
      setMsg({ text: data.error || 'Ошибка', ok: false })
    }
  }

  if (plan === null) return null

  // Скоро истекает — подсвечиваем свечением, чтобы напомнить о продлении
  const expiringSoon = plan === 'pro' && daysLeft !== null && daysLeft <= 5

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: narrow ? '6px' : '8px', fontSize: '12px', color: 'var(--t-text-muted)', whiteSpace: 'nowrap' }}>
      {expiringSoon && (
        <style>{`
          @keyframes plan-widget-glow {
            0%, 100% { text-shadow: 0 0 0 rgba(var(--t-warning-rgb), 0); }
            50% { text-shadow: 0 0 8px rgba(var(--t-warning-rgb), 0.9); }
          }
        `}</style>
      )}
      <span style={expiringSoon ? { color: 'var(--t-warning)', fontWeight: 600, animation: 'plan-widget-glow 1.6s ease-in-out infinite' } : undefined}>
        {narrow
          ? <>{plan === 'pro' ? 'Pro' : 'Free'}{plan === 'pro' && daysLeft !== null && ` · ${daysLeft}д`}</>
          : <>Тариф: {plan === 'pro' ? 'Pro' : 'Free'}{plan === 'pro' && daysLeft !== null && ` (осталось ${daysLeft} ${daysWord(daysLeft)})`}</>}
      </span>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && redeem()}
        placeholder="Код"
        style={{
          width: narrow ? '52px' : '80px', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '6px',
          padding: '4px 8px', color: 'var(--t-text-secondary)', fontSize: '12px',
        }}
      />
      <button
        onClick={redeem}
        disabled={busy || !code.trim()}
        style={{
          background: 'none', border: '1px solid var(--t-border)', borderRadius: '6px', padding: narrow ? '4px 6px' : '4px 10px',
          color: busy || !code.trim() ? 'var(--t-text-faint)' : 'var(--t-text-secondary)', fontSize: '12px',
          cursor: busy || !code.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {narrow ? 'OK' : 'Ввести'}
      </button>
      {msg && (narrow ? (
        <span style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 150, whiteSpace: 'nowrap',
          background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '6px', padding: '4px 8px',
          color: msg.ok ? 'var(--t-success)' : 'var(--t-danger-soft)',
        }}>
          {msg.text}
        </span>
      ) : (
        <span style={{ color: msg.ok ? 'var(--t-success)' : 'var(--t-danger-soft)' }}>{msg.text}</span>
      ))}
    </div>
  )
}
