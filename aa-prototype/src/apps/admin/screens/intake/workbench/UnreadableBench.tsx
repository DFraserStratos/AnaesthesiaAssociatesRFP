/**
 * The bench for a rooms' PDF that cannot be read (build plan Phase 68; D117): no rows, only the file and why it
 * could not become a List. Phase 70 fills it.
 */

import type { BenchProps } from './benchProps'
import { Notice } from '../../../../../shared/ui'

export function UnreadableBench({ arrival }: BenchProps) {
  return (
    <div data-shot="intake-bench-unreadable" data-arrival-key={arrival.key}>
      <Notice tone="warning" title={arrival.title} shot="intake-bench-unreadable-reason">
        {arrival.reason ?? 'This file could not be read as a List.'}
      </Notice>
    </div>
  )
}
