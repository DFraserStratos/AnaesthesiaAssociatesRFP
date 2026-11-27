/**
 * The Finances section's Payments tab (build plan Phases 58 and 66; D107, D110, D115, US-13.3.3,
 * US-10.2.7, US-03.7.2): the events on Procedures awaiting the office's approval first, while any
 * wait, then the weekly payment cycle card and the payment runs table in the main column; the
 * approved events waiting for the next billing run in the rail, shown only while one waits
 * (docs/explorations/finances-section.html `#p-payments`). The tab's number, and its share of the
 * Finances badge, is the events awaiting approval (`financeCounts.ts`'s `paymentsTabCount`).
 */

import { useAdminOutlet } from '../../outlet'
import { PageBody } from '../../components/AdminPage'
import { PaymentCyclePanel } from '../../components/PaymentCyclePanel'
import { FinancesPage } from './FinancesSection'
import { EventsAwaitingApproval } from './EventsAwaitingApproval'
import { EventsAwaitingRun, EVENTS_AWAITING_RUN_TITLE, useEventsAwaitingRun } from './EventsAwaitingRun'
import { PaymentRunsTable } from './PaymentRunsTable'

export function PaymentsTab() {
  const { actor } = useAdminOutlet()
  // An empty rail would still hold its column, so the rail goes with the last waiting event.
  const waiting = useEventsAwaitingRun().length
  return (
    <FinancesPage tab="payments" mode="fluid">
      <PageBody {...(waiting > 0 ? { rail: <EventsAwaitingRun />, railLabel: EVENTS_AWAITING_RUN_TITLE } : {})}>
        <EventsAwaitingApproval actor={actor} />
        <PaymentCyclePanel actor={actor} />
        <PaymentRunsTable />
      </PageBody>
    </FinancesPage>
  )
}
