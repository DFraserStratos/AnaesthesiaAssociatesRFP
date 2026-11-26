/**
 * A hospital file's heading in the feed (build plan Phase 68; docs/explorations/intake-ideas.html #idea1,
 * layout A's `.arr .ah`): the file's label over its source mark, when it arrived and how many Lists it
 * holds. Intake's own heading, not the table kit's `GroupRow` (a `th` for a table's column group): the
 * feed is a listbox, and this names the group of options under it (`id`, read by `aria-labelledby`).
 */

import type { ArrivalGroup } from '../../../../../domain/intake/arrivals'
import { plural } from '../../../../../shared/format'
import { useToday } from '../../../../../store'
import { fontFamily, neutral, type as typeScale } from '../../../../../theme/tokens'
import { receivedText } from './feedText'
import { SourceMark } from './SourceMark'

export function FeedGroupHeader({ heading, batchId, id }: { heading: NonNullable<ArrivalGroup['heading']>; batchId: string; id?: string }) {
  const todayISO = useToday()
  return (
    <div data-shot="intake-group-header" data-batch-id={batchId} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 4px 6px' }}>
      <div id={id} style={{ fontSize: typeScale.small.size, lineHeight: '16px', fontWeight: 600, color: neutral.ink }}>
        {heading.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: typeScale.captionSm.size, lineHeight: '16px', color: neutral.slate }}>
        <SourceMark source={heading.source} />
        <span style={{ fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums', fontSize: 11, color: neutral.mist }}>{receivedText(heading.receivedAtISO, todayISO)}</span>
        <span aria-hidden>·</span>
        <span>{plural(heading.listCount, 'List')}</span>
      </div>
    </div>
  )
}
