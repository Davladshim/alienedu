'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, code })
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    // Перенаправляем по роли
    const role = data.user.role
    if (role === 'admin') router.push('/admin')
    else if (role === 'teacher') router.push('/teacher')
    else router.push('/student')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: '#1a1d27',
        border: '0.5px solid #2a2d3d',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Логотип */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪐</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 500, margin: 0 }}>
            Alien<span style={{ color: '#4f8ef7' }}>Edu</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            Войдите в свой аккаунт
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Логин
            </label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Ваш логин"
              required
              style={{
                width: '100%',
                background: '#0f1117',
                border: '0.5px solid #2a2d3d',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Код доступа
            </label>
            <input
              type="password"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Ваш код"
              required
              style={{
                width: '100%',
                background: '#0f1117',
                border: '0.5px solid #2a2d3d',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#2d1515',
              border: '0.5px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#4f8ef7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '11px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/recover" style={{ color: '#4f8ef7', fontSize: '13px', textDecoration: 'none' }}>
            Забыли код?
          </Link>
          <span style={{ color: '#374151', margin: '0 10px' }}>·</span>
          <Link href="/register" style={{ color: '#4f8ef7', fontSize: '13px', textDecoration: 'none' }}>
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  )
}