'use client'
import { useRef, useState } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { GeometryBoard, type GeometryBoardHandle } from './GeometryBoard'
import { ConditionBoardEditor, ConditionBoardViewer } from './ConditionBoard'
import { compressPhoto } from './photoUpload'
import { labelStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface GeometryContent {
  question: string
  explanation?: string
  // Доска для решения — ученик строит на ней черновик (по умолчанию включена,
  // undefined трактуется как true ради обратной совместимости со старыми уроками)
  solutionBoard?: boolean
  // Доска для условия — учитель заранее рисует чертёж к задаче в конструкторе,
  // ученик видит его только для просмотра
  conditionBoard?: boolean
  conditionBoardState?: string | null
}

export const geometryDefault: GeometryContent = { question: '' }

export interface GeometryAnswer {
  drawing: string | null
  solutionText: string
  photo: string | null
}

export function GeometryEditor({ content, onChange }: {
  content: GeometryContent
  onChange: (content: GeometryContent) => void
}) {
  const solutionBoard = content.solutionBoard !== false
  const conditionBoard = !!content.conditionBoard

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Условие задачи</label>
      <FormulaTextarea
        value={content.question}
        onChange={question => onChange({ ...content, question })}
        rows={3}
        placeholder="Например: В треугольнике ABC угол A равен 60°. Найдите..."
      />
      <div style={{ color: 'var(--t-text-muted)', fontSize: '12px' }}>
        Ученик может построить чертёж в GeoGebra и/или записать решение текстом или фото из тетради.
        Ответ не проверяется автоматически — его нужно посмотреть вручную.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--t-text-secondary)' }}>
          <input
            type="checkbox"
            checked={solutionBoard}
            onChange={e => onChange({ ...content, solutionBoard: e.target.checked })}
          />
          Показать доску для решения ученику
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--t-text-secondary)' }}>
          <input
            type="checkbox"
            checked={conditionBoard}
            onChange={e => onChange({ ...content, conditionBoard: e.target.checked, ...(e.target.checked ? {} : { conditionBoardState: null }) })}
          />
          Показать доску для условия (нарисовать чертёж к задаче заранее)
        </label>
      </div>

      {conditionBoard && (
        <div>
          <label style={labelStyle}>Чертёж к задаче — покажется ученику для просмотра</label>
          <ConditionBoardEditor
            appName="geometry"
            initialState={content.conditionBoardState}
            onStateChange={base64 => onChange({ ...content, conditionBoardState: base64 })}
          />
        </div>
      )}

      <label style={{ ...labelStyle, marginTop: '4px' }}>Решение (необязательно, можно показать ученику во время урока)</label>
      <FormulaTextarea
        value={content.explanation || ''}
        onChange={explanation => onChange({ ...content, explanation })}
        rows={3}
        placeholder="Готовое решение, которое можно показать ученику, если он застрял"
      />
    </div>
  )
}

export function GeometryPlayer({ content, onSubmit, disabled }: {
  content: GeometryContent
  onSubmit: (answer: GeometryAnswer) => void
  disabled?: boolean
}) {
  const boardRef = useRef<GeometryBoardHandle>(null)
  const [solutionText, setSolutionText] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const solutionBoard = content.solutionBoard !== false
  const conditionBoard = !!content.conditionBoard && !!content.conditionBoardState

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    try {
      const dataUrl = await compressPhoto(file)
      setPhoto(dataUrl)
    } catch {
      // не удалось обработать файл — просто игнорируем выбор
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const drawing = solutionBoard ? (await boardRef.current?.exportSnapshot() ?? null) : null
      onSubmit({ drawing, solutionText, photo })
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !disabled && !submitting && !photoBusy && (solutionText.trim() || photo)

  return (
    <div>
      <div style={{ marginBottom: '14px', lineHeight: 1.6, fontSize: '15px' }}>
        <Formula text={content.question} />
      </div>

      {conditionBoard && (
        <>
          <label style={labelStyle}>Рисунок к задаче</label>
          <ConditionBoardViewer appName="geometry" base64={content.conditionBoardState!} />
        </>
      )}

      {solutionBoard && (
        <>
          <label style={{ ...labelStyle, marginTop: conditionBoard ? '14px' : 0 }}>Доска для решения (черновик, необязательно)</label>
          <GeometryBoard ref={boardRef} disabled={disabled} />
        </>
      )}

      <label style={{ ...labelStyle, marginTop: '14px' }}>Решение текстом</label>
      <FormulaTextarea
        value={solutionText}
        onChange={setSolutionText}
        rows={3}
        placeholder="Запиши решение — можно вставлять формулы"
      />

      <label style={{ ...labelStyle, marginTop: '10px' }}>Или приложи фото решения из тетради</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{
          background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)',
          borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
        }}>
          📷 {photoBusy ? 'Обработка...' : 'Выбрать фото'}
          <input type="file" accept="image/*" onChange={handlePhoto} disabled={disabled || photoBusy} style={{ display: 'none' }} />
        </label>
        {photo && (
          <img src={photo} alt="Фото решения" style={{ maxHeight: '80px', borderRadius: '6px', border: '1px solid var(--t-border)' }} />
        )}
        {photo && !disabled && (
          <button type="button" onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: '13px' }}>
            ✕ убрать фото
          </button>
        )}
      </div>

      <button
        disabled={!canSubmit}
        onClick={handleSubmit}
        style={{ ...(canSubmit ? submitButtonStyle : submitButtonDisabledStyle), marginTop: '16px' }}
      >
        {submitting ? 'Отправка...' : 'Отправить решение'}
      </button>
    </div>
  )
}
