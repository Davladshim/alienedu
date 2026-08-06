'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Child {
  id: number
  full_name: string
  login: string
  grade: number | null
  created_at: string
}

const emptyCreateForm = { full_name: '', login: '', code: '', grade: '' }
const emptyLinkForm = { login: '', code: '' }

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '8px',
  padding: '10px 14px', color: 'var(--t-text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

function ConsentCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: '3px', flexShrink: 0 }}
      />
      <span style={{ color: 'var(--t-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
        Я родитель или законный представитель этого ребёнка и даю согласие на обработку его персональных
        данных на условиях{' '}
        <Link href="/privacy" target="_blank" style={{ color: 'var(--t-accent)' }}>Политики конфиденциальности</Link>
      </span>
    </label>
  )
}

export default function ParentPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'create' | 'link' | null>(null)

  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createConsent, setCreateConsent] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [linkForm, setLinkForm] = useState(emptyLinkForm)
  const [linkConsent, setLinkConsent] = useState(false)
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')

  function load() {
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(data => {
        setChildren(data.children || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  function closeForms() {
    setMode(null)
    setCreateError('')
    setLinkError('')
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    if (!createForm.full_name.trim() || !createForm.login.trim() || !createForm.code || !createForm.grade) {
      setCreateError('Заполните все поля')
      return
    }
    if (!createConsent) {
      setCreateError('Нужно подтвердить согласие на обработку персональных данных ребёнка')
      return
    }
    setCreating(true)
    const res = await fetch('/api/parent/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: createForm.full_name, login: createForm.login, code: createForm.code,
        grade: Number(createForm.grade), consent: createConsent,
      }),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setCreateForm(emptyCreateForm)
      setCreateConsent(false)
      closeForms()
      load()
    } else {
      setCreateError(data.error || 'Не удалось добавить ребёнка')
    }
  }

  async function submitLink(e: React.FormEvent) {
    e.preventDefault()
    setLinkError('')
    if (!linkForm.login.trim() || !linkForm.code) {
      setLinkError('Заполните все поля')
      return
    }
    if (!linkConsent) {
      setLinkError('Нужно подтвердить согласие на обработку персональных данных ребёнка')
      return
    }
    setLinking(true)
    const res = await fetch('/api/parent/children/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: linkForm.login, code: linkForm.code, consent: linkConsent }),
    })
    const data = await res.json()
    setLinking(false)
    if (res.ok) {
      setLinkForm(emptyLinkForm)
      setLinkConsent(false)
      closeForms()
      load()
    } else {
      setLinkError(data.error || 'Не удалось привязать аккаунт')
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '700px', padding: '2rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>👨‍👩‍👧 Кабинет родителя</h1>
        <p style={{ color: 'var(--t-text-muted)', fontSize: '14px', marginBottom: '1.5rem' }}>
          Здесь можно завести аккаунт ребёнку — логин и пароль придумываете вы, ребёнку не нужно регистрироваться самостоятельно.
          Если ребёнку уже завёл аккаунт второй родитель, можно привязаться к нему, зная логин и пароль.
        </p>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && children.length === 0 && !mode && (
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '2rem', textAlign: 'center', color: 'var(--t-text-muted)', marginBottom: '1.5rem',
          }}>
            Пока не добавлено ни одного ребёнка
          </div>
        )}

        {!loading && children.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
            {children.map(c => (
              <Link key={c.id} href={`/parent/child/${c.id}`} style={{
                display: 'block', background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px',
                padding: '14px 18px', textDecoration: 'none', color: 'inherit',
              }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{c.full_name}</div>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  Логин: {c.login}{c.grade ? ` · ${c.grade} класс` : ''} · Расписание и баланс →
                </div>
              </Link>
            ))}
          </div>
        )}

        {!mode && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setMode('create')}
              style={{
                background: 'linear-gradient(135deg, var(--t-accent), var(--t-accent2))', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              + Добавить ребёнка
            </button>
            <button
              onClick={() => setMode('link')}
              style={{
                background: 'none', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
                borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              🔗 Привязать существующий аккаунт
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={submitCreate} style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>Новый аккаунт ребёнка</div>

            <input
              value={createForm.full_name}
              onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Имя и фамилия ребёнка"
              style={inputStyle}
            />
            <input
              value={createForm.login}
              onChange={e => setCreateForm(f => ({ ...f, login: e.target.value }))}
              placeholder="Логин"
              style={inputStyle}
            />
            <input
              value={createForm.code}
              onChange={e => setCreateForm(f => ({ ...f, code: e.target.value }))}
              placeholder="Пароль"
              type="password"
              style={inputStyle}
            />
            <select
              value={createForm.grade}
              onChange={e => setCreateForm(f => ({ ...f, grade: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Класс</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                <option key={g} value={g}>{g} класс</option>
              ))}
            </select>

            <ConsentCheckbox checked={createConsent} onChange={setCreateConsent} />

            {createError && <div style={{ color: 'var(--t-danger)', fontSize: '13px' }}>{createError}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={creating}
                style={{
                  background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Добавляем...' : 'Создать аккаунт'}
              </button>
              <button
                type="button"
                onClick={closeForms}
                style={{
                  background: 'none', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
                  borderRadius: '8px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer',
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {mode === 'link' && (
          <form onSubmit={submitLink} style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>Привязать существующий аккаунт ребёнка</div>
            <p style={{ color: 'var(--t-text-muted)', fontSize: '13px', margin: 0 }}>
              Например, если аккаунт ребёнку уже завёл второй родитель — введите логин и пароль,
              которые он придумал.
            </p>

            <input
              value={linkForm.login}
              onChange={e => setLinkForm(f => ({ ...f, login: e.target.value }))}
              placeholder="Логин ребёнка"
              style={inputStyle}
            />
            <input
              value={linkForm.code}
              onChange={e => setLinkForm(f => ({ ...f, code: e.target.value }))}
              placeholder="Пароль ребёнка"
              type="password"
              style={inputStyle}
            />

            <ConsentCheckbox checked={linkConsent} onChange={setLinkConsent} />

            {linkError && <div style={{ color: 'var(--t-danger)', fontSize: '13px' }}>{linkError}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={linking}
                style={{
                  background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: linking ? 'not-allowed' : 'pointer',
                }}
              >
                {linking ? 'Привязываем...' : 'Привязать'}
              </button>
              <button
                type="button"
                onClick={closeForms}
                style={{
                  background: 'none', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
                  borderRadius: '8px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer',
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
