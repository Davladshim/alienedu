'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordInput } from '@/components/PasswordInput'

export default function RecoverPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [login, setLogin] = useState('')
  const [secretAnswer, setSecretAnswer] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newCodeConfirm, setNewCodeConfirm] = useState('')
  const [secretQuestion, setSecretQuestion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    width: '100%',
    background: 'var(--t-bg)',
    border: '0.5px solid var(--t-border)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--t-text)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    color: 'var(--t-text-secondary)',
    fontSize: '13px',
    display: 'block',
    marginBottom: '6px'
  }

  async function handleFindUser(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/auth/get-question?login=${login}`)
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    setSecretQuestion(data.secret_question)
    setStep(2)
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newCode !== newCodeConfirm) {
      setError('Коды не совпадают')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login,
        secret_answer: secretAnswer,
        new_code: newCode
      })
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    router.push('/login')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'auto',
      background: 'var(--t-bg)',
      display: 'flex',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        background: 'var(--t-card)',
        border: '0.5px solid var(--t-border)',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px',
        margin: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪐</div>
          <h1 style={{ color: 'var(--t-text)', fontSize: '22px', fontWeight: 500, margin: 0 }}>
            Alien<span style={{ color: 'var(--t-accent)' }}>Edu</span>
          </h1>
          <p style={{ color: 'var(--t-text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Восстановление доступа
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleFindUser}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Ваш логин</label>
              <input value={login} onChange={e => setLogin(e.target.value)}
                placeholder="Введите логин" required style={inputStyle} />
            </div>

            {error && (
              <div style={{
                background: 'var(--t-danger-bg)', border: '0.5px solid var(--t-danger)',
                borderRadius: '8px', padding: '10px 14px',
                color: 'var(--t-danger)', fontSize: '13px', marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', background: 'var(--t-accent)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '11px',
              fontSize: '14px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Ищем...' : 'Продолжить'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleRecover}>
            <div style={{
              background: 'var(--t-bg)', borderRadius: '8px',
              padding: '12px 14px', marginBottom: '1.5rem'
            }}>
              <p style={{ color: 'var(--t-text-muted)', fontSize: '12px', margin: '0 0 4px' }}>
                Секретный вопрос:
              </p>
              <p style={{ color: 'var(--t-text)', fontSize: '14px', margin: 0 }}>
                {secretQuestion}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Ответ</label>
              <input value={secretAnswer}
                onChange={e => setSecretAnswer(e.target.value)}
                placeholder="Ваш ответ" required style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Новый пароль</label>
              <PasswordInput value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder="Новый пароль" required autoComplete="new-password" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Повторите новый пароль</label>
              <PasswordInput value={newCodeConfirm}
                onChange={e => setNewCodeConfirm(e.target.value)}
                placeholder="Повторите пароль" required autoComplete="new-password" style={inputStyle} />
            </div>

            {error && (
              <div style={{
                background: 'var(--t-danger-bg)', border: '0.5px solid var(--t-danger)',
                borderRadius: '8px', padding: '10px 14px',
                color: 'var(--t-danger)', fontSize: '13px', marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', background: 'var(--t-accent)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '11px',
              fontSize: '14px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Сохраняем...' : 'Сохранить новый пароль'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: 'var(--t-accent)', fontSize: '13px', textDecoration: 'none' }}>
            ← Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  )
}