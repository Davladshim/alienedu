'use client'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function renderMath(source: string, displayMode: boolean, key: number) {
  try {
    const html = katex.renderToString(source, { displayMode, throwOnError: false })
    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />
  } catch {
    return <span key={key}>{source}</span>
  }
}

// Рендерит текст с формулами: $...$ — инлайн, $$...$$ — блочная
export function Formula({ text }: { text: string }) {
  if (!text) return null

  const delimiter = /\$\$([^$]+)\$\$|\$([^$]+)\$/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = delimiter.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
    }
    if (match[1] !== undefined) {
      parts.push(renderMath(match[1], true, key++))
    } else if (match[2] !== undefined) {
      parts.push(renderMath(match[2], false, key++))
    }
    lastIndex = delimiter.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
  }

  return <>{parts}</>
}
