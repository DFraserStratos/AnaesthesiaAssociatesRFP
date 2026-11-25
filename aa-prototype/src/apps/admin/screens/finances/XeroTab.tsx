/**
 * The Finances section's Xero tab (build plan Phase 58; D107, D110,
 * US-13.3.3): the connection line, then the Xero sync queue and the invoices
 * changed directly in Xero, moved off the Billing monitor unchanged and shown
 * for every anaesthetist.
 */

import { useAdminOutlet } from '../../outlet'
import { PageBody } from '../../components/AdminPage'
import { XeroConnectionLine, XeroDivergencePanel, XeroQueuePanel } from '../../components/XeroPanels'
import { FinancesPage } from './FinancesSection'

export function XeroTab() {
  const { actor } = useAdminOutlet()
  return (
    <FinancesPage tab="xero" mode="fluid">
      <XeroConnectionLine />
      <PageBody>
        <XeroQueuePanel actor={actor} />
        <XeroDivergencePanel actor={actor} />
      </PageBody>
    </FinancesPage>
  )
}
