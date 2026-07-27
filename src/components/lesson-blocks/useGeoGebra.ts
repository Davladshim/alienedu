'use client'
import { useEffect, useId, useRef, useState } from 'react'

export interface GeoGebraAppApi {
  getPNGBase64: (scaleParameter: number, transparent: boolean, dpi: number) => string
  newConstruction: () => void
  setSize: (width: number, height: number) => void
}

interface GeoGebraAppletParams {
  id?: string
  appName: 'geometry' | 'graphing'
  width: number
  height: number
  language?: string
  showToolBar?: boolean
  showAlgebraInput?: boolean
  showMenuBar?: boolean
  showResetIcon?: boolean
  showZoomButtons?: boolean
  enableLabelDrags?: boolean
  appletOnLoad?: (api: GeoGebraAppApi) => void
}

declare global {
  interface Window {
    GGBApplet?: new (params: GeoGebraAppletParams, useBrowserForJS: boolean) => { inject: (containerId: string) => void }
  }
}

const GGB_SCRIPT_URL = 'https://www.geogebra.org/apps/deployggb.js'
let ggbScriptPromise: Promise<void> | null = null

function loadGeoGebraScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.GGBApplet) return Promise.resolve()
  if (!ggbScriptPromise) {
    ggbScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GGB_SCRIPT_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        // Даём шанс перезагрузить страницу и попробовать ещё раз —
        // не запоминаем неудачную попытку навсегда
        ggbScriptPromise = null
        reject(new Error('Не удалось загрузить GeoGebra'))
      }
      document.head.appendChild(script)
    })
  }
  return ggbScriptPromise
}

// Общая база для встраивания апплета GeoGebra (алгебра — appName "graphing",
// геометрия — appName "geometry"): загрузка скрипта апплета, инициализация
// и подгонка ширины под контейнер — вынесено сюда, чтобы не дублировать
// одну и ту же обвязку в блоках "Геометрия" и "Алгебра"
export function useGeoGebra(appName: 'geometry' | 'graphing', height = 420) {
  const reactId = useId()
  const containerId = `ggb-${reactId.replace(/:/g, '')}`
  const wrapperRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<GeoGebraAppApi | null>(null)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadGeoGebraScript()
      .then(() => {
        if (cancelled || !wrapperRef.current || !window.GGBApplet) return
        const width = Math.max(320, wrapperRef.current.clientWidth || 600)
        const applet = new window.GGBApplet({
          id: containerId,
          appName,
          width,
          height,
          language: 'ru',
          showToolBar: true,
          showAlgebraInput: false,
          showMenuBar: false,
          showResetIcon: true,
          showZoomButtons: true,
          enableLabelDrags: false,
          appletOnLoad: (api) => {
            if (cancelled) return
            appRef.current = api
            setReady(true)
          },
        }, true)
        applet.inject(containerId)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
      appRef.current = null
      // У GGBApplet нет официального destroy() для HTML5-апплетов — просто
      // вычищаем контейнер, чтобы при повторном монтировании блока (например,
      // при возврате к предыдущему вопросу урока) не накапливались старые апплеты
      const container = document.getElementById(containerId)
      if (container) container.innerHTML = ''
    }
    // containerId/appName/height стабильны на весь жизненный цикл инстанса — пересоздавать апплет при ререндере не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready) return
    const wrapper = wrapperRef.current
    if (!wrapper || typeof ResizeObserver === 'undefined') return
    let lastWidth = wrapper.clientWidth
    const observer = new ResizeObserver(() => {
      const width = wrapper.clientWidth
      if (Math.abs(width - lastWidth) > 8 && appRef.current) {
        lastWidth = width
        appRef.current.setSize(Math.max(320, width), height)
      }
    })
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [ready, height])

  function exportSnapshot(): string | null {
    const app = appRef.current
    if (!app) return null
    try {
      const base64 = app.getPNGBase64(1, true, 100)
      return base64 ? `data:image/png;base64,${base64}` : null
    } catch {
      return null
    }
  }

  function clear() {
    appRef.current?.newConstruction()
  }

  return { containerId, wrapperRef, ready, loadError, exportSnapshot, clear }
}
