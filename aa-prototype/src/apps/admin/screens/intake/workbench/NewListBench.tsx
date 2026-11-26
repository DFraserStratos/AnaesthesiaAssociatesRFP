/**
 * The bench for a new List (build plan Phase 68; D117): the arrival's rows, read only. Phase 70 fills it with the
 * page beside what was read, and where to place it.
 */

import type { BenchProps } from './benchProps'
import { ArrivalRowsTable } from './ArrivalRowsTable'

export function NewListBench({ arrival }: BenchProps) {
  return (
    <div data-shot="intake-bench-newList" data-arrival-key={arrival.key}>
      <ArrivalRowsTable arrivalKey={arrival.key} shot="intake-bench-newList-rows" />
    </div>
  )
}
