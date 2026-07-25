'use client'
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
        placeholder="https://..."
      />
    </div>
  )
}

export function TheoryPlayer({ content }: { content: TheoryContent }) {
  return (
    <div>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '15px' }}>
        <Formula text={content.text} />
      </div>
      {content.imageUrl && (
        <img src={content.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '12px' }} />
      )}
    </div>
  )
}
