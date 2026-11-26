/**
 * Component catalogue example for Admin · Intake (build plan Phase 72): the Needs NHI bench on the live seed's first
 * row waiting for an NHI (Mere Tipene's, its stub on Dr Souter's Tue 8 Dec PM List).
 */

import { OFFICE_ACTOR } from '../../../../store'
import { useArrivalFeed } from '../../../../store/intakeSelectors'
import { EmptyState } from '../../../../shared/ui'
import { NeedsNhiBench } from '../../../admin/screens/intake/workbench/NeedsNhiBench'

const NEEDS_NHI = { kind: 'needsNhi' } as const
const noop = () => undefined

export function NeedsNhiBenchExample() {
  const groups = useArrivalFeed(NEEDS_NHI, '')
  const first = groups[0]?.items[0]
  if (first === undefined) return <EmptyState variant="card">No row is waiting for an NHI.</EmptyState>
  return <NeedsNhiBench arrival={first} actor={OFFICE_ACTOR} onDone={noop} />
}
