'use client'

// Ширина/высота "холста", на котором рендерится html_code модели — сама
// вёрстка модели не обязана ничего знать про обрезку/масштаб, она просто
// рисуется в этой системе координат, а видимое окно (frameWidth/frameHeight)
// обрезает и масштабирует её через CSS-transform
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export interface InteractiveModelFrameProps {
  htmlCode: string
  frameWidth: number
  frameHeight: number
  offsetX: number
  offsetY: number
  scale: number
  // bare — как вставляется ученику/в предпросмотр учителя: без фона и рамки,
  // просто окно с моделью. Без bare — как видит админ при создании: с рамкой
  // контейнера, чтобы визуально отличать поле редактирования
  bare?: boolean
}

export function InteractiveModelFrame({ htmlCode, frameWidth, frameHeight, offsetX, offsetY, scale, bare }: InteractiveModelFrameProps) {
  return (
    <div
      style={{
        position: 'relative', width: `${frameWidth}px`, height: `${frameHeight}px`,
        overflow: 'hidden', maxWidth: '100%',
        ...(bare
          ? { background: 'transparent', border: 'none' }
          : { background: '#fff', border: '1px solid var(--t-border)', borderRadius: '8px' }),
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, transformOrigin: 'top left',
        }}
      >
        <iframe
          srcDoc={htmlCode}
          sandbox="allow-scripts"
          title="Интерактивная модель"
          style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`, border: 'none', display: 'block' }}
        />
      </div>
    </div>
  )
}
