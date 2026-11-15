import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Segmented } from './shared'

const TICK_EASE = [0.65, 0, 0.35, 1] as const

/** The bare check of the done bar; `draw` plays the complete-tick stroke (360 ms after 60 ms) when it mounts. */
function Check({ draw }: { draw: boolean }) {
  const reduced = useReducedMotion() === true
  const play = draw && !reduced
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
      <motion.path
        d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
        fill="none"
        stroke="var(--success-on-tint)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={play ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.36, delay: 0.06, ease: TICK_EASE }}
      />
    </svg>
  )
}

/**
 * Booking capture's footer control: a shadcn Button (cta size, teal) that becomes the green done bar
 * with an Amend link while the List is active. `drawTick` plays the complete-tick on the check when the
 * Booking is completed; today the bar simply swaps in.
 */
export function CompleteBarReplacement({ drawTick = false }: { drawTick?: boolean }) {
  const [completed, setCompleted] = useState(false)
  const [canAmend, setCanAmend] = useState<'yes' | 'no'>('yes')
  const amendRef = useRef<HTMLButtonElement>(null)
  const completeRef = useRef<HTMLButtonElement>(null)
  const moved = useRef(false)
  // The control under focus is replaced on each click: focus follows to its counterpart.
  useEffect(() => {
    if (!moved.current) return
    if (completed) amendRef.current?.focus()
    else completeRef.current?.focus()
  }, [completed])
  function set(next: boolean) {
    moved.current = true
    setCompleted(next)
  }
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:text-xs tw:font-semibold tw:text-mist">List still active</span>
        <Segmented label="List still active" size="sm" value={canAmend} options={[{ value: 'yes', label: 'Yes (Amend shown)' }, { value: 'no', label: 'No' }]} onChange={setCanAmend} />
      </div>
      {completed ? (
        <div role="status" className="tw:flex tw:h-14 tw:items-center tw:justify-center tw:gap-2 tw:rounded-card tw:bg-success-tint tw:text-[17px] tw:font-bold tw:text-success-on-tint">
          <Check draw={drawTick} />
          Booking complete
          {canAmend === 'yes' && (
            <Button variant="link" className="tw:ml-1.5 tw:py-1! tw:text-sm tw:underline" ref={amendRef} onClick={() => set(false)}>
              Amend
            </Button>
          )}
        </div>
      ) : (
        <Button size="cta" className="tw:h-14 tw:w-full tw:shadow-e2" ref={completeRef} onClick={() => set(true)}>
          Mark complete
        </Button>
      )}
    </div>
  )
}
