/**
 * One anaesthetist's remittance advice in a payment run, under the run (catch-up Phase 39a; build
 * plan Phase 58, D108). A run not approved, superseded or unknown, or an anaesthetist not paid in
 * it, falls back to the Payments tab (its route is the run's sibling, so `RequireEntity`'s `..` lands there).
 */

import { useParams } from 'react-router-dom'
import { RequireEntity } from '../../../../shell/RequireEntity'
import { useAppStore } from '../../../../store'
import { RemittanceAdviceScreen } from '../PaymentRunScreen'

export function RemittancePage() {
  const { runId = '', anaesthetistId = '' } = useParams()
  const exists = useAppStore((s) => {
    const run = s.billing.payablesRuns[runId]
    return run !== undefined && run.status !== 'superseded' && run.approvedAtISO !== undefined && run.byAnaesthetist.some((t) => t.anaesthetistId === anaesthetistId)
  })
  return (
    <RequireEntity exists={exists}>
      <RemittanceAdviceScreen key={`${runId}:${anaesthetistId}`} runId={runId} anaesthetistId={anaesthetistId} />
    </RequireEntity>
  )
}
