/**
 * The Finances section's Billing tab (build plan Phase 58; D107, D110,
 * US-13.3.3): the billing pipeline per List, grouped by anaesthetist, which
 * was the Billing monitor.
 */

import { useAdminOutlet } from '../../outlet'
import { BillingMonitorScreen } from '../BillingMonitorScreen'

export function BillingTab() {
  const { actor } = useAdminOutlet()
  return <BillingMonitorScreen actor={actor} />
}
