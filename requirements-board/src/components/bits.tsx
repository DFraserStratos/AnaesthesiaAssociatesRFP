import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import { COMPONENT_CODE, STATUS_HELP, statusClass } from '../vocab.ts'
import type { ItemStatus } from '../../shared/types.ts'

export function StatusLabel({ status, className = '' }: { status: string; className?: string }) {
  return (
    <span className={`status ${statusClass(status)} ${className}`} title={STATUS_HELP[status as ItemStatus]}>
      {status}
    </span>
  )
}

export function Glyph({ component }: { component: string }) {
  return (
    <span className="glyph" title={component}>
      {COMPONENT_CODE[component] ?? component.slice(0, 3).toUpperCase()}
    </span>
  )
}

export function Prose({ text, small }: { text: string; small?: boolean }) {
  return (
    <div className={`prose${small ? ' small' : ''}`}>
      <Markdown>{text}</Markdown>
    </div>
  )
}

/** Highlight every search word in `text`. */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const words = query.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return text
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
}
