'use client'
import { useEffect, useId, useRef, useState } from 'react'

export interface GeoGebraAppApi {
  getPNGBase64: (scaleParameter: number, transparent: boolean, dpi: number) => string
  newConstruction: () => void
  setSize: (width: number, height: number) => void
  getBase64: () => string
  setBase64: (base64: string, callback?: () => void) => void
  registerUpdateListener: (fn: () => void) => void
  registerAddListener: (fn: (objName: string) => void) => void
  registerRemoveListener: (fn: (objName: string) => void) => void
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

export interface UseGeoGebraOptions {
  height?: number
  // Апплет только для просмотра (трансляция доски учителя ученику) — без
  // тулбара и панели ввода, ученик ничего не может на нём построить сам
  readOnly?: boolean
}

// Общая база для встраивания апплета GeoGebra (алгебра — appName "graphing",
// геометрия — appName "geometry"): загрузка скрипта апплета, инициализация
// и подгонка ширины под контейнер — вынесено сюда, чтобы не дублировать
// одну и ту же обвязку в блоках "Геометрия"/"Алгебра" и в живой доске урока
export function useGeoGebra(appName: 'geometry' | 'graphing', options: UseGeoGebraOptions = {}) {
  const { height = 420, readOnly = false } = options
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
          showToolBar: !readOnly,
          showAlgebraInput: false,
          showMenuBar: false,
          showResetIcon: !readOnly,
          showZoomButtons: !readOnly,
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
    // containerId/appName/height/readOnly стабильны на весь жизненный цикл инстанса — пересоздавать апплет при ререндере не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Апплет подгоняется под контейнер только явным вызовом setSize() ниже —
  // раньше здесь был ResizeObserver, автоматически звавший setSize() при
  // любом изменении ширины обёртки (в том числе от посторонних сдвигов
  // разметки), из-за чего координаты клика на доске могли рассинхронизироваться
  // с моделью GeoGebra. Теперь пересчёт размера — только по явному действию
  // пользователя (ручной ресайз окна доски), см. setSize()
  function setSize(width: number, height: number) {
    appRef.current?.setSize(Math.max(280, width), Math.max(200, height))
  }

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

  function getBase64(): string | null {
    try {
      return appRef.current?.getBase64() ?? null
    } catch {
      return null
    }
  }

  function loadBase64(base64: string) {
    try {
      appRef.current?.setBase64(base64)
    } catch {
      // рассинхронизированное или битое состояние — просто пропускаем
      // этот кадр, следующее обновление от учителя всё поправит
    }
  }

  // Вызывает callback с текущим getBase64() при любом изменении доски —
  // добавление/перенос/удаление объекта, с небольшим дебаунсом, чтобы не
  // рассылать состояние на каждый промежуточный кадр перетаскивания
  function onChange(callback: (base64: string) => void, debounceMs = 200) {
    const app = appRef.current
    if (!app) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const fire = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const base64 = getBase64()
        if (base64) callback(base64)
      }, debounceMs)
    }
    app.registerUpdateListener(fire)
    app.registerAddListener(fire)
    app.registerRemoveListener(fire)
  }

  return { containerId, wrapperRef, ready, loadError, exportSnapshot, clear, getBase64, loadBase64, onChange, setSize }
}
