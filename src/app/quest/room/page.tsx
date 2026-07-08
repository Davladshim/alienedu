'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
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
  const [bonusVisible, setBonusVisible] = useState(false)
  const [bonusAnswer, setBonusAnswer] = useState('')
  const [bonusIndex, setBonusIndex] = useState(0)
  const [waitingFor, setWaitingFor] = useState<string[]>([])
  const [keyPieces, setKeyPieces] = useState(0)
  const [totalPieces, setTotalPieces] = useState(0)

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

  async function loadRoom(pid: string) {
    // setLoading только при первой загрузке
    if (!room) setLoading(true)
    const res = await fetch(`/api/quest/room?player_id=${pid}`)
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    setRoom(data.room)
    setProgress(data.progress || [])
    setKeyPieces(data.pieces_collected)
    setTotalPieces(data.total_pieces)
    setWaitingFor(data.waiting_for || [])
    setLoading(false)
  }

  // Polling вместо realtime подписки
  useEffect(() => {
    if (!playerId) return
    const interval = setInterval(() => {
      loadRoom(playerId)
    }, 3000)
    return () => clearInterval(interval)
  }, [playerId])

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const res = await fetch('/api/quest/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        room_id: room.id,
        answer: answer.trim()
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      return
    }

    if (data.correct) {
      setSuccess('✅ Правильно! Кусочек ключа найден!')
      setKeyPieces(prev => prev + 1)
      setAnswer('')
    } else {
      setError(`❌ Неверно. Подсказка: ${data.hint || 'Попробуй ещё раз'}`)
    }
  }

  async function handleOpenDoor() {
    if (keyPieces < totalPieces) {
      setError('Упс! Не хватает кусочков ключа. Поищи ещё 🔍')
      return
    }

    if (waitingFor.length > 0) {
      setError(`Ждём: ${waitingFor.join(', ')} ещё не собрали свои части ключа`)
      return
    }

    const res = await fetch('/api/quest/open-door', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, room_id: room.id })
    })

    const data = await res.json()
    if (res.ok) {
      loadRoom(playerId!)
    } else {
      setError(data.error)
    }
  }

  async function handleBonusAnswer(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch('/api/quest/bonus-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        room_id: room.id,
        bonus_index: bonusIndex,
        answer: bonusAnswer.trim()
      })
    })

    const data = await res.json()
    if (data.correct) {
      setSuccess('🎉 Ключ стал красивее!')
      setBonusAnswer('')
      setBonusVisible(false)
    } else {
      setError(`Подсказка: ${data.hint || 'Попробуй ещё раз'}`)
    }
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <p style={{ color: '#6b7280' }}>Загружаем комнату...</p>
    </div>
  )

  if (!room) return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '1rem'
    }}>
      <div style={{ fontSize: '48px' }}>🏆</div>
      <h1 style={{ color: '#fff', fontSize: '24px' }}>Квест пройден!</h1>
      <p style={{ color: '#6b7280' }}>Отличная работа!</p>
    </div>
  )

  const allPiecesCollected = keyPieces >= totalPieces
  const canOpenDoor = allPiecesCollected && waitingFor.length === 0

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      fontFamily: 'system-ui, sans-serif',
      padding: '1.5rem'
    }}>
      {/* Шапка */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
          🚪 Комната {room.room_number}
        </h2>
        <div style={{
          background: '#1a1d27',
          border: '0.5px solid #2a2d3d',
          borderRadius: '8px',
          padding: '6px 14px',
          color: '#4f8ef7',
          fontSize: '14px',
          fontWeight: 600
        }}>
          {room.room_type === 'shared' ? '👥 Совместная' :
           room.room_type === 'final' ? '🏆 Финал' : '👤 Одиночная'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1.5rem' }}>

        {/* Основная область комнаты */}
        <div>
          {/* Подсказка */}
          {room.hint && (
            <div style={{
              background: '#1a1d27',
              border: '0.5px solid #2a2d3d',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 4px' }}>
                💡 Подсказка:
              </p>
              <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
                {room.hint}
              </p>
            </div>
          )}

          {/* Задание */}
          <div style={{
            background: '#1a1d27',
            border: '0.5px solid #2a2d3d',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px' }}>
              🔑 Задание:
            </p>
            <p style={{ color: '#fff', fontSize: '16px', margin: '0 0 1rem', lineHeight: 1.5 }}>
              {room.key_task}
            </p>

            <form onSubmit={handleAnswer} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Твой ответ..."
                style={{
                  flex: 1,
                  background: '#0f1117',
                  border: '0.5px solid #2a2d3d',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button type="submit" style={{
                background: '#4f8ef7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                Проверить
              </button>
            </form>
          </div>

          {/* Сообщения */}
          {error && (
            <div style={{
              background: '#2d1515', border: '0.5px solid #ef4444',
              borderRadius: '8px', padding: '10px 14px',
              color: '#ef4444', fontSize: '13px', marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: '#0d2d1a', border: '0.5px solid #10b981',
              borderRadius: '8px', padding: '10px 14px',
              color: '#10b981', fontSize: '13px', marginBottom: '1rem'
            }}>
              {success}
            </div>
          )}

          {/* Статус ожидания в совместной комнате */}
          {room.room_type !== 'solo' && waitingFor.length > 0 && allPiecesCollected && (
            <div style={{
              background: '#1a1d27',
              border: '0.5px solid #f59e0b',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              <p style={{ color: '#f59e0b', fontSize: '14px', margin: '0 0 8px', fontWeight: 600 }}>
                ⏳ Ждём: {waitingFor.join(', ')}
              </p>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                Пока ждёшь — укрась свой ключ!
              </p>
              {room.bonus_tasks && room.bonus_tasks.length > 0 && (
                <button
                  onClick={() => setBonusVisible(true)}
                  style={{
                    marginTop: '10px',
                    background: 'transparent',
                    border: '0.5px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#f59e0b',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✨ Украсить ключ
                </button>
              )}
            </div>
          )}

          {/* Кнопка открыть дверь */}
          {allPiecesCollected && waitingFor.length === 0 && (
            <button
              onClick={handleOpenDoor}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🚪 Открыть дверь
            </button>
          )}
        </div>

        {/* Ключ справа */}
        <div style={{
          background: '#1a1d27',
          border: '0.5px solid #2a2d3d',
          borderRadius: '12px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
            Твой ключ
          </p>
          <div style={{ fontSize: '48px' }}>🗝️</div>
          <div style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {Array.from({ length: totalPieces }).map((_, i) => (
              <div key={i} style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: i < keyPieces ? '#4f8ef7' : '#2a2d3d',
                border: '0.5px solid',
                borderColor: i < keyPieces ? '#4f8ef7' : '#374151',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
            {keyPieces}/{totalPieces} кусочков
          </p>
        </div>
      </div>

      {/* Бонусное задание — всплывающее окно */}
      {bonusVisible && room.bonus_tasks && room.bonus_tasks[bonusIndex] && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1d27',
            border: '0.5px solid #f59e0b',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <p style={{ color: '#f59e0b', fontSize: '13px', margin: '0 0 8px' }}>
              ✨ Возможность украсить ключ!
            </p>
            <p style={{ color: '#fff', fontSize: '16px', margin: '0 0 1rem', lineHeight: 1.5 }}>
              {room.bonus_tasks[bonusIndex].task}
            </p>
            <form onSubmit={handleBonusAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                value={bonusAnswer}
                onChange={e => setBonusAnswer(e.target.value)}
                placeholder="Твой ответ..."
                style={{
                  background: '#0f1117',
                  border: '0.5px solid #2a2d3d',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{
                  flex: 1, background: '#f59e0b', color: '#000',
                  border: 'none', borderRadius: '8px', padding: '10px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}>
                  Проверить
                </button>
                <button type="button" onClick={() => setBonusVisible(false)} style={{
                  background: 'transparent',
                  border: '0.5px solid #374151',
                  borderRadius: '8px', padding: '10px 16px',
                  color: '#6b7280', fontSize: '14px', cursor: 'pointer'
                }}>
                  Выйти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}