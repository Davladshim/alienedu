import type { CSSProperties } from 'react'

export const labelStyle: CSSProperties = {
  color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '2px',
}

export const inputStyle: CSSProperties = {
  width: '100%', background: '#0f1117', border: '1px solid #2a2d3d',
  borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
}

export const textareaStyle: CSSProperties = {
  ...inputStyle, resize: 'vertical', fontFamily: 'inherit',
}

export const smallButtonStyle: CSSProperties = {
  background: 'rgba(79,142,247,0.15)', border: '1px solid #4f8ef7',
  color: '#4f8ef7', borderRadius: '8px', padding: '6px 14px',
  fontSize: '13px', cursor: 'pointer',
}

export const removeButtonStyle: CSSProperties = {
  background: 'none', border: 'none', color: '#6b7280',
  cursor: 'pointer', fontSize: '14px', padding: '0 4px',
}

export const submitButtonStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
  color: '#fff', border: 'none', borderRadius: '8px',
  padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
}

export const submitButtonDisabledStyle: CSSProperties = {
  ...submitButtonStyle, background: '#2a2d3d', color: '#4b5563', cursor: 'not-allowed',
}
