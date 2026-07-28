'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { inputStyle, labelStyle, textareaStyle, submitButtonStyle, submitButtonDisabledStyle, smallButtonStyle, removeButtonStyle } from '@/components/lesson-blocks/styles'
import { SubjectPicker, SubjectIcon } from '@/components/subjects'

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
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
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
function formatClock(minutes: number): string {
  const h = Math.floor(((minutes % 1440) + 1440) % 1440 / 60)
  const m = ((minutes % 60) + 60) % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function formatTimeRange(time: string, durationMinutes: number): string {
  const start = toMinutes(time)
  return `${formatClock(start)} · ${formatClock(start + Number(durationMinutes || 0))}`
}

const STATUS_SHORT: Record<string, string> = { scheduled: 'план', completed: 'проведён', cancelled: 'отменён' }

function hasConflict(lesson: any, dayLessons: any[]): boolean {
  if (lesson.status === 'cancelled') return false
  const start = toMinutes(lesson.time)
  const end = start + Number(lesson.duration_minutes || 0)
  return dayLessons.some(other => {
    if (other.id === lesson.id || other.status === 'cancelled') return false
    const oStart = toMinutes(other.time)
    const oEnd = oStart + Number(other.duration_minutes || 0)
    return start < oEnd && oStart < end
  })
}

// Цвет рамки карточки целиком — состояние занятия
function lessonColor(lesson: any, dayLessons: any[]): string {
  if (lesson.status === 'cancelled') return '#6b7280'
  if (hasConflict(lesson, dayLessons)) return '#f472b6'
  if (lesson.is_trial) return '#e5e7eb'
  if (lesson.template_id) return '#4f8ef7'
  return '#34d399'
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
const emptyTrialForm = { time: '15:00', student_name: '', notes: '' }

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [lessons, setLessons] = useState<any[]>([])
  const [roster, setRoster] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addingForDate, setAddingForDate] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<LessonForm>(emptyForm)
  const [addingTrialForDate, setAddingTrialForDate] = useState<string | null>(null)
  const [trialForm, setTrialForm] = useState(emptyTrialForm)
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

  // Статус "проведён" выставляется на сервере в момент окончания занятия,
  // но без периодического опроса страница показывала бы устаревшие статусы
  // всем занятиям, которые закончились уже после того, как календарь
  // загрузился — обновляем список раз в минуту, чтобы это не зависело от
  // ручной перезагрузки страницы
  useEffect(() => {
    const interval = setInterval(loadLessons, 60000)
    return () => clearInterval(interval)
  }, [loadLessons])

  function openAddForm(dateStr: string) {
    setAddingForDate(dateStr)
    setAddForm(emptyForm)
    setAddingTrialForDate(null)
    setEditingId(null)
  }

  function openTrialForm(dateStr: string) {
    setAddingTrialForDate(dateStr)
    setTrialForm(emptyTrialForm)
    setAddingForDate(null)
    setEditingId(null)
  }

  function closePanel() {
    setAddingForDate(null)
    setAddingTrialForDate(null)
    setEditingId(null)
    setError('')
  }

  async function submitAdd() {
    if (!addingForDate) return
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
        date: addingForDate,
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

  async function submitTrial() {
    if (!addingTrialForDate) return
    setError('')
    if (!trialForm.time) {
      setError('Укажи время')
      return
    }
    setSaving(true)
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_trial: true,
        student_name: trialForm.student_name,
        time: trialForm.time,
        notes: trialForm.notes,
        date: addingTrialForDate,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setAddingTrialForDate(null)
      loadLessons()
    } else {
      setError(data.error || 'Ошибка')
    }
  }

  function openEdit(lesson: any) {
    setEditingId(lesson.id)
    const isPastLesson = new Date(`${String(lesson.date).slice(0, 10)}T${lesson.time}:00`) < new Date()
    setEditForm({
      date: String(lesson.date).slice(0, 10),
      time: lesson.time,
      duration_minutes: lesson.duration_minutes,
      subject: lesson.subject || '',
      status: lesson.status,
      notes: lesson.notes || '',
      price: lesson.price ?? '',
      student_name: lesson.student_name,
      template_id: lesson.template_id,
      is_trial: lesson.is_trial,
      isPastLesson,
    })
    setAddingForDate(null)
    setAddingTrialForDate(null)
  }

  async function submitEdit() {
    if (!editingId) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/schedule/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: editForm.date, time: editForm.time, duration_minutes: editForm.duration_minutes,
        subject: editForm.subject, notes: editForm.notes,
        price: editForm.price === '' ? null : Number(editForm.price),
      }),
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

  async function handleCancel() {
    if (!editingId) return
    if (!confirm('Отменить занятие?')) return
    setSaving(true)
    await fetch(`/api/schedule/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    setSaving(false)
    setEditingId(null)
    loadLessons()
  }

  async function handleDelete() {
    if (!editingId) return
    if (!confirm('Удалить занятие?')) return
    const res = await fetch(`/api/schedule/${editingId}`, { method: 'DELETE' })
    if (res.ok) {
      setEditingId(null)
      loadLessons()
    }
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '95%', maxWidth: '1600px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Link href="/teacher" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📅 Расписание</h1>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          <span style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
            background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7', color: '#4f8ef7', fontWeight: 600,
          }}>
            📅 Расписание
          </span>
          <Link href="/teacher/calendar/template" style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
            background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
          }}>
            🔁 Шаблон
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setWeekStart(w => addDays(w, -7))} style={smallButtonStyle}>← Пред. неделя</button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))} style={smallButtonStyle}>Сегодня</button>
            <button onClick={() => setWeekStart(w => addDays(w, 7))} style={smallButtonStyle}>След. неделя →</button>
          </div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            {weekStart.getDate()} {MONTHS[weekStart.getMonth()]} – {weekEnd.getDate()} {MONTHS[weekEnd.getMonth()]}
          </div>
        </div>

        {/* Легенда цветов */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '1rem', fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid #e5e7eb', display: 'inline-block' }} />
            Пробный
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid #4f8ef7', display: 'inline-block' }} />
            По шаблону
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid #34d399', display: 'inline-block' }} />
            Не по шаблону
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid #6b7280', display: 'inline-block' }} />
            Отменено
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid #f472b6', display: 'inline-block' }} />
            Пересечение по времени
          </span>
        </div>

        {loading && <p style={{ color: '#6b7280' }}>Загрузка...</p>}

        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))', gap: '10px', minWidth: '1120px' }}>
            {days.map((day, i) => {
              const dateStr = toISODate(day)
              const dayLessons = lessons.filter(l => String(l.date).slice(0, 10) === dateStr)
              const isToday = isSameDay(day, today)

              return (
                <div key={dateStr} style={{
                  background: '#1a1d27', border: `1px solid ${isToday ? '#4f8ef7' : '#2a2d3d'}`,
                  borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: isToday ? '#4f8ef7' : '#fff', textAlign: 'center' }}>
                    {WEEKDAYS_SHORT[i]}, {day.getDate()} {MONTHS[day.getMonth()].slice(0, 3)}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openAddForm(dateStr)} style={{ ...smallButtonStyle, flex: 1, fontSize: '11px', padding: '5px 6px' }}>+ Добавить</button>
                    <button
                      onClick={() => openTrialForm(dateStr)}
                      style={{
                        background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
                        borderRadius: '8px', fontSize: '11px', padding: '5px 6px', cursor: 'pointer',
                      }}
                    >
                      Пробный
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayLessons.map(lesson => {
                      const color = lessonColor(lesson, dayLessons)
                      const isSelected = editingId === lesson.id
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => (isSelected ? closePanel() : openEdit(lesson))}
                          style={{
                            position: 'relative',
                            padding: '8px', background: '#0f1117',
                            border: `2px solid ${color}`,
                            boxShadow: isSelected ? `0 0 0 3px ${color}4D` : 'none',
                            borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                          }}
                        >
                          {lesson.status !== 'scheduled' && (
                            <span style={{ position: 'absolute', top: '4px', right: '6px', fontSize: '9px', color: '#6b7280' }}>
                              {STATUS_SHORT[lesson.status]}
                            </span>
                          )}
                          {!lesson.is_trial && lesson.call_link && (
                            <a
                              href={lesson.call_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              title="Перейти по ссылке урока"
                              style={{ position: 'absolute', top: '3px', left: '5px', color: '#4f8ef7', display: 'flex', lineHeight: 0 }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="M9 15 L15 9" />
                                <path d="M13 6.5 L14.5 5 A4 4 0 0 1 20 10.5 L18.5 12" />
                                <path d="M11 17.5 L9.5 19 A4 4 0 0 1 4 13.5 L5.5 12" />
                              </svg>
                            </a>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '12px' }}>
                            <span>{formatTimeRange(lesson.time, lesson.duration_minutes)}</span>
                            {lesson.subject && <SubjectIcon subject={lesson.subject} size={13} />}
                          </div>
                          <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '3px' }}>
                            {lesson.is_trial ? `Пробный${lesson.student_name && lesson.student_name !== 'Пробный урок' ? ` · ${lesson.student_name}` : ''}` : lesson.student_name}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {(addingForDate || addingTrialForDate || (editingId && editForm)) && (
          <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            {addingForDate && (
              <>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px' }}>
                  Новое занятие — {WEEKDAYS[days.findIndex(d => toISODate(d) === addingForDate)]}, {new Date(addingForDate + 'T00:00:00').getDate()} {MONTHS[new Date(addingForDate + 'T00:00:00').getMonth()]}
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
                  <div style={{ minWidth: '200px' }}>
                    <label style={labelStyle}>Предмет</label>
                    <SubjectPicker value={addForm.subject} onChange={v => setAddForm({ ...addForm, subject: v })} />
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
                  <button onClick={closePanel} style={{ ...smallButtonStyle, background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af' }}>Отмена</button>
                  <button onClick={submitAdd} disabled={saving || roster.length === 0} style={saving || roster.length === 0 ? submitButtonDisabledStyle : submitButtonStyle}>
                    {saving ? 'Сохраняем...' : 'Добавить'}
                  </button>
                </div>
              </>
            )}

            {addingTrialForDate && (
              <>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px' }}>
                  Пробный урок — {WEEKDAYS[days.findIndex(d => toISODate(d) === addingTrialForDate)]}, {new Date(addingTrialForDate + 'T00:00:00').getDate()} {MONTHS[new Date(addingTrialForDate + 'T00:00:00').getMonth()]}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <div>
                    <label style={labelStyle}>Время</label>
                    <input type="time" value={trialForm.time} onChange={e => setTrialForm({ ...trialForm, time: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <label style={labelStyle}>Имя (необязательно)</label>
                    <input value={trialForm.student_name} onChange={e => setTrialForm({ ...trialForm, student_name: e.target.value })} style={inputStyle} placeholder="Имя потенциального ученика" />
                  </div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={labelStyle}>Заметка</label>
                  <textarea value={trialForm.notes} onChange={e => setTrialForm({ ...trialForm, notes: e.target.value })} rows={2} style={textareaStyle} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={closePanel} style={{ ...smallButtonStyle, background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af' }}>Отмена</button>
                  <button onClick={submitTrial} disabled={saving} style={saving ? submitButtonDisabledStyle : submitButtonStyle}>
                    {saving ? 'Сохраняем...' : 'Добавить'}
                  </button>
                </div>
              </>
            )}

            {editingId && editForm && (
              <>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px' }}>
                  Занятие — {editForm.student_name}
                  {editForm.is_trial && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#e5e7eb', fontWeight: 400 }}>пробный</span>}
                  {!editForm.is_trial && !editForm.template_id && (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#34d399', fontWeight: 400 }}>не по шаблону</span>
                  )}
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>{STATUS_SHORT[editForm.status]}</span>
                </div>
                {editForm.isPastLesson && (
                  <div style={{ color: '#fbbf24', fontSize: '12px', marginBottom: '10px', padding: '8px 12px', background: 'rgba(251,191,36,0.1)', borderRadius: '8px' }}>
                    Занятие уже прошло — дату и время менять нельзя, можно отменить или удалить
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <div>
                    <label style={labelStyle}>Дата</label>
                    <input type="date" value={editForm.date} disabled={editForm.isPastLesson} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Время</label>
                    <input type="time" value={editForm.time} disabled={editForm.isPastLesson} onChange={e => setEditForm({ ...editForm, time: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Длительность (мин)</label>
                    <input type="number" value={editForm.duration_minutes} onChange={e => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })} style={{ ...inputStyle, width: '90px' }} />
                  </div>
                  {!editForm.is_trial && (
                    <>
                      <div style={{ minWidth: '200px' }}>
                        <label style={labelStyle}>Предмет</label>
                        <SubjectPicker value={editForm.subject} onChange={v => setEditForm({ ...editForm, subject: v })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Цена, ₽</label>
                        <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={{ ...inputStyle, width: '100px' }} />
                      </div>
                    </>
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={labelStyle}>Заметка</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={textareaStyle} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleDelete} style={removeButtonStyle}>🗑 Удалить</button>
                    {editForm.status === 'scheduled' && (
                      <button
                        onClick={handleCancel}
                        style={{ background: 'transparent', border: '1px solid #6b7280', color: '#9ca3af', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Отменить занятие
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={closePanel} style={{ ...smallButtonStyle, background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af' }}>Отмена</button>
                    <button onClick={submitEdit} disabled={saving} style={saving ? submitButtonDisabledStyle : submitButtonStyle}>
                      {saving ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '10px' }}>{error}</p>}
          </div>
        )}

      </div>
    </div>
  )
}
