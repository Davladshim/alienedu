import type { CSSProperties } from 'react'

export const labelStyle: CSSProperties = {
  color: 'var(--t-text-secondary)', fontSize: '13px', display: 'block', marginBottom: '2px',
}

export const inputStyle: CSSProperties = {
  width: '100%', background: 'var(--t-bg)', border: '1px solid var(--t-border)',
  borderRadius: '8px', padding: '10px 14px', color: 'var(--t-text)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
}

export const textareaStyle: CSSProperties = {
  ...inputStyle, resize: 'vertical', fontFamily: 'inherit',
}

export const smallButtonStyle: CSSProperties = {
  background: 'rgba(var(--t-accent-rgb),0.15)', border: '1px solid var(--t-accent)',
  color: 'var(--t-accent)', borderRadius: '8px', padding: '6px 14px',
  fontSize: '13px', cursor: 'pointer',
}

export const removeButtonStyle: CSSProperties = {
  background: 'none', border: 'none', color: 'var(--t-text-muted)',
  cursor: 'pointer', fontSize: '14px', padding: '0 4px',
}

export const submitButtonStyle: CSSProperties = {
  background: 'linear-gradient(135deg, var(--t-accent), var(--t-accent2))',
  color: '#fff', border: 'none', borderRadius: '8px',
  padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
}

export const submitButtonDisabledStyle: CSSProperties = {
  ...submitButtonStyle, background: 'var(--t-border)', color: 'var(--t-text-faint)', cursor: 'not-allowed',
}

// Глобальный масштаб интерфейса (html { zoom: 1.25 } в globals.css) ломает
// сопоставление координат клика в апплетах GeoGebra: canvas создаётся с
// шириной, прочитанной из clientWidth (уже отмасштабированной зумом), а
// затем рендерится ЕЩЁ РАЗ через тот же зум — размер клетки на экране и
// внутренняя система координат апплета расходятся, и точка ставится не
// там, где курсор. Проверено на собственном хуке ресайза доски: mouse-delta
// в 100px превращалась в изменение размера на 125px — ровно на коэффициент
// зума. Обнуляем зум для целого поддерева с доской (вложенный zoom
// перемножается с родительским и гасит его — проверено эмпирически), чтобы
// 1 CSS-пиксель внутри доски снова соответствовал 1 экранному пикселю
export const GEOGEBRA_ZOOM_RESET: CSSProperties = { zoom: 1 / 1.25 }

// Уголок для ручного ресайза окна доски — визуально диагональные штрихи,
// как у нативного resize-грипа браузера
export const resizeHandleStyle: CSSProperties = {
  position: 'absolute', right: 0, bottom: 0, width: '18px', height: '18px',
  cursor: 'nwse-resize', zIndex: 5,
  background: `linear-gradient(135deg, transparent 0%, transparent 45%, var(--t-text-muted) 45%, var(--t-text-muted) 55%, transparent 55%, transparent 65%, var(--t-text-muted) 65%, var(--t-text-muted) 75%, transparent 75%)`,
}

// Шапка окна доски, за которую можно перетаскивать (drag handle)
export const dragHandleStyle: CSSProperties = {
  cursor: 'move', userSelect: 'none',
}
