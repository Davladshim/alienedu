'use client'
import { useState } from 'react'

export interface GateItem {
  id: number
  label: string
  sublabel?: string
}

// Полноэкранное окно, которое встаёт поверх всего и не даёт продолжить,
// пока репетитор не выберет, кто/что остаётся активным после того, как
// истёкшая Pro-подписка вернула его на Free сверх лимита. Сверху — поле
// для ввода нового кода, на случай если он уже есть под рукой и выбор
// вообще не нужен
export function PlanGateModal({
  title, description, items, mode, limit, confirmLabel, onConfirm, onCodeRedeemed,
}: {
  title: string
  description: string
  items: GateItem[]
  mode: 'multi' | 'single'
  limit: number
  confirmLabel: string
  onConfirm: (ids: number[]) => Promise<{ ok: boolean; error?: string }>
  onCodeRedeemed: () => void
}) {
  const [selected, setSelected] = useState<number[]>([])
  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [codeMsg, setCodeMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function toggle(id: number) {
    if (mode === 'single') { setSelected([id]); return }
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : (sel.length < limit ? [...sel, id] : sel))
  }

  async function redeem() {
    if (!code.trim()) return
    setRedeeming(true)
    setCodeMsg('')
    const res = await fetch('/api/plan/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    setRedeeming(false)
    if (res.ok) {
      setCode('')
      onCodeRedeemed()
    } else {
      setCodeMsg(data.error || 'Ошибка')
    }
  }

  async function submit() {
    if (selected.length === 0) return
    setSubmitting(true)
    setError('')
    const result = await onConfirm(selected)
    setSubmitting(false)
    if (!result.ok) setError(result.error || 'Ошибка')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(2,6,16,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto',
    }}>
      <div style={{
        background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '20px',
        padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{title}</div>
        <div style={{ color: 'var(--t-text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
          {description}
        </div>

        <div style={{ background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Уже есть новый код?</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && redeem()}
              placeholder="Код"
              style={{
                flex: 1, background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '8px',
                padding: '8px 12px', color: 'var(--t-text)', fontSize: '13px', outline: 'none',
              }}
            />
            <button
              onClick={redeem}
              disabled={redeeming || !code.trim()}
              style={{
                background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px',
                fontSize: '13px', cursor: redeeming || !code.trim() ? 'not-allowed' : 'pointer',
                opacity: redeeming || !code.trim() ? 0.6 : 1, flexShrink: 0,
              }}
            >
              {redeeming ? '...' : 'Активировать'}
            </button>
          </div>
          {codeMsg && <div style={{ color: 'var(--t-danger)', fontSize: '12px', marginTop: '6px' }}>{codeMsg}</div>}
        </div>

        <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
          {mode === 'single' ? 'Выберите, какой оставить' : `Выбрано: ${selected.length} из ${limit}`}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto', marginBottom: '20px' }}>
          {items.map(item => {
            const isSelected = selected.includes(item.id)
            const disabled = mode === 'multi' && !isSelected && selected.length >= limit
            return (
              <label
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                  border: `1px solid ${isSelected ? 'var(--t-accent)' : 'var(--t-border)'}`, borderRadius: '8px',
                  background: isSelected ? 'rgba(var(--t-accent-rgb),0.1)' : 'var(--t-bg)',
                  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
                }}
              >
                <input
                  type={mode === 'single' ? 'radio' : 'checkbox'}
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => toggle(item.id)}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</div>
                  {item.sublabel && <div style={{ fontSize: '12px', color: 'var(--t-text-muted)' }}>{item.sublabel}</div>}
                </div>
              </label>
            )
          })}
        </div>

        {error && <div style={{ color: 'var(--t-danger)', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

        <button
          onClick={submit}
          disabled={submitting || selected.length === 0}
          style={{
            width: '100%',
            background: submitting || selected.length === 0 ? 'var(--t-border)' : 'linear-gradient(135deg, var(--t-accent), var(--t-accent2))',
            color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600,
            cursor: submitting || selected.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Сохраняем...' : confirmLabel}
        </button>
      </div>
    </div>
  )
}
