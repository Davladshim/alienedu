'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { inputStyle, labelStyle, submitButtonDisabledStyle } from '@/components/lesson-blocks/styles'
import { SubjectPicker, SubjectIcon } from '@/components/subjects'

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Отдельная цветовая схема (фиолетовая), чтобы план недели визуально
// не путался с настоящим расписанием (там синяя)
const ACCENT = 'var(--t-template-accent)'
const accentButtonStyle = {
  background: `rgba(var(--t-template-accent-rgb),0.15)`, border: `1px solid ${ACCENT}`,
  color: ACCENT, borderRadius: '8px', padding: '6px 14px',
  fontSize: '13px', cursor: 'pointer',
}
const accentSubmitStyle = {
  background: `linear-gradient(135deg, ${ACCENT}, var(--t-template-gradient-end))`,
  color: '#fff', border: 'none', borderRadius: '8px',
  padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
}

function formatClock(minutes: number): string {
  const h = Math.floor(((minutes % 1440) + 1440) % 1440 / 60)
  const m = ((minutes % 60) + 60) % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
// Время начала и конца друг под другом без подписей (просто числа), имя
// ученика ниже — как в LessonCard настоящего расписания. Колонки дней
// всегда в семь штук в ряд и всегда помещаются на экран — на узких
// экранах (narrow) они просто уже, а шрифт чуть меньше (не через scale)
function TemplateCard({ tpl, narrow, onClick, onDelete }: {
  tpl: any
  narrow: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const startDateStr = toISODateStr(tpl.start_date)
  const endDateStr = tpl.end_date ? toISODateStr(tpl.end_date) : null
  const isUpcoming = startDateStr > todayISO()
  const isEnding = endDateStr !== null
  const start = (() => { const [h, m] = tpl.time.split(':').map(Number); return h * 60 + m })()
  const end = start + Number(tpl.duration_minutes || 0)
  const dateRange = (isUpcoming || isEnding) && (
    <>
      {isUpcoming && `с ${formatDateRu(startDateStr)}`}
      {isUpcoming && isEnding && ' · '}
      {isEnding && `до ${formatDateRu(endDateStr!)}`}
    </>
  )

  if (narrow) {
    return (
      <div
        onClick={onClick}
        style={{
          position: 'relative', padding: '5px 2px', background: 'var(--t-bg)',
          border: `1px solid ${ACCENT}`, borderRadius: '6px', textAlign: 'center', cursor: 'pointer',
        }}
      >
        <button
          onClick={onDelete}
          style={{ position: 'absolute', top: '1px', right: '2px', background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '10px', padding: 0, lineHeight: 1 }}
        >
          ✕
        </button>
        {tpl.subject && (
          <div style={{ display: 'flex', justifyContent: 'center', lineHeight: 0, marginBottom: '2px' }}>
            <SubjectIcon subject={tpl.subject} size={10} />
          </div>
        )}
        <div style={{ fontWeight: 600, fontSize: '11px', lineHeight: 1.3, marginTop: tpl.subject ? 0 : '8px' }}>{formatClock(start)}</div>
        <div style={{ fontWeight: 600, fontSize: '11px', lineHeight: 1.3, borderTop: '1px solid var(--t-border)', marginTop: '2px', paddingTop: '2px' }}>{formatClock(end)}</div>
        <div style={{ color: 'var(--t-text-secondary)', fontSize: '10px', lineHeight: 1.25, marginTop: '3px', wordBreak: 'break-word' }}>{tpl.student_name}</div>
        {dateRange && <div style={{ color: ACCENT, fontSize: '8px', marginTop: '3px' }}>{dateRange}</div>}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', padding: '10px 8px', background: 'var(--t-bg)',
        border: `2px solid ${ACCENT}`, borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
      }}
    >
      <button
        onClick={onDelete}
        style={{ position: 'absolute', top: '4px', right: '6px', background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '12px', padding: 0 }}
      >
        ✕
      </button>
      {tpl.subject && (
        <span style={{ position: 'absolute', top: '5px', left: '6px', display: 'flex', lineHeight: 0 }}>
          <SubjectIcon subject={tpl.subject} size={13} />
        </span>
      )}
      <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '10px' }}>{formatClock(start)}</div>
      <div style={{ fontWeight: 600, fontSize: '14px', borderTop: '1px solid var(--t-border)', marginTop: '4px', paddingTop: '4px' }}>{formatClock(end)}</div>
      <div style={{ color: 'var(--t-text-secondary)', fontSize: '13px', marginTop: '6px' }}>{tpl.student_name}</div>
      {dateRange && <div style={{ color: ACCENT, fontSize: '11px', marginTop: '4px' }}>{dateRange}</div>}
    </div>
  )
}

// На узких экранах (портретный телефон/планшет, <=900px) колонки дней
// становятся уже, а шрифт — совсем немного меньше (фиксированный
// размер, не сжатие через scale) — см. подробный комментарий у
// одноимённого хука в src/app/teacher/calendar/page.tsx
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

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toISODateStr(value: unknown): string {
  return String(value).slice(0, 10)
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
  student_id: '', day_of_week: dayOfWeek, time: '00:00', duration_minutes: 60, subject: '', price: '', start_date: todayISO(),
})

interface EditForm {
  id: number
  student_name: string
  day_of_week: number
  time: string
  duration_minutes: number
  subject: string
  price: string
  effective_date: string
}

interface TemplateRow {
  id: number
  student_name: string
  day_of_week: number
  time: string
  duration_minutes: number
  subject: string | null
  price: number | string | null
  start_date: string
  end_date: string | null
}

function formatDateRu(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

function toISODateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// «До ближайшего 31 мая» — если сегодня ещё до 31 мая этого года, берём
// его; если уже позже — 31 мая следующего года (по сути «до конца
// текущего учебного года»)
function nearestMay31(): string {
  const now = new Date()
  const year = now.getFullYear()
  const may31ThisYear = new Date(year, 4, 31)
  const target = now <= may31ThisYear ? may31ThisYear : new Date(year + 1, 4, 31)
  return toISODateLocal(target)
}

function endOfYear(): string {
  return toISODateLocal(new Date(new Date().getFullYear(), 11, 31))
}

type PeriodPreset = '' | 'may' | 'newyear' | 'custom'

export default function TemplatePage() {
  const [roster, setRoster] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [addingForDay, setAddingForDay] = useState<number | null>(null)
  const [addForm, setAddForm] = useState<TemplateForm>(emptyForm(0))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [generating, setGenerating] = useState(false)
  const [resultMsg, setResultMsg] = useState('')

  // Период применения шаблона + подсветка-напоминалка после изменений
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>('')
  const [customWeeksModalOpen, setCustomWeeksModalOpen] = useState(false)
  const [customWeeksInput, setCustomWeeksInput] = useState(4)
  const [customConfirmed, setCustomConfirmed] = useState(false)
  const [needsAttention, setNeedsAttention] = useState(false)

  const periodReady = selectedPreset === 'may' || selectedPreset === 'newyear' || (selectedPreset === 'custom' && customConfirmed)
  const highlightDropdown = needsAttention && !periodReady
  const highlightButton = needsAttention && periodReady

  function markChanged() {
    setNeedsAttention(true)
    setSelectedPreset('')
    setCustomConfirmed(false)
  }

  function onPeriodSelectChange(value: string) {
    const v = value as PeriodPreset
    setSelectedPreset(v)
    setCustomConfirmed(false)
    if (v === 'custom') setCustomWeeksModalOpen(true)
  }

  function confirmCustomWeeks() {
    setCustomConfirmed(true)
    setCustomWeeksModalOpen(false)
  }

  function cancelCustomWeeks() {
    setCustomWeeksModalOpen(false)
    setSelectedPreset('')
  }

  function loadTemplates() {
    fetch('/api/templates').then(r => r.json()).then(data => {
      setTemplates(data.templates || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadTemplates()
    fetch('/api/students').then(r => r.json()).then(data => setRoster((data.students || []).filter((s: any) => !s.archived_at)))
  }, [])

  function openAddForm(dayOfWeek: number) {
    setAddingForDay(dayOfWeek)
    setAddForm(emptyForm(dayOfWeek))
    setError('')
    setEditForm(null)
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
      markChanged()
    } else {
      setError(data.error || 'Ошибка')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить из шаблона?')) return
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTemplates(t => t.filter(tpl => tpl.id !== id))
      markChanged()
    }
  }

  function openEditForm(tpl: TemplateRow) {
    setAddingForDay(null)
    setEditForm({
      id: tpl.id,
      student_name: tpl.student_name,
      day_of_week: tpl.day_of_week,
      time: tpl.time,
      duration_minutes: tpl.duration_minutes,
      subject: tpl.subject || '',
      price: tpl.price === null || tpl.price === undefined ? '' : String(tpl.price),
      effective_date: todayISO(),
    })
    setEditError('')
  }

  async function submitEdit() {
    if (!editForm) return
    setEditError('')
    setEditSaving(true)
    const res = await fetch(`/api/templates/${editForm.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_of_week: editForm.day_of_week,
        time: editForm.time,
        duration_minutes: editForm.duration_minutes,
        subject: editForm.subject,
        price: editForm.price === '' ? undefined : Number(editForm.price),
        effective_date: editForm.effective_date,
      }),
    })
    const data = await res.json()
    setEditSaving(false)
    if (res.ok) {
      setEditForm(null)
      loadTemplates()
      markChanged()
    } else {
      setEditError(data.error || 'Ошибка')
    }
  }

  async function handleGenerate() {
    if (!periodReady) return
    setGenerating(true)
    setResultMsg('')
    const body = selectedPreset === 'custom'
      ? { weeks: customWeeksInput }
      : { endDate: selectedPreset === 'may' ? nearestMay31() : endOfYear() }
    const res = await fetch('/api/templates/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setGenerating(false)
    if (res.ok) {
      setResultMsg(`Создано занятий: ${data.created}${data.skipped ? `, пропущено (уже были): ${data.skipped}` : ''}`)
      setNeedsAttention(false)
      setSelectedPreset('')
      setCustomConfirmed(false)
    } else {
      setResultMsg(data.error || 'Ошибка')
    }
  }

  const todayDow = (new Date().getDay() + 6) % 7 // 0=понедельник
  const narrow = useNarrowScreen()

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '95%', maxWidth: '1600px', padding: narrow ? '0.75rem' : '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Link href="/teacher" style={{ color: 'var(--t-text-muted)', textDecoration: 'none', fontSize: '14px' }}>← Кабинет</Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🔁 Шаблон недели</h1>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          <Link href="/teacher/calendar" style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
            background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
          }}>
            📅 Расписание
          </Link>
          <span style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
            background: `rgba(var(--t-template-accent-rgb),0.15)`, border: `1px solid ${ACCENT}`, color: ACCENT, fontWeight: 600,
          }}>
            🔁 Шаблон
          </span>
        </div>

        <p style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginBottom: '1.5rem' }}>
          Это план — повторяющиеся занятия по дням недели, без привязки к конкретным датам. Чтобы план стал реальным расписанием, нажми «Добавить в расписание» внизу.
        </p>

        {loading && <p style={{ color: 'var(--t-text-muted)' }}>Загрузка...</p>}

        {/* Семь колонок всегда помещаются на экран без горизонтальной
            прокрутки — см. подробный комментарий в calendar/page.tsx */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: narrow ? '4px' : '10px', marginBottom: '1.5rem' }}>
          {WEEKDAYS.map((weekday, dow) => {
            const dayTemplates = templates.filter(t => t.day_of_week === dow)
            const isToday = dow === todayDow

            return (
              <div key={dow} style={narrow ? {
                display: 'flex', flexDirection: 'column', gap: '4px',
                borderTop: `2px solid ${isToday ? ACCENT : 'var(--t-border)'}`, paddingTop: '4px',
              } : {
                background: 'var(--t-card)', border: `1px solid ${isToday ? ACCENT : 'var(--t-border)'}`,
                borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <div style={{ fontWeight: 600, fontSize: narrow ? '10px' : '13px', color: isToday ? ACCENT : 'var(--t-text)', textAlign: 'center' }}>
                  {WEEKDAYS_SHORT[dow]}
                </div>

                <button onClick={() => openAddForm(dow)} style={narrow
                  ? { ...accentButtonStyle, fontSize: '13px', padding: '3px', lineHeight: 1 }
                  : { ...accentButtonStyle, fontSize: '11px', padding: '5px 8px' }}>
                  {narrow ? '+' : '+ Добавить'}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: narrow ? '4px' : '6px' }}>
                  {dayTemplates.map(tpl => (
                    <TemplateCard
                      key={tpl.id}
                      tpl={tpl}
                      narrow={narrow}
                      onClick={() => openEditForm(tpl)}
                      onDelete={e => { e.stopPropagation(); handleDelete(tpl.id) }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {addingForDay !== null && (
          <div style={{ background: 'var(--t-card)', border: `1px solid ${ACCENT}`, borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
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
              <div>
                <label style={labelStyle}>С какой даты</label>
                <input type="date" value={addForm.start_date} onChange={e => setAddForm({ ...addForm, start_date: e.target.value })} style={inputStyle} />
              </div>
            </div>
            {roster.length === 0 && (
              <p style={{ color: 'var(--t-text-muted)', fontSize: '13px', marginBottom: '10px' }}>
                В твоём списке пока нет учеников. <Link href="/teacher/students" style={{ color: ACCENT }}>Добавить учеников →</Link>
              </p>
            )}
            {error && <p style={{ color: 'var(--t-danger)', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setAddingForDay(null)} style={{ ...accentButtonStyle, background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)' }}>Отмена</button>
              <button onClick={submitAdd} disabled={saving || roster.length === 0} style={saving || roster.length === 0 ? submitButtonDisabledStyle : accentSubmitStyle}>
                {saving ? 'Сохраняем...' : 'Добавить в шаблон'}
              </button>
            </div>
          </div>
        )}

        {editForm !== null && (
          <div style={{ background: 'var(--t-card)', border: `1px solid ${ACCENT}`, borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
              Изменить слот — {editForm.student_name}
            </div>
            <p style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '14px' }}>
              Занятия по старому шаблону до даты вступления в силу останутся как есть. С указанной даты шаблон изменится на новый.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div>
                <label style={labelStyle}>День недели</label>
                <select value={editForm.day_of_week} onChange={e => setEditForm({ ...editForm, day_of_week: Number(e.target.value) })} style={inputStyle}>
                  {WEEKDAYS.map((w, i) => <option key={i} value={i}>{w}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Время</label>
                <input type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Длительность (мин)</label>
                <input type="number" value={editForm.duration_minutes} onChange={e => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })} style={{ ...inputStyle, width: '90px' }} />
              </div>
              <div style={{ minWidth: '200px' }}>
                <label style={labelStyle}>Предмет</label>
                <SubjectPicker value={editForm.subject} onChange={v => setEditForm({ ...editForm, subject: v })} />
              </div>
              <div>
                <label style={labelStyle}>Цена, ₽</label>
                <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={{ ...inputStyle, width: '100px' }} placeholder="по умолчанию" />
              </div>
              <div>
                <label style={labelStyle}>Дата вступления в силу</label>
                <input type="date" value={editForm.effective_date} onChange={e => setEditForm({ ...editForm, effective_date: e.target.value })} style={inputStyle} />
              </div>
            </div>
            {editError && <p style={{ color: 'var(--t-danger)', fontSize: '13px', marginBottom: '10px' }}>{editError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setEditForm(null)} style={{ ...accentButtonStyle, background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)' }}>Отмена</button>
              <button onClick={submitEdit} disabled={editSaving} style={editSaving ? submitButtonDisabledStyle : accentSubmitStyle}>
                {editSaving ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={labelStyle}>Применить шаблон</label>
          <select
            value={selectedPreset}
            onChange={e => onPeriodSelectChange(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: '220px' }}
            className={highlightDropdown ? 't-reminder-pulse' : undefined}
          >
            <option value="" disabled>Выбери период</option>
            <option value="may">До конца учебного года (31 мая)</option>
            <option value="newyear">До Нового года</option>
            <option value="custom">Выбрать другой промежуток…</option>
          </select>
          {selectedPreset === 'custom' && customConfirmed && (
            <span style={{ color: 'var(--t-text-secondary)', fontSize: '13px' }}>({customWeeksInput} нед.)</span>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || templates.length === 0 || !periodReady}
            className={highlightButton ? 't-reminder-pulse' : undefined}
            style={generating || templates.length === 0 || !periodReady ? submitButtonDisabledStyle : accentSubmitStyle}
          >
            {generating ? 'Добавляем...' : '⚡ Добавить в расписание'}
          </button>
          {resultMsg && <span style={{ color: 'var(--t-text-secondary)', fontSize: '13px' }}>{resultMsg}</span>}
        </div>

        {customWeeksModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'var(--t-overlay)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: 'var(--t-card)', border: `1px solid ${ACCENT}`, borderRadius: '16px', padding: '1.5rem', width: '90%', maxWidth: '340px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Другой промежуток</div>
              <label style={labelStyle}>Сколько недель вперёд?</label>
              <input
                type="number" min={1} max={120} value={customWeeksInput}
                onChange={e => setCustomWeeksInput(Number(e.target.value))}
                style={{ ...inputStyle, marginBottom: '14px' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={cancelCustomWeeks} style={{ ...accentButtonStyle, background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)' }}>Отмена</button>
                <button onClick={confirmCustomWeeks} style={accentSubmitStyle}>Подтвердить</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
