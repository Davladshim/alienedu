'use client'
import { useEffect } from 'react'
import { useGeoGebra } from './useGeoGebra'
import { useResizableBoard } from './useResizableBoard'
import { resizeHandleStyle, GEOGEBRA_ZOOM_RESET } from './styles'

const DEFAULT_SIZE = { width: 640, height: 440 }

// Доска учителя во время живого наблюдения за учеником — обычный
// редактируемый апплет GeoGebra (карандаш, ластик и весь тулбар), только
// каждое изменение построения транслируется наружу через onBoardChange,
// чтобы ученик видел то же самое в режиме только для чтения
export function LiveTeacherBoard({ onBoardChange }: { onBoardChange: (base64: string) => void }) {
  const { containerId, wrapperRef, ready, loadError, onChange, setSize } = useGeoGebra('geometry', { height: DEFAULT_SIZE.height })
  const { size, onHandleMouseDown } = useResizableBoard(DEFAULT_SIZE, ({ width, height }) => setSize(width, height))

  useEffect(() => {
    if (!ready) return
    onChange(onBoardChange, 200)
    // onChange регистрирует слушатели один раз, когда апплет готов —
    // обработчик всегда берёт актуальную onBoardChange через замыкание вызова
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return (
    <div style={{
      position: 'relative', width: `${size.width}px`, height: `${size.height}px`, maxWidth: '100%',
      borderRadius: '8px', border: '1px solid #2a2d3d', background: '#fff', overflow: 'hidden',
      ...GEOGEBRA_ZOOM_RESET,
    }}>
      <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
        <div id={containerId} />
      </div>
      {!ready && !loadError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '13px' }}>
          Загрузка доски...
        </div>
      )}
      {loadError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '13px', padding: '0 20px', textAlign: 'center' }}>
          Не удалось загрузить GeoGebra.
        </div>
      )}
      <div
        onMouseDown={onHandleMouseDown}
        title="Изменить размер доски"
        style={resizeHandleStyle}
      />
    </div>
  )
}
