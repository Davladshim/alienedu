'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function TeacherPage() {
  const [teacherName, setTeacherName] = useState('')

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => setTeacherName(data.full_name || '')).catch(() => {})
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--t-bg)',
      fontFamily: 'system-ui, sans-serif',
      color: 'var(--t-text)',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        padding: '2rem',
      }}>

        {/* Шапка */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            🪐 Кабинет преподавателя{teacherName && ` ${teacherName}`}
          </h1>
          <p style={{ color: 'var(--t-text-muted)', fontSize: '14px', margin: 0 }}>
            AlienEdu — платформа для интерактивных уроков
          </p>
        </div>

        {/* Первый ряд — три равные карточки */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '16px'
        }}>

          {/* Мои ученики */}
          <Link href="/teacher/students" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--t-card)', border: '1px solid var(--t-border)',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-info)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Мои ученики</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Список учеников</div>
            </div>
          </Link>

          {/* Финансы */}
          <Link href="/teacher/finance" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--t-card)', border: '1px solid var(--t-border)',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Финансы</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Доход, баланс, кто не оплатил</div>
            </div>
          </Link>

          {/* Мои уроки */}
          <Link href="/teacher/lessons" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--t-card)', border: '1px solid var(--t-border)',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📚</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Мои уроки</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Конструктор интерактивных уроков</div>
            </div>
          </Link>

        </div>

        {/* Второй ряд — две карточки на всю ширину */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '2rem'
        }}>

          {/* Магазин презентаций */}
          <a href="/shop" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--t-card)', border: '1px solid var(--t-border)',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-info)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛍️</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Магазин презентаций</div>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>Интерактивные презентации</div>
            </div>
          </a>

          {/* StereoSpace — временно недоступен, ещё в разработке */}
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)',
            borderRadius: '16px', padding: '1.5rem', cursor: 'not-allowed', opacity: 0.5,
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔷</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>StereoSpace</div>
            <div style={{ color: 'var(--t-text-muted)', fontSize: '13px' }}>В разработке — скоро будет доступно</div>
          </div>

        </div>

        {/* Расписание */}
        <Link href="/teacher/calendar" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)',
            borderRadius: '16px', padding: '2rem',
            minHeight: '120px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '20px',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
          >
            <div style={{ fontSize: '40px' }}>📅</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--t-text)' }}>Расписание</div>
              <div style={{ fontSize: '13px', color: 'var(--t-text-muted)' }}>Занятия по неделям, переносы, отмены</div>
            </div>
          </div>
        </Link>

      </div>
    </div>
  )
}