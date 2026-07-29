'use client'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function renderMath(source: string, displayMode: boolean, key: string) {
  try {
    const html = katex.renderToString(source, { displayMode, throwOnError: false })
    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />
  } catch {
    return <span key={key}>{source}</span>
  }
}

// Разметка простого форматирования внутри обычного текста (не формул):
// **жирный**, __подчёркнутый__, *курсив*, [color=#hex]цветной[/color] —
// нарочно не через dangerouslySetInnerHTML, чтобы текст, введённый
// репетитором, нельзя было превратить в произвольный HTML/скрипт
const formatDelimiter = /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|\[color=([^\]]+)\]([\s\S]+?)\[\/color\]/g

function renderFormatted(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return []
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null
  formatDelimiter.lastIndex = 0

  while ((match = formatDelimiter.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`${keyPrefix}-${key++}`}>{text.slice(lastIndex, match.index)}</span>)
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-${key++}`}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(<u key={`${keyPrefix}-${key++}`}>{match[2]}</u>)
    } else if (match[3] !== undefined) {
      parts.push(<em key={`${keyPrefix}-${key++}`}>{match[3]}</em>)
    } else if (match[4] !== undefined && match[5] !== undefined) {
      parts.push(<span key={`${keyPrefix}-${key++}`} style={{ color: match[4] }}>{match[5]}</span>)
    }
    lastIndex = formatDelimiter.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(<span key={`${keyPrefix}-${key++}`}>{text.slice(lastIndex)}</span>)
  }
  return parts
}

// Рендерит текст с формулами и форматированием: $...$ — инлайн формула,
// $$...$$ — блочная; **жирный**/__подчёркнутый__/*курсив*/[color=...] —
// вне формул
export function Formula({ text }: { text: string }) {
  if (!text) return null

  const delimiter = /\$\$([^$]+)\$\$|\$([^$]+)\$/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = delimiter.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderFormatted(text.slice(lastIndex, match.index), `t${key++}`))
    }
    if (match[1] !== undefined) {
      parts.push(renderMath(match[1], true, `m${key++}`))
    } else if (match[2] !== undefined) {
      parts.push(renderMath(match[2], false, `m${key++}`))
    }
    lastIndex = delimiter.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(...renderFormatted(text.slice(lastIndex), `t${key++}`))
  }

  // white-space: pre-wrap — переносы строк и повторные пробелы, введённые
  // репетитором, должны отображаться как есть, а не схлопываться в один
  // пробел (поведение браузера по умолчанию для обычного текста)
  return <span style={{ whiteSpace: 'pre-wrap' }}>{parts}</span>
}
