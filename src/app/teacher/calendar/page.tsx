'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { inputStyle, labelStyle, textareaStyle, submitButtonStyle, submitButtonDisabledStyle, smallButtonStyle, removeButtonStyle } from '@/components/lesson-blocks/styles'
import { TemplatePanel } from './TemplatePanel'

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}
function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}
function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b)
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Запланирован', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  completed: { label: 'Проведён', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  cancelled: { label: 'Отменён', color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
}

interface LessonForm {
  student_id: string
  time: string
  duration_minutes: number
  subject: string
  notes: string
  price: string
}

const emptyForm: LessonForm = { student_id: '', time: '15:00', duration_minutes: 60, subject: '', notes: '', price: '' }

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [lessons, setLessons] = useState<any[]>([])
  const [roster, setRoster] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addingForDate, setAddingForDate] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<LessonForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<any>(null)

  const weekEnd = addDays(weekStart, 6)

  const loadLessons = useCallback(() => {
    const end = addDays(weekStart, 6)
    fetch(`/api/schedule?from=${toISODate(weekStart)}&to=${toISODate(end)}`)
      .then(r => r.json())
      .then(data => {
        setLessons(data.lessons || [])
        setLoading(false)
      })
  }, [weekStart])

  useEffect(() => { loadLessons() }, [loadLessons])
  useEffect(() => {
    fetch('/api/students').then(r => r.json()).then(data => setRoster(data.students || []))
  }, [])

  function openAddForm(dateStr: string) {
    setAddingForDate(dateStr)
    setAddForm(emptyForm)
    setEditingId(null)
  }

  async function submitAdd(dateStr: string) {
    setError('')
    if (!addForm.student_id || !addForm.time) {
      setError('Выбери ученика и время')
      return
    }
    setSaving(true)
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addForm,
        student_id: Number(addForm.student_id),
        date: dateStr,
        price: addForm.price === '' ? undefined : Number(addForm.price),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setAddingForDate(null)
      loadLessons()
    } else {
      setError(data.error || 'Ошибка')
    }
  }

  function openEdit(lesson: any) {
    setEditingId(lesson.id)
    setEditForm({
      date: String(lesson.date).slice(0, 10),
      time: lesson.time,
      duration_minutes: lesson.duration_minutes,
      subject: lesson.subject || '',
      status: lesson.status,
      notes: lesson.notes || '',
      price: lesson.price ?? '',
      is_paid: lesson.is_paid,
    })
    setAddingForDate(null)
  }

  async function submitEdit(id: number) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/schedule/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, price: editForm.price === '' ? null : Number(editForm.price) }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setEditingId(null)
      loadLessons()
    } else {
      setError(data.error || 'Ошибка')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить занятие?')) return
    const res = await fetch(`/api/schedule/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEditingId(null)
      loadLessons()
    }
  }

  async function togglePaid(lesson: any, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/schedule/${lesson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_paid: !lesson.is_paid }),
    })
    loadLessons()
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📅 Расписание</h1>
        </div>

        <TemplatePanel roster={roster} onGenerated={loadLessons} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setWeekStart(w => addDays(w, -7))} style={smallButtonStyle}>← Пред. неделя</button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))} style={smallButtonStyle}>Сегодня</button>
            <button onClick={() => setWeekStart(w => addDays(w, 7))} style={smallButtonStyle}>След. неделя →</button>
          </div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            {weekStart.getDate()} {MONTHS[weekStart.getMonth()]} – {weekEnd.getDate()} {MONTHS[weekEnd.getMonth()]}
          </div>
        </div>

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {days.map((day, i) => {
            const dateStr = toISODate(day)
            const dayLessons = lessons.filter(l => String(l.date).slice(0, 10) === dateStr)
            const isToday = isSameDay(day, today)

            return (
              <div key={dateStr} style={{
                background: '#1a1d27', border: `1px solid ${isToday ? '#4f8ef7' : '#2a2d3d'}`,
                borderRadius: '16px', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: isToday ? '#4f8ef7' : '#fff' }}>
                    {WEEKDAYS[i]}, {day.getDate()} {MONTHS[day.getMonth()]}
                  </div>
                  <button onClick={() => openAddForm(dateStr)} style={smallButtonStyle}>+ Добавить</button>
                </div>

                {dayLessons.length === 0 && addingForDate !== dateStr && (
                  <div style={{ color: '#4b5563', fontSize: '13px' }}>Нет занятий</div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayLessons.map(lesson => {
                    const status = STATUS_LABEL[lesson.status] || STATUS_LABEL.scheduled
                    const isEditing = editingId === lesson.id
                    return (
                      <div key={lesson.id}>
                        <div
                          onClick={() => (isEditing ? setEditingId(null) : openEdit(lesson))}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', background: '#0f1117', border: '1px solid #2a2d3d',
                            borderRadius: '10px', cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', width: '42px' }}>{lesson.time}</span>
                            <div>
                              <div style={{ fontSize: '14px' }}>{lesson.student_name}</div>
                              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                                {[lesson.subject, `${lesson.duration_minutes} мин`, lesson.price ? `${lesson.price} ₽` : null].filter(Boolean).join(' · ')}
                                {lesson.original_date && ' · перенесён'}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {lesson.price && (
                              <span
                                onClick={e => togglePaid(lesson, e)}
                                style={{
                                  fontSize: '11px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer',
                                  background: lesson.is_paid ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                                  color: lesson.is_paid ? '#34d399' : '#9ca3af',
                                }}
                              >
                                {lesson.is_paid ? '💰 Оплачено' : 'Не оплачено'}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </div>
                        </div>

                        {isEditing && editForm && (
                          <div style={{ background: '#0f1117', border: '1px solid #2a2d3d', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '14px', marginTop: '-1px' }}>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              <div>
                                <label style={labelStyle}>Дата</label>
                                <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={inputStyle} />
                              </div>
                              <div>
                                <label style={labelStyle}>Время</label>
                                <input type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} style={inputStyle} />
                              </div>
                              <div>
                                <label style={labelStyle}>Длительность (мин)</label>
                                <input type="number" value={editForm.duration_minutes} onChange={e => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })} style={{ ...inputStyle, width: '90px' }} />
                              </div>
                              <div style={{ flex: 1, minWidth: '140px' }}>
                                <label style={labelStyle}>Предмет</label>
                                <input value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} style={inputStyle} />
                              </div>
                              <div>
                                <label style={labelStyle}>Цена, ₽</label>
                                <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={{ ...inputStyle, width: '100px' }} />
                              </div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer', fontSize: '13px', color: '#9ca3af' }}>
                              <input type="checkbox" checked={!!editForm.is_paid} onChange={e => setEditForm({ ...editForm, is_paid: e.target.checked })} />
                              Оплачено (спишет/вернёт сумму с баланса ученика)
                            </label>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={labelStyle}>Статус</label>
                              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                                <option value="scheduled">Запланирован</option>
                                <option value="completed">Проведён</option>
                                <option value="cancelled">Отменён</option>
                              </select>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={labelStyle}>Заметка</label>
                              <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={textareaStyle} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <button onClick={() => handleDelete(lesson.id)} style={removeButtonStyle}>🗑 Удалить</button>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setEditingId(null)} style={{ ...smallButtonStyle, background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af' }}>Отмена</button>
                                <button onClick={() => submitEdit(lesson.id)} disabled={saving} style={saving ? submitButtonDisabledStyle : submitButtonStyle}>
                                  {saving ? 'Сохраняем...' : 'Сохранить'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {addingForDate === dateStr && (
                  <div style={{ background: '#0f1117', border: '1px solid #2a2d3d', borderRadius: '10px', padding: '14px', marginTop: '8px' }}>
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
                    </div>
                    {roster.length === 0 && (
                      <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '10px' }}>
                        В твоём списке пока нет учеников. <Link href="/teacher/students" style={{ color: '#4f8ef7' }}>Добавить учеников →</Link>
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => setAddingForDate(null)} style={{ ...smallButtonStyle, background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af' }}>Отмена</button>
                      <button onClick={() => submitAdd(dateStr)} disabled={saving || roster.length === 0} style={saving || roster.length === 0 ? submitButtonDisabledStyle : submitButtonStyle}>
                        {saving ? 'Сохраняем...' : 'Добавить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '1rem' }}>{error}</p>}

      </div>
    </div>
  )
}
