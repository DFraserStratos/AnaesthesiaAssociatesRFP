/**
 * The bench for a row waiting for an NHI (build plan Phase 68; D117): its one row, read only. Phase 72 fills it
 * with the NHI path.
 */

import type { BenchProps } from './benchProps'
import { ArrivalRowsTable } from './ArrivalRowsTable'

export function NeedsNhiBench({ arrival }: BenchProps) {
  return (
    <div data-shot="intake-bench-needsNhi" data-arrival-key={arrival.key}>
      <ArrivalRowsTable arrivalKey={arrival.key} shot="intake-bench-needsNhi-rows" />
    </div>
  )
}
