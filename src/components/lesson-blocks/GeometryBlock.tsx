'use client'
import { useRef, useState } from 'react'
import { Formula } from './Formula'
import { FormulaTextarea } from './FormulaTextarea'
import { GeometryBoard, type GeometryBoardHandle } from './GeometryBoard'
import { labelStyle, submitButtonStyle, submitButtonDisabledStyle } from './styles'

export interface GeometryContent {
  question: string
}

export const geometryDefault: GeometryContent = { question: '' }

export interface GeometryAnswer {
  drawing: string | null
  solutionText: string
  photo: string | null
}

const MAX_PHOTO_DIMENSION = 1200

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('canvas')); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function GeometryEditor({ content, onChange }: {
  content: GeometryContent
  onChange: (content: GeometryContent) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Условие задачи</label>
      <FormulaTextarea
        value={content.question}
        onChange={question => onChange({ ...content, question })}
        rows={3}
        placeholder="Например: В треугольнике ABC угол A равен 60°. Найдите..."
      />
      <div style={{ color: '#6b7280', fontSize: '12px' }}>
        Ученик решает задачу на мини-доске и/или записывает решение текстом или фото из тетради.
        Ответ не проверяется автоматически — его нужно посмотреть вручную.
      </div>
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

      <label style={labelStyle}>Мини-доска (черновик решения)</label>
      <GeometryBoard ref={boardRef} disabled={disabled} />

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
