'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

type Tool = 'select' | 'pencil' | 'eraser' | 'segment' | 'circle' | 'polygon' | 'text'

export interface GeometryBoardHandle {
  exportSnapshot: () => Promise<string | null>
  clear: () => void
}

const tools: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Выделение / перемещение', icon: '↖️' },
  { id: 'pencil', label: 'Карандаш', icon: '✏️' },
  { id: 'segment', label: 'Отрезок', icon: '📏' },
  { id: 'circle', label: 'Окружность', icon: '⭕' },
  { id: 'polygon', label: 'Многоугольник', icon: '⬠' },
  { id: 'text', label: 'Текст', icon: '🔤' },
  { id: 'eraser', label: 'Ластик', icon: '🧹' },
]

// Элементы, которые ластик не должен трогать
const PROTECTED_EL_TYPES = new Set(['axis', 'ticks', 'grid'])

export const GeometryBoard = forwardRef<GeometryBoardHandle, { disabled?: boolean }>(
  function GeometryBoard({ disabled }, ref) {
    const containerId = useRef(`geo-board-${Math.random().toString(36).slice(2)}`)
    const containerRef = useRef<HTMLDivElement>(null)
    const boardRef = useRef<JXG.Board | null>(null)
    const [tool, setTool] = useState<Tool>('select')
    const [ready, setReady] = useState(false)

    // Состояние, накопленное в процессе построения текущей фигуры
    const pendingPointsRef = useRef<JXG.Point[]>([])
    const strokeRef = useRef<{ curve: JXG.Curve; xs: number[]; ys: number[] } | null>(null)
    const drawingRef = useRef(false)

    useEffect(() => {
      let cancelled = false
      import('jsxgraph').then(mod => {
        if (cancelled || !containerRef.current) return
        const JXGLib = (mod as unknown as { default: typeof JXG }).default ?? (mod as unknown as typeof JXG)
        const board = JXGLib.JSXGraph.initBoard(containerId.current, {
          boundingbox: [-6, 6, 6, -6],
          axis: true,
          showCopyright: false,
          showNavigation: false,
          keepAspectRatio: true,
        })
        boardRef.current = board
        setReady(true)
      })
      return () => {
        cancelled = true
        if (boardRef.current) {
          JXG.JSXGraph.freeBoard(boardRef.current)
          boardRef.current = null
        }
      }
    }, [])

    useImperativeHandle(ref, () => ({
      clear() {
        clearBoard()
      },
      async exportSnapshot() {
        const board = boardRef.current
        if (!board) return null
        const svg = board.containerObj.querySelector('svg')
        if (!svg) return null
        const clone = svg.cloneNode(true) as SVGSVGElement
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        const width = svg.clientWidth || 500
        const height = svg.clientHeight || 500
        clone.setAttribute('width', String(width))
        clone.setAttribute('height', String(height))
        // JSXGraph всегда держит пустой <foreignObject> в корне SVG (слой для
        // HTML-текста) — Chromium считает canvas "испорченным" при отрисовке
        // SVG с foreignObject и блокирует экспорт в PNG, поэтому вырезаем его
        for (const fo of Array.from(clone.getElementsByTagName('foreignObject'))) {
          fo.remove()
        }
        const svgString = new XMLSerializer().serializeToString(clone)
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        try {
          const img = new Image()
          const loaded = new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = reject
          })
          img.src = url
          await loaded
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) return null
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
          return canvas.toDataURL('image/png')
        } finally {
          URL.revokeObjectURL(url)
        }
      },
    }))

    function resetPending() {
      pendingPointsRef.current = []
      strokeRef.current = null
      drawingRef.current = false
    }

    function selectTool(t: Tool) {
      resetPending()
      setTool(t)
    }

    function eraseUnderMouse(evt: React.PointerEvent) {
      const board = boardRef.current
      if (!board) return
      const hits = board.getAllObjectsUnderMouse(evt.nativeEvent) as unknown as JXG.GeometryElement[]
      const target = hits.find(el => !PROTECTED_EL_TYPES.has(el.elType))
      if (target) board.removeObject(target)
      board.update()
    }

    function handlePointerDown(evt: React.PointerEvent) {
      if (disabled || !ready) return
      const board = boardRef.current
      if (!board) return
      const [bx, by] = board.getUsrCoordsOfMouse(evt.nativeEvent)

      if (tool === 'pencil') {
        drawingRef.current = true
        const xs = [bx]
        const ys = [by]
        const curve = board.create('curve', [xs, ys], { strokeColor: '#4f8ef7', strokeWidth: 2 })
        strokeRef.current = { curve, xs, ys }
        return
      }

      if (tool === 'eraser') {
        eraseUnderMouse(evt)
        return
      }

      if (tool === 'segment') {
        pendingPointsRef.current.push(board.create('point', [bx, by], { size: 2, name: '', withLabel: false, fixed: false }))
        if (pendingPointsRef.current.length === 2) {
          const [a, b] = pendingPointsRef.current
          board.create('segment', [a, b], { strokeColor: '#34d399' })
          resetPending()
        }
        return
      }

      if (tool === 'circle') {
        pendingPointsRef.current.push(board.create('point', [bx, by], { size: 2, name: '', withLabel: false, fixed: false }))
        if (pendingPointsRef.current.length === 2) {
          const [center, edge] = pendingPointsRef.current
          board.create('circle', [center, edge], { strokeColor: '#f472b6' })
          resetPending()
        }
        return
      }

      if (tool === 'polygon') {
        pendingPointsRef.current.push(board.create('point', [bx, by], { size: 2, name: '', withLabel: false, fixed: false }))
        return
      }

      if (tool === 'text') {
        const value = window.prompt('Текст на доске:')
        if (value) board.create('text', [bx, by, value], { fontSize: 14, color: '#1a1d27', display: 'internal' })
        return
      }
    }

    function handlePointerMove(evt: React.PointerEvent) {
      if (tool !== 'pencil' || !drawingRef.current || !strokeRef.current) return
      const board = boardRef.current
      if (!board) return
      const [bx, by] = board.getUsrCoordsOfMouse(evt.nativeEvent)
      strokeRef.current.xs.push(bx)
      strokeRef.current.ys.push(by)
      strokeRef.current.curve.dataX = strokeRef.current.xs
      strokeRef.current.curve.dataY = strokeRef.current.ys
      board.update()
    }

    function handlePointerUp() {
      if (tool === 'pencil') {
        drawingRef.current = false
        strokeRef.current = null
      }
    }

    function finishPolygon() {
      const board = boardRef.current
      if (!board || pendingPointsRef.current.length < 3) { resetPending(); return }
      board.create('polygon', pendingPointsRef.current, { fillColor: '#7c3aed', fillOpacity: 0.15, strokeColor: '#7c3aed' })
      resetPending()
    }

    function clearBoard() {
      const board = boardRef.current
      if (!board) return
      for (const el of [...board.objectsList] as JXG.GeometryElement[]) {
        if (PROTECTED_EL_TYPES.has(el.elType)) continue
        board.removeObject(el)
      }
      board.update()
      resetPending()
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
              onClick={() => selectTool(t.id)}
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
          {tool === 'polygon' && (
            <button type="button" onClick={finishPolygon} style={{
              background: 'rgba(124,58,237,0.2)', border: '1px solid #7c3aed', color: '#c4b5fd',
              borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
            }}>
              Готово (замкнуть)
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={clearBoard}
            style={{
              marginLeft: 'auto', background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af',
              borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            🗑 Очистить
          </button>
        </div>
        <div
          id={containerId.current}
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            width: '100%', height: '360px', background: '#fff', borderRadius: '8px',
            border: '1px solid #2a2d3d', touchAction: 'none',
          }}
        />
      </div>
    )
  }
)
