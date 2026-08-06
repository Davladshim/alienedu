'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PasswordInput } from '@/components/PasswordInput'

interface Tutor {
  id: number
  teacher_id: number
  teacher_name: string
  lesson_price: number | null
  balance: number
  family_id: number | null
  family_name: string | null
  family_balance: number | null
}

interface ScheduleItem {
  id: number
  teacher_id: number
  teacher_name: string
  date: string
  time: string
  duration_minutes: number
  subject: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  price: number | null
  is_paid: boolean
}

interface Overview {
  child: { id: number; full_name: string; login: string; grade: number | null }
  tutors: Tutor[]
  upcoming: ScheduleItem[]
  recent: ScheduleItem[]
}

const STATUS_LABEL: Record<string, string> = { scheduled: 'Запланировано', completed: 'Проведено', cancelled: 'Отменено' }
const STATUS_COLOR: Record<string, string> = { scheduled: 'var(--t-accent)', completed: 'var(--t-text-muted)', cancelled: 'var(--t-danger-soft)' }

function formatMoney(n: number | null): string {
  const num = Number(n) || 0
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const cardStyle: React.CSSProperties = {
  background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem',
}

const passwordInputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '8px',
  padding: '10px 14px', color: 'var(--t-text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

function ResetPasswordBox({ childId }: { childId: string }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [codeConfirm, setCodeConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (code !== codeConfirm) {
      setError('Пароли не совпадают')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/parent/child/${childId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setSuccess(true)
      setCode('')
      setCodeConfirm('')
    } else {
      setError(data.error || 'Не удалось сбросить пароль')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setSuccess(false) }}
        style={{
          background: 'none', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
          borderRadius: '8px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer',
        }}
      >
        🔑 Сбросить пароль
      </button>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '320px' }}>
      <PasswordInput value={code} onChange={e => setCode(e.target.value)} placeholder="Новый пароль" required style={passwordInputStyle} autoComplete="new-password" />
      <PasswordInput value={codeConfirm} onChange={e => setCodeConfirm(e.target.value)} placeholder="Повторите пароль" required style={passwordInputStyle} autoComplete="new-password" />
      {error && <div style={{ color: 'var(--t-danger)', fontSize: '13px' }}>{error}</div>}
      {success && <div style={{ color: 'var(--t-success)', fontSize: '13px' }}>Пароль обновлён — сообщите его ребёнку.</div>}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" disabled={saving} style={{
          background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setError('') }} style={{
          background: 'none', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
          borderRadius: '8px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer',
        }}>
          Отмена
        </button>
      </div>
    </form>
  )
}

function ScheduleRow({ item }: { item: ScheduleItem }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
      padding: '10px 14px', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '10px',
    }}>
      <div style={{ fontSize: '14px' }}>
        {new Date(item.date).toLocaleDateString('ru-RU')} {item.time}
        <span style={{ color: 'var(--t-text-muted)' }}> · {item.teacher_name}{item.subject ? ` · ${item.subject}` : ''}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {item.price != null && (
          <span style={{ fontSize: '13px', color: item.is_paid ? 'var(--t-success)' : 'var(--t-danger-soft)' }}>
            {formatMoney(item.price)} ₽ {item.is_paid ? '· оплачено' : '· не оплачено'}
          </span>
        )}
        <span style={{ fontSize: '12px', color: STATUS_COLOR[item.status] || 'var(--t-text-muted)' }}>
          {STATUS_LABEL[item.status] || item.status}
        </span>
      </div>
    </div>
  )
}

export default function ParentChildPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/parent/child/${id}`)
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) {
          setError(d.error || 'Не удалось загрузить данные')
          setLoading(false)
          return
        }
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError('Не удалось загрузить данные')
        setLoading(false)
      })
  }, [id])

  return (
    <div style={{
      minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif',
      color: 'var(--t-text)', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Link href="/parent" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>← Кабинет родителя</Link>
        </div>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && error && (
          <div style={{ ...cardStyle, border: '1px solid var(--t-danger-soft)', color: 'var(--t-danger-soft)' }}>
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{data.child.full_name}</h1>
            <p style={{ color: 'var(--t-text-muted)', fontSize: '14px', marginBottom: '1rem' }}>
              Логин: {data.child.login}{data.child.grade ? ` · ${data.child.grade} класс` : ''}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <ResetPasswordBox childId={id} />
            </div>

            <div style={{ ...cardStyle, marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>Репетиторы и баланс</div>
              {data.tutors.length === 0 && (
                <div style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>Пока нет ни одного репетитора</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.tutors.map(t => (
                  <div key={t.id} style={{
                    padding: '10px 14px', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '10px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{t.teacher_name}</div>
                      <div style={{ fontSize: '13px', color: t.balance < 0 ? 'var(--t-danger-soft)' : 'var(--t-text)' }}>
                        Баланс: {formatMoney(t.balance)} ₽
                      </div>
                    </div>
                    <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '4px' }}>
                      {t.lesson_price != null && <>Стоимость занятия: {formatMoney(t.lesson_price)} ₽</>}
                      {t.family_id && (
                        <span> · Семья «{t.family_name}», общий остаток: {formatMoney(t.family_balance)} ₽ (делится между детьми в семье)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>Ближайшие занятия</div>
              {data.upcoming.length === 0 && (
                <div style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>Занятий не запланировано</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.upcoming.map(item => <ScheduleRow key={item.id} item={item} />)}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>Недавние занятия</div>
              {data.recent.length === 0 && (
                <div style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>Пока не было занятий</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.recent.map(item => <ScheduleRow key={item.id} item={item} />)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
