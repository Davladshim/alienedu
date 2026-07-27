'use client'
import { forwardRef, useImperativeHandle } from 'react'
import { useGeoGebra } from './useGeoGebra'

export interface AlgebraBoardHandle {
  exportSnapshot: () => string | null
}

export const AlgebraBoard = forwardRef<AlgebraBoardHandle, { disabled?: boolean }>(
  function AlgebraBoard({ disabled }, ref) {
    const { containerId, wrapperRef, ready, loadError, exportSnapshot } = useGeoGebra('graphing')

    useImperativeHandle(ref, () => ({ exportSnapshot }))

    return (
      <div
        style={{
          position: 'relative',
          minHeight: '420px',
          borderRadius: '8px',
          border: '1px solid #2a2d3d',
          background: '#fff',
          overflow: 'hidden',
          pointerEvents: disabled ? 'none' : 'auto',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div ref={wrapperRef} style={{ width: '100%' }}>
          <div id={containerId} />
        </div>
        {!ready && !loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '13px' }}>
            Загрузка графика...
          </div>
        )}
        {loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '13px', padding: '0 20px', textAlign: 'center' }}>
            Не удалось загрузить GeoGebra. Проверьте интернет-соединение и обновите страницу.
          </div>
        )}
      </div>
    )
  }
)
