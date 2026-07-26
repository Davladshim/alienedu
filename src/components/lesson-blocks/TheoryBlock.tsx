'use client'
import { useState } from 'react'
import { Formula } from './Formula'
import { labelStyle, textareaStyle, inputStyle } from './styles'

export interface TheoryContent {
  text: string
  imageUrl?: string
}

export const theoryDefault: TheoryContent = { text: '', imageUrl: '' }

export function TheoryEditor({ content, onChange }: {
  content: TheoryContent
  onChange: (content: TheoryContent) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={labelStyle}>Текст (для формул используй $...$ или $$...$$, например $S = \pi r^2$)</label>
      <textarea
        value={content.text}
        onChange={e => onChange({ ...content, text: e.target.value })}
        rows={5}
        style={textareaStyle}
        placeholder="Объяснение темы..."
      />
      <label style={labelStyle}>Ссылка на картинку (необязательно)</label>
      <input
        value={content.imageUrl || ''}
        onChange={e => onChange({ ...content, imageUrl: e.target.value })}
        style={inputStyle}
        placeholder="https://... (прямая ссылка на файл картинки, не на страницу сайта)"
      />
      <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '-4px' }}>
        Нужна прямая ссылка на файл (заканчивается на .jpg, .png, .svg и т.п.), а не ссылка на страницу вроде статьи Википедии — иначе картинка не загрузится.
      </div>
    </div>
  )
}

export function TheoryPlayer({ content }: { content: TheoryContent }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '15px' }}>
        <Formula text={content.text} />
      </div>
      {content.imageUrl && !imageFailed && (
        <img
          src={content.imageUrl}
          alt=""
          style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '12px' }}
          onError={() => setImageFailed(true)}
        />
      )}
      {content.imageUrl && imageFailed && (
        <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '12px', padding: '10px 14px', background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '8px' }}>
          Не удалось загрузить картинку. Проверьте, что ссылка ведёт напрямую на файл изображения.
        </div>
      )}
    </div>
  )
}
