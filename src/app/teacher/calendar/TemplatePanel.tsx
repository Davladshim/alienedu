'use client'
import { useState, useEffect } from 'react'
import { inputStyle, labelStyle, submitButtonStyle, submitButtonDisabledStyle, smallButtonStyle, removeButtonStyle } from '@/components/lesson-blocks/styles'

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface TemplateForm {
  student_id: string
  day_of_week: number
  time: string
  duration_minutes: number
  subject: string
  price: string
  start_date: string
}

const emptyForm: TemplateForm = {
  student_id: '', day_of_week: 0, time: '15:00', duration_minutes: 60, subject: '', price: '', start_date: todayISO(),
}

export function TemplatePanel({ roster, onGenerated }: { roster: any[]; onGenerated: () => void }) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [form, setForm] = useState<TemplateForm>(emptyForm)
  const [adding, setAdding] = useState(false)
  const [weeks, setWeeks] = useState(4)
  const [generating, setGenerating] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const [error, setError] = useState('')

  function loadTemplates() {
    fetch('/api/templates').then(r => r.json()).then(data => setTemplates(data.templates || []))
  }

  useEffect(() => {
    if (open) loadTemplates()
  }, [open])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.student_id) {
      setError('Выбери ученика')
      return
    }
    setAdding(true)
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, student_id: Number(form.student_id), price: form.price === '' ? undefined : Number(form.price) }),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) {
      setForm({ ...emptyForm, start_date: todayISO() })
      loadTemplates()
    } else {
      setError(data.error || 'Ошибка')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить шаблон?')) return
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    if (res.ok) setTemplates(t => t.filter(tpl => tpl.id !== id))
  }

  async function handleGenerate() {
    setGenerating(true)
    setResultMsg('')
    const res = await fetch('/api/templates/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weeks }),
    })
    const data = await res.json()
    setGenerating(false)
    if (res.ok) {
      setResultMsg(`Создано занятий: ${data.created}${data.skipped ? `, пропущено (уже были): ${data.skipped}` : ''}`)
      onGenerated()
    } else {
      setResultMsg(data.error || 'Ошибка')
    }
  }

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>🔁 Шаблон недели (повторяющиеся занятия)</div>
        <span style={{ color: '#6b7280', fontSize: '13px' }}>{open ? 'Свернуть ▲' : 'Развернуть ▼'}</span>
      </div>

      {open && (
        <div style={{ marginTop: '14px' }}>
          {templates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {templates.map(tpl => (
                <div key={tpl.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0f1117', border: '1px solid #2a2d3d', borderRadius: '8px', fontSize: '13px' }}>
                  <span>{WEEKDAYS_SHORT[tpl.day_of_week]}, {tpl.time} · {tpl.student_name} {tpl.subject ? `· ${tpl.subject}` : ''} {tpl.price ? `· ${tpl.price} ₽` : ''}</span>
                  <button onClick={() => handleDelete(tpl.id)} style={removeButtonStyle}>✕</button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={labelStyle}>Ученик</label>
              <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} style={inputStyle}>
                <option value="" disabled>Выбери ученика</option>
                {roster.map(s => <option key={s.student_id} value={s.student_id}>{s.full_name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>День недели</label>
              <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: Number(e.target.value) })} style={inputStyle}>
                {WEEKDAYS_SHORT.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Время</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Длительность</label>
              <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} style={{ ...inputStyle, width: '90px' }} />
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <label style={labelStyle}>Предмет</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Цена, ₽</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={{ ...inputStyle, width: '100px' }} placeholder="по умолчанию" />
            </div>
            <div>
              <label style={labelStyle}>С какой даты</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button type="submit" disabled={adding} style={adding ? submitButtonDisabledStyle : smallButtonStyle}>+ Добавить в шаблон</button>
            </div>
          </form>

          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid #2a2d3d', paddingTop: '14px' }}>
            <label style={labelStyle}>Добавить в расписание на</label>
            <input type="number" value={weeks} onChange={e => setWeeks(Number(e.target.value))} style={{ ...inputStyle, width: '70px' }} min={1} max={12} />
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>недель вперёд</span>
            <button onClick={handleGenerate} disabled={generating || templates.length === 0} style={generating || templates.length === 0 ? submitButtonDisabledStyle : submitButtonStyle}>
              {generating ? 'Добавляем...' : '⚡ Добавить в расписание'}
            </button>
          </div>
          {resultMsg && <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>{resultMsg}</p>}
        </div>
      )}
    </div>
  )
}
