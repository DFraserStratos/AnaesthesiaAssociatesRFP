/**
 * The bench for Lists that match exactly (build plan Phase 68; D117): the arrival's rows, read only. Phase 71
 * fills it with the confirmation.
 */

import type { BenchProps } from './benchProps'
import { ArrivalRowsTable } from './ArrivalRowsTable'

export function MatchesExactlyBench({ arrival }: BenchProps) {
  return (
    <div data-shot="intake-bench-matchesExactly" data-arrival-key={arrival.key}>
      <ArrivalRowsTable arrivalKey={arrival.key} shot="intake-bench-matchesExactly-rows" />
    </div>
  )
}
