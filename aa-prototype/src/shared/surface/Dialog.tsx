import { useEffect, type ReactNode } from 'react'
import { elevation, neutral, radius, scrim } from '../../theme/tokens'
import { motion } from '../../theme/motion'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Accepted for signature parity with the mobile bottom sheet; unused on web. */
  hideHandle?: boolean
}

/**
 * The web `SurfaceProvider`'s `Overlay` (convention 16): a centred desktop
 * dialog with the same `{open, onClose, children, hideHandle}` signature as the
 * mobile `BottomSheet`, so every shared flow/capture sheet renders unchanged on
 * both platforms. Scrim (`aa-fade-in`) + a `radius.panel` card at `elevation.e3`;
 * closes on Escape or a scrim click. `position:fixed; inset:0` so it centres over
 * the viewport regardless of where the detail panel sits.
 */
export function Dialog({ open, onClose, children }: DialogProps) {
  useEffect(() => {
    if (!open) return undefined
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
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
        role="dialog"
        aria-modal
        style={{
          position: 'relative',
          width: 'min(520px, 100%)',
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
