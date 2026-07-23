import { semantic } from '../../theme/tokens'
import { motion } from '../../theme/motion'

interface TickBadgeProps {
  size?: number
  /** Play the draw + pulse (the completion moment); otherwise a static tick. */
  animate?: boolean
}

/**
 * The small completion tick: a success-tint circle with a drawn checkmark.
 * When `animate`, replays the design's complete-tick pattern (`aa-tick-draw`
 * on the stroke, `aa-tick-pulse` on the circle); otherwise it renders drawn and
 * still, for the settled "done" states on rows.
 */
export function TickBadge({ size = 24, animate = false }: TickBadgeProps) {
  const stroke = 13 / 24
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: semantic.success.tint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        ...(animate
          ? { animation: `aa-tick-pulse ${motion.completeTick.pulseDuration}ms ${motion.completeTick.easing}` }
          : {}),
      }}
    >
      <svg width={size * stroke} height={size * stroke} viewBox="0 0 14 14">
        <path
          d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
          fill="none"
          stroke={semantic.success.onTint}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...(animate
            ? {
                strokeDasharray: 34,
                strokeDashoffset: 34,
                style: {
                  animation: `aa-tick-draw ${motion.completeTick.drawDuration}ms ${motion.completeTick.easing} ${motion.completeTick.drawDelay}ms forwards`,
                },
              }
            : {})}
        />
      </svg>
    </span>
  )
}
