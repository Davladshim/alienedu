'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Quest = {
  id: number
  title: string
  status: string
  player_count: number
  created_at: string
  finished_at: string | null
}

const TABS = [
  { key: 'active', label: 'Незавершённые' },
  { key: 'finished', label: 'Завершённые' },
  { key: 'saved', label: 'Сохранённые' },
  { key: 'all', label: 'Все' },
]

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([])
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
      case 'waiting': return { label: 'Ожидает', color: 'var(--t-warning2)' }
      case 'active': return { label: 'Активен', color: 'var(--t-success2)' }
      case 'finished': return { label: 'Завершён', color: 'var(--t-text-muted)' }
      default: return { label: status, color: 'var(--t-text-muted)' }
    }
  }

  return (
  <div style={{
    minHeight: '100vh',
    background: 'var(--t-bg)',
    fontFamily: 'system-ui, sans-serif',
    color: 'var(--t-text)',
    display: 'flex',
    justifyContent: 'center',
  }}>
  <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

      {/* Шапка */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <Link href="/teacher" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>
          ← Кабинет
        </Link>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🎮 Мои квесты</h1>
      </div>

      {/* Блок: Квест "Комнаты" */}
      <QuestBlock
        title='Квест "Комнаты"'
        quests={quests}
        loading={loading}
        formatDate={formatDate}
        getStatusLabel={getStatusLabel}
      />

      {/* Блок: Квест "2" — заглушка */}
      <QuestBlock
        title='Квест "2"'
        quests={[]}
        loading={false}
        formatDate={formatDate}
        getStatusLabel={getStatusLabel}
        placeholder
      />

    </div>
  </div>
  )
}

function QuestBlock({ title, quests, loading, formatDate, getStatusLabel, placeholder }: {
  title: string
  quests: Quest[]
  loading: boolean
  formatDate: (d: string) => string
  getStatusLabel: (s: string) => { label: string; color: string }
  placeholder?: boolean
}) {
  const [activeTab, setActiveTab] = useState('all')

  const filtered = quests.filter(q => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return q.status === 'waiting' || q.status === 'active'
    if (activeTab === 'finished') return q.status === 'finished'
    if (activeTab === 'saved') return false // пока нет шаблонов
    return true
  })

  return (
    <div style={{
      background: 'var(--t-card)', border: '1px solid var(--t-border)',
      borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--t-text)' }}>
          {title}
        </h2>
        {title === 'Квест "Комнаты"' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/teacher/room-editor" style={{
              background: 'transparent', color: 'var(--t-text-secondary)', border: '1px solid var(--t-border)',
              textDecoration: 'none', borderRadius: '8px',
              padding: '6px 14px', fontSize: '13px', fontWeight: 600
            }}>
              🗺️ Редактор комнат
            </Link>
            <Link href="/teacher/quest/new" style={{
              background: 'var(--t-accent)', color: '#fff',
              textDecoration: 'none', borderRadius: '8px',
              padding: '6px 14px', fontSize: '13px', fontWeight: 600
            }}>
              + Новый квест
            </Link>
          </div>
        )}
      </div>

      {/* Вкладки */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--t-border)', paddingBottom: '1rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? 'rgba(var(--t-accent-rgb),0.15)' : 'transparent',
              border: activeTab === tab.key ? '1px solid var(--t-accent)' : '1px solid var(--t-border)',
              borderRadius: '8px', padding: '6px 14px',
              color: activeTab === tab.key ? 'var(--t-accent)' : 'var(--t-text-muted)',
              fontSize: '13px', cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Содержимое */}
      {placeholder ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--t-text-faint)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚧</div>
          <div style={{ fontSize: '14px' }}>Скоро</div>
        </div>
      ) : loading ? (
        <p style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>Загружаем...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--t-text-faint)', fontSize: '14px', textAlign: 'center', padding: '1.5rem 0' }}>
          Квестов пока нет
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(q => {
            const { label, color } = getStatusLabel(q.status)
            return (
              <Link key={q.id} href={`/teacher/quest/${q.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--t-bg)', border: '1px solid var(--t-border)',
                  borderRadius: '10px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'border-color 0.2s', cursor: 'pointer'
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--t-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--t-border)')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--t-text)', marginBottom: '2px' }}>
                      {q.title}
                    </div>
                    <div style={{ color: 'var(--t-text-muted)', fontSize: '12px' }}>
                      {q.player_count} учеников · {formatDate(q.created_at)}
                    </div>
                  </div>
                  <span style={{
                    background: `${color}20`, color, borderRadius: '6px',
                    padding: '3px 10px', fontSize: '12px', fontWeight: 600
                  }}>
                    {label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}