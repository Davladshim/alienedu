'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { submitButtonStyle, submitButtonDisabledStyle } from '@/components/lesson-blocks/styles'

export function LessonAssignment({ lessonId, initialAssignedIds }: {
  lessonId: string
  initialAssignedIds: number[]
}) {
  const [roster, setRoster] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number[]>(initialAssignedIds)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => {
        setRoster(data.students || [])
        setLoading(false)
      })
  }, [])

  function toggle(studentId: number) {
    setSaved(false)
    setSelected(sel => sel.includes(studentId) ? sel.filter(id => id !== studentId) : [...sel, studentId])
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/lessons/${lessonId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_ids: selected }),
    })
    setSaving(false)
    if (res.ok) setSaved(true)
  }

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontWeight: 600 }}>
        Кому назначить урок
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: '14px' }}>Загрузка...</p>}

      {!loading && roster.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          В твоём списке пока нет учеников. <Link href="/teacher/students" style={{ color: '#4f8ef7' }}>Добавить учеников →</Link>
        </p>
      )}

      {roster.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          {roster.map(student => (
            <label key={student.student_id} style={{
              display: 'flex', gap: '10px', alignItems: 'center',
              padding: '8px 12px', border: '1px solid #2a2d3d', borderRadius: '8px', cursor: 'pointer',
              background: selected.includes(student.student_id) ? 'rgba(79,142,247,0.1)' : 'transparent',
            }}>
              <input
                type="checkbox"
                checked={selected.includes(student.student_id)}
                onChange={() => toggle(student.student_id)}
              />
              <span style={{ fontSize: '14px' }}>{student.full_name}</span>
              {student.is_placeholder ? (
                <span style={{ color: '#fbbf24', fontSize: '12px' }}>не зарегистрирован</span>
              ) : (
                <span style={{ color: '#6b7280', fontSize: '12px' }}>@{student.login}</span>
              )}
            </label>
          ))}
        </div>
      )}

      {roster.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleSave} disabled={saving} style={saving ? submitButtonDisabledStyle : submitButtonStyle}>
            {saving ? 'Сохраняем...' : 'Сохранить назначение'}
          </button>
          {saved && <span style={{ color: '#34d399', fontSize: '13px' }}>✅ Сохранено</span>}
        </div>
      )}
    </div>
  )
}
