import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Sheets on screen. The modals are keyed by record id, so stepping to a
 * sibling unmounts one sheet and mounts another; without this the entrance
 * would replay and the page behind would flash through the fading scrim.
 * The replacement renders before the outgoing one unmounts, so a non-zero
 * count here means this sheet is a swap, not an opening.
 */
let openSheets = 0

/** A question the sheet asks about itself, over a veil of its own content. */
export interface SheetConfirm {
  title: string
  body: string
  /** The action being confirmed, e.g. "Discard changes". Always says what happens. */
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * The centred modal sheet shared by items and questions. Esc closes (after the
 * content's own key handler has had a chance), clicking the scrim closes, and
 * focus returns to where it was when the sheet closes.
 *
 * A sheet never stacks a second dialogue on itself: when it has something to
 * ask, it veils its own content (`confirm`) and puts the question in its place.
 */
export function Sheet({
  children,
  onClose,
  onKey,
  confirm,
  label,
  statusClass = '',
}: {
  children: ReactNode
  /** Every way out goes through here, so an unsaved-edit guard can intercept it. */
  onClose: () => void
  /** Return true when the key was handled. */
  onKey?: (e: KeyboardEvent) => boolean
  confirm?: SheetConfirm | null
  label: string
  statusClass?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const [entering] = useState(() => openSheets === 0)
  const handlers = useRef({ onClose, onKey, confirm })
  handlers.current = { onClose, onKey, confirm }

  useEffect(() => {
    openSheets++
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus({ preventScroll: true })
    // aria-modal is only a promise: make the page behind actually unreachable by Tab and pointer.
    const behind = [...document.querySelectorAll<HTMLElement>('.masthead, .main')]
    for (const el of behind) el.inert = true
    const listener = (e: KeyboardEvent) => {
      const h = handlers.current
      if (h.confirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          h.confirm.onCancel()
        }
        return
      }
      if (h.onKey?.(e)) return
      if (e.key === 'Escape') {
        e.preventDefault()
        h.onClose()
      }
    }
    window.addEventListener('keydown', listener)
    return () => {
      openSheets--
      window.removeEventListener('keydown', listener)
      // Another sheet may already be open (switching item to question); leave it modal.
      if (document.querySelectorAll('.sheet').length <= 1) for (const el of behind) el.inert = false
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  // Keeping the edits is the safe answer, so it takes the focus and the Enter key.
  // The veiled content is washed out visually; `inert` makes it unreachable too.
  useEffect(() => {
    for (const el of Array.from(ref.current?.children ?? [])) {
      if (!el.classList.contains('sheet-veil')) (el as HTMLElement).inert = !!confirm
    }
    if (confirm) confirmRef.current?.focus({ preventScroll: true })
  }, [confirm])

  return (
    <div
      className={`scrim${entering ? '' : ' swapped'}`}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (confirm) confirm.onCancel()
        else onClose()
      }}
    >
      <div ref={ref} className={`sheet ${statusClass}${confirm ? ' veiled' : ''}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
        {confirm && (
          <div className="sheet-veil" role="alertdialog" aria-label={confirm.title}>
            <div className="veil-ask">
              <h3>{confirm.title}</h3>
              <p>{confirm.body}</p>
              <div className="veil-actions">
                <button ref={confirmRef} className="btn primary" onClick={confirm.onCancel}>
                  {confirm.cancelLabel}
                </button>
                <button className="btn danger" onClick={confirm.onConfirm}>
                  {confirm.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
