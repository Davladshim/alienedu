'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function QuestDashboardPage() {
  const { id } = useParams()
  const [session, setSession] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [codes, setCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const dataRef = useRef<any>(null)

  useEffect(() => { loadData() }, [id])

  useEffect(() => {
    let interval: any
    if (timerActive) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive])

  useEffect(() => {
    if (!id) return
    const interval = setInterval(() => loadData(), 3000)
    return () => clearInterval(interval)
  }, [id])

  async function loadData() {
    const res = await fetch(`/api/quest/session/${id}`)
    const data = await res.json()
    if (res.ok) {
      if (JSON.stringify(dataRef.current) !== JSON.stringify(data)) {
        dataRef.current = data
        setSession(data.session)
        setPlayers(data.players)
        setRooms(data.rooms)
        setCodes(data.codes)
      }
    }
    setLoading(false)
  }

  async function excludePlayer(playerId: number) {
    if (!confirm('Исключить этого ученика? Его прогресс будет засчитан автоматически.')) return
    await fetch('/api/quest/exclude-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, session_id: id })
    })
    loadData()
  }

  async function startQuest() {
    await fetch(`/api/quest/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: id })
    })
    setTimerActive(true)
    loadData()
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  function getPlayerPieces(playerId: number, roomId: number) {
    const player = players.find(p => p.id === playerId)
    if (!player) return 0
    return player.progress?.filter((pr: any) => pr.room_id === roomId && pr.is_correct).length || 0
  }

  // Группировка игроков по парам/тройкам для совместных комнат
  function getSharedGroups(): number[][] {
    const activePlayers = players.filter(p => !p.is_excluded)
    const n = activePlayers.length
    const groups: number[][] = []
    let i = 0
    while (i < n) {
      const remaining = n - i
      // Если осталось 3 или если осталось нечётное число — берём тройку
      if (remaining === 3 || (remaining % 2 === 1 && remaining > 3)) {
        groups.push(activePlayers.slice(i, i + 3).map(p => p.id))
        i += 3
      } else {
        groups.push(activePlayers.slice(i, i + 2).map(p => p.id))
        i += 2
      }
    }
    return groups
  }

  function getPlayerGroup(playerId: number): number[] {
    const groups = getSharedGroups()
    return groups.find(g => g.includes(playerId)) || [playerId]
  }

  if (loading) return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--t-text-muted)' }}>Загружаем квест...</p>
    </div>
  )

  const activePlayers = players.filter(p => !p.is_excluded)
  const excludedPlayers = players.filter(p => p.is_excluded)

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: '1200px', padding: '1.5rem' }}>

      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--t-text)', fontSize: '22px', margin: '0 0 4px' }}>
            🎮 {session?.title}
          </h1>
          <p style={{ color: 'var(--t-text-muted)', fontSize: '13px', margin: 0 }}>
            {players.length} учеников · {rooms.length} комнат
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            background: 'var(--t-card)', border: '0.5px solid var(--t-border)',
            borderRadius: '8px', padding: '8px 16px',
            color: timerActive ? 'var(--t-accent)' : 'var(--t-text-muted)',
            fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums'
          }}>
            ⏱ {formatTime(timer)}
          </div>
          {session?.status === 'waiting' && (
            <button onClick={startQuest} style={{
              background: 'var(--t-success2)', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 20px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}>
              ▶ Начать квест
            </button>
          )}
        </div>
      </div>

      {/* Таблица */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr>
              {/* Колонка комнат */}
              <th style={{
                color: 'var(--t-text-secondary)', fontSize: '12px', textAlign: 'left',
                padding: '8px 12px', borderBottom: '0.5px solid var(--t-border)',
                minWidth: '160px'
              }}>Комната</th>

              {/* Колонки игроков */}
              {players.map((player, idx) => (
                <th key={player.id} style={{
                  color: player.is_excluded ? 'var(--t-text-faint)' : 'var(--t-text)',
                  fontSize: '13px', textAlign: 'center',
                  padding: '4px 8px', borderBottom: '0.5px solid var(--t-border)',
                  minWidth: '90px'
                }}>
                  {/* Код над именем */}
                  <div style={{
                    fontFamily: 'monospace', fontSize: '11px',
                    color: 'var(--t-accent)', letterSpacing: '1px', marginBottom: '2px'
                  }}>
                    {codes[idx] || ''}
                  </div>
                  <div style={{ color: player.is_excluded ? 'var(--t-text-faint)' : 'var(--t-text)' }}>
                    {player.player_name || '...'}
                  </div>
                  {!player.is_excluded ? (
                    <button onClick={() => excludePlayer(player.id)} style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--t-danger)', fontSize: '10px', cursor: 'pointer', padding: '2px'
                    }}>исключить</button>
                  ) : (
                    <span style={{ color: 'var(--t-danger)', fontSize: '10px' }}>исключён</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td style={{
                  padding: '10px 12px', borderBottom: '0.5px solid var(--t-card)',
                  color: 'var(--t-text-secondary)', fontSize: '12px'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--t-text)', fontSize: '13px' }}>
                    {room.room_type === 'solo' ? '👤' : room.room_type === 'shared' ? '👥' : '🏆'} Комната {room.room_number}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--t-text-muted)' }}>
                    {room.key_task?.substring(0, 35)}...
                  </div>
                </td>

                {players.map(player => {
                  const pieces = getPlayerPieces(player.id, room.id)
                  const isCurrentRoom = player.current_room_id === room.id
                  const isDone = pieces >= 1
                  const group = room.room_type === 'shared' || room.room_type === 'final'
                    ? getPlayerGroup(player.id)
                    : null
                  const isGroupStart = group ? group[0] === player.id : false
                  const isGroupEnd = group ? group[group.length - 1] === player.id : false

                  return (
                    <td key={player.id} style={{
                      padding: '10px 8px',
                      borderBottom: '0.5px solid var(--t-card)',
                      textAlign: 'center',
                      background: isCurrentRoom ? 'rgba(var(--t-accent-rgb), 0.05)' : 'transparent',
                      // Обводка группы
                      borderLeft: (group && isGroupStart) ? '2px solid rgba(var(--t-accent-rgb),0.125)' : undefined,
                      borderRight: (group && isGroupEnd) ? '2px solid rgba(var(--t-accent-rgb),0.125)' : undefined,
                      borderTop: group ? '1px solid rgba(var(--t-accent-rgb),0.08)' : undefined,
                    }}>
                      {player.is_excluded ? (
                        <span style={{ color: 'var(--t-text-faint)', fontSize: '16px' }}>—</span>
                      ) : isDone ? (
                        <span style={{ fontSize: '18px' }}>✅</span>
                      ) : isCurrentRoom ? (
                        <div>
                          <span style={{ fontSize: '16px' }}>🗝️</span>
                          <div style={{ color: 'var(--t-accent)', fontSize: '11px' }}>{pieces}/1</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--t-text-faint)', fontSize: '16px' }}>○</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  )
}