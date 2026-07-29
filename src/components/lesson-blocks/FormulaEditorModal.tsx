'use client'
import { useEffect, useRef, useState } from 'react'

// Визуальный конструктор формул поверх MathLive — вводишь формулу и сразу
// видишь её как формулу (не как код), затем вставляешь готовый LaTeX в текст
export function FormulaEditorModal({ onInsert, onClose }: {
  onInsert: (latex: string) => void
  onClose: () => void
}) {
  const fieldRef = useRef<(HTMLElement & { value: string }) | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    import('mathlive').then(() => setReady(true))
  }, [])

  // Виртуальная клавиатура MathLive прижата к низу экрана и может занимать
  // больше половины его высоты — если не резервировать под неё место, поле
  // ввода и кнопки "Вставить"/"Отмена" физически оказываются под ней и
  // перестают ловить клики. window.mathVirtualKeyboard — глобальный объект
  // самой библиотеки, сообщает актуальную высоту через это событие
  useEffect(() => {
    if (!ready) return
    const vk = (window as unknown as { mathVirtualKeyboard?: EventTarget & { boundingRect: DOMRect } }).mathVirtualKeyboard
    if (!vk) return
    function onGeometryChange() {
      setKeyboardHeight(vk!.boundingRect?.height || 0)
    }
    vk.addEventListener('geometrychange', onGeometryChange)
    return () => vk.removeEventListener('geometrychange', onGeometryChange)
  }, [ready])

  useEffect(() => {
    const container = containerRef.current
    if (!ready || !container) return
    const field = document.createElement('math-field') as HTMLElement & { value: string }
    field.style.display = 'block'
    field.style.width = '100%'
    field.style.padding = '14px'
    field.style.fontSize = '20px'
    field.style.background = '#0f1117'
    field.style.border = '1px solid #2a2d3d'
    field.style.borderRadius = '8px'
    field.style.color = '#fff'
    container.appendChild(field)
    fieldRef.current = field
    field.focus()
    return () => {
      container.removeChild(field)
      fieldRef.current = null
    }
  }, [ready])

  function handleInsert() {
    const latex = fieldRef.current?.value?.trim()
    if (latex) onInsert(latex)
    onClose()
  }

  return (
    <div
      style={{
        // MathLive рисует свою виртуальную клавиатуру отдельным элементом
        // прямо в document.body поверх всей страницы, с z-index 105 — если
        // наша подложка выше, клавиатура визуально "гаснет" под ней и не
        // ловит клики. Поэтому подложка ниже клавиатуры, а закрытие —
        // только по кнопкам, не по клику снаружи (иначе клик по клавиатуре,
        // не попавшей "внутрь" модалки, закрывал бы конструктор).
        // Клавиатура всегда прижата к НИЗУ экрана и занимает существенную
        // его часть — если диалог центрировать по вертикали, поле ввода и
        // кнопки "Вставить"/"Отмена" физически оказываются под клавиатурой
        // и перестают ловить клики. Поэтому диалог держим у ВЕРХА экрана,
        // где клавиатура гарантированно не может его перекрыть.
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px',
        paddingBottom: keyboardHeight + 20,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#1a1d27', border: '1px solid #2a2d3d', borderRadius: '16px',
          padding: '1.5rem', width: '100%', maxWidth: '520px', zIndex: 91,
          marginTop: '32px', flexShrink: 0,
          maxHeight: `calc(100vh - ${keyboardHeight}px - 60px)`, overflowY: 'auto',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Конструктор формулы</div>

        {!ready && (
          <div style={{ color: '#6b7280', fontSize: '13px', padding: '20px 0' }}>Загрузка редактора...</div>
        )}
        <div ref={containerRef} style={{ display: ready ? 'block' : 'none' }} />

        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '10px' }}>
          Печатай формулу как обычно — дроби, степени и корни можно набрать прямо со стрелками на клавиатуре
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid #2a2d3d', color: '#9ca3af', borderRadius: '8px', padding: '8px 18px', fontSize: '14px', cursor: 'pointer' }}
          >
            Отмена
          </button>
          <button
            onClick={handleInsert}
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Вставить
          </button>
        </div>
      </div>
    </div>
  )
}
