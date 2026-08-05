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

const emptyForm = { full_name: '', login: '', code: '', grade: '' }

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '8px',
  padding: '10px 14px', color: 'var(--t-text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export default function ParentPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim() || !form.login.trim() || !form.code || !form.grade) {
      setError('Заполните все поля')
      return
    }
    setAdding(true)
    const res = await fetch('/api/parent/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: form.full_name, login: form.login, code: form.code, grade: Number(form.grade) }),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) {
      setForm(emptyForm)
      setShowForm(false)
      load()
    } else {
      setError(data.error || 'Не удалось добавить ребёнка')
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '700px', padding: '2rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>👨‍👩‍👧 Кабинет родителя</h1>
        <p style={{ color: 'var(--t-text-muted)', fontSize: '14px', marginBottom: '1.5rem' }}>
          Здесь можно завести аккаунт ребёнку — логин и пароль придумываете вы, ребёнку не нужно регистрироваться самостоятельно.
        </p>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {!loading && children.length === 0 && !showForm && (
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

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: 'linear-gradient(135deg, var(--t-accent), var(--t-accent2))', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Добавить ребёнка
          </button>
        ) : (
          <form onSubmit={submit} style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>Новый аккаунт ребёнка</div>

            <input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Имя и фамилия ребёнка"
              style={inputStyle}
            />
            <input
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              placeholder="Логин"
              style={inputStyle}
            />
            <input
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="Пароль"
              type="password"
              style={inputStyle}
            />
            <select
              value={form.grade}
              onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Класс</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                <option key={g} value={g}>{g} класс</option>
              ))}
            </select>

            {error && <div style={{ color: 'var(--t-danger)', fontSize: '13px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={adding}
                style={{
                  background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer',
                }}
              >
                {adding ? 'Добавляем...' : 'Создать аккаунт'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError('') }}
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
