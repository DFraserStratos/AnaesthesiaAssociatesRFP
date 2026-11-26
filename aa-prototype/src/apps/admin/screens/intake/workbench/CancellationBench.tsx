/**
 * The bench for a cancellation (build plan Phase 68; D117): the arrival's rows, read only. Phase 69 fills it with
 * the decision.
 */

import type { BenchProps } from './benchProps'
import { ArrivalRowsTable } from './ArrivalRowsTable'

export function CancellationBench({ arrival }: BenchProps) {
  return (
    <div data-shot="intake-bench-cancellation" data-arrival-key={arrival.key}>
      <ArrivalRowsTable arrivalKey={arrival.key} shot="intake-bench-cancellation-rows" />
    </div>
  )
}
