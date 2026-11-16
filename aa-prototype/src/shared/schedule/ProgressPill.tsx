/**
 * A List's progress as a compact pill for tables and result rows (catch-up
 * Phase 38a): the web Lists table's Progress column and the search and day rows
 * on both apps. The label comes from `LIST_PROGRESS_LABEL` only. Submitted
 * carries the design's done tick; nothing here is an action colour.
 *
 * `progressTone` and `progressLabel` are the one tone and label source: the
 * phone's `ListRow` reads them too and keeps its own mockup anatomy (UI
 * unification U3, B G11). The tinted pill is the shared `Pill` at `lg`.
 */

import { STATUS_PALETTE } from '../../theme/statusColours'
import { LIST_PROGRESS_LABEL, type ListProgress } from '../../domain/listProgress'
import { TickBadge } from '../ui/TickBadge'
import { Pill, type PillTone } from '../ui/Pill'

/** "done": the design's tick and a free-green word (submitted, ready to submit); otherwise a `Pill` tone. */
export function progressTone(progress: Exclude<ListProgress, 'upcoming'>): PillTone | 'done' {
  if (progress === 'submitted' || progress === 'readyToSubmit') return 'done'
  return progress === 'toFinish' ? 'warning' : 'neutral'
}

export function progressLabel(progress: Exclude<ListProgress, 'upcoming'>): string {
  return LIST_PROGRESS_LABEL[progress]
}

/** The done word's colour, beside the tick. */
export const PROGRESS_DONE_COLOR = STATUS_PALETTE.free.onTint

export function ProgressPill({ progress }: { progress: ListProgress }) {
  if (progress === 'upcoming') return null
  const tone = progressTone(progress)
  const label = progressLabel(progress)
  // Submitted and ready to submit share the design's done tick, as the phone's List row draws them.
  if (tone === 'done') {
    return (
      <span data-progress={progress} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: PROGRESS_DONE_COLOR, whiteSpace: 'nowrap' }}>
        <TickBadge size={18} />
        {label}
      </span>
    )
  }
  return (
    <Pill size="lg" tone={tone} data-progress={progress}>
      {label}
    </Pill>
  )
}
