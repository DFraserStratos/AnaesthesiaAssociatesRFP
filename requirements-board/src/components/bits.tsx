import { useEffect, useState, type ReactNode } from 'react'
import { TYPE_LABEL, type Component, type Item, type ItemType } from '../../shared/types.ts'
import { recordUrl } from '../nav.ts'
import { COMPONENT_CODE, statusClass, statusLabel, typeClass } from '../vocab.ts'

/** The work-item type mark (after Azure DevOps' backlog icon), in the type's colour. */
export function TypeIcon({ type, size = 14 }: { type: ItemType; size?: number }) {
  return (
    <svg className={`type-icon ${typeClass(type)}`} width={size} height={size} viewBox="0 0 14 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      {[1.5, 5.5, 9.5].map((y) => (
        <g key={y}>
          <rect x="1.5" y={y} width="4.5" height="3" rx="0.8" />
          <rect x="8" y={y} width="4.5" height="3" rx="0.8" />
        </g>
      ))}
    </svg>
  )
}

/** A title with its type icon: how an item is named everywhere outside its own sheet. */
export function ItemName({ item }: { item: Item }) {
  return (
    <span className={typeClass(item.type)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }} title={item.id}>
      <TypeIcon type={item.type} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
    </span>
  )
}

/** The lineage as arrow pills that slot into each other, each in its type colour. Pills are clickable when `onPick` is given. */
export function Lineage({ chain, onPick }: { chain: Item[]; onPick?: (id: string) => void }) {
  return (
    <nav className="lineage" aria-label="Lineage">
      {chain.map((it) => {
        const body = (
          <>
            <TypeIcon type={it.type} size={13} />
            <span>{it.title}</span>
          </>
        )
        return !onPick ? (
          <span key={it.id} className={`seg ${typeClass(it.type)}`} title={`${TYPE_LABEL[it.type]} · ${it.title}`}>
            {body}
          </span>
        ) : (
          <button key={it.id} type="button" className={`seg ${typeClass(it.type)}`} title={`${TYPE_LABEL[it.type]} · ${it.title}`} onClick={() => onPick(it.id)}>
            {body}
          </button>
        )
      })}
    </nav>
  )
}

export function StatusLabel({ status, className = '', children }: { status: string; className?: string; children?: ReactNode }) {
  return (
    <span className={`status ${statusClass(status)} ${className}`}>
      {statusLabel(status)}
      {children}
    </span>
  )
}

export function Glyph({ component }: { component: string }) {
  return (
    <span className="glyph" title={component}>
      {COMPONENT_CODE[component as Component] ?? component.slice(0, 3).toUpperCase()}
    </span>
  )
}

/**
 * A record's ID that copies a link to the record when clicked. Pasted over selected text in any
 * Markdown field, the link turns the selection into a link to the record.
 */
export function CopyLink({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  const copy = () => void navigator.clipboard?.writeText(recordUrl(id)).then(() => setCopied(true), () => {})
  return (
    <button type="button" className={`copy-link${className ? ` ${className}` : ''}`} onClick={copy} title="Copy a link to this card, to paste over text in a description or note">
      {copied ? 'Link copied' : children}
    </button>
  )
}

/** Highlight every search word in `text`. */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const words = query.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return text
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
}
