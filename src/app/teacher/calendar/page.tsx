'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { inputStyle, labelStyle, textareaStyle, submitButtonStyle, submitButtonDisabledStyle, smallButtonStyle, removeButtonStyle } from '@/components/lesson-blocks/styles'
import { SubjectPicker, SubjectIcon } from '@/components/subjects'
import { FitToWidth } from '@/components/FitToWidth'

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

// На телефонах и планшетах в портретной ориентации семь колонок с сеткой
// расписания, сжатые через FitToWidth до ширины экрана, превращались в
// нечитаемую мелочь — вместо сжатия на таких экранах показываем дни одной
// колонкой на всю ширину, а внутри карточки занятия поля идут друг под
// другом обычным (не уменьшенным) шрифтом
function useNarrowScreen(breakpoint = 900): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return narrow
}

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
  if (lesson.status === 'cancelled' || lesson.status === 'completed') return 'var(--t-text-muted)'
  if (hasConflict(lesson, dayLessons)) return 'var(--t-pink)'
  if (lesson.is_trial) return 'var(--t-trial)'
  // Урок из шаблона, но перенесённый (original_date заполняется при первом
  // переносе) — визуально как обычный внеплановый урок, для наглядности
  if (lesson.template_id && !lesson.original_date) return 'var(--t-accent)'
  return 'var(--t-success)'
}

// Карточка одного занятия в календаре — на узких экранах (narrow) поля
// идут друг под другом обычным шрифтом вместо сжатого центрированного
// блока, который на телефоне ещё и масштабировался FitToWidth до нечитаемости
function LessonCard({ lesson, dayLessons, isSelected, narrow, onClick }: {
  lesson: any
  dayLessons: any[]
  isSelected: boolean
  narrow: boolean
  onClick: () => void
}) {
  const color = lessonColor(lesson, dayLessons)
  const start = toMinutes(lesson.time)
  const end = start + Number(lesson.duration_minutes || 0)
  const studentLabel = lesson.is_trial
    ? `Пробный${lesson.student_name && lesson.student_name !== 'Пробный урок' ? ` · ${lesson.student_name}` : ''}`
    : lesson.student_name

  const cancelledBadge = lesson.status === 'cancelled' && (
    <span style={{
      position: 'absolute', top: narrow ? '10px' : '4px', right: narrow ? '40px' : '6px',
      fontSize: narrow ? '12px' : '9px', color: 'var(--t-text-muted)',
    }}>
      {STATUS_SHORT[lesson.status]}
    </span>
  )

  const callLink = !lesson.is_trial && lesson.call_link && (
    <a
      href={lesson.call_link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title="Перейти по ссылке урока"
      style={{
        position: 'absolute', top: narrow ? '12px' : '3px', left: narrow ? '12px' : '5px',
        color: 'var(--t-accent)', display: 'flex', lineHeight: 0,
      }}
    >
      <svg width={narrow ? 16 : 11} height={narrow ? 16 : 11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M9 15 L15 9" />
        <path d="M13 6.5 L14.5 5 A4 4 0 0 1 20 10.5 L18.5 12" />
        <path d="M11 17.5 L9.5 19 A4 4 0 0 1 4 13.5 L5.5 12" />
      </svg>
    </a>
  )

  if (narrow) {
    return (
      <div
        onClick={onClick}
        style={{
          position: 'relative', padding: '16px 44px 14px 18px', background: 'var(--t-bg)',
          border: `2px solid ${color}`, boxShadow: isSelected ? `0 0 0 3px ${color}4D` : 'none',
          borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
          opacity: lesson.status === 'completed' ? 0.55 : 1,
        }}
      >
        {cancelledBadge}
        {callLink}
        {lesson.subject && (
          <span style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', lineHeight: 0 }}>
            <SubjectIcon subject={lesson.subject} size={18} />
          </span>
        )}
        <div style={{ fontWeight: 600, fontSize: '15px' }}>Начало: {formatClock(start)}</div>
        <div style={{ fontWeight: 600, fontSize: '15px', marginTop: '4px' }}>Конец: {formatClock(end)}</div>
        <div style={{ color: 'var(--t-text-secondary)', fontSize: '14px', marginTop: '8px' }}>{studentLabel}</div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', padding: '8px', background: 'var(--t-bg)',
        border: `2px solid ${color}`, boxShadow: isSelected ? `0 0 0 3px ${color}4D` : 'none',
        borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
        opacity: lesson.status === 'completed' ? 0.55 : 1,
      }}
    >
      {cancelledBadge}
      {callLink}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '12px' }}>
        <span>{formatTimeRange(lesson.time, lesson.duration_minutes)}</span>
        {lesson.subject && <SubjectIcon subject={lesson.subject} size={13} />}
      </div>
      <div style={{ color: 'var(--t-text-secondary)', fontSize: '11px', marginTop: '3px' }}>{studentLabel}</div>
    </div>
  )
}

interface LessonForm {
  student_id: string
  time: string
  duration_minutes: number
  subject: string
  notes: string
  price: string
}

const emptyForm: LessonForm = { student_id: '', time: '00:00', duration_minutes: 60, subject: '', notes: '', price: '' }
const emptyTrialForm = { time: '00:00', student_name: '', notes: '' }

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
    fetch('/api/students').then(r => r.json()).then(data => setRoster((data.students || []).filter((s: any) => !s.archived_at)))
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
    const lessonEnd = new Date(`${String(lesson.date).slice(0, 10)}T${lesson.time}:00`)
    lessonEnd.setMinutes(lessonEnd.getMinutes() + (lesson.duration_minutes || 60))
    const isPastLesson = lessonEnd < new Date()
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
  const narrow = useNarrowScreen()

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '95%', maxWidth: '1600px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Link href="/teacher" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📅 Расписание</h1>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          <span style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
            background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)', fontWeight: 600,
          }}>
            📅 Расписание
          </span>
          <Link href="/teacher/calendar/template" style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
            background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
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
          <div style={{ color: 'var(--t-text-muted)', fontSize: '14px' }}>
            {weekStart.getDate()} {MONTHS[weekStart.getMonth()]} – {weekEnd.getDate()} {MONTHS[weekEnd.getMonth()]}
          </div>
        </div>

        {/* Легенда цветов */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '1rem', fontSize: '12px', color: 'var(--t-text-secondary)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid var(--t-trial)', display: 'inline-block' }} />
            Пробный
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid var(--t-accent)', display: 'inline-block' }} />
            По шаблону
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid var(--t-success)', display: 'inline-block' }} />
            Не по шаблону
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid var(--t-text-muted)', display: 'inline-block' }} />
            Отменено
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid var(--t-pink)', display: 'inline-block' }} />
            Пересечение по времени
          </span>
        </div>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {(() => {
          const dayCards = days.map((day, i) => {
            const dateStr = toISODate(day)
            const dayLessons = lessons.filter(l => String(l.date).slice(0, 10) === dateStr)
            const isToday = isSameDay(day, today)

            return (
              <div key={dateStr} style={{
                background: 'var(--t-card)', border: `1px solid ${isToday ? 'var(--t-accent)' : 'var(--t-border)'}`,
                borderRadius: '12px', padding: narrow ? '14px' : '10px', display: 'flex', flexDirection: 'column',
                gap: '8px', width: '100%',
              }}>
                <div style={{ fontWeight: 600, fontSize: narrow ? '15px' : '13px', color: isToday ? 'var(--t-accent)' : 'var(--t-text)', textAlign: narrow ? 'left' : 'center' }}>
                  {WEEKDAYS_SHORT[i]}, {day.getDate()} {MONTHS[day.getMonth()].slice(0, 3)}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => openAddForm(dateStr)} style={{ ...smallButtonStyle, flex: 1, fontSize: narrow ? '13px' : '11px', padding: narrow ? '8px 6px' : '5px 6px' }}>+ Добавить</button>
                  <button
                    onClick={() => openTrialForm(dateStr)}
                    style={{
                      background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
                      borderRadius: '8px', fontSize: narrow ? '13px' : '11px', padding: narrow ? '8px 6px' : '5px 6px', cursor: 'pointer',
                    }}
                  >
                    Пробный
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: narrow ? '10px' : '6px' }}>
                  {dayLessons.map(lesson => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      dayLessons={dayLessons}
                      narrow={narrow}
                      isSelected={editingId === lesson.id}
                      onClick={() => (editingId === lesson.id ? closePanel() : openEdit(lesson))}
                    />
                  ))}
                </div>
              </div>
            )
          })

          return narrow ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.5rem' }}>
              {dayCards}
            </div>
          ) : (
            <FitToWidth style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))', gap: '10px', minWidth: '1120px' }}>
                {dayCards}
              </div>
            </FitToWidth>
          )
        })()}

        {(addingForDate || addingTrialForDate || (editingId && editForm)) && (
          <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
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
                    <input type="time" value={addForm.time} onChange={e => setAddForm({ ...addForm, time: e.target.value })} style={{ ...inputStyle, color: addForm.time === '00:00' ? 'var(--t-text-muted)' : inputStyle.color }} />
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
                  <p style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginBottom: '10px' }}>
                    В твоём списке пока нет учеников. <Link href="/teacher/students" style={{ color: 'var(--t-accent)' }}>Добавить учеников →</Link>
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={closePanel} style={{ ...smallButtonStyle, background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)' }}>Отмена</button>
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
                    <input type="time" value={trialForm.time} onChange={e => setTrialForm({ ...trialForm, time: e.target.value })} style={{ ...inputStyle, color: trialForm.time === '00:00' ? 'var(--t-text-muted)' : inputStyle.color }} />
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
                  <button onClick={closePanel} style={{ ...smallButtonStyle, background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)' }}>Отмена</button>
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
                  {editForm.is_trial && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--t-trial)', fontWeight: 400 }}>пробный</span>}
                  {!editForm.is_trial && !editForm.template_id && (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--t-success)', fontWeight: 400 }}>не по шаблону</span>
                  )}
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--t-text-muted)', fontWeight: 400 }}>{STATUS_SHORT[editForm.status]}</span>
                </div>
                {editForm.isPastLesson && (
                  <div style={{ color: 'var(--t-warning)', fontSize: '12px', marginBottom: '10px', padding: '8px 12px', background: 'rgba(var(--t-warning-rgb),0.1)', borderRadius: '8px' }}>
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
                        style={{ background: 'transparent', border: '1px solid var(--t-text-muted)', color: 'var(--t-text-secondary)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Отменить занятие
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={closePanel} style={{ ...smallButtonStyle, background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)' }}>Отмена</button>
                    <button onClick={submitEdit} disabled={saving} style={saving ? submitButtonDisabledStyle : submitButtonStyle}>
                      {saving ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && <p style={{ color: 'var(--t-danger)', fontSize: '14px', marginTop: '10px' }}>{error}</p>}
          </div>
        )}

      </div>
    </div>
  )
}
