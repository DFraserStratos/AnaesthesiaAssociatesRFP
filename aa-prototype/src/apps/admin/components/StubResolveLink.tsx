import { useNavigate } from 'react-router-dom'
import type { Stub } from '../../../domain/types'
import { TextAction } from '../../../shared/ui'
import { useAppStore } from '../../../store'
import { arrivalKeyForRow } from '../../../store/intakeSelectors'
import { arrivalsPath } from '../screens/intake/intakePaths'

/**
 * "Resolve at Intake" (catch-up Phase 33a; US-02.6.3; re-pointed by build plan
 * Phase 68): opens Intake's Arrivals with the stub's waiting row's arrival
 * selected, the same hand-off a Booking's "From hospital row" line uses. The
 * office resolves the row there.
 */
export function StubResolveLink({ stub }: { stub: Stub }) {
  const navigate = useNavigate()
  const open = () => {
    const item = arrivalKeyForRow(useAppStore.getState(), stub.importRowId)
    navigate(arrivalsPath({ filter: { kind: 'needsNhi' }, ...(item !== undefined ? { item } : {}) }))
  }
  return (
    <TextAction size="sm" shot="stub-resolve-link" onClick={open} style={{ flex: 'none' }}>
      Resolve at Intake
    </TextAction>
  )
}
