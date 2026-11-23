import { semantic, radius } from '../../theme/tokens'
import { motion } from '../../theme/motion'

/**
 * The brand tick (UI unification U7, U35; J N8): the design's drawn checkmark, path
 * `M2.5 7.5 L5.5 10.5 L11.5 3.5` on a 14 viewBox, round caps, for COMPLETION states (a done Booking, a
 * submitted List, the tick badge). Always hidden from screen readers: the words beside it carry the meaning.
 * lucide `Check` stays the icon for "selected". `draw` plays the design's complete-tick stroke draw.
 */
export function TickGlyph({ size = 18, color, strokeWidth = 2.4, draw = false }: { size?: number; color: string; strokeWidth?: number; draw?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden data-tick-glyph="">
      <path
        d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...(draw
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
  )
}

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
        borderRadius: radius.pill,
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
      <TickGlyph size={size * stroke} color={semantic.success.onTint} strokeWidth={2.2} draw={animate} />
    </span>
  )
}
