/**
 * A screen's render timing (catch-up Phase 43; US-15.0.4): the time from the
 * start of the render to the commit (a layout effect), then a paint sample two
 * animation frames later, recorded in `scaleMode` tagged with the current scale.
 * It samples on mount and whenever `deps` change (a page, a filter, a date), so
 * each screen has a demo-scale and a full-scale figure. Measurement only:
 * nothing it records reaches domain state.
 */

import { useLayoutEffect, useRef } from 'react'
import { nowMs, recordScreenSample } from '../../store/scaleMode'

/** The timed screens, in the banner's order, with their labels. */
export const TIMED_SCREENS = [
  { key: 'day', label: 'Day view' },
  { key: 'review', label: 'To authorise' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'audit', label: 'Audit' },
  { key: 'monitor', label: 'Billing' },
  { key: 'ledger', label: 'Ledger' },
] as const

export type TimedScreen = (typeof TIMED_SCREENS)[number]['key']

export function useScreenTiming(key: TimedScreen, deps: readonly unknown[]): void {
  const start = useRef(0)
  // Taken on every render; the effect below reads the one that led to this commit.
  start.current = nowMs()
  useLayoutEffect(() => {
    const began = start.current
    recordScreenSample(key, nowMs() - began)
    if (typeof requestAnimationFrame !== 'function') return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => recordScreenSample(key, nowMs() - began, 'paint'))
    })
    return () => {
      cancelAnimationFrame(first)
      if (second !== 0) cancelAnimationFrame(second)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
