/** An anaesthetist's account, under Finances' Ledger tab (catch-up Phase 36, US-13.2.1; build plan Phase 58, D108). An unknown anaesthetist goes back to the tab. */

import { Navigate, useParams } from 'react-router-dom'
import { useAppStore } from '../../../../store'
import { LedgerScreen } from '../LedgerScreen'
import { financePath } from './financePaths'

export function AnaesthetistAccountPage() {
  const { anaesthetistId = '' } = useParams()
  const known = useAppStore((s) => s.masters.anaesthetists[anaesthetistId] !== undefined)
  if (!known) return <Navigate to={financePath('ledger')} replace />
  return <LedgerScreen anaesthetistId={anaesthetistId} />
}
