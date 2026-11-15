import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { scheduleCompletionHaptic } from '@proto/theme/haptics'
import { formatCurrency } from '@proto/shared/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EASE_TICK, T } from './shared'

/**
 * The Design Language's complete-tick and value-tick patterns (theme/motion.ts) on Motion. Reduced
 * motion collapses every duration to 80ms with no delay, as the prototype's global rule does.
 */
function useTiming() {
  const reduced = useReducedMotion() === true
  return {
    reduced,
    draw: reduced ? T.reduced : T.drawDuration,
    drawDelay: reduced ? 0 : T.drawDelay,
    pulse: reduced ? T.reduced : T.pulse,
    flood: reduced ? T.reduced : 0.2,
  }
}

const SMALL_TICK = 'M2.5 7.5 L5.5 10.5 L11.5 3.5'

// ===========================================================================
// TickBadge
// ===========================================================================

/** The small completion tick: success-tint circle, drawn check; animated, it draws and pulses 1 to 1.04 to 1. */
export function TickBadge({ size = 24, animate: play = false }: { size?: number; animate?: boolean }) {
  const t = useTiming()
  const glyph = size * (13 / 24)
  return (
    <motion.span
      aria-hidden
      className="tw:flex tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-success-tint tw:text-success-on-tint"
      style={{ width: size, height: size }}
      initial={false}
      animate={play && !t.reduced ? { scale: [1, 1.04, 1] } : undefined}
      transition={{ duration: t.pulse, ease: EASE_TICK, times: [0, 0.45, 1] }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 14 14">
        <motion.path
          d={SMALL_TICK}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={play ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: t.draw, delay: t.drawDelay, ease: EASE_TICK }}
        />
      </svg>
    </motion.span>
  )
}

export function TickBadgeReplacement() {
  const [n, setN] = useState(0)
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <div key={n} className="tw:flex tw:flex-wrap tw:items-center tw:gap-4">
        <TickBadge size={24} animate />
        <TickBadge size={28} animate />
        <TickBadge size={40} animate />
        <TickBadge size={28} />
      </div>
      <Button variant="pill" className="tw:h-11 tw:w-full" onClick={() => setN((x) => x + 1)}>
        Replay
      </Button>
    </div>
  )
}

// ===========================================================================
// SuccessOverlay
// ===========================================================================

/**
 * The full-surface success moment: inset-0 white flood with a 4px blur, the 96px circle pops, the
 * tick draws, the haptic fires (scheduleCompletionHaptic, as today), a role=status title and line,
 * and the late-arming transparent Dismiss button. `exitFade` wraps it in AnimatePresence so hiding
 * it fades out; without it, it vanishes when the owner unmounts it, as today.
 */
export function SuccessOverlay({ show, exitFade, title, children, onDismiss }: { show: boolean; exitFade: boolean; title: string; children?: ReactNode; onDismiss?: () => void }) {
  if (!exitFade) return show ? <OverlayBody title={title} onDismiss={onDismiss}>{children}</OverlayBody> : null
  return <AnimatePresence>{show && <OverlayBody key="success" title={title} onDismiss={onDismiss}>{children}</OverlayBody>}</AnimatePresence>
}

function OverlayBody({ title, children, onDismiss }: { title: string; children?: ReactNode; onDismiss?: () => void }) {
  const t = useTiming()
  const dismissable = onDismiss !== undefined
  const [ready, setReady] = useState(false)
  useEffect(scheduleCompletionHaptic as () => () => void, [])
  useEffect(() => {
    if (!dismissable) return undefined
    const timer = window.setTimeout(() => setReady(true), (t.drawDelay + t.draw) * 1000)
    return () => window.clearTimeout(timer)
  }, [dismissable, t.drawDelay, t.draw])

  return (
    <motion.div
      className="tw:absolute tw:inset-0 tw:z-60 tw:flex tw:items-center tw:justify-center tw:bg-white/90 tw:backdrop-blur-[4px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: t.flood, ease: 'easeOut' }}
    >
      <div role="status" aria-live="polite" className="tw:flex tw:flex-col tw:items-center tw:gap-4">
        <motion.div
          className="tw:flex tw:size-24 tw:items-center tw:justify-center tw:rounded-pill tw:bg-success-tint tw:text-success"
          initial={{ scale: t.reduced ? 1 : 0.5, opacity: 0 }}
          animate={t.reduced ? { opacity: 1 } : { scale: [0.5, 1.05, 1], opacity: [0, 1, 1] }}
          transition={{ duration: t.reduced ? T.reduced : 0.42, ease: EASE_TICK, times: t.reduced ? undefined : [0, 0.6, 1] }}
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
              transition={{ duration: t.draw, delay: t.drawDelay, ease: EASE_TICK }}
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

export function SuccessOverlayReplacement({ exitFade }: { exitFade: boolean }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!show) return undefined
    // The owners' timing: the overlay holds for 1050ms, then the flow moves on.
    const timer = window.setTimeout(() => setShow(false), 1050)
    return () => window.clearTimeout(timer)
  }, [show])
  return (
    <>
      <Button size="cta" className="tw:w-full" onClick={() => setShow(true)}>
        Mark list completed
      </Button>
      <SuccessOverlay show={show} exitFade={exitFade} title="List submitted" onDismiss={() => setShow(false)}>
        <div className="tw:text-sm tw:text-slate">Sent to the office for review</div>
      </SuccessOverlay>
    </>
  )
}

// ===========================================================================
// CompleteBar
// ===========================================================================

/**
 * The Booking footer content: the teal Mark complete CTA (Button cta at e2), or the success-tint
 * bar with the drawn tick, "Booking complete" and the Amend text action while the List is open.
 * `pop` animates the swap on Motion (the bar fades and its tick draws); without it the bar swaps in
 * instantly, as today.
 */
export function CompleteBarView({ completed, canAmend, pop, onComplete, onAmend }: { completed: boolean; canAmend: boolean; pop: boolean; onComplete: () => void; onAmend: () => void }) {
  const t = useTiming()
  const animated = pop && !t.reduced
  if (!completed) {
    return (
      <Button size="cta" className="tw:h-14 tw:w-full tw:shadow-e2" onClick={onComplete}>
        Mark complete
      </Button>
    )
  }
  return (
    <motion.div
      role="status"
      className="tw:flex tw:h-14 tw:items-center tw:justify-center tw:gap-2 tw:rounded-card tw:bg-success-tint tw:text-[17px] tw:font-bold tw:text-success-on-tint"
      initial={animated ? { opacity: 0, scale: 0.98 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: EASE_TICK }}
    >
      <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
        <motion.path
          d={SMALL_TICK}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animated ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: t.draw, delay: t.drawDelay, ease: EASE_TICK }}
        />
      </svg>
      Booking complete
      {canAmend && (
        <Button variant="link" onClick={onAmend} className="tw:ml-1.5 tw:py-1! tw:text-sm tw:underline">
          Amend
        </Button>
      )}
    </motion.div>
  )
}

export function CompleteBarReplacement({ pop }: { pop: boolean }) {
  const [completed, setCompleted] = useState(false)
  return <CompleteBarView completed={completed} canAmend pop={pop} onComplete={() => setCompleted(true)} onAmend={() => setCompleted(false)} />
}

// ===========================================================================
// useTickingValue
// ===========================================================================

/** The booking-total tile both options share: ink card, the figure on a green flash that decays. */
function TotalTile({ flashing, children }: { flashing: boolean; children: ReactNode }) {
  return (
    <div className="tw:flex tw:items-center tw:justify-between tw:rounded-card tw:bg-ink tw:p-4">
      <span className="tw:text-[13px] tw:text-white/70">Booking total</span>
      <span
        className={cn('tw:flex tw:items-center tw:rounded-[8px] tw:px-2 tw:leading-[normal] tw:transition-[background-color] tw:duration-[240ms] tw:ease-out', flashing ? 'tw:bg-[color-mix(in_srgb,var(--status-free)_45%,transparent)]' : 'tw:bg-transparent')}
      >
        {children}
      </span>
    </div>
  )
}

/** Raises a flash on each change and drops it after the 320ms roll plus a quarter of the 240ms decay. */
function useFlash(value: number, reduced: boolean): boolean {
  const [flashing, setFlashing] = useState(false)
  // The value last seen: a flash only on a real change, never on mount (StrictMode runs the
  // effect twice on mount, which a first-render flag does not survive).
  const previous = useRef(value)
  useEffect(() => {
    if (previous.current === value) {
      setFlashing(false)
      return undefined
    }
    previous.current = value
    if (reduced) return undefined
    setFlashing(true)
    const timer = window.setTimeout(() => setFlashing(false), 320 + 240 / 4)
    return () => window.clearTimeout(timer)
  }, [value, reduced])
  return flashing
}

/** Today's roll on Motion: a 320ms cubic ease-out tween of the whole figure (Motion's animate on a motion value). */
function TweenFigure({ value }: { value: number }) {
  const reduced = useReducedMotion() === true
  const mv = useMotionValue(value)
  const [shown, setShown] = useState(value)
  useMotionValueEvent(mv, 'change', (v) => setShown(v))
  useEffect(() => {
    if (reduced) {
      mv.jump(value)
      setShown(value)
      return undefined
    }
    const controls = animate(mv, value, { duration: 0.32, ease: [0.33, 1, 0.68, 1] })
    return () => controls.stop()
  }, [value, reduced, mv])
  const flashing = useFlash(value, reduced)
  return (
    <TotalTile flashing={flashing}>
      <span className="tw:font-mono tw:text-[28px] tw:leading-[normal] tw:font-bold tw:text-white tw:tabular-nums">{formatCurrency(shown)}</span>
    </TotalTile>
  )
}

/** NumberFlow: each digit rolls on its own wheel; tabular figures; it honours reduced motion itself. */
function NumberFlowFigure({ value }: { value: number }) {
  const reduced = useReducedMotion() === true
  const flashing = useFlash(value, reduced)
  return (
    <TotalTile flashing={flashing}>
      <NumberFlow
        value={value}
        locales="en-NZ"
        format={{ style: 'currency', currency: 'NZD', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        transformTiming={{ duration: 320, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' }}
        className="tw:font-mono tw:text-[28px] tw:leading-[normal] tw:font-bold tw:text-white tw:tabular-nums"
      />
    </TotalTile>
  )
}

export function TickingValueReplacement({ engine }: { engine: 'tween' | 'numberflow' }) {
  const [fee, setFee] = useState(642.5)
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {engine === 'tween' ? <TweenFigure value={fee} /> : <NumberFlowFigure value={fee} />}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <Button variant="pill" className="tw:h-11" onClick={() => setFee((x) => Math.max(0, Math.round((x - 32.13) * 100) / 100))}>
          Remove a unit
        </Button>
        <Button variant="pill" className="tw:h-11" onClick={() => setFee((x) => Math.round((x + 32.13) * 100) / 100)}>
          Add a unit
        </Button>
      </div>
    </div>
  )
}
