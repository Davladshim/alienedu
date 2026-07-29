'use client'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { useGeoGebra } from './useGeoGebra'

export interface LiveStudentBoardViewerHandle {
  setSize: (width: number, height: number) => void
}

// Доска ученика во время объяснения учителем — апплет GeoGebra без
// тулбара и без возможности что-либо построить, только отображает то,
// что прислал учитель (base64 всей конструкции). Размер задаёт родитель
// (плавающее окно доски, которое ученик может сам растягивать) через ref
export const LiveStudentBoardViewer = forwardRef<LiveStudentBoardViewerHandle, { base64: string | null; height?: number }>(
  function LiveStudentBoardViewer({ base64, height = 300 }, ref) {
    const { containerId, wrapperRef, ready, loadError, loadBase64, setSize } = useGeoGebra('geometry', { height, readOnly: true })

    useImperativeHandle(ref, () => ({ setSize }))

    useEffect(() => {
      if (ready && base64) loadBase64(base64)
      // loadBase64 обращается к текущему апплету через ref — пересоздавать
      // подписку не нужно, реагируем только на новые кадры от учителя
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, base64])

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', border: '1px solid var(--t-border)', background: '#fff', overflow: 'hidden', pointerEvents: 'none' }}>
        <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
          <div id={containerId} />
        </div>
        {!ready && !loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-text-muted)', fontSize: '13px' }}>
            Загрузка доски...
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
)
