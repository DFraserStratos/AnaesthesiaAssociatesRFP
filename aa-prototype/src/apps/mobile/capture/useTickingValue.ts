import { useEffect, useRef, useState } from 'react'
import { motion } from '../../../theme/motion'

/** The mockup's tweenFee: a 320 ms rAF tween with ease 1 - (1 - p)^3. */
const TWEEN_MS = 320

export interface TickingValue {
  /** The rolling display value (format it; round units for display). */
  display: number
  /** True while the green flash tint should show; decays per value-tick. */
  flashing: boolean
}

/**
 * Roll a numeric value toward its target — the design's value-tick pattern
 * (fee and unit counts "tick" rather than jump; tabular numerals mandatory on
 * the rendering element). A change starts the mockup's 320 ms cubic ease-out
 * tween and raises `flashing`, which drops after the tween so the caller's
 * `motion.valueTick.tintDecay` background transition fades the tint out.
 * `prefers-reduced-motion` jumps instantly with no flash.
 */
export function useTickingValue(target: number): TickingValue {
  const [display, setDisplay] = useState(target)
  const [flashing, setFlashing] = useState(false)
  const displayRef = useRef(target)
  const rafRef = useRef<number | null>(null)
  const flashRef = useRef<number | null>(null)

  useEffect(() => {
    const from = displayRef.current
    if (Math.abs(target - from) < 0.005) return

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      displayRef.current = target
      setDisplay(target)
      return
    }

    setFlashing(true)
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / TWEEN_MS)
      const eased = 1 - Math.pow(1 - p, 3)
      const value = from + (target - from) * eased
      displayRef.current = value
      setDisplay(value)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(step)

    if (flashRef.current !== null) clearTimeout(flashRef.current)
    flashRef.current = window.setTimeout(
      () => setFlashing(false),
      TWEEN_MS + motion.valueTick.tintDecay / 4,
    )
  }, [target])

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (flashRef.current !== null) clearTimeout(flashRef.current)
    },
    [],
  )

  return { display, flashing }
}
