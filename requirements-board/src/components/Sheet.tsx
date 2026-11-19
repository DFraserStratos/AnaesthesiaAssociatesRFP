import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/**
 * Sheets on screen. The modals are keyed by record id, so stepping to a
 * sibling unmounts one sheet and mounts another; without this the entrance
 * would replay and the page behind would flash through the fading scrim.
 * The replacement renders before the outgoing one unmounts, so a non-zero
 * count here means this sheet is a swap, not an opening.
 */
let openSheets = 0
/** Where focus was before the first of a run of modal sheets opened: stepping between siblings keeps it. */
let opener: HTMLElement | null = null

/** Where focus goes when a modal sheet closes: back where it was, or the page's main region if that is gone. */
function restoreFocus(to: HTMLElement | null) {
  // `body` is where focus sits when nothing had it (a sheet opened from the URL): that is no opener.
  if (to && to !== document.body && to.isConnected && !to.closest('[inert]')) {
    to.focus({ preventScroll: true })
    if (document.activeElement === to) return
  }
  // The docked card a question sat over, else the page itself. `main` is made focusable (no tab stop)
  // only until focus leaves it again, so afterwards a click on empty page space puts focus back on
  // `body`, as before (board keys read where focus is).
  const docked = document.querySelector<HTMLElement>('.dock .sheet.docked')
  if (docked) return docked.focus({ preventScroll: true })
  const main = document.querySelector<HTMLElement>('main')
  if (!main) return
  if (!main.hasAttribute('tabindex')) {
    main.tabIndex = -1
    main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true })
  }
  main.focus({ preventScroll: true })
}

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
 * `docked` is the board's side panel instead: no scrim, the board stays live
 * beside it, and it takes no focus on open so arrow keys keep walking the
 * board. Esc still closes it, unless it came from the board's own controls
 * (search, a popover) or a modal sheet is open over it.
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
  docked = false,
}: {
  children: ReactNode
  /** Every way out goes through here, so an unsaved-edit guard can intercept it. */
  onClose: () => void
  /** Return true when the key was handled. */
  onKey?: (e: KeyboardEvent) => boolean
  confirm?: SheetConfirm | null
  label: string
  statusClass?: string
  docked?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const [entering] = useState(() => openSheets === 0)
  // Read while rendering, before any field's autoFocus runs: the element to give focus back to on close.
  // A sheet that replaces a sibling keeps the first sheet's opener.
  const [openedFrom] = useState(() => (docked ? null : openSheets === 0 ? (document.activeElement as HTMLElement | null) : opener))
  const handlers = useRef({ onClose, onKey, confirm })
  handlers.current = { onClose, onKey, confirm }

  useEffect(() => {
    if (docked) {
      const listener = (e: KeyboardEvent) => {
        if (document.querySelector('.scrim')) return // a modal sheet over the panel owns the keyboard
        const h = handlers.current
        const target = e.target instanceof HTMLElement ? e.target : null
        const fromBoard = !!target && target !== document.body && !ref.current?.contains(target) && !target.closest('.react-flow')
        if (h.confirm) {
          if (e.key === 'Escape') {
            e.preventDefault()
            h.confirm.onCancel()
          }
          return
        }
        if (e.key === 'Escape' && fromBoard) return
        if (h.onKey?.(e)) return
        if (e.key === 'Escape') {
          e.preventDefault()
          h.onClose()
        }
      }
      window.addEventListener('keydown', listener)
      return () => window.removeEventListener('keydown', listener)
    }
    openSheets++
    opener = openedFrom
    // A field that asked for focus (a new card's title) keeps it; otherwise the sheet itself takes it.
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true })
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
      if (document.querySelectorAll('.scrim .sheet').length <= 1) for (const el of behind) el.inert = false
      // A sibling replacing this sheet mounts in the same commit; only the last sheet to close gives focus back.
      queueMicrotask(() => {
        if (openSheets > 0) return
        restoreFocus(openedFrom)
        opener = null
      })
    }
  }, [])

  // The veiled content is washed out visually; `inert` makes it unreachable too. Checked on every render,
  // since content can appear under the veil (a banner when a file changes).
  useEffect(() => {
    for (const el of Array.from(ref.current?.children ?? [])) {
      if (!el.classList.contains('sheet-veil')) (el as HTMLElement).inert = !!handlers.current.confirm
    }
    // A modal sheet keeps the focus: when what had it goes (leaving Edit removes the field), the sheet takes it.
    if (!docked && (!document.activeElement || document.activeElement === document.body)) ref.current?.focus({ preventScroll: true })
  })
  // Keeping the edits is the safe answer, so it takes the focus and the Enter key: once, when the question
  // appears, never again on a re-render (a file changing) while the user works elsewhere.
  const asking = confirm ? confirm.title : null
  useEffect(() => {
    if (!asking) return
    const before = document.activeElement as HTMLElement | null
    confirmRef.current?.focus({ preventScroll: true })
    // Answered: focus goes back where it was in the sheet (the answer's button is gone), unless the user
    // has put it somewhere else meanwhile. A sheet closing gives focus back itself.
    return () => {
      const sheet = ref.current
      const now = document.activeElement
      if (!sheet || (now && now !== document.body && now.isConnected)) return
      ;(before && before.isConnected && sheet.contains(before) ? before : sheet).focus({ preventScroll: true })
    }
  }, [asking])
  const bodyId = useId()

  const veil = confirm && (
    <div className="sheet-veil" role="alertdialog" aria-label={confirm.title} aria-describedby={bodyId}>
      <div className="veil-ask">
        <h3>{confirm.title}</h3>
        <p id={bodyId}>{confirm.body}</p>
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
  )

  if (docked) {
    return (
      <div ref={ref} className={`sheet docked ${statusClass}${confirm ? ' veiled' : ''}`} role="region" aria-label={label} tabIndex={-1}>
        {children}
        {veil}
      </div>
    )
  }

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
        {veil}
      </div>
    </div>
  )
}
