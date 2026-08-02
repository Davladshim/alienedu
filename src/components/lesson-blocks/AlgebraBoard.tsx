'use client'
import { forwardRef, useImperativeHandle } from 'react'
import { useGeoGebra } from './useGeoGebra'
import { GEOGEBRA_ZOOM_RESET } from './styles'

export interface AlgebraBoardHandle {
  exportSnapshot: () => string | null
}

export const AlgebraBoard = forwardRef<AlgebraBoardHandle, { disabled?: boolean }>(
  function AlgebraBoard({ disabled }, ref) {
    const { containerId, wrapperRef, ready, loadError, exportSnapshot } = useGeoGebra('graphing', { showAlgebraInput: true })

    useImperativeHandle(ref, () => ({ exportSnapshot }))

    return (
      <div
        style={{
          position: 'relative',
          minHeight: '420px',
          borderRadius: '8px',
          border: '1px solid var(--t-border)',
          background: '#fff',
          overflow: 'hidden',
          pointerEvents: disabled ? 'none' : 'auto',
          opacity: disabled ? 0.6 : 1,
          ...GEOGEBRA_ZOOM_RESET,
        }}
      >
        <div ref={wrapperRef} style={{ width: '100%' }}>
          <div id={containerId} />
        </div>
        {!ready && !loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-text-muted)', fontSize: '13px' }}>
            Загрузка графика...
          </div>
        )}
        {loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-danger)', fontSize: '13px', padding: '0 20px', textAlign: 'center' }}>
            Не удалось загрузить GeoGebra. Проверьте интернет-соединение и обновите страницу.
          </div>
        )}
      </div>
    )
  }
)
