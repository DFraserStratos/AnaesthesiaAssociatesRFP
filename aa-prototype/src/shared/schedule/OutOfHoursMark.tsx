/**
 * The out-of-hours List's two marks (catch-up Phase 32c; US-01.1.6), shared so
 * every surface draws them alike: the moon that stands in the session column
 * where an AM or PM List shows its session, and the neutral "Out-of-hours"
 * pill beside a title.
 */

import { Moon } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import { OUT_OF_HOURS } from '../outOfHoursTerms'

/** The moon in a session column (20px tall, like the AM or PM word it replaces). */
export function OutOfHoursMoon({ color = neutral.ink, size = 15 }: { color?: string; size?: number }) {
  return (
    <span style={{ height: 20, display: 'flex', alignItems: 'center', color }}>
      <Moon size={size} strokeWidth={2.2} aria-hidden />
    </span>
  )
}

/** The neutral pill, with the moon when `moon` is set (a header) and without it beside a row title. */
export function OutOfHoursPill({ moon = false }: { moon?: boolean }) {
  return (
    <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: radius.pill, background: neutral.sunken, color: neutral.ink, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {moon && <Moon size={11} strokeWidth={2.4} aria-hidden />}
      {OUT_OF_HOURS}
    </span>
  )
}
