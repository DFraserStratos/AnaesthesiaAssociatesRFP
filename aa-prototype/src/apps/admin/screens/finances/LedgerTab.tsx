/**
 * The Finances section's Ledger tab (build plan Phase 58; D107, D110,
 * US-13.3.3): the whole ledger, with the AA Holding account (moved off the
 * Billing monitor unchanged) below its tables.
 */

import { useAdminOutlet } from '../../outlet'
import { HoldingAccountPanel } from '../../components/HoldingAccountPanel'
import { LedgerScreen } from '../LedgerScreen'

export function LedgerTab() {
  const { actor } = useAdminOutlet()
  return <LedgerScreen actor={actor} below={<HoldingAccountPanel />} />
}
