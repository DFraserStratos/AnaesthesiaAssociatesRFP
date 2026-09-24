import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The centred modal sheet shared by items and questions. Esc closes (after the
 * content's own key handler has had a chance), clicking the scrim closes, and
 * focus returns to where it was when the sheet closes.
 */
export function Sheet({
  children,
  onClose,
  onKey,
  guardClose,
  label,
  statusClass = '',
}: {
  children: ReactNode
  onClose: () => void
  /** Return true when the key was handled. */
  onKey?: (e: KeyboardEvent) => boolean
  /** Return false to veto closing (e.g. unsaved edits). */
  guardClose?: () => boolean
  label: string
  statusClass?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const handlers = useRef({ onClose, onKey, guardClose })
  handlers.current = { onClose, onKey, guardClose }

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus({ preventScroll: true })
    // aria-modal is only a promise: make the page behind actually unreachable by Tab and pointer.
    const behind = [...document.querySelectorAll<HTMLElement>('.masthead, .main')]
    for (const el of behind) el.inert = true
    const listener = (e: KeyboardEvent) => {
      const h = handlers.current
      if (h.onKey?.(e)) return
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!h.guardClose || h.guardClose()) h.onClose()
      }
    }
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
      // Another sheet may already be open (switching item to question); leave it modal.
      if (document.querySelectorAll('.sheet').length <= 1) for (const el of behind) el.inert = false
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  return (
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && (!guardClose || guardClose())) onClose()
      }}
    >
      <div ref={ref} className={`sheet ${statusClass}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </div>
  )
}
