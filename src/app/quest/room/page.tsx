'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function QuestRoomPage() {
  const router = useRouter()
  const [room, setRoom] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [waitingFor, setWaitingFor] = useState<string[]>([])
  const [keyPieces, setKeyPieces] = useState(0)
  const [totalPieces, setTotalPieces] = useState(0)
  const [showTask, setShowTask] = useState(false)
  const [view, setView] = useState<'center' | 'left' | 'right'>('center')
  const [bonusVisible, setBonusVisible] = useState(false)
  const [bonusAnswer, setBonusAnswer] = useState('')
  const [bonusIndex, setBonusIndex] = useState(0)
  const roomRef = useRef<any>(null)
  const keyPiecesRef = useRef(0)
  const waitingForRef = useRef<string[]>([])

  useEffect(() => {
    const pid = sessionStorage.getItem('quest_player_id')
    const sid = sessionStorage.getItem('quest_session_id')
    if (!pid || !sid) {
      router.push('/quest/join')
      return
    }
    setPlayerId(pid)
    setSessionId(sid)
    loadRoom(pid)
  }, [])

  useEffect(() => {
    if (!playerId) return
    const interval = setInterval(() => {
      loadRoom(playerId)
    }, 3000)
    return () => clearInterval(interval)
  }, [playerId])

  async function loadRoom(pid: string) {
    if (!roomRef.current) setLoading(true)
    const res = await fetch(`/api/quest/room?player_id=${pid}`)
    const data = await res.json()
    if (!res.ok) {
      setLoading(false)
      return
    }
    if (JSON.stringify(roomRef.current) !== JSON.stringify(data.room)) {
      roomRef.current = data.room
      setRoom(data.room)
    }
    if (keyPiecesRef.current !== data.pieces_collected) {
      keyPiecesRef.current = data.pieces_collected
      setKeyPieces(data.pieces_collected)
    }
    if (JSON.stringify(waitingForRef.current) !== JSON.stringify(data.waiting_for || [])) {
      waitingForRef.current = data.waiting_for || []
      setWaitingFor(data.waiting_for || [])
    }
    setProgress(data.progress || [])
    setTotalPieces(data.total_pieces)
    setLoading(false)
  }

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const res = await fetch('/api/quest/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, room_id: room.id, answer: answer.trim() })
    })
    const data = await res.json()
    if (data.correct) {
      setSuccess('Верно! Кусочек ключа получен 🗝️')
      setAnswer('')
      setShowTask(false)
      if (playerId) loadRoom(playerId)
    } else {
      setError('Неверно, попробуй ещё раз')
    }
  }

  async function handleOpenDoor() {
    const res = await fetch('/api/quest/open-door', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, room_id: room.id })
    })
    if (res.ok && playerId) loadRoom(playerId)
  }

  async function handleBonusAnswer(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/quest/bonus-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, room_id: room.id, bonus_index: bonusIndex, answer: bonusAnswer.trim() })
    })
    const data = await res.json()
    if (data.correct) {
      setBonusVisible(false)
      setBonusAnswer('')
      if (playerId) loadRoom(playerId)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100%', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--t-text-muted)', fontSize: '16px' }}>Загружаем комнату...</div>
      </div>
    )
  }

  if (!room) return null

  const isCompleted = progress.some(p => p.is_correct)
  const canOpenDoor = keyPieces >= totalPieces && totalPieces > 0
  const roomNumber = room.room_number || 1
  const imgSrc = `/rooms/room-${roomNumber}/${view}.jpg`

  return (
      <div style={{
        minHeight: '100%',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
        gap: '20px'
      }}>
        
      {/* Основная картинка комнаты */}
      <div style={{ flex: 1, maxWidth: '900px', position: 'relative' }}>

        {/* Картинка */}
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          background: 'var(--t-card)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--t-border)'
        }}>
          <img
            src={imgSrc}
            alt="комната"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            
          />

          {/* Кнопка задания поверх картинки */}
          <button
            onClick={() => setShowTask(true)}
            style={{
              position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(var(--t-accent-rgb),0.9)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '10px 20px',
              fontSize: '14px', cursor: 'pointer', fontWeight: 600
            }}
          >📋 Открыть задание</button>

          {/* Кнопки поворота */}
          <button onClick={() => {
            if (view === 'right') setView('center')
            else if (view === 'center') setView('left')
          }} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: '44px', height: '44px',
            color: '#fff', fontSize: '18px', cursor: 'pointer',
            opacity: view === 'left' ? 0.3 : 1
          }}>◀</button>

          <button onClick={() => {
            if (view === 'left') setView('center')
            else if (view === 'center') setView('right')
          }} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: '44px', height: '44px',
            color: '#fff', fontSize: '18px', cursor: 'pointer',
            opacity: view === 'right' ? 0.3 : 1
          }}>▶</button>
        </div>

        {/* Пояснение */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          {room.room_type === 'solo' && (
            <p style={{ color: 'var(--t-text-secondary)', fontSize: '13px', margin: '8px auto 0', maxWidth: '500px' }}>
              👤 Ты в комнате один! Реши все задания, найди все кусочки ключа и открывай дверь!
            </p>
          )}
          {room.room_type === 'shared' && (
            <p style={{ color: 'var(--t-text-secondary)', fontSize: '13px', margin: '8px auto 0', maxWidth: '500px' }}>
              👥 Ты в этой комнате с {waitingFor.length > 0 ? waitingFor.join(' и ') : 'другими учениками'}. Найди все свои кусочки ключа и дождись остальных — вместе вы сможете открыть дверь!
            </p>
          )}
          {room.room_type === 'final' && (
            <p style={{ color: 'var(--t-warning2)', fontSize: '13px', margin: '8px auto 0', maxWidth: '500px' }}>
              ⚡️ Это босс-комната! Только совместными усилиями из неё можно выйти. Собери свои кусочки ключа, дождись всех остальных и победи босса!
            </p>
          )}
        </div>

        {/* Ждём других */}
        {waitingFor.length > 0 && (
          <div style={{
            marginTop: '12px', background: 'var(--t-card)',
            border: '0.5px solid var(--t-warning2)', borderRadius: '10px', padding: '12px 16px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--t-warning2)', fontSize: '13px', margin: '0 0 4px' }}>
              ⏳ Ждём: {waitingFor.join(', ')}
            </p>
            {room.bonus_tasks && room.bonus_tasks.length > 0 && (
              <button onClick={() => setBonusVisible(true)} style={{
                marginTop: '8px', background: 'transparent',
                border: '0.5px solid var(--t-warning2)', borderRadius: '8px',
                padding: '6px 14px', color: 'var(--t-warning2)', fontSize: '13px', cursor: 'pointer'
              }}>✨ Украсить ключ</button>
            )}
          </div>
        )}
      </div>

      {/* Окно ключа справа */}
      <div style={{
        width: '120px', flexShrink: 0,
        background: 'var(--t-card)', border: '1px solid var(--t-border)',
        borderRadius: '16px', padding: '16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
      }}>
        <div style={{ color: 'var(--t-text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Твой ключ
        </div>
        <div style={{ fontSize: '36px' }}>🗝️</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          {Array.from({ length: totalPieces }).map((_, i) => (
            <div key={i} style={{
              height: '8px', borderRadius: '4px',
              background: i < keyPieces ? 'var(--t-accent)' : 'var(--t-border)',
              transition: 'background 0.3s ease'
            }} />
          ))}
        </div>
        <div style={{ color: 'var(--t-text-muted)', fontSize: '11px' }}>{keyPieces}/{totalPieces}</div>
        {canOpenDoor && (
          <button onClick={handleOpenDoor} style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--t-success2), var(--t-success))',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '8px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', marginTop: '4px'
          }}>🚪 Открыть!</button>
        )}
      </div>

      {/* Всплывающее окно задания */}
      {showTask && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--t-card)', border: '1px solid var(--t-border)',
            borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ color: 'var(--t-accent)', fontSize: '13px', margin: 0, fontWeight: 600 }}>🔑 Задание</p>
              <button onClick={() => setShowTask(false)} style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <p style={{ color: 'var(--t-text)', fontSize: '16px', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {room.key_task}
            </p>
            {!isCompleted ? (
              <form onSubmit={handleAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Твой ответ..."
                  style={{
                    background: 'var(--t-bg)', border: '0.5px solid var(--t-border)',
                    borderRadius: '8px', padding: '12px 14px',
                    color: 'var(--t-text)', fontSize: '14px', outline: 'none'
                  }}
                />
                {error && <p style={{ color: 'var(--t-danger)', fontSize: '13px', margin: 0 }}>{error}</p>}
                {success && <p style={{ color: 'var(--t-success2)', fontSize: '13px', margin: 0 }}>{success}</p>}
                <button type="submit" style={{
                  background: 'var(--t-accent)', color: '#fff', border: 'none',
                  borderRadius: '8px', padding: '12px', fontSize: '15px',
                  fontWeight: 600, cursor: 'pointer'
                }}>Проверить</button>
              </form>
            ) : (
              <p style={{ color: 'var(--t-success2)', fontSize: '14px', textAlign: 'center' }}>✅ Задание выполнено!</p>
            )}
          </div>
        </div>
      )}

      {/* Бонусное задание */}
      {bonusVisible && room.bonus_tasks && room.bonus_tasks[bonusIndex] && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--t-card)', border: '0.5px solid var(--t-warning2)',
            borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%'
          }}>
            <p style={{ color: 'var(--t-warning2)', fontSize: '13px', margin: '0 0 8px' }}>✨ Украсить ключ!</p>
            <p style={{ color: 'var(--t-text)', fontSize: '16px', margin: '0 0 1rem', lineHeight: 1.5 }}>
              {room.bonus_tasks[bonusIndex].task}
            </p>
            <form onSubmit={handleBonusAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                value={bonusAnswer}
                onChange={e => setBonusAnswer(e.target.value)}
                placeholder="Твой ответ..."
                style={{
                  background: 'var(--t-bg)', border: '0.5px solid var(--t-border)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: 'var(--t-text)', fontSize: '14px', outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{
                  flex: 1, background: 'var(--t-warning2)', color: '#000',
                  border: 'none', borderRadius: '8px', padding: '10px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}>Проверить</button>
                <button type="button" onClick={() => setBonusVisible(false)} style={{
                  background: 'transparent', border: '0.5px solid var(--t-text-faint)',
                  borderRadius: '8px', padding: '10px 16px',
                  color: 'var(--t-text-muted)', fontSize: '14px', cursor: 'pointer'
                }}>Выйти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}