/**
 * The Finances section's Payments tab (build plan Phase 58; D107, D110,
 * US-13.3.3): the weekly payment cycle and its runs, then the approved events
 * waiting for the next billing run, both moved off the Billing monitor
 * unchanged.
 */

import { Link } from 'react-router-dom'
import { neutral } from '../../../../theme/tokens'
import { useAppStore } from '../../../../store'
import { approvedEventsAwaitingRun } from '../../../../store/procedureEventActions'
import { freeFormSubtotal } from '../../../../domain/billing/additionalInvoice'
import { creditDetailOf, eventLines } from '../../../../domain/billing/procedureEvent'
import { CREDIT_LABELS, EVENT_KIND_LABEL, EVENT_LABELS, PRE_POST_OP_COPY, kindRowText } from '../../../../shared/procedureEventCopy'
import { formatCurrency } from '../../../../shared/format'
import { CountBadge, Notice } from '../../../../shared/ui'
import { useAdminOutlet } from '../../outlet'
import { PageBody } from '../../components/AdminPage'
import { PaymentCyclePanel } from '../../components/PaymentCyclePanel'
import { FinancesPage } from './FinancesSection'

export function PaymentsTab() {
  const { actor } = useAdminOutlet()
  return (
    <FinancesPage tab="payments" mode="fluid">
      <PageBody>
        <PaymentCyclePanel actor={actor} />
        <EventsAwaitingRunPanel />
      </PageBody>
    </FinancesPage>
  )
}

/**
 * Approved events waiting for the next billing run (catch-up Phase 38b), so an
 * approved event is never invisible between its review and its run. Shown only
 * while one waits; each links to its Booking. The run itself is the demo
 * action "Run the next billing run" (the real system's run is scheduled).
 */
export function EventsAwaitingRunPanel() {
  const state = useAppStore((s) => s)
  const waiting = approvedEventsAwaitingRun(state)
  if (waiting.length === 0) return null
  return (
    <Notice tone="neutral" icon={false} shot="events-awaiting-run" title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{EVENT_LABELS.awaitingRunTitle} <CountBadge count={waiting.length} mono srNoun="waiting" /></span>}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {waiting.map((e) => {
        const booking = state.schedule.bookings[e.bookingId]
        const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
        const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
        // A credit (catch-up Phase 39) names the invoice it credits and its total, never $0.
        const creditDetail = creditDetailOf(e)
        const credited = creditDetail !== undefined ? state.billing.invoices[creditDetail.originalInvoiceId] : undefined
        return (
          <div key={e.id} data-event-id={e.id} data-kind={e.kind} style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 13 }}>
            {list !== undefined ? (
              <Link to={`/admin/day/${list.dateISO}/bookings/${e.bookingId}`} style={{ color: neutral.ink, fontWeight: 600 }}>{patient?.name ?? e.bookingId}</Link>
            ) : (
              <span style={{ fontWeight: 600 }}>{patient?.name ?? e.bookingId}</span>
            )}
            <span style={{ color: neutral.slate }}>{credited !== undefined ? CREDIT_LABELS.creditsInFull(credited.invoiceNumber) : EVENT_KIND_LABEL[e.kind]}</span>
            <span className="mono" style={{ marginLeft: 'auto', color: neutral.ink }}>{credited !== undefined ? formatCurrency(credited.subtotal) : PRE_POST_OP_COPY.amount(kindRowText(state, e)?.amount ?? freeFormSubtotal(eventLines(e)))} <span style={{ color: neutral.slate }}>{EVENT_LABELS.exGst}</span></span>
          </div>
        )
      })}
      </span>
    </Notice>
  )
}
