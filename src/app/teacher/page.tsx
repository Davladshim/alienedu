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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'waiting': return { label: 'Ожидает', color: '#f59e0b' }
      case 'active': return { label: 'Активен', color: '#10b981' }
      case 'finished': return { label: 'Завершён', color: '#6b7280' }
      default: return { label: status, color: '#6b7280' }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>🪐</div>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 500, margin: 0 }}>
              Alien<span style={{ color: '#4f8ef7' }}>Edu</span>
            </h1>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0' }}>
              Кабинет преподавателя
            </p>
          </div>
          <Link href="/teacher/quest/new" style={{
            background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
            color: '#fff',
            borderRadius: '10px',
            padding: '10px 20px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600
          }}>
            + Новый квест
          </Link>
        </div>

        {/* Модули */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '2rem' }}>
          <div style={{
            background: '#1a1d27', border: '0.5px solid #2a2d3d',
            borderRadius: '12px', padding: '1rem 1.25rem',
            color: '#6b7280', fontSize: '14px'
          }}>
            📅 Календарь — в разработке
          </div>
          <div style={{
            background: '#1a1d27', border: '0.5px solid #2a2d3d',
            borderRadius: '12px', padding: '1rem 1.25rem',
            color: '#6b7280', fontSize: '14px'
          }}>
            👥 Мои ученики — в разработке
          </div>
        </div>

        {/* Список квестов */}
        <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '1rem' }}>
          🎮 Мои квесты
        </h2>

        {loading ? (
          <p style={{ color: '#6b7280' }}>Загружаем...</p>
        ) : quests.length === 0 ? (
          <div style={{
            background: '#1a1d27', border: '0.5px dashed #2a2d3d',
            borderRadius: '12px', padding: '2rem',
            textAlign: 'center', color: '#6b7280'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎮</div>
            <p style={{ margin: 0 }}>Квестов пока нет — создай первый!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quests.map(quest => {
              const statusInfo = getStatusLabel(quest.status)
              return (
                <Link key={quest.id} href={`/teacher/quest/${quest.id}`} style={{
                  display: 'block', textDecoration: 'none',
                  background: '#1a1d27', border: '0.5px solid #2a2d3d',
                  borderRadius: '12px', padding: '1rem 1.25rem',
                  transition: 'border-color 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
                        {quest.title}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>
                        {quest.player_count} учеников · {formatDate(quest.created_at)}
                      </div>
                    </div>
                    <span style={{
                      background: `${statusInfo.color}22`,
                      color: statusInfo.color,
                      border: `0.5px solid ${statusInfo.color}44`,
                      borderRadius: '20px', padding: '4px 12px',
                      fontSize: '12px', fontWeight: 500
                    }}>
                      {statusInfo.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}