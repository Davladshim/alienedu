'use client'
import { useEffect, useState } from 'react'
import { FormulaTextarea } from './FormulaTextarea'
import { InteractiveModelFrame } from './InteractiveModelFrame'
import { labelStyle, inputStyle } from './styles'

export interface InteractiveModelContent {
  modelId: number | null
  description: string
}

export const interactiveModelDefault: InteractiveModelContent = { modelId: null, description: '' }

interface ModelSummary {
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
}

export function InteractiveModelEditor({ content, onChange }: {
  content: InteractiveModelContent
  onChange: (content: InteractiveModelContent) => void
}) {
  const [models, setModels] = useState<ModelSummary[]>([])
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (subject) params.set('subject', subject)
    let cancelled = false
    fetch(`/api/interactive-models?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setModels(data.models || [])
        setLoadedOnce(true)
      })
    return () => { cancelled = true }
  }, [query, subject])

  const subjects = Array.from(new Set(models.map(m => m.subject))).sort()
  const selected = models.find(m => m.id === content.modelId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск по названию или теме..."
          style={{ ...inputStyle, flex: 2, minWidth: '200px' }}
        />
        <select value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '150px', cursor: 'pointer' }}>
          <option value="">Все предметы</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!loadedOnce ? (
        <div style={{ color: '#6b7280', fontSize: '13px' }}>Загрузка...</div>
      ) : models.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: '13px' }}>Моделей пока нет — обратитесь к администратору, чтобы пополнить банк.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', maxHeight: '320px', overflowY: 'auto', padding: '2px' }}>
          {models.map(m => {
            const isSelected = m.id === content.modelId
            return (
              <div
                key={m.id}
                onClick={() => onChange({ ...content, modelId: m.id })}
                style={{
                  cursor: 'pointer', borderRadius: '8px', padding: '8px',
                  border: `1px solid ${isSelected ? '#4f8ef7' : '#2a2d3d'}`,
                  background: isSelected ? 'rgba(79,142,247,0.1)' : '#1a1d27',
                }}
              >
                <div style={{ pointerEvents: 'none', overflow: 'hidden', borderRadius: '4px', marginBottom: '6px' }}>
                  <div style={{ transform: `scale(${Math.min(1, 124 / m.frame_width)})`, transformOrigin: 'top left', width: `${m.frame_width}px`, height: `${m.frame_height}px` }}>
                    <InteractiveModelFrame
                      htmlCode={m.html_code} frameWidth={m.frame_width} frameHeight={m.frame_height}
                      offsetX={m.offset_x} offsetY={m.offset_y} scale={Number(m.scale)}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>{m.title}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{m.subject}{m.topic && ` · ${m.topic}`}</div>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div style={{ color: '#34d399', fontSize: '12px' }}>✓ Выбрана модель «{selected.title}»</div>
      )}

      <label style={{ ...labelStyle, marginTop: '4px' }}>Описание/пояснение к модели (необязательно)</label>
      <FormulaTextarea
        value={content.description}
        onChange={description => onChange({ ...content, description })}
        rows={3}
        placeholder="Например: покрути молекулу и найди угол между связями"
      />
    </div>
  )
}

export function InteractiveModelPlayer({ content }: { content: InteractiveModelContent }) {
  const [model, setModel] = useState<ModelSummary | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!content.modelId) return
    fetch(`/api/interactive-models/${content.modelId}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then(data => { if (data) setModel(data.model) })
      .catch(() => setNotFound(true))
  }, [content.modelId])

  if (!content.modelId) {
    return <div style={{ color: '#6b7280', fontSize: '13px' }}>Модель не выбрана</div>
  }

  return (
    <div>
      {content.description && (
        <div style={{ marginBottom: '12px', lineHeight: 1.6, fontSize: '15px' }}>{content.description}</div>
      )}
      {notFound && (
        <div style={{ color: '#ef4444', fontSize: '13px' }}>Модель была удалена из банка администратором</div>
      )}
      {!notFound && !model && (
        <div style={{ color: '#6b7280', fontSize: '13px' }}>Загрузка модели...</div>
      )}
      {model && (
        <InteractiveModelFrame
          htmlCode={model.html_code} frameWidth={model.frame_width} frameHeight={model.frame_height}
          offsetX={model.offset_x} offsetY={model.offset_y} scale={Number(model.scale)}
          bare
        />
      )}
    </div>
  )
}
