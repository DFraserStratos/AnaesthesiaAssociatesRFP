/**
 * The one sheet confirm (UI unification U2, README U18, F G6): built from the
 * surface's `Overlay`, `OverlayHeader` and `SheetActions` and nothing else.
 * Focus opens on the safe button, and a double click runs the primary once.
 *
 * The body between the header and the footer (`children`: a reason field, an
 * error box, a note) is the caller's. Labels are the caller's too ("Keep it",
 * "Keep the booking", "Cancel"; Phase 44 audits them).
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { useSurface } from './context'
import { OverlayHeader } from './OverlayHeader'
import { SheetActions } from './SheetActions'

/** How long the primary ignores a second click after a run. */
const CONFIRM_REARM_MS = 400

export interface ConfirmSheetProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  confirmLabel: ReactNode
  onConfirm: () => void
  /** The safe button's label; it closes through `onClose`. */
  cancelLabel: ReactNode
  /**
   * The safe button's own action, when it is not just closing (catch-up
   * Phase 35's "Leave without saving?": Discard and leave). Escape and the
   * backdrop still call `onClose`. Defaults to `onClose`.
   */
  onCancel?: () => void
  confirmDisabled?: boolean
  /** On the sheet's body wrapper. */
  shot?: string
  /** On the primary button. */
  confirmShot?: string
  children?: ReactNode
}

export function ConfirmSheet({ open, onClose, title, description, confirmLabel, onConfirm, cancelLabel, onCancel, confirmDisabled, shot, confirmShot, children }: ConfirmSheetProps) {
  const { Overlay } = useSurface()
  const safeRef = useRef<HTMLButtonElement>(null)
  // A double click cannot run the confirm twice: after a run the primary
  // ignores clicks for a moment (a refusal shown in the sheet, even the same
  // one again, can then be retried).
  const ranRef = useRef(false)
  useEffect(() => () => window.clearTimeout(rearmRef.current), [])
  const rearmRef = useRef<number | undefined>(undefined)

  function confirm() {
    if (ranRef.current) return
    ranRef.current = true
    rearmRef.current = window.setTimeout(() => {
      ranRef.current = false
    }, CONFIRM_REARM_MS)
    onConfirm()
  }

  return (
    <Overlay open={open} onClose={onClose} initialFocusRef={safeRef}>
      <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title={title} description={description} />
        {children}
        <SheetActions
          primary={
            <Button variant="primary" block onClick={confirm} disabled={confirmDisabled} shot={confirmShot}>
              {confirmLabel}
            </Button>
          }
          secondary={
            <Button buttonRef={safeRef} variant="secondary" block onClick={onCancel ?? onClose}>
              {cancelLabel}
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}
