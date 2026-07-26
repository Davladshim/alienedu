'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useJSXBoard } from './useJSXBoard'

type Tool = 'select' | 'point' | 'pencil' | 'eraser'

export interface AlgebraBoardHandle {
  exportSnapshot: () => Promise<string | null>
  clear: () => void
}

const tools: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Выделение / перемещение', icon: '↖️' },
  { id: 'point', label: 'Точка графика', icon: '📍' },
  { id: 'pencil', label: 'Карандаш', icon: '✏️' },
  { id: 'eraser', label: 'Ластик', icon: '🧹' },
]

export const AlgebraBoard = forwardRef<AlgebraBoardHandle, { disabled?: boolean }>(
  function AlgebraBoard({ disabled }, ref) {
    const { containerId, containerRef, boardRef, ready, setHandlers, eraseUnderMouse, pointUnderMouse, clearBoard, exportSnapshot } = useJSXBoard([-8, 8, 8, -8])
    const [tool, setTool] = useState<Tool>('point')

    // Точки графика: соединяются кривой по возрастанию x — как таблица
    // значений функции. Кривая пересобирается при добавлении/переносе/удалении точки
    const graphPointsRef = useRef<JXG.Point[]>([])
    const curveRef = useRef<JXG.Curve | null>(null)
    const strokeRef = useRef<{ curve: JXG.Curve; xs: number[]; ys: number[] } | null>(null)
    const drawingRef = useRef(false)

    useImperativeHandle(ref, () => ({
      clear: handleClear,
      exportSnapshot,
    }))

    function syncCurve() {
      const board = boardRef.current
      if (!board) return
      const points = [...graphPointsRef.current].sort((a, b) => a.X() - b.X())
      const xs = points.map(p => p.X())
      const ys = points.map(p => p.Y())
      if (points.length < 2) {
        if (curveRef.current) {
          board.removeObject(curveRef.current)
          curveRef.current = null
        }
        board.update()
        return
      }
      if (curveRef.current) {
        curveRef.current.dataX = xs
        curveRef.current.dataY = ys
      } else {
        curveRef.current = board.create('curve', [xs, ys], { strokeColor: '#4f8ef7', strokeWidth: 2 })
      }
      board.update()
    }

    function addGraphPoint(bx: number, by: number) {
      const board = boardRef.current
      if (!board) return
      const point = board.create('point', [bx, by], { size: 3, name: '', withLabel: false, strokeColor: '#34d399', fillColor: '#34d399' })
      point.on('drag', syncCurve)
      graphPointsRef.current.push(point)
      syncCurve()
    }

    function handleDown(evt: Event) {
      if (disabled || !ready) return
      const board = boardRef.current
      if (!board) return
      const [bx, by] = board.getUsrCoordsOfMouse(evt)

      if (tool === 'point') {
        // Клик по уже существующей точке — это попытка её перетащить,
        // а не поставить новую точку поверх
        if (!pointUnderMouse(evt)) addGraphPoint(bx, by)
        return
      }

      if (tool === 'pencil') {
        drawingRef.current = true
        const xs = [bx]
        const ys = [by]
        const curve = board.create('curve', [xs, ys], { strokeColor: '#f472b6', strokeWidth: 2 })
        strokeRef.current = { curve, xs, ys }
        return
      }

      if (tool === 'eraser') {
        const removed = eraseUnderMouse(evt)
        if (removed && removed.elType === 'point') {
          graphPointsRef.current = graphPointsRef.current.filter(p => p.id !== removed.id)
          syncCurve()
        }
        return
      }
    }

    function handleMove(evt: Event) {
      if (tool !== 'pencil' || !drawingRef.current || !strokeRef.current) return
      const board = boardRef.current
      if (!board) return
      const [bx, by] = board.getUsrCoordsOfMouse(evt)
      strokeRef.current.xs.push(bx)
      strokeRef.current.ys.push(by)
      strokeRef.current.curve.dataX = strokeRef.current.xs
      strokeRef.current.curve.dataY = strokeRef.current.ys
      board.update()
    }

    function handleUp() {
      if (tool === 'pencil') {
        drawingRef.current = false
        strokeRef.current = null
      }
    }

    // Обработчики регистрируются на самой доске JSXGraph (см. useJSXBoard) —
    // здесь просто держим их актуальными на каждый рендер, чтобы видеть
    // свежий tool/disabled без пересоздания подписки
    useEffect(() => {
      setHandlers({ onDown: handleDown, onMove: handleMove, onUp: handleUp })
    })

    function handleClear() {
      clearBoard()
      graphPointsRef.current = []
      curveRef.current = null
      strokeRef.current = null
      drawingRef.current = false
    }

    return (
      <div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {tools.map(t => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              disabled={disabled}
              onClick={() => setTool(t.id)}
              style={{
                background: tool === t.id ? 'rgba(79,142,247,0.25)' : 'transparent',
                border: `1px solid ${tool === t.id ? '#4f8ef7' : '#2a2d3d'}`,
                color: '#fff', borderRadius: '8px', padding: '6px 10px', fontSize: '15px',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {t.icon}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={handleClear}
            style={{
              marginLeft: 'auto', background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
              borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            🗑 Очистить
          </button>
        </div>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>
          Ставь точки графика (📍) — они соединятся линией по возрастанию x. Точку можно перетащить.
        </div>
        <div
          id={containerId}
          ref={containerRef}
          style={{
            width: '100%', height: '360px', background: '#fff', borderRadius: '8px',
            border: '1px solid #2a2d3d', touchAction: 'none',
          }}
        />
      </div>
    )
  }
)
