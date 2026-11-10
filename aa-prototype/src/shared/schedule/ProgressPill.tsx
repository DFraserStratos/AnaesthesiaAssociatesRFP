/**
 * A List's progress as a compact pill for tables and result rows (catch-up
 * Phase 38a): the web Lists table's Progress column and the search and day rows
 * on both apps. The label comes from `LIST_PROGRESS_LABEL` only. Submitted
 * carries the design's done tick; nothing here is an action colour.
 */

import { neutral, semantic } from '../../theme/tokens'
import { STATUS_PALETTE } from '../../theme/statusColours'
import { LIST_PROGRESS_LABEL, type ListProgress } from '../../domain/listProgress'
import { TickBadge } from '../ui/TickBadge'

const TONE: Record<Exclude<ListProgress, 'upcoming'>, { bg: string; color: string }> = {
  toFinish: { bg: semantic.warning.tint, color: semantic.warning.onTint },
  readyToSubmit: { bg: 'transparent', color: STATUS_PALETTE.free.onTint },
  submitted: { bg: 'transparent', color: STATUS_PALETTE.free.onTint },
  authorised: { bg: neutral.sunken, color: neutral.slate },
  invoiced: { bg: neutral.sunken, color: neutral.slate },
}

export function ProgressPill({ progress }: { progress: ListProgress }) {
  if (progress === 'upcoming') return null
  const tone = TONE[progress]
  const label = LIST_PROGRESS_LABEL[progress]
  // Submitted and ready to submit share the design's done tick, as the phone's List row draws them.
  if (progress === 'submitted' || progress === 'readyToSubmit') {
    return (
      <span data-progress={progress} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: tone.color, whiteSpace: 'nowrap' }}>
        <TickBadge size={18} />
        {label}
      </span>
    )
  }
  return (
    <span data-progress={progress} style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}
