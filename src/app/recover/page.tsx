'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    background: '#0f1117',
    border: '0.5px solid #2a2d3d',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    color: '#9ca3af',
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
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        background: '#1a1d27',
        border: '0.5px solid #2a2d3d',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪐</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 500, margin: 0 }}>
            Alien<span style={{ color: '#4f8ef7' }}>Edu</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
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
                background: '#2d1515', border: '0.5px solid #ef4444',
                borderRadius: '8px', padding: '10px 14px',
                color: '#ef4444', fontSize: '13px', marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#4f8ef7', color: '#fff',
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
              background: '#0f1117', borderRadius: '8px',
              padding: '12px 14px', marginBottom: '1.5rem'
            }}>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 4px' }}>
                Секретный вопрос:
              </p>
              <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
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
              <label style={labelStyle}>Новый код</label>
              <input type="password" value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder="Новый код" required style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Повторите новый код</label>
              <input type="password" value={newCodeConfirm}
                onChange={e => setNewCodeConfirm(e.target.value)}
                placeholder="Повторите код" required style={inputStyle} />
            </div>

            {error && (
              <div style={{
                background: '#2d1515', border: '0.5px solid #ef4444',
                borderRadius: '8px', padding: '10px 14px',
                color: '#ef4444', fontSize: '13px', marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', background: '#4f8ef7', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '11px',
              fontSize: '14px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Сохраняем...' : 'Сохранить новый код'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: '#4f8ef7', fontSize: '13px', textDecoration: 'none' }}>
            ← Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  )
}