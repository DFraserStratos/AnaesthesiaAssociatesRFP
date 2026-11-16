import { useRef, type ReactNode } from 'react'
import { elevation, neutral, radius, scrim, zIndex } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import { useModalLayer } from './useModalLayer'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Accepted for signature parity with the mobile bottom sheet; unused on web. */
  hideHandle?: boolean
  /** `wide` for a two-column body (the step rail). */
  size?: 'default' | 'wide'
}

/**
 * The web `SurfaceProvider`'s `Overlay` (convention 16): a centred desktop
 * dialog with the same `{open, onClose, children, hideHandle}` signature as the
 * mobile `BottomSheet`, so every shared flow/capture sheet renders unchanged on
 * both platforms. Scrim (`aa-fade-in`) + a `radius.panel` card at `elevation.e3`;
 * closes on Escape (the one modal stack, `useModalLayer`) or a scrim click.
 * `position:fixed; inset:0` so it centres over the viewport regardless of where
 * the detail panel sits.
 */
export function Dialog({ open, onClose, children, size = 'default' }: DialogProps) {
  // One modal stack (U2): Escape closes only the top layer (the RVG code
  // picker over the Add booking dialog, catch-up Phase 19), focus goes in and
  // comes back, Tab stays inside, the page behind is inert.
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useModalLayer({ open, onClose, rootRef, panelRef })

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
        {children}
      </div>
    </div>
  )
}
