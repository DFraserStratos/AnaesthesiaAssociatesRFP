import { useNavigate } from 'react-router-dom'
import type { Stub } from '../../../domain/types'
import { TextAction } from '../../../shared/ui'

/**
 * "Resolve on Matching" (catch-up Phase 33a; US-02.6.3): opens Matching with
 * the stub's waiting row selected, the same hand-off a Booking's "From a
 * hospital row" line uses. The office resolves the row there.
 */
export function StubResolveLink({ stub }: { stub: Stub }) {
  const navigate = useNavigate()
  return (
    <TextAction size="sm" shot="stub-resolve-link" onClick={() => navigate('/admin/intake/matching', { state: { selectRowId: stub.importRowId } })} style={{ flex: 'none' }}>
      Resolve on Matching
    </TextAction>
  )
}
