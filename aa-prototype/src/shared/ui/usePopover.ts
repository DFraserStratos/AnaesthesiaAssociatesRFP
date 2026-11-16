/**
 * The one popover behaviour (UI unification U2, README U30): open state, one
 * outside `pointerdown` that closes, and Escape that closes and returns focus
 * to the trigger. The trigger carries `aria-expanded` and `aria-controls`.
 *
 * It joins the one modal stack as a `popover` layer (`useModalLayer`), so
 * Escape closes an open popover before the dialog under it, and a dialog's
 * Escape never also closes a harness menu below it.
 *
 * `rootRef` goes on the element holding both the trigger and the panel, so a
 * click on either is "inside". Imports nothing from an app folder (PWA-safe).
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useModalLayer } from '../surface/useModalLayer'

export interface Popover {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  /** Close and put focus back on the trigger (what Escape does). */
  closeToTrigger: () => void
  rootRef: React.RefObject<HTMLDivElement>
  triggerRef: React.RefObject<HTMLButtonElement>
  /** The panel's id, for `aria-controls`. */
  panelId: string
  /** Spread on the trigger button. */
  triggerProps: {
    ref: React.RefObject<HTMLButtonElement>
    'aria-expanded': boolean
    'aria-controls': string
  }
}

export function usePopover(): Popover {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const closeToTrigger = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])
  const toggle = useCallback(() => setOpen((value) => !value), [])

  useModalLayer({ open, onClose: closeToTrigger, rootRef, kind: 'popover' })

  useEffect(() => {
    if (!open) return undefined
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return {
    open,
    setOpen,
    toggle,
    closeToTrigger,
    rootRef,
    triggerRef,
    panelId,
    triggerProps: { ref: triggerRef, 'aria-expanded': open, 'aria-controls': panelId },
  }
}
