import { useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { elevation, neutral, radius, scrim, zIndex } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import { useModalLayer } from './useModalLayer'
import { OverlayTitleContext } from './overlayTitle'
import { CloseButton } from '../ui/IconButton'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Accepted for signature parity with the mobile bottom sheet; unused on web. */
  hideHandle?: boolean
  /** `wide` for a two-column body (the step rail). */
  size?: 'default' | 'wide'
  /** The control that takes focus on open (a confirm's safe button). */
  initialFocusRef?: RefObject<HTMLElement>
}

/**
 * The web `SurfaceProvider`'s `Overlay` (convention 16): a centred desktop
 * dialog with the same `{open, onClose, children, hideHandle}` signature as the
 * mobile `BottomSheet`, so every shared flow/capture sheet renders unchanged on
 * both platforms. Scrim (`aa-fade-in`) + a `radius.panel` card at `elevation.e3`;
 * closes on Escape (the one modal stack, `useModalLayer`) or a scrim click.
 * `position:fixed; inset:0` so it centres over the viewport regardless of where
 * the detail panel sits. An `OverlayHeader` inside names it and shows the
 * corner X (UI unification U2, questions 11 and 12).
 */
export function Dialog({ open, onClose, children, size = 'default', initialFocusRef }: DialogProps) {
  // One modal stack (U2): Escape closes only the top layer (the RVG code
  // picker over the Add booking dialog, catch-up Phase 19), focus goes in and
  // comes back, Tab stays inside, the page behind is inert.
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useModalLayer({ open, onClose, rootRef, panelRef, initialFocusRef })
  // The `OverlayHeader` inside names the dialog and brings the corner X (question 11).
  const [titleId, setTitleId] = useState<string | null>(null)
  const seam = useMemo(() => ({ register: setTitleId, corner: true }), [])

  if (!open) return null
  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, zIndex: zIndex.dialog, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: scrim,
          animation: `aa-fade-in ${motion.sheetIn.scrimFade}ms ${motion.sheetIn.easing}`,
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby={titleId ?? undefined}
        tabIndex={-1}
        style={{
          position: 'relative',
          outline: 'none',
          width: size === 'wide' ? 'min(760px, 100%)' : 'min(520px, 100%)',
          maxHeight: '86vh',
          overflow: 'auto',
          background: neutral.surface,
          borderRadius: radius.panel,
          boxShadow: elevation.e3,
          padding: '24px 24px 28px',
          animation: `aa-fade-in ${motion.sheetIn.scrimFade}ms ${motion.sheetIn.easing}`,
        }}
      >
        <OverlayTitleContext.Provider value={seam}>{children}</OverlayTitleContext.Provider>
        {titleId !== null && (
          // The drawer's corner X, through the layer's one onClose (question 11; the shared CloseButton since U5).
          <CloseButton onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, display: 'flex' }} />
        )}
      </div>
    </div>
  )
}
