'use client'
import { useRef, useState } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { AlgebraBoard, type AlgebraBoardHandle } from './AlgebraBoard'
import { compressPhoto } from './photoUpload'
import { labelStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface AlgebraContent {
  question: string
  explanation?: string
}

export const algebraDefault: AlgebraContent = { question: '' }

export interface AlgebraAnswer {
  drawing: string | null
  solutionText: string
  photo: string | null
}

export function AlgebraEditor({ content, onChange }: {
  content: AlgebraContent
  onChange: (content: AlgebraContent) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Условие задачи</label>
      <FormulaTextarea
        value={content.question}
        onChange={question => onChange({ ...content, question })}
        rows={3}
        placeholder="Например: Постройте график функции $y = x^2 - 2x$ на отрезке [-2; 4]"
      />
      <div style={{ color: '#6b7280', fontSize: '12px' }}>
        Ученик может построить график в GeoGebra и/или записать решение текстом или фото из тетради.
        Ответ не проверяется автоматически — его нужно посмотреть вручную.
      </div>
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

export function AlgebraPlayer({ content, onSubmit, disabled }: {
  content: AlgebraContent
  onSubmit: (answer: AlgebraAnswer) => void
  disabled?: boolean
}) {
  const boardRef = useRef<AlgebraBoardHandle>(null)
  const [solutionText, setSolutionText] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
      const drawing = await boardRef.current?.exportSnapshot() ?? null
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

      <label style={labelStyle}>График (черновик решения, необязательно)</label>
      <AlgebraBoard ref={boardRef} disabled={disabled} />

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
          background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7', color: '#4f8ef7',
          borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
        }}>
          📷 {photoBusy ? 'Обработка...' : 'Выбрать фото'}
          <input type="file" accept="image/*" onChange={handlePhoto} disabled={disabled || photoBusy} style={{ display: 'none' }} />
        </label>
        {photo && (
          <img src={photo} alt="Фото решения" style={{ maxHeight: '80px', borderRadius: '6px', border: '1px solid #2a2d3d' }} />
        )}
        {photo && !disabled && (
          <button type="button" onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px' }}>
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
