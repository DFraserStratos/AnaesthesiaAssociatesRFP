/**
 * The out-of-hours List's mark (catch-up Phase 32c; US-01.1.6), shared so
 * every surface draws them alike: the moon that stands in the session column
 * where an AM or PM List shows its session. (Its unused "Out-of-hours" pill
 * was deleted in UI unification U3: rows say it in the subtitle.)
 */

import { Moon } from 'lucide-react'
import { neutral } from '../../theme/tokens'

/** The moon in a session column (20px tall, like the AM or PM word it replaces). */
export function OutOfHoursMoon({ color = neutral.ink, size = 15 }: { color?: string; size?: number }) {
  return (
    <span style={{ height: 20, display: 'flex', alignItems: 'center', color }}>
      <Moon size={size} strokeWidth={2.2} aria-hidden />
    </span>
  )
}
