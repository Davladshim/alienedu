'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Room = {
  room_type: 'solo' | 'shared' | 'final'
  hint: string
  key_task: string
  key_answer: string
  max_players: number
}

export default function NewQuestPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [rooms, setRooms] = useState<Room[]>([
    { room_type: 'solo', hint: '', key_task: '', key_answer: '', max_players: 1 }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addRoom() {
    setRooms([...rooms, { room_type: 'solo', hint: '', key_task: '', key_answer: '', max_players: 1 }])
  }

  function removeRoom(index: number) {
    setRooms(rooms.filter((_, i) => i !== index))
  }

  function updateRoom(index: number, field: keyof Room, value: any) {
    const updated = [...rooms]
    updated[index] = { ...updated[index], [field]: value }
    setRooms(updated)
  }

  async function handleSubmit() {
    setError('')
    if (!title.trim()) {
      setError('Введите название квеста')
      return
    }
    if (rooms.some(r => !r.key_task || !r.key_answer)) {
      setError('Заполните задание и ответ в каждой комнате')
      return
    }

    setLoading(true)
    const res = await fetch('/api/quest/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, rooms })
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    router.push(`/teacher/quest/${data.session_id}`)
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '1.5rem' }}>
          🎮 Создать новый квест
        </h1>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
            Название квеста
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Например: Повтор 5-6 класса"
            style={inputStyle}
          />
        </div>

        {rooms.map((room, index) => (
          <div key={index} style={{
            background: '#1a1d27',
            border: '0.5px solid #2a2d3d',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>
                Комната {index + 1}
              </h3>
              {rooms.length > 1 && (
                <button onClick={() => removeRoom(index)} style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}>
                  Удалить
                </button>
              )}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Тип комнаты
              </label>
              <select
                value={room.room_type}
                onChange={e => updateRoom(index, 'room_type', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="solo">👤 Одиночная</option>
                <option value="shared">👥 Совместная</option>
                <option value="final">🏆 Финальная</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Подсказка (необязательно)
              </label>
              <input
                value={room.hint}
                onChange={e => updateRoom(index, 'hint', e.target.value)}
                placeholder="Подсказка для ученика"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Задание
              </label>
              <textarea
                value={room.key_task}
                onChange={e => updateRoom(index, 'key_task', e.target.value)}
                placeholder="Текст задания"
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' as const }}
              />
            </div>

            <div>
              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Правильный ответ
              </label>
              <input
                value={room.key_answer}
                onChange={e => updateRoom(index, 'key_answer', e.target.value)}
                placeholder="Точный ответ"
                style={inputStyle}
              />
            </div>
          </div>
        ))}

        <button onClick={addRoom} style={{
          width: '100%',
          background: 'transparent',
          border: '0.5px dashed #4f8ef7',
          borderRadius: '12px',
          padding: '14px',
          color: '#4f8ef7',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '1.5rem'
        }}>
          + Добавить комнату
        </button>

        {error && (
          <div style={{
            background: '#2d1515', border: '0.5px solid #ef4444',
            borderRadius: '8px', padding: '10px 14px',
            color: '#ef4444', fontSize: '13px', marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%',
          background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          padding: '14px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Создаём...' : '🚀 Создать квест'}
        </button>
      </div>
    </div>
  )
}