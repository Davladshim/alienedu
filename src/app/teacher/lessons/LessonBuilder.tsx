'use client'
import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { blockRegistry, blockTypes, type BlockType, type LessonBlockData } from '@/components/lesson-blocks'
import { inputStyle, labelStyle, textareaStyle, submitButtonStyle, submitButtonDisabledStyle } from '@/components/lesson-blocks/styles'
import { LessonPreview } from './LessonPreview'
import { LessonAssignment } from './LessonAssignment'

export interface LessonMeta {
  title: string
  subject: string
  grade: number | ''
  status: 'draft' | 'published'
  mode: 'quiz' | 'exam'
}

function iconBtnStyle(disabled: boolean, danger?: boolean): CSSProperties {
  return {
    background: 'none', border: '1px solid #2a2d3d', borderRadius: '6px',
    width: '26px', height: '26px', fontSize: '12px',
    color: disabled ? '#374151' : danger ? '#ef4444' : '#9ca3af',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export function LessonBuilder({
  backHref,
  lessonId,
  initialTitle = '',
  initialSubject = '',
  initialGrade = '',
  initialStatus = 'draft',
  initialMode = 'quiz',
  initialBlocks = [],
  initialAssignedStudentIds = [],
  saving,
  error,
  onSave,
  onDelete,
}: {
  backHref: string
  lessonId?: string
  initialTitle?: string
  initialSubject?: string
  initialGrade?: number | ''
  initialStatus?: 'draft' | 'published'
  initialMode?: 'quiz' | 'exam'
  initialBlocks?: LessonBlockData[]
  initialAssignedStudentIds?: number[]
  saving: boolean
  error: string
  onSave: (meta: LessonMeta, blocks: LessonBlockData[]) => void
  onDelete?: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [subject, setSubject] = useState(initialSubject)
  const [grade, setGrade] = useState<number | ''>(initialGrade)
  const [status, setStatus] = useState<'draft' | 'published'>(initialStatus)
  const [mode, setMode] = useState<'quiz' | 'exam'>(initialMode)
  const [blocks, setBlocks] = useState<LessonBlockData[]>(initialBlocks)
  const [previewing, setPreviewing] = useState(false)

  function addBlock(type: BlockType) {
    const def = blockRegistry[type]
    setBlocks(bs => [...bs, { id: `b${Date.now()}${Math.random().toString(36).slice(2)}`, type, content: def.defaultContent }])
  }
  function updateBlockContent(id: string, content: any) {
    setBlocks(bs => bs.map(b => (b.id === id ? { ...b, content } : b)))
  }
  function removeBlock(id: string) {
    setBlocks(bs => bs.filter(b => b.id !== id))
  }
  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks(bs => {
      const i = bs.findIndex(b => b.id === id)
      const j = i + dir
      if (j < 0 || j >= bs.length) return bs
      const copy = [...bs]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  if (previewing) {
    return <LessonPreview blocks={blocks} onExit={() => setPreviewing(false)} />
  }

  const canSave = title.trim().length > 0 && blocks.length > 0 && !saving

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <button onClick={() => router.push(backHref)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>
            ← Мои уроки
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📚 Конструктор урока</h1>
        </div>

        {/* Название/предмет/класс */}
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '220px' }}>
              <label style={labelStyle}>Название урока</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Например: Квадратные уравнения" />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={labelStyle}>Предмет</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} placeholder="Математика" />
            </div>
            <div style={{ width: '110px' }}>
              <label style={labelStyle}>Класс</label>
              <input
                type="number"
                value={grade}
                onChange={e => setGrade(e.target.value ? Number(e.target.value) : '')}
                style={inputStyle}
                placeholder="9"
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', cursor: 'pointer', fontSize: '14px', color: '#9ca3af' }}>
            <input
              type="checkbox"
              checked={status === 'published'}
              onChange={e => setStatus(e.target.checked ? 'published' : 'draft')}
            />
            Опубликован (виден назначенным ученикам)
          </label>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Режим прохождения</label>
            <select value={mode} onChange={e => setMode(e.target.value === 'exam' ? 'exam' : 'quiz')} style={{ ...inputStyle, maxWidth: '280px' }}>
              <option value="quiz">Проверочная — сразу видно верно/неверно</option>
              <option value="exam">Контрольная — без подсказок, разбор в конце</option>
            </select>
          </div>
        </div>

        {lessonId && (
          <LessonAssignment lessonId={lessonId} initialAssignedIds={initialAssignedStudentIds} />
        )}

        {/* Блоки */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.5rem' }}>
          {blocks.map((block, i) => {
            const def = blockRegistry[block.type]
            const Editor = def.Editor
            return (
              <div key={block.id} style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{def.icon} {i + 1}. {def.label}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => moveBlock(block.id, -1)} disabled={i === 0} style={iconBtnStyle(i === 0)}>↑</button>
                    <button onClick={() => moveBlock(block.id, 1)} disabled={i === blocks.length - 1} style={iconBtnStyle(i === blocks.length - 1)}>↓</button>
                    <button onClick={() => removeBlock(block.id)} style={iconBtnStyle(false, true)}>✕</button>
                  </div>
                </div>
                <Editor content={block.content} onChange={(c: any) => updateBlockContent(block.id, c)} />
                {def.checkAnswer !== null && (
                  <BlockRetrySettings content={block.content} onChange={c => updateBlockContent(block.id, c)} mode={mode} />
                )}
              </div>
            )
          })}

          {blocks.length === 0 && (
            <div style={{ background: '#1a1d27', border: '1px dashed #2a2d3d', borderRadius: '16px', padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '14px' }}>
              Добавь первый блок урока ниже
            </div>
          )}
        </div>

        {/* Добавить блок */}
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontWeight: 600 }}>Добавить блок</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {blockTypes.map(t => (
              <button
                key={t}
                onClick={() => addBlock(t)}
                style={{
                  background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7', color: '#4f8ef7',
                  borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer',
                }}
              >
                {blockRegistry[t].icon} {blockRegistry[t].label}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} style={{
                background: 'transparent', border: '1px solid #7f1d1d', color: '#fca5a5',
                borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer',
              }}>
                Удалить урок
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setPreviewing(true)}
              disabled={blocks.length === 0}
              style={{
                background: 'transparent', border: '1px solid #2a2d3d',
                color: blocks.length === 0 ? '#4b5563' : '#9ca3af',
                borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
                cursor: blocks.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              👁 Предпросмотр
            </button>
            <button
              onClick={() => onSave({ title, subject, grade, status, mode }, blocks)}
              disabled={!canSave}
              style={canSave ? submitButtonStyle : submitButtonDisabledStyle}
            >
              {saving ? 'Сохраняем...' : '💾 Сохранить'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// Настройки повторных попыток и объяснения — общие для любого блока
// с автопроверкой, хранятся прямо в JSON-содержимом блока (без отдельных
// полей БД), поэтому вынесены сюда одним компонентом вместо повторения
// в каждом Editor'е блока
function BlockRetrySettings({ content, onChange, mode }: { content: any; onChange: (content: any) => void; mode: 'quiz' | 'exam' }) {
  const retryable = !!content.retryable
  const maxAttempts = content.maxAttempts ?? 2

  return (
    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #2a2d3d' }}>
      {mode === 'exam' ? (
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '10px' }}>
          В режиме «Контрольная» повторные попытки недоступны — ответ фиксируется сразу
        </div>
      ) : (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#9ca3af', marginBottom: retryable ? '10px' : 0 }}>
            <input
              type="checkbox"
              checked={retryable}
              onChange={e => onChange({ ...content, retryable: e.target.checked })}
            />
            Разрешить перерешать при неверном ответе
          </label>
          {retryable && (
            <div style={{ marginBottom: '10px' }}>
              <label style={labelStyle}>Максимум попыток</label>
              <input
                type="number"
                min={2}
                value={maxAttempts}
                onChange={e => onChange({ ...content, maxAttempts: Math.max(2, Number(e.target.value) || 2) })}
                style={{ ...inputStyle, width: '90px' }}
              />
            </div>
          )}
        </>
      )}
      <label style={labelStyle}>Объяснение (необязательно, покажется ученику после попыток)</label>
      <textarea
        value={content.explanation || ''}
        onChange={e => onChange({ ...content, explanation: e.target.value })}
        rows={2}
        style={textareaStyle}
        placeholder="Почему ответ именно такой..."
      />
    </div>
  )
}
