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
  isPublic: boolean
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
  initialIsPublic = false,
  initialBlocks = [],
  initialAssignedStudentIds = [],
  locked = false,
  authorName = null,
  canPublishToLibrary = true,
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
  initialIsPublic?: boolean
  initialBlocks?: LessonBlockData[]
  initialAssignedStudentIds?: number[]
  locked?: boolean
  authorName?: string | null
  canPublishToLibrary?: boolean
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
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [blocks, setBlocks] = useState<LessonBlockData[]>(initialBlocks)
  const [previewing, setPreviewing] = useState(false)

  if (locked) {
    return (
      <LockedLessonView
        backHref={backHref}
        lessonId={lessonId}
        title={title}
        subject={subject}
        grade={grade}
        mode={mode}
        authorName={authorName}
        blocks={blocks}
        initialAssignedStudentIds={initialAssignedStudentIds}
        onDelete={onDelete}
      />
    )
  }

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

          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '14px', color: '#9ca3af',
            cursor: canPublishToLibrary ? 'pointer' : 'not-allowed',
          }}>
            <input
              type="checkbox"
              checked={isPublic}
              disabled={!canPublishToLibrary}
              onChange={e => setIsPublic(e.target.checked)}
            />
            Опубликовать в библиотеке (виден другим репетиторам, они смогут добавить его себе)
          </label>
          {!canPublishToLibrary && (
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', marginLeft: '24px' }}>
              Публикация в библиотеке доступна на тарифе Pro
            </div>
          )}
          {canPublishToLibrary && isPublic && status !== 'published' && (
            <div style={{ color: '#fbbf24', fontSize: '12px', marginTop: '4px', marginLeft: '24px' }}>
              Появится в библиотеке только после публикации самого урока (галочка выше)
            </div>
          )}

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
              onClick={() => onSave({ title, subject, grade, status, mode, isPublic }, blocks)}
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

function blockPreviewText(block: LessonBlockData): string {
  const c = block.content
  if (typeof c.question === 'string' && c.question) return c.question
  if (typeof c.instruction === 'string' && c.instruction) return c.instruction
  if (typeof c.template === 'string' && c.template) return c.template
  return blockRegistry[block.type].label
}

// Урок, скопированный из библиотеки другого репетитора — только просмотр
// и назначение ученикам, редактировать содержимое нельзя (см. проверку
// locked на сервере в PUT /api/lessons/[id])
function LockedLessonView({
  backHref, lessonId, title, subject, grade, mode, authorName, blocks, initialAssignedStudentIds, onDelete,
}: {
  backHref: string
  lessonId?: string
  title: string
  subject: string
  grade: number | ''
  mode: 'quiz' | 'exam'
  authorName?: string | null
  blocks: LessonBlockData[]
  initialAssignedStudentIds: number[]
  onDelete?: () => void
}) {
  const router = useRouter()
  const [previewing, setPreviewing] = useState(false)

  if (previewing) {
    return <LessonPreview blocks={blocks} onExit={() => setPreviewing(false)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
          <button onClick={() => router.push(backHref)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>
            ← Мои уроки
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📚 {title}</h1>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#93c5fd',
          background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)',
          borderRadius: '20px', padding: '4px 12px', marginBottom: '1.5rem',
        }}>
          📖 Из библиотеки{authorName ? ` · автор: ${authorName}` : ''}
        </div>

        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', color: '#9ca3af', fontSize: '14px' }}>
          <div>{[subject, grade ? `${grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}</div>
          <div style={{ marginTop: '4px' }}>{mode === 'exam' ? 'Контрольная — без подсказок, разбор в конце' : 'Проверочная — сразу видно верно/неверно'}</div>
          <div style={{ marginTop: '10px', color: '#6b7280', fontSize: '12px' }}>
            Этот урок скопирован из библиотеки и доступен только для просмотра — менять его содержимое нельзя,
            но можно назначать своим ученикам.
          </div>
        </div>

        {lessonId && (
          <LessonAssignment lessonId={lessonId} initialAssignedIds={initialAssignedStudentIds} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
          {blocks.map((block, i) => {
            const def = blockRegistry[block.type]
            return (
              <div key={block.id} style={{ background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>{def.icon} {i + 1}. {def.label}</div>
                <div style={{ fontSize: '14px', color: '#e5e7eb' }}>{blockPreviewText(block)}</div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} style={{
                background: 'transparent', border: '1px solid #7f1d1d', color: '#fca5a5',
                borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer',
              }}>
                Убрать из своего списка
              </button>
            )}
          </div>
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
