'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type RoomTemplate = {
  id: number
  name: string
}

type RoomRow = {
  id: string
  room_type: 'solo' | 'shared' | 'final' | ''
  template_id: number | null | undefined
  is_edited: boolean
  name: string
}

type ZoneData = {
  view: string
  x: number
  y: number
  width: number
  height: number
  item_image: string
  zone_type: string
}

type RoomEditorData = {
  room_index: number
  room_number: number // номер комнаты (1, 2, 3...)
  zones: ZoneData[]
}

// Заглушки шаблонов — потом заменим на реальные из БД
const MOCK_TEMPLATES: RoomTemplate[] = [
  { id: 1, name: 'Викторианский кабинет' },
  { id: 2, name: 'Современная комната' },
]

const VIEWS = ['center', 'left', 'right'] as const
const ROOM_STYLES = [
  { id: 1, name: 'Викторианский кабинет' },
  { id: 2, name: 'Современная комната' },
]

export default function NewQuestPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [playerCount, setPlayerCount] = useState(10)
  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Редактор комнаты
  const [editingRoom, setEditingRoom] = useState<RoomRow | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentView, setCurrentView] = useState<'center' | 'left' | 'right'>('center')
  const [roomNumber, setRoomNumber] = useState(1)
  const [zones, setZones] = useState<ZoneData[]>([])
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [selectedItem, setSelectedItem] = useState<string>('envelope.png')

  function addRoom() {
      const newRoom: RoomRow = {
        id: Date.now().toString(),
        room_type: '',
        template_id: undefined,
        is_edited: false,
        name: '',
      }
      setRooms([...rooms, newRoom])
    }

    function removeRoom(index: number) {
    setRooms(rooms.filter((_, i) => i !== index))
  }

  function updateRoom(index: number, field: keyof RoomRow, value: any) {
    const updated = [...rooms]
    updated[index] = { ...updated[index], [field]: value }
    setRooms(updated)
  }

  function openRoomEditor(room: RoomRow, index: number) {
    setEditingRoom(room)
    setEditingIndex(index)
    setCurrentView('center')
    setRoomNumber(index + 1)
    setZones([])
    setSelectedZone(null)
  }

  function saveRoomEditor() {
    if (editingIndex === null) return
    const updated = [...rooms]
    updated[editingIndex] = { ...updated[editingIndex], is_edited: true }
    setRooms(updated)
    setEditingRoom(null)
    setEditingIndex(null)
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const newZone: ZoneData = {
      view: currentView, x: x - 4, y: y - 6,
      width: 8, height: 12,
      item_image: selectedItem, zone_type: 'task'
    }
    setZones([...zones, newZone])
    setSelectedZone(newZone)
  }

  function updateZone(field: string, value: any) {
    if (!selectedZone) return
    const updated = zones.map(z => z === selectedZone ? { ...z, [field]: value } : z)
    setZones(updated)
    setSelectedZone({ ...selectedZone, [field]: value })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Delete' && selectedZone) {
      setZones(zones.filter(z => z !== selectedZone))
      setSelectedZone(null)
      return
    }
    if (!selectedZone) return
    const step = e.shiftKey ? 0.5 : 0.2
    let { x, y } = selectedZone
    if (e.key === 'ArrowLeft') x -= step
    if (e.key === 'ArrowRight') x += step
    if (e.key === 'ArrowUp') y -= step
    if (e.key === 'ArrowDown') y += step
    else return
    e.preventDefault()
    const newX = Math.max(0, Math.min(x, 100 - selectedZone.width))
    const newY = Math.max(0, Math.min(y, 100 - selectedZone.height))
    const updated = zones.map(z => z === selectedZone ? { ...z, x: newX, y: newY } : z)
    const newSelected = { ...selectedZone, x: newX, y: newY }
    setZones(updated)
    setSelectedZone(newSelected)
    setTimeout(() => editorRef.current?.focus(), 0)
  }

  const canProceed = rooms.length > 0 && rooms.every(r => r.template_id !== null || r.is_edited)

  async function handleCreate() {
    setError('')
    if (!title.trim()) { setError('Введите название квеста'); return }
    if (rooms.length === 0) { setError('Добавьте хотя бы одну комнату'); return }
    setLoading(true)

    // Создаём квест с заглушками для заданий
    const roomsData = rooms.map((r, i) => ({
      room_type: r.room_type,
      hint: '',
      key_task: `Задание комнаты ${i + 1}`,
      key_answer: 'ответ',
      max_players: r.room_type === 'solo' ? 1 : 2,
    }))

    const res = await fetch('/api/quest/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, player_count: playerCount, rooms: roomsData })
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      router.push(`/teacher/quest/${data.session_id}`)
    } else {
      setError(data.error || 'Ошибка')
    }
  }

  // ===== РЕДАКТОР КОМНАТЫ =====
  if (editingRoom !== null) {
    const imgSrc = `/rooms/room-${roomNumber}/${currentView}.jpg`
    const currentZones = zones.filter(z => z.view === currentView)

    return (
      <div
        ref={editorRef}
        style={{ minHeight: '100vh', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        autoFocus
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <button onClick={() => { setEditingRoom(null); setEditingIndex(null) }}
            style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '14px' }}>
            ← Назад к редактору веток
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
            🗺️ Редактор комнаты {editingIndex !== null ? editingIndex + 1 : ''}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>

          {/* Боковая панель */}
          <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Выбор номера комнаты */}
            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase' }}>Вариант комнаты</div>
              <select
                value={roomNumber}
                onChange={e => setRoomNumber(Number(e.target.value))}
                style={{ width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '6px', padding: '6px', color: 'var(--t-text)', fontSize: '13px' }}
              >
                {ROOM_STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Ракурс */}
            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase' }}>Ракурс</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {VIEWS.map(v => (
                  <button key={v} onClick={() => setCurrentView(v)} style={{
                    flex: 1, padding: '5px', borderRadius: '6px',
                    border: currentView === v ? '1px solid var(--t-accent)' : '1px solid var(--t-border)',
                    background: currentView === v ? 'rgba(var(--t-accent-rgb),0.15)' : 'var(--t-bg)',
                    color: currentView === v ? 'var(--t-accent)' : 'var(--t-text-muted)',
                    fontSize: '11px', cursor: 'pointer'
                  }}>{v}</button>
                ))}
              </div>
            </div>

            {/* Предметы */}
            <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase' }}>Выбери предмет</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['envelope.png', 'paper-ball.png'].map(item => (
                  <div key={item}
                    onClick={() => setSelectedItem(item)}
                    style={{
                      background: selectedItem === item ? 'rgba(var(--t-accent-rgb),0.15)' : 'var(--t-bg)',
                      border: `1px solid ${selectedItem === item ? 'var(--t-accent)' : 'var(--t-border)'}`,
                      borderRadius: '8px', padding: '8px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontSize: '12px', color: 'var(--t-text-secondary)',
                      cursor: 'pointer'
                    }}>
                    <img src={`/rooms/items/${item}`} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt={item} />
                    {item === 'envelope.png' ? 'Конверт' : 'Комок бумаги'}
                    {selectedItem === item && <span style={{ marginLeft: 'auto', color: 'var(--t-accent)', fontSize: '10px' }}>✓ выбран</span>}
                  </div>
                ))}
                <p style={{ color: 'var(--t-text-faint)', fontSize: '11px', marginTop: '4px' }}>Кликни на комнату чтобы поставить</p>
              </div>
            </div>

            {/* Настройки выбранной зоны */}
            {selectedZone && (
              <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '12px' }}>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase' }}>Зона</div>

                <label style={{ color: 'var(--t-text-secondary)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Предмет</label>
                <select value={selectedZone.item_image} onChange={e => updateZone('item_image', e.target.value)}
                  style={{ width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '6px', padding: '5px', color: 'var(--t-text)', fontSize: '11px', marginBottom: '8px' }}>
                  <option value="envelope.png">Конверт</option>
                  <option value="paper-ball.png">Комок бумаги</option>
                </select>

                <label style={{ color: 'var(--t-text-secondary)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Тип</label>
                <select value={selectedZone.zone_type} onChange={e => updateZone('zone_type', e.target.value)}
                  style={{ width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '6px', padding: '5px', color: 'var(--t-text)', fontSize: '11px', marginBottom: '8px' }}>
                  <option value="task">Задание</option>
                  <option value="decoy">Обманка</option>
                </select>

                <label style={{ color: 'var(--t-text-secondary)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Ширина</label>
                <input type="range" min="3" max="25" value={selectedZone.width}
                  onChange={e => updateZone('width', Number(e.target.value))}
                  style={{ width: '100%', marginBottom: '4px' }} />

                <label style={{ color: 'var(--t-text-secondary)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Высота</label>
                <input type="range" min="3" max="25" value={selectedZone.height}
                  onChange={e => updateZone('height', Number(e.target.value))}
                  style={{ width: '100%', marginBottom: '8px' }} />

                <p style={{ color: 'var(--t-text-faint)', fontSize: '10px', marginBottom: '6px' }}>
                  ↑↓←→ для точного позиционирования
                </p>

                <button onClick={() => {
                  setZones(zones.filter(z => z !== selectedZone))
                  setSelectedZone(null)
                }} style={{
                  width: '100%', background: 'var(--t-danger-bg)', color: 'var(--t-danger-soft)',
                  border: 'none', borderRadius: '6px', padding: '6px',
                  fontSize: '11px', cursor: 'pointer'
                }}>🗑️ Удалить</button>
              </div>
            )}

            <button onClick={saveRoomEditor} style={{
              width: '100%', background: 'linear-gradient(135deg, var(--t-success2), var(--t-success))',
              color: '#fff', border: 'none', borderRadius: '8px', padding: '10px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}>✅ Сохранить комнату</button>
          </div>

          {/* Картинка */}
          <div style={{ flex: 1 }}>
            <div
              style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', cursor: 'crosshair', userSelect: 'none' }}
              onClick={handleImageClick}
            >
              <img key={imgSrc} src={imgSrc} alt="комната" style={{ width: '100%', display: 'block' }}
                onError={e => (e.currentTarget.style.opacity = '0')} />

              {currentZones.map((zone, i) => (
                <div key={i}
                  onClick={e => { e.stopPropagation(); setSelectedZone(zone) }}
                  style={{
                    position: 'absolute',
                    left: `${zone.x}%`, top: `${zone.y}%`,
                    width: `${zone.width}%`, height: `${zone.height}%`,
                    border: selectedZone === zone
                      ? '2px solid var(--t-accent)'
                      : zone.zone_type === 'decoy' ? '2px dashed var(--t-warning2)' : '2px dashed var(--t-success2)',
                    background: selectedZone === zone ? 'rgba(var(--t-accent-rgb),0.2)' : 'rgba(255,255,255,0.05)',
                    cursor: 'pointer', borderRadius: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <img src={`/rooms/items/${zone.item_image}`}
                    style={{ width: '60%', height: '60%', objectFit: 'contain', opacity: 0.7 }} alt="" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== РЕДАКТОР ВЕТОК =====
  return (
    <div style={{ minHeight: '100vh', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <button onClick={() => router.push('/teacher/quests')}
            style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '14px' }}>
            ← Мои квесты
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🎮 Новый квест</h1>
        </div>

        {/* Название и количество учеников */}
        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ color: 'var(--t-text-muted)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Название квеста</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Например: Осенний квест"
                style={{ width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--t-text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ width: '160px' }}>
              <label style={{ color: 'var(--t-text-muted)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Учеников</label>
              <select
                value={playerCount}
                onChange={e => setPlayerCount(Number(e.target.value))}
                style={{ width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '8px', padding: '10px', color: 'var(--t-text)', fontSize: '14px' }}
              >
                {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} учеников</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Комнаты */}
        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Уровни</h2>
            <button onClick={addRoom} style={{
              background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)',
              color: 'var(--t-accent)', borderRadius: '8px', padding: '6px 14px',
              fontSize: '13px', cursor: 'pointer'
            }}>+ Добавить уровень</button>
          </div>

          {rooms.length === 0 && (
            <p style={{ color: 'var(--t-text-faint)', fontSize: '14px', textAlign: 'center', padding: '1.5rem 0' }}>
              Нажми «Добавить уровень» чтобы начать
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rooms.map((room, i) => (
            <div key={room.id} style={{
              background: 'var(--t-bg)', border: '1px solid var(--t-border)',
              borderRadius: '10px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'
            }}>
              <div style={{ color: 'var(--t-text-muted)', fontSize: '13px', fontWeight: 600, minWidth: '60px' }}>
                Уровень {i + 1}
              </div>

              <select
                value={room.room_type ?? ''}
                onChange={e => updateRoom(i, 'room_type', e.target.value)}
                style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '6px', padding: '6px 10px', color: room.room_type ? 'var(--t-text)' : 'var(--t-text-muted)', fontSize: '13px' }}
              >
                <option value="" disabled>Выберите тип уровня</option>
                <option value="solo">👤 Одиночная</option>
                <option value="shared">👥 Совместная</option>
                <option value="final">🏆 Финальная</option>
              </select>

              <select
                value={room.template_id ?? ''}
                onChange={e => updateRoom(i, 'template_id', e.target.value === 'new' ? null : Number(e.target.value))}
                style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '6px', padding: '6px 10px', color: room.template_id !== undefined ? 'var(--t-text)' : 'var(--t-text-muted)', fontSize: '13px', flex: 1, minWidth: '160px' }}
              >
                <option value="" disabled>Выберите шаблон комнаты</option>
                <option value="new">✨ Новая комната</option>
              </select>

              <button
                onClick={() => openRoomEditor(room, i)}
                disabled={!room.room_type || room.template_id === undefined}
                style={{
                  background: 'var(--t-card)',
                  border: `1px solid ${!room.room_type || room.template_id === undefined ? 'var(--t-border)' : 'var(--t-accent)'}`,
                  color: !room.room_type || room.template_id === undefined ? 'var(--t-text-faint)' : 'var(--t-accent)',
                  borderRadius: '6px', padding: '6px 12px',
                  fontSize: '12px', cursor: !room.room_type || room.template_id === undefined ? 'not-allowed' : 'pointer',
                }}
              >
                {room.is_edited ? '✅ Изменить' : '✏️ Редактировать'}
              </button>

              <button onClick={() => removeRoom(i)} style={{
                background: 'none', border: 'none', color: 'var(--t-text-muted)',
                cursor: 'pointer', fontSize: '16px', padding: '0 4px'
              }}>✕</button>
            </div>
          ))}
          </div>
        </div>

        {error && <p style={{ color: 'var(--t-danger)', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => router.push('/teacher/quests')} style={{
            background: 'transparent', border: '1px solid var(--t-border)',
            color: 'var(--t-text-muted)', borderRadius: '8px', padding: '10px 20px',
            fontSize: '14px', cursor: 'pointer'
          }}>Отмена</button>
          <button
            onClick={handleCreate}
            disabled={!canProceed || loading}
            style={{
              background: canProceed ? 'linear-gradient(135deg, var(--t-accent), var(--t-accent2))' : 'var(--t-border)',
              color: canProceed ? '#fff' : 'var(--t-text-faint)',
              border: 'none', borderRadius: '8px', padding: '10px 24px',
              fontSize: '14px', fontWeight: 600,
              cursor: canProceed ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Создаём...' : '▶ Создать квест'}
          </button>
        </div>

      </div>
    </div>
  )
}
