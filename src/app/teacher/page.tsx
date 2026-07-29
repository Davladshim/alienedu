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
      background: '#0f1117',
      fontFamily: 'system-ui, sans-serif',
      color: '#fff',
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
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
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
              background: '#1a1d27', border: '1px solid #2a2d3d',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#60a5fa')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Мои ученики</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Список учеников</div>
            </div>
          </Link>

          {/* Финансы */}
          <Link href="/teacher/finance" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1a1d27', border: '1px solid #2a2d3d',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Финансы</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Доход, баланс, кто не оплатил</div>
            </div>
          </Link>

          {/* Мои уроки */}
          <Link href="/teacher/lessons" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1a1d27', border: '1px solid #2a2d3d',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📚</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Мои уроки</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Конструктор интерактивных уроков</div>
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
              background: '#1a1d27', border: '1px solid #2a2d3d',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#60a5fa')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛍️</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Магазин презентаций</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Интерактивные презентации</div>
            </div>
          </a>

          {/* StereoSpace */}
          <a href="/stereo" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1a1d27', border: '1px solid #2a2d3d',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#60a5fa')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔷</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>StereoSpace</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Задачи по стереометрии</div>
            </div>
          </a>

        </div>

        {/* Расписание */}
        <Link href="/teacher/calendar" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d',
            borderRadius: '16px', padding: '2rem',
            minHeight: '120px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '20px',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
          >
            <div style={{ fontSize: '40px' }}>📅</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: '#fff' }}>Расписание</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Занятия по неделям, переносы, отмены</div>
            </div>
          </div>
        </Link>

      </div>
    </div>
  )
}