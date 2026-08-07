'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { daysWord, daysLeftFrom } from '@/lib/adminFormat'
import { Formula } from '@/components/lesson-blocks/Formula'

interface PlanCode {
  id: number
  code: string
  plan: string
  status: string
  first_used_at: string | null
  valid_days: number
  created_at: string
  used_by_login: string | null
  used_by_name: string | null
}

interface ModerationLesson {
  id: number
  title: string
  subject: string | null
  grade: number | null
  mode: 'quiz' | 'exam'
  author_name: string
  block_count: number
  library_description: string | null
  moderation_status: 'pending' | 'approved' | 'rejected'
  moderation_reason: string | null
}

const MODERATION_TABS: { key: 'pending' | 'approved' | 'rejected'; label: string }[] = [
  { key: 'pending', label: 'На модерации' },
  { key: 'approved', label: 'В библиотеке' },
  { key: 'rejected', label: 'Отклонённые' },
]

const DURATION_LABELS: Record<string, string> = { '30': '1 месяц (30 дней)', '365': '1 год (365 дней)' }
const PLAN_LABELS: Record<string, string> = { pro: 'Pro' }

function buildMessage(code: string, plan: string, validDays: string): string {
  const planLabel = PLAN_LABELS[plan] || plan
  const durationLabel = DURATION_LABELS[validDays] || `${validDays} дней`
  return [
    `Вы получили код на тариф ${planLabel} на ${durationLabel}.`,
    `Код: ${code}`,
    ``,
    `Никому его не передавайте — он одноразовый.`,
    `Отсчёт срока начнётся с момента активации: введите код в личном кабинете AlienEdu на странице «Тарифы».`,
  ].join('\n')
}

export default function AdminPage() {
  const [checked, setChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [duration, setDuration] = useState('')
  const [customDays, setCustomDays] = useState('14')
  const [plan, setPlan] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [lastGenerated, setLastGenerated] = useState<{ code: string; plan: string; valid_days: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  const [codes, setCodes] = useState<PlanCode[]>([])

  const [moderationLessons, setModerationLessons] = useState<ModerationLesson[]>([])
  const [moderationLoading, setModerationLoading] = useState(false)
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null)
  const [moderationTab, setModerationTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [decidingLessonId, setDecidingLessonId] = useState<number | null>(null)
  const [descriptionLesson, setDescriptionLesson] = useState<ModerationLesson | null>(null)

  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => { if (r.ok) { setIsLoggedIn(true); loadCodes(); loadModerationLessons() } })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [])

  function loadCodes() {
    fetch('/api/admin/plan-codes').then(r => r.json()).then(data => setCodes(data.codes || []))
  }

  function loadModerationLessons() {
    setModerationLoading(true)
    fetch('/api/admin/lessons')
      .then(r => r.json())
      .then(data => setModerationLessons(data.lessons || []))
      .finally(() => setModerationLoading(false))
  }

  async function deleteLesson(id: number, title: string) {
    if (!confirm(`Полностью удалить урок «${title}»? Это затронет всех репетиторов, которые его себе добавили, и нельзя отменить.`)) return
    setDeletingLessonId(id)
    const res = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' })
    setDeletingLessonId(null)
    if (res.ok) {
      setModerationLessons(ls => ls.filter(l => l.id !== id))
    } else {
      alert('Не удалось удалить урок')
    }
  }

  async function approveLesson(id: number) {
    setDecidingLessonId(id)
    const res = await fetch(`/api/admin/lessons/${id}/approve`, { method: 'POST' })
    setDecidingLessonId(null)
    if (res.ok) {
      setModerationLessons(ls => ls.map(l => l.id === id ? { ...l, moderation_status: 'approved', moderation_reason: null } : l))
    } else {
      alert('Не удалось одобрить урок')
    }
  }

  async function rejectLesson(id: number) {
    const reason = window.prompt('Причина отклонения (будет видна автору урока):')
    if (reason === null) return
    if (!reason.trim()) { alert('Укажите причину отклонения'); return }
    setDecidingLessonId(id)
    const res = await fetch(`/api/admin/lessons/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setDecidingLessonId(null)
    if (res.ok) {
      setModerationLessons(ls => ls.map(l => l.id === id ? { ...l, moderation_status: 'rejected', moderation_reason: reason.trim() } : l))
    } else {
      alert('Не удалось отклонить урок')
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setIsLoggedIn(true)
      loadCodes()
      loadModerationLessons()
    } else {
      setLoginError('Неверный пароль')
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    setIsLoggedIn(false)
    setPassword('')
  }

  const effectiveDays = duration === 'custom' ? Number(customDays) : Number(duration)
  const durationValid = duration === 'custom'
    ? Number.isInteger(effectiveDays) && effectiveDays >= 1
    : !!duration

  async function handleGenerate() {
    if (!durationValid || !plan) return
    setGenerating(true)
    setGenError('')
    setCopied(false)
    const res = await fetch('/api/admin/plan-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, validDays: effectiveDays }),
    })
    const data = await res.json()
    setGenerating(false)
    if (res.ok) {
      setLastGenerated({ code: data.code, plan: data.plan, valid_days: String(data.valid_days) })
      loadCodes()
    } else {
      setGenError(data.error || 'Ошибка')
    }
  }

  async function revokeCode(c: PlanCode) {
    const who = c.used_by_login ? ` у ${c.used_by_name || c.used_by_login} (@${c.used_by_login})` : ''
    const warning = c.used_by_login
      ? `Отозвать код ${c.code}${who}? Аккаунт сразу перейдёт на бесплатный тариф.`
      : `Отозвать код ${c.code}? Он ещё не был активирован, просто станет недействительным.`
    if (!confirm(warning)) return
    setRevokingId(c.id)
    const res = await fetch(`/api/admin/plan-codes/${c.id}/revoke`, { method: 'POST' })
    setRevokingId(null)
    if (res.ok) {
      loadCodes()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Не удалось отозвать код')
    }
  }

  async function copyMessage() {
    if (!lastGenerated) return
    const message = buildMessage(lastGenerated.code, lastGenerated.plan, lastGenerated.valid_days)
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setGenError('Не удалось скопировать — скопируйте вручную')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '8px',
    padding: '10px 14px', color: 'var(--t-text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }
  const cardStyle: React.CSSProperties = {
    background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem',
  }

  if (!checked) return null

  if (!isLoggedIn) {
    return (
      <div style={{
        position: 'fixed', inset: 0, overflow: 'auto', background: 'var(--t-bg)', display: 'flex',
        fontFamily: 'system-ui, sans-serif', padding: '2rem',
      }}>
        <div style={{ ...cardStyle, width: '100%', maxWidth: '380px', margin: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛠</div>
            <h1 style={{ color: 'var(--t-text)', fontSize: '20px', fontWeight: 600, margin: 0 }}>Админка AlienEdu</h1>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Пароль администратора"
              autoComplete="current-password"
              style={{ ...inputStyle, marginBottom: '1rem' }}
            />
            {loginError && <p style={{ color: 'var(--t-danger)', fontSize: '13px', marginBottom: '1rem' }}>{loginError}</p>}
            <button type="submit" style={{
              width: '100%', background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '11px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}>
              Войти
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif', color: 'var(--t-text)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🛠 Админка AlienEdu</h1>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
          >
            Выйти
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <Link href="/teacher/quests" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <div
              style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-info)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧩</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Мои квесты</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Управление квестами</div>
            </div>
          </Link>
          <Link href="/teacher" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <div
              style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🪐</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Кабинет репетитора</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Основной кабинет</div>
            </div>
          </Link>
          <Link href="/admin/models" target="_blank" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <div
              style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏦</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Банк интерактивных моделей</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Откроется в новой вкладке</div>
            </div>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '1.5rem' }}>
          <Link href="/shop/admin" target="_blank" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <div
              style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-info)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛍️</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Админка магазина</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Презентации, коды доступа</div>
            </div>
          </Link>
          <Link href="/stereo/admin" target="_blank" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <div
              style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔷</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Админка StereoSpace</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Задачи, коды доступа</div>
            </div>
          </Link>
          <Link href="/stereo" target="_blank" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <div
              style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔷</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>StereoSpace</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Сам сервис — для проверки</div>
            </div>
          </Link>
        </div>

        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '14px' }}>Коды на тариф</div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ color: 'var(--t-text-secondary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Срок</label>
              <select value={duration} onChange={e => setDuration(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Выберите срок</option>
                <option value="30">1 месяц (30 дней)</option>
                <option value="365">1 год (365 дней)</option>
                <option value="custom">Произвольный срок</option>
              </select>
            </div>
            {duration === 'custom' && (
              <div style={{ width: '140px' }}>
                <label style={{ color: 'var(--t-text-secondary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Дней</label>
                <input
                  type="number" min={1} value={customDays} onChange={e => setCustomDays(e.target.value)}
                  style={inputStyle} placeholder="Например, 14"
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ color: 'var(--t-text-secondary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Тариф</label>
              <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Выберите тариф</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                onClick={handleGenerate}
                disabled={!durationValid || !plan || generating}
                style={{
                  background: !durationValid || !plan || generating ? 'var(--t-border)' : 'linear-gradient(135deg, var(--t-accent), var(--t-accent2))',
                  color: !durationValid || !plan || generating ? 'var(--t-text-muted)' : '#fff',
                  border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600,
                  cursor: !durationValid || !plan || generating ? 'not-allowed' : 'pointer',
                }}
              >
                {generating ? 'Генерируем...' : 'Сгенерировать'}
              </button>
            </div>
          </div>

          {genError && <p style={{ color: 'var(--t-danger)', fontSize: '13px', marginBottom: '10px' }}>{genError}</p>}

          {lastGenerated && (
            <div style={{
              background: 'var(--t-bg)', border: '1px solid var(--t-accent)', borderRadius: '10px',
              padding: '14px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: '10px', flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '1px' }}>{lastGenerated.code}</div>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginTop: '2px' }}>
                  {PLAN_LABELS[lastGenerated.plan]} · {DURATION_LABELS[lastGenerated.valid_days]}
                </div>
              </div>
              <button
                onClick={copyMessage}
                style={{
                  background: copied ? 'rgba(var(--t-success-rgb),0.15)' : 'rgba(var(--t-accent-rgb),0.15)',
                  border: `1px solid ${copied ? 'var(--t-success)' : 'var(--t-accent)'}`, color: copied ? 'var(--t-success)' : 'var(--t-accent)',
                  borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {copied ? '✓ Скопировано' : '📋 Скопировать сообщение'}
              </button>
            </div>
          )}

          <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '8px' }}>История кодов</div>
          {codes.length === 0 ? (
            <div style={{ color: 'var(--t-text-faint)', fontSize: '13px' }}>Кодов ещё не было</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    {['Код', 'Дата активации', 'Логин', 'Имя', 'Тариф', 'Осталось', 'Статус', ''].map(h => (
                      <th key={h} style={{
                        position: 'sticky', top: 0, background: 'var(--t-card)', textAlign: 'left',
                        color: 'var(--t-text-muted)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase',
                        padding: '6px 10px', borderBottom: '1px solid var(--t-border)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => {
                    const daysLeft = c.first_used_at ? daysLeftFrom(c.first_used_at, c.valid_days) : null
                    const statusColor = c.status !== 'active' ? 'var(--t-text-muted)' : c.first_used_at ? 'var(--t-success)' : 'var(--t-info)'
                    const statusLabel = c.status !== 'active' ? 'отозван' : c.first_used_at ? 'активирован' : 'не использован'
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--t-border)' }}>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{c.code}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--t-text-secondary)' }}>
                          {c.first_used_at ? new Date(c.first_used_at).toLocaleDateString('ru-RU') : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--t-text-secondary)' }}>{c.used_by_login || '—'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--t-text-secondary)' }}>{c.used_by_name || '—'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--t-text-secondary)' }}>{PLAN_LABELS[c.plan] || c.plan}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--t-text-secondary)' }}>
                          {daysLeft === null ? '—' : daysLeft > 0 ? `${daysLeft} ${daysWord(daysLeft)}` : 'истёк'}
                        </td>
                        <td style={{ padding: '8px 10px', color: statusColor }}>{statusLabel}</td>
                        <td style={{ padding: '8px 10px' }}>
                          {c.status === 'active' && (
                            <button
                              onClick={() => revokeCode(c)}
                              disabled={revokingId === c.id}
                              style={{
                                background: 'rgba(var(--t-danger-rgb),0.1)', border: '1px solid var(--t-danger)', color: 'var(--t-danger)',
                                borderRadius: '6px', padding: '4px 10px', fontSize: '12px',
                                cursor: revokingId === c.id ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {revokingId === c.id ? '...' : 'Отозвать'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Модерация библиотеки</div>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '14px' }}>
            Уроки, которые репетиторы опубликовали в общую библиотеку. Новая публикация появляется здесь во
            вкладке «На модерации» и не видна другим репетиторам, пока её не одобрят.
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {MODERATION_TABS.map(tab => {
              const count = moderationLessons.filter(l => l.moderation_status === tab.key).length
              const active = moderationTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setModerationTab(tab.key)}
                  style={{
                    background: active ? 'rgba(var(--t-accent-rgb),0.15)' : 'transparent',
                    border: `1px solid ${active ? 'var(--t-accent)' : 'var(--t-border)'}`,
                    color: active ? 'var(--t-accent)' : 'var(--t-text-secondary)',
                    borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  {tab.label} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>

          {moderationLoading && <p style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Загрузка...</p>}
          {!moderationLoading && moderationLessons.filter(l => l.moderation_status === moderationTab).length === 0 && (
            <div style={{ color: 'var(--t-text-faint)', fontSize: '13px' }}>
              {moderationTab === 'pending' ? 'Нечего проверять' : moderationTab === 'approved' ? 'В библиотеке пока пусто' : 'Отклонённых уроков нет'}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '440px', overflowY: 'auto' }}>
            {moderationLessons.filter(l => l.moderation_status === moderationTab).map(l => (
              <div key={l.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                fontSize: '13px', padding: '8px 0', borderBottom: '1px solid var(--t-border)', flexWrap: 'wrap',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{l.title}</div>
                  <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginTop: '2px' }}>
                    {[l.subject, l.grade ? `${l.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                    {' · '}{l.block_count} {l.block_count === 1 ? 'блок' : 'блоков'}
                    {' · '}автор: {l.author_name}
                  </div>
                  {l.moderation_status === 'rejected' && l.moderation_reason && (
                    <div style={{ color: 'var(--t-danger)', fontSize: '12px', marginTop: '2px' }}>
                      Причина: {l.moderation_reason}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setDescriptionLesson(l)}
                    style={{
                      background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
                      borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
                    }}
                  >
                    📄 Описание
                  </button>
                  {l.moderation_status !== 'approved' && (
                    <button
                      onClick={() => approveLesson(l.id)}
                      disabled={decidingLessonId === l.id}
                      style={{
                        background: 'rgba(var(--t-success-rgb),0.12)', border: '1px solid var(--t-success)', color: 'var(--t-success)',
                        borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
                        cursor: decidingLessonId === l.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ✅ Одобрить
                    </button>
                  )}
                  {l.moderation_status !== 'rejected' && (
                    <button
                      onClick={() => rejectLesson(l.id)}
                      disabled={decidingLessonId === l.id}
                      style={{
                        background: 'rgba(var(--t-warning-rgb),0.12)', border: '1px solid var(--t-warning)', color: 'var(--t-warning)',
                        borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
                        cursor: decidingLessonId === l.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ❌ Отклонить
                    </button>
                  )}
                  <button
                    onClick={() => deleteLesson(l.id, l.title)}
                    disabled={deletingLessonId === l.id}
                    style={{
                      background: 'rgba(var(--t-danger-rgb),0.1)', border: '1px solid var(--t-danger)', color: 'var(--t-danger)',
                      borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
                      cursor: deletingLessonId === l.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {deletingLessonId === l.id ? 'Удаляем...' : '🗑 Удалить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {descriptionLesson && (
        <div
          onClick={() => setDescriptionLesson(null)}
          style={{
            position: 'fixed', inset: 0, background: 'var(--t-overlay)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
              padding: '1.75rem', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{descriptionLesson.title}</div>
              <button
                onClick={() => setDescriptionLesson(null)}
                style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: 'var(--t-text)', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {descriptionLesson.library_description ? <Formula text={descriptionLesson.library_description} /> : 'Автор не оставил описание.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
