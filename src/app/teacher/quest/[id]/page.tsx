'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function QuestDashboardPage() {
  const { id } = useParams()
  const [session, setSession] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [codes, setCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  // Таймер урока
  useEffect(() => {
    let interval: any
    if (timerActive) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive])

  // Реальное время
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`teacher_quest_${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'quest_progress'
      }, () => loadData())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'quest_players'
      }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function loadData() {
    const res = await fetch(`/api/quest/session/${id}`)
    const data = await res.json()
    if (res.ok) {
      setSession(data.session)
      setPlayers(data.players)
      setRooms(data.rooms)
      setCodes(data.codes)
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
    return player.progress?.filter((pr: any) =>
      pr.room_id === roomId && pr.is_correct
    ).length || 0
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6b7280' }}>Загружаем квест...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>

      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '22px', margin: '0 0 4px' }}>
            🎮 {session?.title}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
            {players.length} учеников · {rooms.length} комнат
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Таймер */}
          <div style={{
            background: '#1a1d27', border: '0.5px solid #2a2d3d',
            borderRadius: '8px', padding: '8px 16px',
            color: timerActive ? '#4f8ef7' : '#6b7280',
            fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums'
          }}>
            ⏱ {formatTime(timer)}
          </div>

          {session?.status === 'waiting' && (
            <button onClick={startQuest} style={{
              background: '#10b981', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 20px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}>
              ▶ Начать квест
            </button>
          )}
        </div>
      </div>

      {/* Коды доступа */}
      <div style={{
        background: '#1a1d27', border: '0.5px solid #2a2d3d',
        borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem'
      }}>
        <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 10px' }}>
          🔑 Коды доступа для учеников:
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {codes.map((code, i) => (
            <div key={i} style={{
              background: '#0f1117', border: '0.5px solid #2a2d3d',
              borderRadius: '6px', padding: '6px 12px',
              color: '#4f8ef7', fontSize: '16px', fontWeight: 700,
              letterSpacing: '2px', fontFamily: 'monospace'
            }}>
              {code}
            </div>
          ))}
        </div>
      </div>

      {/* Таблица прогресса */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                color: '#9ca3af', fontSize: '12px', textAlign: 'left',
                padding: '8px 12px', borderBottom: '0.5px solid #2a2d3d'
              }}>
                Комната
              </th>
              {players.map(player => (
                <th key={player.id} style={{
                  color: player.is_excluded ? '#ef4444' : '#fff',
                  fontSize: '13px', textAlign: 'center',
                  padding: '8px 12px', borderBottom: '0.5px solid #2a2d3d',
                  minWidth: '100px'
                }}>
                  <div>{player.player_name || '...'}</div>
                  {!player.is_excluded && (
                    <button onClick={() => excludePlayer(player.id)} style={{
                      background: 'transparent', border: 'none',
                      color: '#ef4444', fontSize: '11px', cursor: 'pointer',
                      padding: '2px 4px'
                    }}>
                      исключить
                    </button>
                  )}
                  {player.is_excluded && (
                    <span style={{ color: '#ef4444', fontSize: '11px' }}>исключён</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td style={{
                  padding: '10px 12px',
                  borderBottom: '0.5px solid #1a1d27',
                  color: '#9ca3af', fontSize: '13px'
                }}>
                  <div style={{ fontWeight: 600, color: '#fff' }}>
                    {room.room_type === 'solo' ? '👤' : room.room_type === 'shared' ? '👥' : '🏆'} Комната {room.room_number}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>
                    {room.key_task?.substring(0, 40)}...
                  </div>
                </td>
                {players.map(player => {
                  const pieces = getPlayerPieces(player.id, room.id)
                  const isCurrentRoom = player.current_room_id === room.id
                  const isDone = pieces >= 1

                  return (
                    <td key={player.id} style={{
                      padding: '10px 12px',
                      borderBottom: '0.5px solid #1a1d27',
                      textAlign: 'center',
                      background: isCurrentRoom ? 'rgba(79, 142, 247, 0.05)' : 'transparent'
                    }}>
                      {player.is_excluded ? (
                        <span style={{ color: '#374151', fontSize: '18px' }}>—</span>
                      ) : isDone ? (
                        <span style={{ fontSize: '20px' }}>✅</span>
                      ) : isCurrentRoom ? (
                        <div>
                          <span style={{ fontSize: '18px' }}>🗝️</span>
                          <div style={{ color: '#4f8ef7', fontSize: '11px' }}>
                            {pieces}/1
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#374151', fontSize: '18px' }}>○</span>
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
  )
}