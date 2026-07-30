'use client'
import { useState, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { blockRegistry, blockTypes, groupBlocksIntoPages, getGroupId, GROUP_ID_FIELD, type BlockType, type LessonBlockData } from '@/components/lesson-blocks'
import { inputStyle, labelStyle, textareaStyle, submitButtonStyle, submitButtonDisabledStyle, smallButtonStyle } from '@/components/lesson-blocks/styles'
import { FormulaTextarea } from '@/components/lesson-blocks/FormulaTextarea'
import { LessonPreview } from './LessonPreview'
import { LessonAssignment } from './LessonAssignment'

export interface LessonMeta {
  title: string
  subject: string
  grade: number | ''
  status: 'draft' | 'published'
  mode: 'quiz' | 'exam'
  isPublic: boolean
  libraryDescription: string
}

function stripGroupId(content: any): any {
  if (!content || !(GROUP_ID_FIELD in content)) return content
  const rest = { ...content }
  delete rest[GROUP_ID_FIELD]
  return rest
}

function iconBtnStyle(disabled: boolean, danger?: boolean): CSSProperties {
  return {
    background: 'none', border: '1px solid var(--t-border)', borderRadius: '6px',
    width: '26px', height: '26px', fontSize: '12px',
    color: disabled ? 'var(--t-text-faint)' : danger ? 'var(--t-danger)' : 'var(--t-text-secondary)',
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
  initialLibraryDescription = '',
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
  initialLibraryDescription?: string
  initialBlocks?: LessonBlockData[]
  initialAssignedStudentIds?: number[]
  locked?: boolean
  authorName?: string | null
  canPublishToLibrary?: boolean
  saving: boolean
  error: string
  onSave: (meta: LessonMeta, blocks: LessonBlockData[]) => Promise<boolean>
  onDelete?: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [subject, setSubject] = useState(initialSubject)
  const [grade, setGrade] = useState<number | ''>(initialGrade)
  const [status, setStatus] = useState<'draft' | 'published'>(initialStatus)
  const [mode, setMode] = useState<'quiz' | 'exam'>(initialMode)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [libraryDescription, setLibraryDescription] = useState(initialLibraryDescription)
  const [blocks, setBlocks] = useState<LessonBlockData[]>(initialBlocks)
  const [previewing, setPreviewing] = useState(false)
  const [mergeSelection, setMergeSelection] = useState<Set<string>>(new Set())

  // Автосохранение черновика в localStorage — если браузер перезагрузится
  // или пропадёт питание посреди составления большого урока из кучи блоков,
  // несохранённая работа не должна пропадать бесследно
  const draftKey = `alienedu_lesson_draft_${lessonId || 'new'}`
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)
  // Пока не решили, что делать с найденным черновиком (восстановить/не
  // нужно), автосохранение выключено — иначе оно тут же затирает найденный
  // черновик пустым состоянием формы ещё до того, как пользователь успеет
  // нажать "Восстановить"
  const [draftChecked, setDraftChecked] = useState(false)

  useEffect(() => {
    // Чтение localStorage вынесено в микротаск, а не вызывается прямо в теле
    // эффекта — так же, как статус подписки у useLiveChannel приходит через
    // callback, а не прямым вызовом setState в эффекте
    queueMicrotask(() => {
      if (locked) {
        setDraftChecked(true)
        return
      }
      try {
        const raw = localStorage.getItem(draftKey)
        if (raw) {
          const draft = JSON.parse(raw)
          if (draft && typeof draft.savedAt === 'number') {
            setDraftSavedAt(draft.savedAt)
            return
          }
        }
      } catch {
        // повреждённый черновик — просто игнорируем
      }
      setDraftChecked(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (locked || !draftChecked) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, subject, grade, status, mode, isPublic, libraryDescription, blocks, savedAt: Date.now() }))
      } catch {
        // например, localStorage переполнен или недоступен (приватный режим) — ничего страшного
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [locked, draftChecked, draftKey, title, subject, grade, status, mode, isPublic, libraryDescription, blocks])

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const draft = JSON.parse(raw)
        setTitle(draft.title ?? '')
        setSubject(draft.subject ?? '')
        setGrade(draft.grade ?? '')
        setStatus(draft.status ?? 'draft')
        setMode(draft.mode ?? 'quiz')
        setIsPublic(draft.isPublic ?? false)
        setLibraryDescription(draft.libraryDescription ?? '')
        setBlocks(draft.blocks ?? [])
      }
    } catch {
      // повреждённый черновик — просто игнорируем
    }
    setDraftSavedAt(null)
    setDraftChecked(true)
  }

  function discardDraft() {
    try {
      localStorage.removeItem(draftKey)
    } catch {
      // недоступен localStorage — нечего и удалять
    }
    setDraftSavedAt(null)
    setDraftChecked(true)
  }

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
  // Удаление одного блока — если это был предпоследний блок в группе,
  // группа автоматически распадается (объединение из одного блока не имеет смысла)
  function removeBlock(id: string) {
    setBlocks(bs => {
      const filtered = bs.filter(b => b.id !== id)
      const pages = groupBlocksIntoPages(filtered)
      return pages.flatMap(page => (page.length === 1 && getGroupId(page[0]))
        ? [{ ...page[0], content: stripGroupId(page[0].content) }]
        : page)
    })
    setMergeSelection(s => {
      if (!s.has(id)) return s
      const copy = new Set(s)
      copy.delete(id)
      return copy
    })
  }
  // Перемещение целой "страницы" (одиночный блок или объединённая группа) —
  // соседние страницы просто меняются местами целиком
  function movePage(pageIndex: number, dir: -1 | 1) {
    setBlocks(bs => {
      const pages = groupBlocksIntoPages(bs)
      const j = pageIndex + dir
      if (j < 0 || j >= pages.length) return bs
      const copy = [...pages]
      ;[copy[pageIndex], copy[j]] = [copy[j], copy[pageIndex]]
      return copy.flat()
    })
  }
  function removePage(pageIndex: number) {
    setBlocks(bs => {
      const pages = groupBlocksIntoPages(bs)
      return pages.filter((_, i) => i !== pageIndex).flat()
    })
  }
  function ungroupPage(pageIndex: number) {
    setBlocks(bs => {
      const pages = groupBlocksIntoPages(bs)
      const target = pages[pageIndex]
      if (!target) return bs
      const targetIds = new Set(target.map(b => b.id))
      return bs.map(b => (targetIds.has(b.id) ? { ...b, content: stripGroupId(b.content) } : b))
    })
  }
  function toggleMergeSelect(id: string) {
    setMergeSelection(s => {
      const copy = new Set(s)
      if (copy.has(id)) copy.delete(id)
      else copy.add(id)
      return copy
    })
  }

  const selectedIndices = blocks
    .map((b, i) => ({ id: b.id, i }))
    .filter(({ id }) => mergeSelection.has(id))
    .map(({ i }) => i)
    .sort((a, b) => a - b)
  const canMerge = selectedIndices.length >= 2 &&
    selectedIndices[selectedIndices.length - 1] - selectedIndices[0] + 1 === selectedIndices.length
  const mergeButtonAfterIndex = canMerge ? selectedIndices[selectedIndices.length - 1] : -1

  function mergeSelected() {
    if (!canMerge) return
    const gid = `g${Date.now()}${Math.random().toString(36).slice(2)}`
    setBlocks(bs => bs.map(b => (mergeSelection.has(b.id) ? { ...b, content: { ...b.content, [GROUP_ID_FIELD]: gid } } : b)))
    setMergeSelection(new Set())
  }

  if (previewing) {
    return <LessonPreview blocks={blocks} onExit={() => setPreviewing(false)} />
  }

  const canSave = title.trim().length > 0 && blocks.length > 0 && !saving && (!isPublic || libraryDescription.trim().length > 0)

  return (
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <button onClick={() => router.push(backHref)} style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '14px' }}>
            ← Мои уроки
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📚 Конструктор урока</h1>
        </div>

        {draftSavedAt && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            background: 'rgba(var(--t-warning-rgb),0.1)', border: '1px solid rgba(var(--t-warning-rgb),0.4)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '1.5rem', fontSize: '13px', color: 'var(--t-warning)',
          }}>
            <span>
              Найден несохранённый черновик от {new Date(draftSavedAt).toLocaleString('ru-RU')} — восстановить?
            </span>
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button onClick={restoreDraft} style={{
                background: 'rgba(var(--t-warning-rgb),0.2)', border: '1px solid var(--t-warning)', color: 'var(--t-warning)',
                borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
              }}>
                Восстановить
              </button>
              <button onClick={discardDraft} style={{
                background: 'transparent', border: '1px solid var(--t-border)', color: 'var(--t-text-secondary)',
                borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
              }}>
                Не нужно
              </button>
            </div>
          </div>
        )}

        {/* Название/предмет/класс */}
        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
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

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', cursor: 'pointer', fontSize: '14px', color: 'var(--t-text-secondary)' }}>
            <input
              type="checkbox"
              checked={status === 'published'}
              onChange={e => setStatus(e.target.checked ? 'published' : 'draft')}
            />
            Опубликован (виден назначенным ученикам)
          </label>

          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '14px', color: 'var(--t-text-secondary)',
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
            <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginTop: '4px', marginLeft: '24px' }}>
              Публикация в библиотеке доступна на тарифе Pro
            </div>
          )}
          {canPublishToLibrary && isPublic && status !== 'published' && (
            <div style={{ color: 'var(--t-warning)', fontSize: '12px', marginTop: '4px', marginLeft: '24px' }}>
              Появится в библиотеке только после публикации самого урока (галочка выше)
            </div>
          )}
          {canPublishToLibrary && isPublic && (
            <div style={{ marginTop: '10px', marginLeft: '24px' }}>
              <label style={labelStyle}>Описание урока для библиотеки</label>
              <textarea
                value={libraryDescription}
                onChange={e => setLibraryDescription(e.target.value)}
                placeholder="Обязательное поле — опиши урок, чтобы другие репетиторы поняли, подойдёт ли он им"
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
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
          {(() => {
            const pages = groupBlocksIntoPages(blocks)
            const startIndices: number[] = []
            {
              let running = 0
              for (const p of pages) {
                startIndices.push(running)
                running += p.length
              }
            }
            return pages.map((page, pageIndex) => {
              const startIndex = startIndices[pageIndex]
              const pageNumber = pageIndex + 1
              const isGroup = page.length > 1

              if (!isGroup) {
                const block = page[0]
                const def = blockRegistry[block.type]
                const Editor = def.Editor
                const showMergeButton = mergeButtonAfterIndex === startIndex
                return (
                  <div key={block.id}>
                    <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--t-text-muted)', fontWeight: 600 }}>{def.icon} {pageNumber}. {def.label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--t-text-muted)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={mergeSelection.has(block.id)} onChange={() => toggleMergeSelect(block.id)} />
                            Объединить
                          </label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => movePage(pageIndex, -1)} disabled={pageIndex === 0} style={iconBtnStyle(pageIndex === 0)}>↑</button>
                            <button onClick={() => movePage(pageIndex, 1)} disabled={pageIndex === pages.length - 1} style={iconBtnStyle(pageIndex === pages.length - 1)}>↓</button>
                            <button onClick={() => removeBlock(block.id)} style={iconBtnStyle(false, true)}>✕</button>
                          </div>
                        </div>
                      </div>
                      <Editor content={block.content} onChange={(c: any) => updateBlockContent(block.id, c)} />
                      {def.checkAnswer !== null && (
                        <BlockRetrySettings content={block.content} onChange={c => updateBlockContent(block.id, c)} mode={mode} />
                      )}
                    </div>
                    {showMergeButton && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <button onClick={mergeSelected} style={smallButtonStyle}>
                          🔗 Объединить в один
                        </button>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div key={page[0].content[GROUP_ID_FIELD]} style={{ border: '1px solid var(--t-accent)', borderRadius: '16px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--t-accent)', fontWeight: 700 }}>🔗 {pageNumber}. Объединённые блоки ({page.length})</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => movePage(pageIndex, -1)} disabled={pageIndex === 0} style={iconBtnStyle(pageIndex === 0)}>↑</button>
                      <button onClick={() => movePage(pageIndex, 1)} disabled={pageIndex === pages.length - 1} style={iconBtnStyle(pageIndex === pages.length - 1)}>↓</button>
                      <button onClick={() => ungroupPage(pageIndex)} style={{ ...iconBtnStyle(false), width: 'auto', padding: '0 10px', fontSize: '12px' }}>Разъединить</button>
                      <button onClick={() => removePage(pageIndex)} style={iconBtnStyle(false, true)}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {page.map(block => {
                      const def = blockRegistry[block.type]
                      const Editor = def.Editor
                      return (
                        <div key={block.id} style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '12px', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--t-text-muted)', fontWeight: 600 }}>{def.icon} {def.label}</div>
                            <button onClick={() => removeBlock(block.id)} style={iconBtnStyle(false, true)}>✕</button>
                          </div>
                          <Editor content={block.content} onChange={(c: any) => updateBlockContent(block.id, c)} />
                          {def.checkAnswer !== null && (
                            <BlockRetrySettings content={block.content} onChange={c => updateBlockContent(block.id, c)} mode={mode} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          })()}

          {blocks.length === 0 && (
            <div style={{ background: 'var(--t-card)', border: '1px dashed var(--t-border)', borderRadius: '16px', padding: '2rem', textAlign: 'center', color: 'var(--t-text-faint)', fontSize: '14px' }}>
              Добавь первый блок урока ниже
            </div>
          )}
        </div>

        {/* Добавить блок */}
        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '13px', color: 'var(--t-text-muted)', marginBottom: '10px', fontWeight: 600 }}>Добавить блок</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {blockTypes.map(t => (
              <button
                key={t}
                onClick={() => addBlock(t)}
                style={{
                  background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)',
                  borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer',
                }}
              >
                {blockRegistry[t].icon} {blockRegistry[t].label}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: 'var(--t-danger)', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} style={{
                background: 'transparent', border: '1px solid var(--t-danger-bg)', color: 'var(--t-danger-soft)',
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
                background: 'transparent', border: '1px solid var(--t-border)',
                color: blocks.length === 0 ? 'var(--t-text-faint)' : 'var(--t-text-secondary)',
                borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
                cursor: blocks.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              👁 Предпросмотр
            </button>
            <button
              onClick={async () => {
                const ok = await onSave({ title, subject, grade, status, mode, isPublic, libraryDescription }, blocks)
                if (ok) discardDraft()
              }}
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
    <div style={{ minHeight: '100%', background: 'var(--t-bg)', color: 'var(--t-text)', fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
          <button onClick={() => router.push(backHref)} style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '14px' }}>
            ← Мои уроки
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📚 {title}</h1>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--t-info)',
          background: 'rgba(var(--t-info-rgb),0.12)', border: '1px solid rgba(var(--t-info-rgb),0.35)',
          borderRadius: '20px', padding: '4px 12px', marginBottom: '1.5rem',
        }}>
          📖 Из библиотеки{authorName ? ` · автор: ${authorName}` : ''}
        </div>

        <div style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', color: 'var(--t-text-secondary)', fontSize: '14px' }}>
          <div>{[subject, grade ? `${grade} класс` : null].filter(Boolean).join(' · ') || 'Без предмета'}</div>
          <div style={{ marginTop: '4px' }}>{mode === 'exam' ? 'Контрольная — без подсказок, разбор в конце' : 'Проверочная — сразу видно верно/неверно'}</div>
          <div style={{ marginTop: '10px', color: 'var(--t-text-muted)', fontSize: '12px' }}>
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
              <div key={block.id} style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ fontSize: '13px', color: 'var(--t-text-muted)', fontWeight: 600, marginBottom: '6px' }}>{def.icon} {i + 1}. {def.label}</div>
                <div style={{ fontSize: '14px', color: 'var(--t-text-secondary)' }}>{blockPreviewText(block)}</div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} style={{
                background: 'transparent', border: '1px solid var(--t-danger-bg)', color: 'var(--t-danger-soft)',
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
              background: 'transparent', border: '1px solid var(--t-border)',
              color: blocks.length === 0 ? 'var(--t-text-faint)' : 'var(--t-text-secondary)',
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
    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--t-border)' }}>
      {mode === 'exam' ? (
        <div style={{ color: 'var(--t-text-muted)', fontSize: '12px', marginBottom: '10px' }}>
          В режиме «Контрольная» повторные попытки недоступны — ответ фиксируется сразу
        </div>
      ) : (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--t-text-secondary)', marginBottom: retryable ? '10px' : 0 }}>
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
      <FormulaTextarea
        value={content.explanation || ''}
        onChange={explanation => onChange({ ...content, explanation })}
        rows={2}
        placeholder="Почему ответ именно такой..."
      />
    </div>
  )
}
