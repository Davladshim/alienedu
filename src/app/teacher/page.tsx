'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TeacherPage() {
  const [quests, setQuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/quest/my-quests')
      .then(r => r.json())
      .then(data => {
        setQuests(data.quests || [])
        setLoading(false)
      })
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
            🪐 Кабинет преподавателя
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            AlienEdu — платформа для интерактивных уроков
          </p>
        </div>

        {/* Сетка модулей */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '2rem'
        }}>

          {/* Мои квесты */}
          <Link href="/teacher/quests" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1a1d27', border: '1px solid #2a2d3d',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎮</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Мои квесты</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Управление квест-уроками</div>
            </div>
          </Link>

          {/* Редактор комнат */}
          <Link href="/teacher/room-editor" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1a1d27', border: '1px solid #2a2d3d',
              borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f8ef7')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3d')}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗺️</div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Редактор комнат</div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Расставить интерактивные зоны</div>
            </div>
          </Link>

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

          {/* StereoSpace — заглушка */}
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d',
            borderRadius: '16px', padding: '1.5rem',
            opacity: 0.5
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔷</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>StereoSpace</div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>Задачи по стереометрии — скоро</div>
          </div>

          {/* Готовые уроки — заглушка */}
          <div style={{
            background: '#1a1d27', border: '1px solid #2a2d3d',
            borderRadius: '16px', padding: '1.5rem',
            opacity: 0.5
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📚</div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Готовые уроки</div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>Скоро</div>
          </div>

        </div>

        {/* Календарь — заглушка */}
        <div style={{
          background: '#1a1d27', border: '1px solid #2a2d3d',
          borderRadius: '16px', padding: '2rem',
          minHeight: '200px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', color: '#4b5563' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Календарь преподавателя</div>
            <div style={{ fontSize: '13px' }}>Здесь будет Календаша — скоро</div>
          </div>
        </div>

      </div>
    </div>
  )
}