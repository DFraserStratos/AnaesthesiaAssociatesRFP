import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { scheduleCompletionHaptic } from '@proto/theme/haptics'
import { Button } from '@/components/ui/button'

/**
 * The Design Language's complete-tick pattern (motion.ts `completeTick`), on Motion:
 * draw 360ms after a 60ms delay on the tick curve; the circle pops 0.5 to 1.05 to 1
 * over 420ms (overlay) or pulses 1 to 1.04 to 1 (badge); the flood fades in 200ms;
 * a haptic at 200ms. Reduced motion: every duration 80ms, no delay, as the
 * prototype's global reduced-motion rule does.
 */
const TICK_EASE = [0.65, 0, 0.35, 1] as const
const DRAW = 0.36
const DRAW_DELAY = 0.06
const POP = 0.42
const PULSE = 0.42
const REDUCED = 0.08

function useTiming() {
  const reduced = useReducedMotion() === true
  return {
    reduced,
    draw: reduced ? REDUCED : DRAW,
    drawDelay: reduced ? 0 : DRAW_DELAY,
    pop: reduced ? REDUCED : POP,
    pulse: reduced ? REDUCED : PULSE,
    flood: reduced ? REDUCED : 0.2,
  }
}

// ---------------------------------------------------------------------------
// TickBadge
// ---------------------------------------------------------------------------

/** The small completion tick: a success-tint circle with a drawn check; animated, it draws and pulses. */
export function TickBadge({ size = 24, animate = false }: { size?: number; animate?: boolean }) {
  const t = useTiming()
  const glyph = size * (13 / 24)
  return (
    <motion.span
      aria-hidden
      className="tw:flex tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-success-tint tw:text-success-on-tint"
      style={{ width: size, height: size }}
      initial={false}
      animate={animate ? { scale: [1, 1.04, 1] } : undefined}
      transition={{ duration: t.pulse, ease: TICK_EASE, times: [0, 0.45, 1] }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 14 14">
        <motion.path
          d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: t.draw, delay: t.drawDelay, ease: TICK_EASE }}
        />
      </svg>
    </motion.span>
  )
}

export function TickBadgeReplacement() {
  const [run, setRun] = useState(0)
  return (
    <div className="tw:flex tw:items-center tw:gap-4">
      <TickBadge key={run} size={36} animate />
      <TickBadge size={24} />
      <Button variant="pill" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SuccessOverlay
// ---------------------------------------------------------------------------

/**
 * The full-surface success moment. Same anatomy as the prototype: an inset-0
 * white flood with a 4px blur, the 96px success-tint circle, the drawn tick, the
 * title and its supporting line in a role=status region, and the late-arming
 * transparent Dismiss button (it appears only once the tick has drawn, so a
 * second impatient click cannot swallow the moment). It vanishes when the owner
 * hides it, as today: no exit animation is added.
 */
export function SuccessOverlay({ show, title, children, onDismiss }: { show: boolean; title: string; children?: ReactNode; onDismiss?: () => void }) {
  return show ? <OverlayBody title={title} onDismiss={onDismiss}>{children}</OverlayBody> : null
}

function OverlayBody({ title, children, onDismiss }: { title: string; children?: ReactNode; onDismiss?: () => void }) {
  const t = useTiming()
  const dismissable = onDismiss !== undefined
  const [ready, setReady] = useState(false)
  useEffect(scheduleCompletionHaptic as () => () => void, [])
  useEffect(() => {
    if (!dismissable) return undefined
    const armAfter = (t.drawDelay + t.draw) * 1000
    const timer = window.setTimeout(() => setReady(true), armAfter)
    return () => window.clearTimeout(timer)
  }, [dismissable, t.drawDelay, t.draw])

  return (
    <motion.div
      className="tw:absolute tw:inset-0 tw:z-60 tw:flex tw:items-center tw:justify-center tw:bg-white/90 tw:backdrop-blur-[4px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: t.flood, ease: 'easeOut' }}
    >
      <div role="status" aria-live="polite" className="tw:flex tw:flex-col tw:items-center tw:gap-4">
        <motion.div
          className="tw:flex tw:size-24 tw:items-center tw:justify-center tw:rounded-pill tw:bg-success-tint tw:text-success"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.05, 1], opacity: [0, 1, 1] }}
          transition={{ duration: t.pop, ease: TICK_EASE, times: [0, 0.6, 1] }}
        >
          <svg width="48" height="48" viewBox="0 0 38 38" aria-hidden>
            <motion.path
              d="M8 20 L16 28 L30 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: t.draw, delay: t.drawDelay, ease: TICK_EASE }}
            />
          </svg>
        </motion.div>
        <div className="tw:text-[17px] tw:font-bold tw:text-success-on-tint">{title}</div>
        {children}
      </div>
      {dismissable && ready && (
        <button type="button" aria-label="Dismiss" onClick={onDismiss} className="tw:absolute tw:inset-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0" />
      )}
    </motion.div>
  )
}

export function SuccessOverlayReplacement() {
  const [shown, setShown] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )
  function show() {
    setShown(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    // The owners' timing: the overlay holds for 1050ms, then the flow moves on.
    timer.current = window.setTimeout(() => setShown(false), 1050)
  }
  return (
    <div className="tw:flex tw:min-h-[150px] tw:items-center tw:justify-center">
      <Button variant="outline" size="lg" onClick={show}>
        Confirm reassignment
      </Button>
      <SuccessOverlay show={shown} title="Moved to Sharma, Priya" onDismiss={() => setShown(false)}>
        <span className="tw:text-[13px] tw:text-slate">The List is in her PM session.</span>
      </SuccessOverlay>
    </div>
  )
}
