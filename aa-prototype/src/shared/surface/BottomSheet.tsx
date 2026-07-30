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
          // The two keyboard lines. On iOS the software keyboard shrinks only
          // the VISUAL viewport, so WebKit tries to scroll the layout viewport
          // to reveal the focused field, finds nothing scrollable inside a
          // host that is exactly viewport-height with `overflow: hidden`, and
          // pans the whole page instead — the classic "content pushed off the
          // top and won't come back", with Save stranded behind the keys.
          // `MobileViewport` publishes the keyboard height; the sheet rides
          // above it and gives back the same height from its cap so it cannot
          // grow off the top. The frame never sets the var, so both resolve to
          // today's values there.
          bottom: 'var(--aa-keyboard-inset, 0px)',
          maxHeight: 'calc(90% - var(--aa-keyboard-inset, 0px))',
          overflow: 'auto',
          background: neutral.surface,
          borderRadius: `${radius.sheet}px ${radius.sheet}px 0 0`,
          boxShadow: elevation.e3,
          paddingTop: 8,
          paddingLeft: 20,
          paddingRight: 20,
          // 36 = 34 + 2 at the simulated inset. The 20px floor is the sheet's
          // own resting bottom gutter, so a zero-inset device keeps a sheet
          // that does not look shrink-wrapped to its last control.
          paddingBottom: 'max(calc(var(--aa-inset-bottom, 34px) + 2px), 20px)',
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
