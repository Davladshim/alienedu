'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { inputStyle, submitButtonStyle, submitButtonDisabledStyle } from '@/components/lesson-blocks/styles'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [login, setLogin] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  function loadStudents() {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => {
        setStudents(data.students || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadStudents()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!login.trim()) return
    setAdding(true)
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login }),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) {
      setLogin('')
      loadStudents()
    } else {
      setError(data.error || 'Ошибка')
    }
  }

  async function handleRemove(id: number) {
    if (!confirm('Убрать ученика из списка?')) return
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setStudents(s => s.filter(st => st.id !== id))
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif',
      color: '#fff', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Кабинет
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>👥 Мои ученики</h1>
        </div>

        <form onSubmit={handleAdd} style={{
          background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
          padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '12px', alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Логин ученика
            </label>
            <input
              value={login}
              onChange={e => setLogin(e.target.value)}
              style={inputStyle}
              placeholder="Логин, который ученик указал при регистрации"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !login.trim()}
            style={adding || !login.trim() ? submitButtonDisabledStyle : submitButtonStyle}
          >
            {adding ? 'Добавляем...' : '+ Добавить'}
          </button>
        </form>

        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        {!loading && students.length === 0 && (
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
            padding: '3rem', textAlign: 'center', color: '#6b7280',
          }}>
            Пока нет учеников — добавь по логину выше.
            <br />
            Сначала ученик должен зарегистрироваться на платформе как «Ученик».
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {students.map(student => (
            <div key={student.id} style={{
              background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px',
              padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{student.full_name}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>@{student.login}</div>
              </div>
              <button
                onClick={() => handleRemove(student.id)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px' }}
              >
                Убрать
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
