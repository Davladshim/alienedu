'use client'
import { useEffect, useId, useRef, useState } from 'react'

// Элементы, которые ластик и "Очистить" не должны трогать. 'label' — это в
// том числе подписи делений осей (числа вроде "5", "-5"), которые иначе
// перехватывают клик по близко расположенной точке/фигуре и стираются вместо неё
export const PROTECTED_EL_TYPES = new Set(['axis', 'ticks', 'grid', 'label'])

export interface BoardPointerHandlers {
  onDown?: (evt: Event) => void
  onMove?: (evt: Event) => void
  onUp?: (evt: Event) => void
}

// Общая база для мини-досок на JSXGraph (геометрия и алгебра): инициализация
// доски, экспорт снимка в PNG и очистка — вынесены сюда, чтобы не дублировать
// одну и ту же обвязку в каждом блоке с доской
export function useJSXBoard(boundingBox: [number, number, number, number]) {
  const reactId = useId()
  const containerId = `jxg-board-${reactId.replace(/:/g, '')}`
  const containerRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<JXG.Board | null>(null)
  const [ready, setReady] = useState(false)

  // Инструменты доски привязаны не к React-обработчикам на div, а напрямую
  // к событиям доски JSXGraph ('down'/'move'/'up'): у JSXGraph свои нативные
  // обработчики на перетаскивание точек, и они останавливают всплытие —
  // React-овский onPointerDown на обёртке просто не получает клик по точке
  const handlersRef = useRef<BoardPointerHandlers>({})

  useEffect(() => {
    let cancelled = false
    import('jsxgraph').then(mod => {
      if (cancelled || !containerRef.current) return
      const JXGLib = (mod as unknown as { default: typeof JXG }).default ?? (mod as unknown as typeof JXG)
      const board = JXGLib.JSXGraph.initBoard(containerId, {
        boundingbox: boundingBox,
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
    // boundingBox используется только при создании доски — пересоздавать
    // доску при каждом ререндере не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const board = boardRef.current
    if (!ready || !board) return
    const onDown = (evt: Event) => handlersRef.current.onDown?.(evt)
    const onMove = (evt: Event) => handlersRef.current.onMove?.(evt)
    const onUp = (evt: Event) => handlersRef.current.onUp?.(evt)
    board.on('down', onDown)
    board.on('move', onMove)
    board.on('up', onUp)
    // off() есть в рантайме (миксин JXG.EventEmitter), но не описан в типах пакета
    const untypedBoard = board as unknown as { off: (event: string, handler: (evt: Event) => void) => void }
    return () => {
      untypedBoard.off('down', onDown)
      untypedBoard.off('move', onMove)
      untypedBoard.off('up', onUp)
    }
  }, [ready])

  // Вызывается компонентом доски в собственном useEffect(без deps) на каждом
  // рендере — сама подписка на доску регистрируется один раз (выше), а сюда
  // просто кладутся свежие замыкания (текущий инструмент и т.п.)
  function setHandlers(handlers: BoardPointerHandlers) {
    handlersRef.current = handlers
  }

  function eraseUnderMouse(evt: Event): JXG.GeometryElement | null {
    const board = boardRef.current
    if (!board) return null
    const hits = board.getAllObjectsUnderMouse(evt) as unknown as JXG.GeometryElement[]
    const target = hits.find(el => !PROTECTED_EL_TYPES.has(el.elType))
    if (target) board.removeObject(target)
    board.update()
    return target ?? null
  }

  // Есть ли уже точка под курсором — используется перед созданием новой
  // точки, чтобы клик по существующей точке (например, чтобы её перетащить)
  // не порождал точку-дубликат поверх неё
  function pointUnderMouse(evt: Event): JXG.Point | null {
    const board = boardRef.current
    if (!board) return null
    const hits = board.getAllObjectsUnderMouse(evt) as unknown as JXG.GeometryElement[]
    return (hits.find(el => el.elType === 'point') as JXG.Point | undefined) ?? null
  }

  function clearBoard() {
    const board = boardRef.current
    if (!board) return
    for (const el of [...board.objectsList] as JXG.GeometryElement[]) {
      if (PROTECTED_EL_TYPES.has(el.elType)) continue
      board.removeObject(el)
    }
    board.update()
  }

  async function exportSnapshot(): Promise<string | null> {
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
  }

  return { containerId, containerRef, boardRef, ready, setHandlers, eraseUnderMouse, pointUnderMouse, clearBoard, exportSnapshot }
}
