import type { ReactNode } from 'react'
import { motion } from '../../theme/motion'
import { semantic } from '../../theme/tokens'

interface SuccessOverlayProps {
  title: string
  children?: ReactNode
  testId?: string
}

/**
 * Full-surface success moment shared by Card completion and List submission.
 * The owning flow controls how long it remains visible.
 */
export function SuccessOverlay({ title, children, testId }: SuccessOverlayProps) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        animation: 'aa-fade-in 200ms ease-out',
      }}
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
  )
}
