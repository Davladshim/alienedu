'use client'
import { useEffect, useRef, useState } from 'react'
import { InteractiveModelFrame } from '@/components/lesson-blocks/InteractiveModelFrame'

interface Model {
  id: number
  title: string
  subject: string
  topic: string
  html_code: string
  frame_width: number
  frame_height: number
  offset_x: number
  offset_y: number
  scale: number
  created_at: string
}

const EMPTY_FORM = {
  title: '', subject: '', topic: '', html_code: '',
  frame_width: 500, frame_height: 400, offset_x: 0, offset_y: 0, scale: 1,
}

const cardStyle: React.CSSProperties = {
  background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '20px',
}
// Фиксированный размер превью в карточке банка моделей — раньше место под
// картинку резервировалось по исходному (немасштабированному) размеру модели,
// из-за чего карточки были разной высоты, а превью иногда вылезало за рамку
const THUMB_WIDTH = 220
const THUMB_HEIGHT = 130
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: '8px',
  padding: '9px 12px', color: 'var(--t-text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { color: 'var(--t-text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }

export default function ModelsAdminPage() {
  const [checked, setChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [models, setModels] = useState<Model[]>([])
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const dragRef = useRef<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null)

  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => { if (r.ok) { setIsLoggedIn(true); loadModels() } })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [])

  function loadModels() {
    fetch('/api/admin/models').then(r => r.json()).then(data => setModels(data.models || []))
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
    })
    if (res.ok) { setIsLoggedIn(true); loadModels() } else { setLoginError('Неверный пароль') }
  }

  function startCreate() {
    setForm(EMPTY_FORM)
    setSaveError('')
    setEditingId('new')
  }

  function startEdit(m: Model) {
    setForm({
      title: m.title, subject: m.subject, topic: m.topic, html_code: m.html_code,
      frame_width: m.frame_width, frame_height: m.frame_height,
      offset_x: m.offset_x, offset_y: m.offset_y, scale: Number(m.scale),
    })
    setSaveError('')
    setEditingId(m.id)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.subject.trim() || !form.html_code.trim()) {
      setSaveError('Заполни название, предмет и код модели')
      return
    }
    setSaving(true)
    setSaveError('')
    const isNew = editingId === 'new'
    const url = isNew ? '/api/admin/models' : `/api/admin/models/${editingId}`
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setEditingId(null)
      loadModels()
    } else {
      const data = await res.json().catch(() => ({}))
      setSaveError(data.error || 'Не удалось сохранить модель')
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Удалить модель «${title}»? Она пропадёт из уроков, где уже вставлена.`)) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/models/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) setModels(ms => ms.filter(m => m.id !== id))
    else alert('Не удалось удалить модель')
  }

  function onPreviewMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: form.offset_x, startOffY: form.offset_y }
    function onMove(ev: MouseEvent) {
      const d = dragRef.current
      if (!d) return
      setForm(f => ({ ...f, offset_x: d.startOffX + (ev.clientX - d.startX), offset_y: d.startOffY + (ev.clientY - d.startY) }))
    }
    function onUp() {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!checked) return null

  if (!isLoggedIn) {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: 'var(--t-bg)', display: 'flex', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <div style={{ ...cardStyle, width: '100%', maxWidth: '380px', margin: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏦</div>
            <h1 style={{ color: 'var(--t-text)', fontSize: '20px', fontWeight: 600, margin: 0 }}>Банк интерактивных моделей</h1>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Пароль админа" autoFocus style={{ ...inputStyle, marginBottom: '12px' }}
            />
            {loginError && <div style={{ color: 'var(--t-danger)', fontSize: '13px', marginBottom: '12px' }}>{loginError}</div>}
            <button type="submit" style={{
              width: '100%', background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>Войти</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🏦 Банк интерактивных моделей</h1>
          {editingId === null && (
            <button onClick={startCreate} style={{
              background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>+ Новая модель</button>
          )}
        </div>

        {editingId !== null ? (
          <div style={{ ...cardStyle, display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
              <label style={labelStyle}>Название</label>
              <input style={{ ...inputStyle, marginBottom: '12px' }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Например: Модель молекулы воды" />

              <label style={labelStyle}>Предмет</label>
              <input style={{ ...inputStyle, marginBottom: '12px' }} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Химия" />

              <label style={labelStyle}>Тема</label>
              <input style={{ ...inputStyle, marginBottom: '12px' }} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="Строение вещества" />

              <label style={labelStyle}>HTML-код модели</label>
              <textarea
                style={{ ...inputStyle, marginBottom: '12px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                rows={12} value={form.html_code} onChange={e => setForm(f => ({ ...f, html_code: e.target.value }))}
                placeholder="<html>...</html>"
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Ширина окна</label>
                  <input type="number" style={inputStyle} value={form.frame_width} onChange={e => setForm(f => ({ ...f, frame_width: Number(e.target.value) || 0 }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Высота окна</label>
                  <input type="number" style={inputStyle} value={form.frame_height} onChange={e => setForm(f => ({ ...f, frame_height: Number(e.target.value) || 0 }))} />
                </div>
              </div>

              <label style={{ ...labelStyle, marginTop: '12px' }}>Масштаб модели: {form.scale.toFixed(2)}×</label>
              <input
                type="range" min="0.1" max="3" step="0.05" value={form.scale}
                onChange={e => setForm(f => ({ ...f, scale: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />

              {saveError && <div style={{ color: 'var(--t-danger)', fontSize: '13px', margin: '10px 0' }}>{saveError}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button onClick={handleSave} disabled={saving} style={{
                  background: 'var(--t-accent)', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '9px 18px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                <button onClick={() => setEditingId(null)} style={{
                  background: 'none', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)', borderRadius: '8px',
                  padding: '9px 18px', fontSize: '14px', cursor: 'pointer',
                }}>Отмена</button>
              </div>
            </div>

            <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
              <label style={labelStyle}>Предпросмотр — перетащи модель мышью, чтобы вписать в окно</label>
              <div style={{ position: 'relative', maxWidth: '100%', overflow: 'auto' }}>
                {form.html_code.trim() ? (
                  <>
                    <InteractiveModelFrame
                      htmlCode={form.html_code}
                      frameWidth={form.frame_width || 500}
                      frameHeight={form.frame_height || 400}
                      offsetX={form.offset_x}
                      offsetY={form.offset_y}
                      scale={form.scale}
                    />
                    {/* Прозрачная накладка поверх iframe — иначе mousedown внутри
                        iframe (отдельный browsing context) не долетает до onMouseDown
                        родителя, и перетаскивание для позиционирования не работает */}
                    <div
                      onMouseDown={onPreviewMouseDown}
                      title="Перетащи, чтобы обрезать пустой фон"
                      style={{ position: 'absolute', inset: 0, cursor: 'move' }}
                    />
                  </>
                ) : (
                  <div style={{
                    width: `${form.frame_width || 500}px`, height: `${form.frame_height || 400}px`, maxWidth: '100%',
                    background: 'var(--t-bg)', border: '1px dashed var(--t-border)', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-text-faint)', fontSize: '13px',
                  }}>
                    Вставь код, чтобы увидеть модель
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {models.length === 0 && (
              <div style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>Пока нет ни одной модели — добавь первую.</div>
            )}
            {models.map(m => {
              const thumbScale = Math.min(THUMB_WIDTH / m.frame_width, THUMB_HEIGHT / m.frame_height, 1)
              return (
              <div key={m.id} style={cardStyle}>
                <div style={{
                  pointerEvents: 'none', marginBottom: '10px', width: `${THUMB_WIDTH}px`, height: `${THUMB_HEIGHT}px`,
                  maxWidth: '100%', overflow: 'hidden', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ transform: `scale(${thumbScale})`, transformOrigin: 'center center', width: `${m.frame_width}px`, height: `${m.frame_height}px`, flexShrink: 0 }}>
                    <InteractiveModelFrame
                      htmlCode={m.html_code} frameWidth={m.frame_width} frameHeight={m.frame_height}
                      offsetX={m.offset_x} offsetY={m.offset_y} scale={Number(m.scale)}
                    />
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{m.title}</div>
                <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px' }}>
                  {m.subject}{m.topic && ` · ${m.topic}`}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEdit(m)} style={{
                    flex: 1, background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)',
                    borderRadius: '8px', padding: '7px', fontSize: '13px', cursor: 'pointer',
                  }}>✏️ Редактировать</button>
                  <button
                    onClick={() => handleDelete(m.id, m.title)}
                    disabled={deletingId === m.id}
                    style={{
                      background: 'rgba(var(--t-danger-rgb),0.1)', border: '1px solid var(--t-danger)', color: 'var(--t-danger)',
                      borderRadius: '8px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer',
                    }}
                  >🗑</button>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
