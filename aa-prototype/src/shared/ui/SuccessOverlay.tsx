import { useEffect, type ReactNode } from 'react'
import { scheduleCompletionHaptic } from '../../theme/haptics'
import { motion } from '../../theme/motion'
import { semantic } from '../../theme/tokens'

interface SuccessOverlayProps {
  title: string
  children?: ReactNode
  testId?: string
  /**
   * Safety valve, not a feature. The owning flow still drives the timing; this
   * only lets a tap run the same dismissal the owner's timer would have run.
   * Omit it and the overlay is inert, exactly as before.
   */
  onDismiss?: () => void
}

/**
 * Full-surface success moment shared by Card completion and List submission.
 * The owning flow controls how long it remains visible.
 *
 * It runs the Design Language's complete-tick pattern in full: the circle pops,
 * the tick draws, and `scheduleCompletionHaptic` honours the pattern's fourth
 * clause (`motion.completeTick.hapticAt`) on devices that have a motor.
 *
 * Because it is an `inset: 0` blocker, a lost dismiss timer would strand the
 * user behind it — and the installable PWA has no browser back button, no URL
 * bar and no reload to escape with. Owners therefore pass `onDismiss` so a tap
 * anywhere runs the same handler the timer runs. The tap target is a real,
 * focusable button rather than a click handler on the flood, and it sits
 * OUTSIDE the `role="status"` region so the announcement stays exactly the
 * title and its supporting line.
 */
export function SuccessOverlay({ title, children, testId, onDismiss }: SuccessOverlayProps) {
  useEffect(scheduleCompletionHaptic, [])

  return (
    <div
      data-testid={testId}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'aa-fade-in 200ms ease-out',
      }}
    >
      <div
        role="status"
        aria-live="polite"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 99,
            background: semantic.success.tint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `aa-circle-pop 420ms ${motion.completeTick.easing}`,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 38 38" aria-hidden>
            <path
              d="M8 20 L16 28 L30 11"
              fill="none"
              stroke={semantic.success.solid}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="34"
              strokeDashoffset="34"
              style={{
                animation: `aa-tick-draw ${motion.completeTick.drawDuration}ms ${motion.completeTick.easing} ${motion.completeTick.drawDelay}ms forwards`,
              }}
            />
          </svg>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: semantic.success.onTint }}>{title}</div>
        {children}
      </div>

      {/* Transparent and full-bleed, so the escape hatch is the whole surface
          without any visible chrome joining the choreography. Last in the DOM
          so it paints over the (non-interactive) success content. */}
      {onDismiss !== undefined && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            inset: 0,
            border: 0,
            padding: 0,
            background: 'transparent',
            font: 'inherit',
            color: 'inherit',
            cursor: 'pointer',
          }}
        />
      )}
    </div>
  )
}
