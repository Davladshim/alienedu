'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

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

function daysWord(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}

function daysLeftFrom(firstUsedAt: string, validDays: number): number {
  const expiresAt = new Date(firstUsedAt).getTime() + validDays * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
}

interface ModerationLesson {
  id: number
  title: string
  subject: string | null
  grade: number | null
  mode: 'quiz' | 'exam'
  author_name: string
  block_count: number
}

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
  const [plan, setPlan] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [lastGenerated, setLastGenerated] = useState<{ code: string; plan: string; valid_days: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [codes, setCodes] = useState<PlanCode[]>([])

  const [moderationLessons, setModerationLessons] = useState<ModerationLesson[]>([])
  const [moderationLoading, setModerationLoading] = useState(false)
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null)

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
  }

  async function handleGenerate() {
    if (!duration || !plan) return
    setGenerating(true)
    setGenError('')
    setCopied(false)
    const res = await fetch('/api/admin/plan-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, validDays: Number(duration) }),
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
    width: '100%', background: '#0f1117', border: '1px solid #2a2d3d', borderRadius: '8px',
    padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }
  const cardStyle: React.CSSProperties = {
    background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem',
  }

  if (!checked) return null

  if (!isLoggedIn) {
    return (
      <div style={{
        position: 'fixed', inset: 0, overflow: 'auto', background: '#0f1117', display: 'flex',
        fontFamily: 'system-ui, sans-serif', padding: '2rem',
      }}>
        <div style={{ ...cardStyle, width: '100%', maxWidth: '380px', margin: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛠</div>
            <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Админка AlienEdu</h1>
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
            {loginError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '1rem' }}>{loginError}</p>}
            <button type="submit" style={{
              width: '100%', background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: '8px',
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
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif', color: '#fff', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🛠 Админка AlienEdu</h1>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: '1px solid #2a2d3d', color: '#9ca3af', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
          >
            Выйти
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <Link href="/teacher/quests" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#60a5fa')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧩</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Мои квесты</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Управление квестами</div>
            </div>
          </Link>
          <Link href="/teacher" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🪐</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Кабинет репетитора</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Основной кабинет</div>
            </div>
          </Link>
          <Link href="/admin/models" target="_blank" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏦</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Банк интерактивных моделей</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Откроется в новой вкладке</div>
            </div>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '1.5rem' }}>
          <Link href="/shop/admin" target="_blank" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#60a5fa')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛍️</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Админка магазина</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Презентации, коды доступа</div>
            </div>
          </Link>
          <Link href="/stereo/admin" target="_blank" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔷</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Админка StereoSpace</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Задачи, коды доступа</div>
            </div>
          </Link>
          <Link href="/stereo" target="_blank" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔷</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>StereoSpace</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Сам сервис — для проверки</div>
            </div>
          </Link>
        </div>

        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '14px' }}>Коды на тариф</div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Срок</label>
              <select value={duration} onChange={e => setDuration(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Выберите срок</option>
                <option value="30">1 месяц (30 дней)</option>
                <option value="365">1 год (365 дней)</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Тариф</label>
              <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Выберите тариф</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                onClick={handleGenerate}
                disabled={!duration || !plan || generating}
                style={{
                  background: !duration || !plan || generating ? '#2a2d3d' : 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
                  color: !duration || !plan || generating ? '#6b7280' : '#fff',
                  border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600,
                  cursor: !duration || !plan || generating ? 'not-allowed' : 'pointer',
                }}
              >
                {generating ? 'Генерируем...' : 'Сгенерировать'}
              </button>
            </div>
          </div>

          {genError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '10px' }}>{genError}</p>}

          {lastGenerated && (
            <div style={{
              background: '#0f1117', border: '1px solid #4f8ef7', borderRadius: '10px',
              padding: '14px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: '10px', flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '1px' }}>{lastGenerated.code}</div>
                <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
                  {PLAN_LABELS[lastGenerated.plan]} · {DURATION_LABELS[lastGenerated.valid_days]}
                </div>
              </div>
              <button
                onClick={copyMessage}
                style={{
                  background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(79,142,247,0.15)',
                  border: `1px solid ${copied ? '#34d399' : '#4f8ef7'}`, color: copied ? '#34d399' : '#4f8ef7',
                  borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {copied ? '✓ Скопировано' : '📋 Скопировать сообщение'}
              </button>
            </div>
          )}

          <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>История кодов</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
            {codes.length === 0 && <div style={{ color: '#4b5563', fontSize: '13px' }}>Кодов ещё не было</div>}
            {codes.map(c => {
              const daysLeft = c.first_used_at ? daysLeftFrom(c.first_used_at, c.valid_days) : null
              return (
                <div key={c.id} style={{ fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #2a2d3d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'monospace' }}>{c.code}</span>
                    <span style={{ color: '#9ca3af' }}>{PLAN_LABELS[c.plan] || c.plan} · {c.valid_days} дн.</span>
                    <span style={{ color: c.status === 'active' ? (c.first_used_at ? '#34d399' : '#60a5fa') : '#6b7280' }}>
                      {c.status !== 'active' ? 'отозван' : c.first_used_at ? 'активирован' : 'не использован'}
                    </span>
                  </div>
                  {c.first_used_at && (
                    <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
                      {c.used_by_name || 'без имени'} ({c.used_by_login || 'аккаунт удалён'})
                      {' · '}активирован {new Date(c.first_used_at).toLocaleDateString('ru-RU')}
                      {' · '}{daysLeft !== null && (daysLeft > 0 ? `осталось ${daysLeft} ${daysWord(daysLeft)}` : 'истёк')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Модерация библиотеки</div>
          <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '14px' }}>
            Все уроки, опубликованные в общую библиотеку. Удаление — полное, для случаев жалоб на содержимое.
          </div>

          {moderationLoading && <p style={{ color: '#6b7280', fontSize: '13px' }}>Загрузка...</p>}
          {!moderationLoading && moderationLessons.length === 0 && (
            <div style={{ color: '#4b5563', fontSize: '13px' }}>В библиотеке пока пусто</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {moderationLessons.map(l => (
              <div key={l.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #2a2d3d',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{l.title}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
                    {[l.subject, l.grade ? `${l.grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}
                    {' · '}{l.block_count} {l.block_count === 1 ? 'блок' : 'блоков'}
                    {' · '}автор: {l.author_name}
                  </div>
                </div>
                <button
                  onClick={() => deleteLesson(l.id, l.title)}
                  disabled={deletingLessonId === l.id}
                  style={{
                    flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444',
                    borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
                    cursor: deletingLessonId === l.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deletingLessonId === l.id ? 'Удаляем...' : '🗑 Удалить'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
