import type { ReactNode } from 'react'
import { elevation, neutral, radius, scrim } from '../../../theme/tokens'
import { motion } from '../../../theme/motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Hide the drag handle (e.g. when the sheet owns its own header chrome). */
  hideHandle?: boolean
}

/**
 * Mobile bottom sheet (convention 16): a scrim that fades in (`aa-fade-in`,
 * scrim token) and a panel that slides up from the bottom edge (`aa-sheet-in`,
 * `motion.sheetIn`, top corners `radius.sheet`). Tapping the scrim closes it.
 * Mounted only while open — the enter choreography is the 320ms slide the demo
 * checklist verifies; reduced-motion collapses it globally.
 *
 * Renders `position:absolute; inset:0` so it must sit inside the phone frame's
 * `position:relative` content region (MobileApp's root provides that).
 */
export function BottomSheet({ open, onClose, children, hideHandle }: BottomSheetProps) {
  if (!open) return null
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70 }}>
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
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '90%',
          overflow: 'auto',
          background: neutral.surface,
          borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`,
          boxShadow: elevation.e3,
          padding: '8px 20px 36px',
          animation: `aa-sheet-in ${motion.sheetIn.in}ms ${motion.sheetIn.easing}`,
        }}
      >
        {hideHandle !== true && (
          <div
            aria-hidden
            style={{ width: 36, height: 4, borderRadius: 99, background: neutral.lineStrong, margin: '4px auto 14px' }}
          />
        )}
        {children}
      </div>
    </div>
  )
}
