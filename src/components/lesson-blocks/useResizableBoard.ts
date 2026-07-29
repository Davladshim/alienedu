'use client'
import { useRef, useState, type RefObject } from 'react'

export interface BoardSize {
  width: number
  height: number
}

// Ручной ресайз окна доски за угол — перетаскивание меняет размер обёртки
// сразу (для плавной анимации), а сам апплет GeoGebra подгоняется вызовом
// onResizeEnd только по окончании перетаскивания (mouseup), а не на каждый
// кадр — так меньше риск разъехавшихся координат клика внутри апплета
export function useResizableBoard(initial: BoardSize, onResizeEnd: (size: BoardSize) => void, min: BoardSize = { width: 320, height: 240 }) {
  const [size, setSize] = useState(initial)
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

  function onHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: size.width, startH: size.height }

    function onMove(ev: MouseEvent) {
      const drag = dragRef.current
      if (!drag) return
      setSize({
        width: Math.max(min.width, drag.startW + (ev.clientX - drag.startX)),
        height: Math.max(min.height, drag.startH + (ev.clientY - drag.startY)),
      })
    }
    function onUp() {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setSize(current => {
        onResizeEnd(current)
        return current
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { size, onHandleMouseDown }
}

export interface BoardPosition {
  left: number
  top: number
}

// Перетаскивание окна доски по экрану за шапку — позиция считается от
// текущего фактического положения элемента (getBoundingClientRect), поэтому
// работает независимо от того, как элемент был спозиционирован изначально
// (right/bottom или left/top). Ref на сам элемент создаёт вызывающий
// компонент и передаёт сюда — так возвращаемый хуком объект не содержит
// смешанных ref/не-ref значений
export function useDraggableBoard(elementRef: RefObject<HTMLDivElement | null>) {
  const [position, setPosition] = useState<BoardPosition | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null)

  function onHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top }

    function onMove(ev: MouseEvent) {
      const drag = dragRef.current
      if (!drag) return
      const rect = elementRef.current?.getBoundingClientRect()
      const width = rect?.width ?? 0
      const height = rect?.height ?? 0
      const maxLeft = Math.max(0, window.innerWidth - width)
      const maxTop = Math.max(0, window.innerHeight - height)
      setPosition({
        left: Math.min(maxLeft, Math.max(0, drag.startLeft + (ev.clientX - drag.startX))),
        top: Math.min(maxTop, Math.max(0, drag.startTop + (ev.clientY - drag.startY))),
      })
    }
    function onUp() {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { position, onHandleMouseDown }
}
