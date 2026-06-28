'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    login: '',
    code: '',
    code_confirm: '',
    role: 'student',
    secret_question: '',
    secret_answer: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.code !== formData.code_confirm) {
      setError('Коды не совпадают')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    router.push('/login')
  }

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
        maxWidth: '440px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪐</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 500, margin: 0 }}>
            Alien<span style={{ color: '#4f8ef7' }}>Edu</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            Создайте аккаунт
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Полное имя</label>
            <input name="full_name" value={formData.full_name}
              onChange={handleChange} placeholder="Имя Фамилия"
              required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Логин</label>
            <input name="login" value={formData.login}
              onChange={handleChange} placeholder="Придумайте логин"
              required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Роль</label>
            <select name="role" value={formData.role}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="student">Ученик</option>
              <option value="teacher">Преподаватель</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Код доступа</label>
            <input name="code" type="password" value={formData.code}
              onChange={handleChange} placeholder="Придумайте код"
              required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Повторите код</label>
            <input name="code_confirm" type="password" value={formData.code_confirm}
              onChange={handleChange} placeholder="Повторите код"
              required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Секретный вопрос</label>
            <input name="secret_question" value={formData.secret_question}
              onChange={handleChange}
              placeholder="Например: кличка первого питомца"
              required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Ответ на секретный вопрос</label>
            <input name="secret_answer" value={formData.secret_answer}
              onChange={handleChange} placeholder="Ваш ответ"
              required style={inputStyle} />
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px' }}>
              Запомните ответ — он понадобится для восстановления кода
            </p>
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

          <button type="submit" disabled={loading} style={{
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
          }}>
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: '#4f8ef7', fontSize: '13px', textDecoration: 'none' }}>
            Уже есть аккаунт? Войти
          </Link>
        </div>
      </div>
    </div>
  )
}