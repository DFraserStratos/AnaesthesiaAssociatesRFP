import { useEffect, useState, type ReactNode } from 'react'
import { elevation, neutral, radius, scrim } from '../../theme/tokens'
import { motion } from '../../theme/motion'

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
 * `motion.sheetIn`, top corners `radius.sheet`). Tapping the scrim or handle
 * reverses that motion before closing. Mounted only while open — the enter
 * choreography is the 320ms slide the demo checklist verifies; reduced-motion
 * collapses both directions globally.
 *
 * Renders `position:absolute; inset:0` so it must sit inside the phone frame's
 * `position:relative` content region (MobileApp's root provides that). It is the
 * mobile `SurfaceProvider`'s `Overlay` (convention 16); the web provider swaps in
 * `Dialog` so shared flows render as centred dialogs without any per-platform
 * branching in the flow bodies themselves.
 */
export function BottomSheet({ open, onClose, children, hideHandle }: BottomSheetProps) {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!closing) return undefined
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const closeDelay = reducedMotion ? motion.reducedMotionFade : motion.sheetIn.out
    const timeout = window.setTimeout(() => {
      setClosing(false)
      onClose()
    }, closeDelay)
    return () => window.clearTimeout(timeout)
  }, [closing, onClose])

  if (!open) return null

  function requestClose() {
    if (!closing) setClosing(true)
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, pointerEvents: closing ? 'none' : 'auto' }}>
      <div
        onClick={requestClose}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: scrim,
          animation: closing
            ? `aa-fade-out ${motion.sheetIn.scrimFade}ms ${motion.sheetIn.easing} forwards`
            : `aa-fade-in ${motion.sheetIn.scrimFade}ms ${motion.sheetIn.easing}`,
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
          animation: closing
            ? `aa-sheet-out ${motion.sheetIn.out}ms ${motion.sheetIn.easing} forwards`
            : `aa-sheet-in ${motion.sheetIn.in}ms ${motion.sheetIn.easing}`,
        }}
      >
        {hideHandle !== true && (
          <button
            type="button"
            aria-label="Close sheet"
            onClick={requestClose}
            style={{
              display: 'block',
              width: 64,
              height: 22,
              padding: '4px 14px 14px',
              margin: '0 auto',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden
              style={{ display: 'block', width: 36, height: 4, borderRadius: 99, background: neutral.lineStrong }}
            />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
