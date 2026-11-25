/** A payment run's page, under Finances' Payments tab (catch-up Phase 39a; build plan Phase 58, D108). An unknown run falls back to the tab. */

import { useParams } from 'react-router-dom'
import { RequireEntity } from '../../../../shell/RequireEntity'
import { useAppStore } from '../../../../store'
import { PaymentRunScreen } from '../PaymentRunScreen'

export function PaymentRunPage() {
  const { runId = '' } = useParams()
  const exists = useAppStore((s) => s.billing.payablesRuns[runId] !== undefined)
  return (
    <RequireEntity exists={exists}>
      <PaymentRunScreen key={runId} runId={runId} />
    </RequireEntity>
  )
}
