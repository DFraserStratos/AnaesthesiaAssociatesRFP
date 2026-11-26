/**
 * The one props shape every Intake bench takes (build plan Phase 68; D117). The Workbench frame hands each bench
 * the selected arrival, the acting office user and `onDone` (called once the arrival is decided, so Arrivals keeps
 * it picked and the bench shows its decision until the office moves on). Wave 7 fills the benches and keeps this shape.
 */

import type { ArrivalItem } from '../../../../../domain/intake/arrivals'
import type { Actor } from '../../../../../store/mutate'

export interface BenchProps {
  arrival: ArrivalItem
  actor: Actor
  onDone: () => void
}
