'use client'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

// Оборачивает широкий контент (календарь с колонками дней, таблицы со
// множеством столбцов), который иначе пришлось бы горизонтально
// прокручивать на узких экранах. Вместо прокрутки — сжимаем содержимое
// целиком (через transform: scale), чтобы оно всегда помещалось по ширине
// экрана, сохраняя пропорции. Вертикальная прокрутка внутри содержимого
// (например, "не более 10 строк таблицы") продолжает работать как обычно —
// под неё берётся уже отрисованная (обрезанная по maxHeight) высота, а не
// полная высота содержимого.
//
// Масштаб и высота обёртки выставляются напрямую через ref (а не через
// React state → JSX style), потому что мы сами же временно сбрасываем
// transform перед измерением естественной ширины — если положиться на
// обычный цикл рендера React, есть риск гонки, когда сброшенное значение
// не успевает замениться посчитанным до следующего измерения
export function FitToWidth({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    function recalc() {
      if (!outer || !inner) return
      inner.style.transform = 'none'
      const naturalWidth = inner.scrollWidth
      const renderedHeight = inner.offsetHeight
      const availableWidth = outer.clientWidth
      const newScale = naturalWidth > availableWidth && availableWidth > 0 ? availableWidth / naturalWidth : 1
      inner.style.transform = newScale !== 1 ? `scale(${newScale})` : ''
      outer.style.height = `${renderedHeight * newScale}px`
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(outer)
    ro.observe(inner)
    window.addEventListener('resize', recalc)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', recalc)
    }
  }, [children])

  return (
    <div ref={outerRef} style={{ ...style, width: '100%', overflow: 'hidden' }}>
      <div ref={innerRef} style={{ transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
}
