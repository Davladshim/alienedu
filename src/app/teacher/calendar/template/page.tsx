'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { inputStyle, labelStyle, submitButtonDisabledStyle } from '@/components/lesson-blocks/styles'

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Отдельная цветовая схема (фиолетовая), чтобы план недели визуально
// не путался с настоящим расписанием (там синяя)
const ACCENT = '#a78bfa'
const accentButtonStyle = {
  background: `rgba(167,139,250,0.15)`, border: `1px solid ${ACCENT}`,
  color: ACCENT, borderRadius: '8px', padding: '6px 14px',
  fontSize: '13px', cursor: 'pointer',
}
const accentSubmitStyle = {
  background: `linear-gradient(135deg, ${ACCENT}, #c026d3)`,
  color: '#fff', border: 'none', borderRadius: '8px',
  padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
}

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

const emptyForm = (dayOfWeek: number): TemplateForm => ({
  student_id: '', day_of_week: dayOfWeek, time: '15:00', duration_minutes: 60, subject: '', price: '', start_date: todayISO(),
})

export default function TemplatePage() {
  const [roster, setRoster] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [addingForDay, setAddingForDay] = useState<number | null>(null)
  const [addForm, setAddForm] = useState<TemplateForm>(emptyForm(0))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [weeks, setWeeks] = useState(4)
  const [generating, setGenerating] = useState(false)
  const [resultMsg, setResultMsg] = useState('')

  function loadTemplates() {
    fetch('/api/templates').then(r => r.json()).then(data => {
      setTemplates(data.templates || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadTemplates()
    fetch('/api/students').then(r => r.json()).then(data => setRoster(data.students || []))
  }, [])

  function openAddForm(dayOfWeek: number) {
    setAddingForDay(dayOfWeek)
    setAddForm(emptyForm(dayOfWeek))
    setError('')
  }

  async function submitAdd() {
    setError('')
    if (!addForm.student_id) {
      setError('Выбери ученика')
      return
    }
    setSaving(true)
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, student_id: Number(addForm.student_id), price: addForm.price === '' ? undefined : Number(addForm.price) }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setAddingForDay(null)
      loadTemplates()
    } else {
      setError(data.error || 'Ошибка')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить из шаблона?')) return
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
    } else {
      setResultMsg(data.error || 'Ошибка')
    }
  }

  const todayDow = (new Date().getDay() + 6) % 7 // 0=понедельник

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1100px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🔁 Шаблон недели</h1>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          <Link href="/teacher/calendar" style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
            background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
          }}>
            📅 Расписание
          </Link>
          <span style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
            background: `rgba(167,139,250,0.15)`, border: `1px solid ${ACCENT}`, color: ACCENT, fontWeight: 600,
          }}>
            🔁 Шаблон
          </span>
        </div>

        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '1.5rem' }}>
          Это план — повторяющиеся занятия по дням недели, без привязки к конкретным датам. Чтобы план стал реальным расписанием, нажми «Добавить в расписание» внизу.
        </p>

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', gap: '10px', minWidth: '980px' }}>
            {WEEKDAYS.map((weekday, dow) => {
              const dayTemplates = templates.filter(t => t.day_of_week === dow)
              const isToday = dow === todayDow

              return (
                <div key={dow} style={{
                  background: '#1a1d27', border: `1px solid ${isToday ? ACCENT : '#2a2d3d'}`,
                  borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: isToday ? ACCENT : '#fff' }}>
                      {WEEKDAYS_SHORT[dow]}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
                      {dayTemplates.length > 0 ? `${dayTemplates.length} ${dayTemplates.length === 1 ? 'занятие' : 'занятия'}` : 'пусто'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayTemplates.map(tpl => (
                      <div key={tpl.id} style={{
                        padding: '6px 8px', background: '#0f1117', border: '1px solid #2a2d3d',
                        borderLeftWidth: '3px', borderLeftColor: ACCENT, borderRadius: '6px',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>{tpl.time} · {tpl.student_name}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {tpl.subject && <span>{tpl.subject}</span>}
                          {tpl.price && <span>{tpl.price}₽</span>}
                          <button
                            onClick={() => handleDelete(tpl.id)}
                            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px', padding: 0, marginLeft: 'auto' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => openAddForm(dow)} style={{ ...accentButtonStyle, fontSize: '11px', padding: '5px 8px' }}>+ Добавить</button>
                </div>
              )
            })}
          </div>
        </div>

        {addingForDay !== null && (
          <div style={{ background: '#1a1d27', border: `1px solid ${ACCENT}`, borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px' }}>
              Новый слот — {WEEKDAYS[addingForDay]}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={labelStyle}>Ученик</label>
                <select value={addForm.student_id} onChange={e => setAddForm({ ...addForm, student_id: e.target.value })} style={inputStyle}>
                  <option value="" disabled>Выбери ученика</option>
                  {roster.map(s => <option key={s.student_id} value={s.student_id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Время</label>
                <input type="time" value={addForm.time} onChange={e => setAddForm({ ...addForm, time: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Длительность (мин)</label>
                <input type="number" value={addForm.duration_minutes} onChange={e => setAddForm({ ...addForm, duration_minutes: Number(e.target.value) })} style={{ ...inputStyle, width: '90px' }} />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={labelStyle}>Предмет</label>
                <input value={addForm.subject} onChange={e => setAddForm({ ...addForm, subject: e.target.value })} style={inputStyle} placeholder="Математика" />
              </div>
              <div>
                <label style={labelStyle}>Цена, ₽</label>
                <input type="number" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} style={{ ...inputStyle, width: '100px' }} placeholder="по умолчанию" />
              </div>
              <div>
                <label style={labelStyle}>С какой даты</label>
                <input type="date" value={addForm.start_date} onChange={e => setAddForm({ ...addForm, start_date: e.target.value })} style={inputStyle} />
              </div>
            </div>
            {roster.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '10px' }}>
                В твоём списке пока нет учеников. <Link href="/teacher/students" style={{ color: ACCENT }}>Добавить учеников →</Link>
              </p>
            )}
            {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setAddingForDay(null)} style={{ ...accentButtonStyle, background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af' }}>Отмена</button>
              <button onClick={submitAdd} disabled={saving || roster.length === 0} style={saving || roster.length === 0 ? submitButtonDisabledStyle : accentSubmitStyle}>
                {saving ? 'Сохраняем...' : 'Добавить в шаблон'}
              </button>
            </div>
          </div>
        )}

        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={labelStyle}>Добавить в расписание на</label>
          <input type="number" value={weeks} onChange={e => setWeeks(Number(e.target.value))} style={{ ...inputStyle, width: '70px' }} min={1} max={12} />
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>недель вперёд</span>
          <button onClick={handleGenerate} disabled={generating || templates.length === 0} style={generating || templates.length === 0 ? submitButtonDisabledStyle : accentSubmitStyle}>
            {generating ? 'Добавляем...' : '⚡ Добавить в расписание'}
          </button>
          {resultMsg && <span style={{ color: '#9ca3af', fontSize: '13px' }}>{resultMsg}</span>}
        </div>

      </div>
    </div>
  )
}
