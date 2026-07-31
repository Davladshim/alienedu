'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordInput } from '@/components/PasswordInput'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    login: '',
    code: '',
    code_confirm: '',
    role: 'student',
    grade: '',
    secret_question: '',
    secret_answer: ''
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
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

    if (!agreeTerms) {
      setError('Нужно согласиться с условиями использования и политикой конфиденциальности')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, agree_terms: agreeTerms })
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
        maxWidth: '440px',
        margin: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪐</div>
          <h1 style={{ color: 'var(--t-text)', fontSize: '22px', fontWeight: 500, margin: 0 }}>
            Alien<span style={{ color: 'var(--t-accent)' }}>Edu</span>
          </h1>
          <p style={{ color: 'var(--t-text-muted)', fontSize: '14px', marginTop: '6px' }}>
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

          {formData.role === 'student' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Класс</label>
              <select name="grade" value={formData.grade}
                onChange={handleChange}
                required style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Выберите класс</option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>{g} класс</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Пароль</label>
            <PasswordInput name="code" value={formData.code}
              onChange={handleChange} placeholder="Придумайте пароль"
              required style={inputStyle} autoComplete="new-password" />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Повторите пароль</label>
            <PasswordInput name="code_confirm" value={formData.code_confirm}
              onChange={handleChange} placeholder="Повторите пароль"
              required style={inputStyle} autoComplete="new-password" />
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
            <p style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginTop: '6px' }}>
              Запомните ответ — он понадобится для восстановления пароля
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '1.25rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              style={{ marginTop: '3px', flexShrink: 0 }}
            />
            <span style={{ color: 'var(--t-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Я согласен с{' '}
              <Link href="/terms" target="_blank" style={{ color: 'var(--t-accent)' }}>Пользовательским соглашением</Link>
              {' '}и{' '}
              <Link href="/privacy" target="_blank" style={{ color: 'var(--t-accent)' }}>Политикой конфиденциальности</Link>,
              а также даю согласие на обработку персональных данных
            </span>
          </label>

          {error && (
            <div style={{
              background: 'var(--t-danger-bg)',
              border: '0.5px solid var(--t-danger)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--t-danger)',
              fontSize: '13px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !agreeTerms} style={{
            width: '100%',
            background: 'var(--t-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '11px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: (loading || !agreeTerms) ? 'not-allowed' : 'pointer',
            opacity: (loading || !agreeTerms) ? 0.6 : 1
          }}>
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: 'var(--t-accent)', fontSize: '13px', textDecoration: 'none' }}>
            Уже есть аккаунт? Войти
          </Link>
        </div>
      </div>
    </div>
  )
}