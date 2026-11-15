import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'

/** The design's complete-tick curve and timings (theme/motion.ts completeTick). */
const TICK_EASE = [0.65, 0, 0.35, 1] as const
const DRAW_S = 0.36
const DRAW_DELAY_S = 0.06
const PULSE_S = 0.42
const REDUCED_FADE_S = 0.08

const PATH = 'M2.5 7.5 L5.5 10.5 L11.5 3.5'

/**
 * The completion tick on Motion: a success-tint circle with a drawn checkmark. `animate` replays the
 * complete-tick pattern (stroke drawn over 360 ms after 60 ms, the circle pulsing 1 to 1.04 to 1 over
 * 420 ms); without it the tick is drawn and still. Reduced motion: an 80 ms fade, no draw or pulse.
 */
export function TickMark({ size = 24, animate = false }: { size?: number; animate?: boolean }) {
  const reduced = useReducedMotion() === true
  const glyph = size * (13 / 24)
  const play = animate && !reduced
  return (
    <motion.span
      aria-hidden
      className="tw:flex tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-success-tint"
      style={{ width: size, height: size }}
      initial={animate && reduced ? { opacity: 0 } : false}
      animate={play ? { scale: [1, 1.04, 1] } : { opacity: 1 }}
      transition={play ? { duration: PULSE_S, times: [0, 0.45, 1], ease: TICK_EASE } : { duration: REDUCED_FADE_S }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 14 14">
        <motion.path
          d={PATH}
          fill="none"
          stroke="var(--success-on-tint)"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={play ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: DRAW_S, delay: DRAW_DELAY_S, ease: TICK_EASE }}
        />
      </svg>
    </motion.span>
  )
}

/** The row: "Complete" with the tick, and a replay button (the first render is the settled, still tick). */
export function TickBadgeReplacement() {
  const [n, setN] = useState(0)
  return (
    <div className="tw:flex tw:items-center tw:gap-3.5">
      <span className="tw:inline-flex tw:items-center tw:gap-2 tw:text-[13px] tw:font-semibold tw:text-success-on-tint">
        Complete <TickMark key={n} size={26} animate={n > 0} />
      </span>
      <Button variant="outline" size="sm" onClick={() => setN((x) => x + 1)}>
        Replay the tick
      </Button>
    </div>
  )
}
