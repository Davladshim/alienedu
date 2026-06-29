'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuestJoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/quest/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase(), name: name.trim() })
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    // Сохраняем данные игрока в sessionStorage
    sessionStorage.setItem('quest_player_id', data.player_id)
    sessionStorage.setItem('quest_player_name', name)
    sessionStorage.setItem('quest_session_id', data.session_id)

    router.push('/quest/room')
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
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🚪</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 500, margin: 0 }}>
            Войти в квест
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            Введи код от преподавателя
          </p>
        </div>

        <form onSubmit={handleJoin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              color: '#9ca3af', fontSize: '13px',
              display: 'block', marginBottom: '6px'
            }}>
              Код доступа
            </label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Например: ABC123"
              required
              maxLength={10}
              style={{
                width: '100%',
                background: '#0f1117',
                border: '0.5px solid #2a2d3d',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '4px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: '#9ca3af', fontSize: '13px',
              display: 'block', marginBottom: '6px'
            }}>
              Твоё имя
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Как тебя зовут?"
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
              padding: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Входим...' : 'Войти в квест 🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}