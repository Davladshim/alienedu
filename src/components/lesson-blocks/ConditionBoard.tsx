'use client'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { useGeoGebra } from './useGeoGebra'
import { GEOGEBRA_ZOOM_RESET } from './styles'

export interface ConditionBoardEditorHandle {
  getBase64: () => string | null
}

// Доска "условия" в конструкторе урока — учитель рисует чертёж к задаче
// заранее. Обычный редактируемый апплет, но без exportSnapshot: сохраняем
// не PNG, а полное состояние GeoGebra (getBase64), чтобы потом показать
// ученику тот же чертёж как отдельный апплет для просмотра, а не картинку
export const ConditionBoardEditor = forwardRef<ConditionBoardEditorHandle, {
  appName: 'geometry' | 'graphing'
  initialState?: string | null
  onStateChange: (base64: string) => void
}>(function ConditionBoardEditor({ appName, initialState, onStateChange }, ref) {
  const { containerId, wrapperRef, ready, loadError, loadBase64, getBase64, onChange } = useGeoGebra(appName, { height: 360 })

  useImperativeHandle(ref, () => ({ getBase64 }))

  useEffect(() => {
    if (ready && initialState) loadBase64(initialState)
    // Загружаем сохранённое состояние только один раз, когда апплет готов —
    // дальше апплет живёт своей жизнью, перезагружать его при каждом
    // изменении content (которое сами же и вызываем через onStateChange) не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  useEffect(() => {
    if (!ready) return
    onChange(onStateChange, 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return (
    <div style={{
      position: 'relative', minHeight: '360px', borderRadius: '8px', border: '1px solid var(--t-border)',
      background: '#fff', overflow: 'hidden', ...GEOGEBRA_ZOOM_RESET,
    }}>
      <div ref={wrapperRef} style={{ width: '100%' }}>
        <div id={containerId} />
      </div>
      {!ready && !loadError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-text-muted)', fontSize: '13px' }}>
          Загрузка доски...
        </div>
      )}
      {loadError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-danger)', fontSize: '13px', padding: '0 20px', textAlign: 'center' }}>
          Не удалось загрузить GeoGebra. Проверьте интернет-соединение и обновите страницу.
        </div>
      )}
    </div>
  )
})

// Доска "условия" во время прохождения урока учеником — только для
// просмотра, показывает то, что заранее нарисовал учитель
export function ConditionBoardViewer({ appName, base64, height = 300 }: {
  appName: 'geometry' | 'graphing'
  base64: string
  height?: number
}) {
  const { containerId, wrapperRef, ready, loadError, loadBase64 } = useGeoGebra(appName, { height, readOnly: true })

  useEffect(() => {
    if (ready) loadBase64(base64)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, base64])

  return (
    <div style={{
      position: 'relative', minHeight: `${height}px`, borderRadius: '8px', border: '1px solid var(--t-border)',
      background: '#fff', overflow: 'hidden', pointerEvents: 'none', ...GEOGEBRA_ZOOM_RESET,
    }}>
      <div ref={wrapperRef} style={{ width: '100%' }}>
        <div id={containerId} />
      </div>
      {!ready && !loadError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-text-muted)', fontSize: '13px' }}>
          Загрузка чертежа...
        </div>
      )}
      {loadError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-danger)', fontSize: '13px', padding: '0 20px', textAlign: 'center' }}>
          Не удалось загрузить GeoGebra.
        </div>
      )}
    </div>
  )
}
