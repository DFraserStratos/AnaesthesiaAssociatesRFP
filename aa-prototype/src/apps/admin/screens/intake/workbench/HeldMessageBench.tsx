/**
 * The bench for a held message (build plan Phase 68; D117): no rows, only the message and why it is held. Phase 71
 * fills it.
 */

import type { BenchProps } from './benchProps'
import { Notice } from '../../../../../shared/ui'

export function HeldMessageBench({ arrival }: BenchProps) {
  return (
    <div data-shot="intake-bench-held" data-arrival-key={arrival.key}>
      <Notice tone="warning" title={arrival.title} shot="intake-bench-held-reason">
        {arrival.reason ?? 'This message could not become a List.'}
      </Notice>
    </div>
  )
}
