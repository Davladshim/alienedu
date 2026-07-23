'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Zone = {
  id?: number
  room_id: number
  view: 'center' | 'left' | 'right'
  x: number
  y: number
  width: number
  height: number
  item_image: string
  zone_type: 'task' | 'decoy'
}

type Room = {
  id: number
  room_number: number
  room_type: string
  session_id: number
}

const ITEMS = ['envelope.png', 'paper-ball.png']
const VIEWS: ('center' | 'left' | 'right')[] = ['center', 'left', 'right']

export default function RoomEditorPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [currentView, setCurrentView] = useState<'center' | 'left' | 'right'>('center')
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [dragging, setDragging] = useState<Zone | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [message, setMessage] = useState('')
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (selectedRoom) fetchZones(selectedRoom.id, currentView)
  }, [selectedRoom, currentView])

  async function fetchRooms() {
    const res = await fetch('/api/quest-rooms-list')
    const data = await res.json()
    setRooms(data.rooms || [])
  }

  async function fetchZones(roomId: number, view: string) {
    const res = await fetch(`/api/quest-room-zones?room_id=${roomId}&view=${view}`)
    const data = await res.json()
    setZones(data.zones || [])
    setSelectedZone(null)
  }

  function getRelativePos(e: React.MouseEvent) {
    if (!imgRef.current) return { x: 0, y: 0 }
    const rect = imgRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }
  }

  function handleImageClick(e: React.MouseEvent) {
    if (dragging) return
    if (!selectedRoom) return
    const pos = getRelativePos(e)
    const newZone: Zone = {
      room_id: selectedRoom.id,
      view: currentView,
      x: pos.x - 4,
      y: pos.y - 6,
      width: 8,
      height: 12,
      item_image: 'envelope.png',
      zone_type: 'task',
    }
    setZones([...zones, newZone])
    setSelectedZone(newZone)
  }

  function handleZoneMouseDown(e: React.MouseEvent, zone: Zone) {
    e.stopPropagation()
    setSelectedZone(zone)
    setDragging(zone)
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left - (zone.x / 100) * rect.width,
      y: e.clientY - rect.top - (zone.y / 100) * rect.height,
    })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
    const newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100
    const updated = zones.map(z =>
      z === dragging ? { ...z, x: Math.max(0, Math.min(newX, 100 - z.width)), y: Math.max(0, Math.min(newY, 100 - z.height)) } : z
    )
    setZones(updated)
    setDragging(updated.find(z => z.id === dragging.id && z.view === dragging.view) || null)
    if (selectedZone === dragging) setSelectedZone(updated.find(z => z === dragging) || null)
  }

  function handleMouseUp() {
    setDragging(null)
  }

  function updateSelectedZone(field: string, value: any) {
    if (!selectedZone) return
    const updated = zones.map(z => z === selectedZone ? { ...z, [field]: value } : z)
    setZones(updated)
    setSelectedZone({ ...selectedZone, [field]: value })
  }

  function deleteZone(zone: Zone) {
    setZones(zones.filter(z => z !== zone))
    if (selectedZone === zone) setSelectedZone(null)
  }

  async function saveZones() {
    if (!selectedRoom) return
    setMessage('Сохраняем...')
    const res = await fetch('/api/quest-room-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: selectedRoom.id, view: currentView, zones })
    })
    if (res.ok) {
      setMessage('✅ Сохранено!')
      fetchZones(selectedRoom.id, currentView)
    } else {
      setMessage('❌ Ошибка')
    }
    setTimeout(() => setMessage(''), 2000)
  }

  const imgSrc = selectedRoom
    ? `/rooms/room-${selectedRoom.room_number}/${currentView}.jpg`
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>🗺️ Редактор комнат</h1>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>

        {/* Левая панель */}
        <div style={{ width: '220px', flexShrink: 0 }}>
          <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Комната</div>
            <select
              style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3d', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '13px' }}
              onChange={e => {
                const room = rooms.find(r => r.id === Number(e.target.value))
                setSelectedRoom(room || null)
              }}
              value={selectedRoom?.id || ''}
            >
              <option value="">Выбери комнату</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  Сессия {r.session_id} · Комната {r.room_number} ({r.room_type})
                </option>
              ))}
            </select>
          </div>

          {selectedRoom && (
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Ракурс</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {VIEWS.map(v => (
                  <button key={v} onClick={() => setCurrentView(v)} style={{
                    flex: 1, padding: '6px', borderRadius: '6px',
                    border: currentView === v ? '1px solid #4f8ef7' : '1px solid #2a2d3d',
                    background: currentView === v ? 'rgba(79,142,247,0.15)' : '#0f1117',
                    color: currentView === v ? '#4f8ef7' : '#6b7280',
                    fontSize: '11px', cursor: 'pointer'
                  }}>{v}</button>
                ))}
              </div>
            </div>
          )}

          {selectedZone && (
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '12px', textTransform: 'uppercase' }}>Настройки зоны</div>

              <label style={{ color: '#9ca3af', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Ширина %</label>
              <input type="range" min="3" max="30" value={selectedZone.width}
                onChange={e => updateSelectedZone('width', Number(e.target.value))}
                style={{ width: '100%', marginBottom: '8px' }} />

              <label style={{ color: '#9ca3af', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Высота %</label>
              <input type="range" min="3" max="30" value={selectedZone.height}
                onChange={e => updateSelectedZone('height', Number(e.target.value))}
                style={{ width: '100%', marginBottom: '12px' }} />

              <label style={{ color: '#9ca3af', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Предмет</label>
              <select value={selectedZone.item_image}
                onChange={e => updateSelectedZone('item_image', e.target.value)}
                style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3d', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', marginBottom: '8px' }}>
                {ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>

              <label style={{ color: '#9ca3af', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Тип</label>
              <select value={selectedZone.zone_type}
                onChange={e => updateSelectedZone('zone_type', e.target.value as 'task' | 'decoy')}
                style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3d', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', marginBottom: '12px' }}>
                <option value="task">Задание</option>
                <option value="decoy">Обманка</option>
              </select>

              <button onClick={() => deleteZone(selectedZone)} style={{
                width: '100%', background: '#7f1d1d', color: '#fca5a5',
                border: 'none', borderRadius: '6px', padding: '8px',
                fontSize: '12px', cursor: 'pointer'
              }}>🗑️ Удалить зону</button>
            </div>
          )}

          {selectedRoom && (
            <button onClick={saveZones} style={{
              width: '100%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff', border: 'none', borderRadius: '8px', padding: '10px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}>💾 Сохранить</button>
          )}
          {message && <p style={{ color: message.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>{message}</p>}
        </div>

        {/* Картинка с зонами */}
        <div style={{ flex: 1 }}>
          {!selectedRoom ? (
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '3rem', textAlign: 'center', color: '#4b5563' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
              <div>Выбери комнату слева</div>
            </div>
          ) : (
            <div>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>
                Кликни на картинку чтобы добавить зону. Перетащи зону чтобы переместить.
              </p>
              <div
                ref={imgRef}
                style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', cursor: 'crosshair', userSelect: 'none' }}
                onClick={handleImageClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {imgSrc && (
                  <img src={imgSrc} alt="комната" style={{ width: '100%', display: 'block' }} />
                )}

                {/* Зоны */}
                {zones.map((zone, i) => (
                  <div
                    key={i}
                    onMouseDown={e => handleZoneMouseDown(e, zone)}
                    style={{
                      position: 'absolute',
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                      border: selectedZone === zone
                        ? '2px solid #4f8ef7'
                        : zone.zone_type === 'decoy'
                          ? '2px dashed #f59e0b'
                          : '2px dashed #10b981',
                      background: selectedZone === zone
                        ? 'rgba(79,142,247,0.2)'
                        : 'rgba(255,255,255,0.05)',
                      cursor: 'move',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#fff',
                    }}
                  >
                    {zone.zone_type === 'decoy' ? '❓' : '📋'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}