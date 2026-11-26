/**
 * The bench for an update to a List AA holds (build plan Phase 68; D117): the arrival's rows, read only. Phase 69
 * fills it with the List-level decision.
 */

import type { BenchProps } from './benchProps'
import { ArrivalRowsTable } from './ArrivalRowsTable'

export function UpdateBench({ arrival }: BenchProps) {
  return (
    <div data-shot="intake-bench-update" data-arrival-key={arrival.key}>
      <ArrivalRowsTable arrivalKey={arrival.key} shot="intake-bench-update-rows" />
    </div>
  )
}
