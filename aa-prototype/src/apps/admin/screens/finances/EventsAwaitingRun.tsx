/**
 * The Payments tab's rail: approved events waiting for the next billing run (catch-up Phase 38b,
 * build plan Phase 66; US-10.2.7, D115), so an approved event is never invisible between its review
 * and its run. One row per event: the patient linking to the Booking, the kind (or the invoice a
 * credit credits in full) and the amount ex GST. Shown only while one waits. The run itself is the
 * demo action "Run the next billing run" (the real system's run is scheduled).
 */

import { useMemo } from 'react'
import { useAppStore } from '../../../../store'
import { approvedEventsAwaitingRun } from '../../../../store/procedureEventActions'
import { freeFormSubtotal } from '../../../../domain/billing/additionalInvoice'
import { creditDetailOf, eventLines } from '../../../../domain/billing/procedureEvent'
import { CREDIT_LABELS, EVENT_KIND_LABEL, EVENT_LABELS, PRE_POST_OP_COPY, kindRowText } from '../../../../shared/procedureEventCopy'
import { formatCurrency } from '../../../../shared/format'
import { RailSection, type RailSectionRow } from '../../../../shared/ui'
import { financePath } from './financePaths'

/** The rail's title, also its `aside` label on the tab. */
export const EVENTS_AWAITING_RUN_TITLE = 'Events awaiting the run'

/** The approved events not yet in a billing run, read from the events slice alone. */
export function useEventsAwaitingRun() {
  const procedureEvents = useAppStore((s) => s.schedule.procedureEvents)
  return useMemo(() => approvedEventsAwaitingRun({ schedule: { procedureEvents } }), [procedureEvents])
}

export function EventsAwaitingRun() {
  const waiting = useEventsAwaitingRun()
  const bookings = useAppStore((s) => s.schedule.bookings)
  const lists = useAppStore((s) => s.schedule.lists)
  const patients = useAppStore((s) => s.masters.patients)
  const contractEventFees = useAppStore((s) => s.masters.contractEventFees)
  const invoices = useAppStore((s) => s.billing.invoices)
  const rows = useMemo<RailSectionRow[]>(
    () =>
      waiting.map((e) => {
        const booking = bookings[e.bookingId]
        const list = booking !== undefined ? lists[booking.listId] : undefined
        const patient = booking !== undefined ? patients[booking.patientId] : undefined
        // A credit (catch-up Phase 39) names the invoice it credits and its total, never $0.
        const creditDetail = creditDetailOf(e)
        const credited = creditDetail !== undefined ? invoices[creditDetail.originalInvoiceId] : undefined
        const amount = credited !== undefined ? formatCurrency(credited.subtotal) : PRE_POST_OP_COPY.amount(kindRowText({ masters: { contractEventFees } }, e)?.amount ?? freeFormSubtotal(eventLines(e)))
        return {
          key: e.id,
          // A Booking whose List is gone has no Day view to open: the row falls back to the Payments tab it sits on.
          to: list !== undefined ? `/admin/day/${list.dateISO}/bookings/${e.bookingId}` : financePath('payments'),
          title: patient?.name ?? e.bookingId,
          sub: (
            <>
              {credited !== undefined ? CREDIT_LABELS.creditsInFull(credited.invoiceNumber) : EVENT_KIND_LABEL[e.kind]}
              {' · '}
              <span className="mono">{amount}</span> {EVENT_LABELS.exGst}
            </>
          ),
          data: { 'data-event-id': e.id, 'data-kind': e.kind },
        }
      }),
    [waiting, bookings, lists, patients, contractEventFees, invoices],
  )
  if (rows.length === 0) return null
  // Every waiting event shows: the list is the office's to clear, and it empties at each billing run.
  return <RailSection title={EVENTS_AWAITING_RUN_TITLE} countNoun="waiting" rows={rows} limit={rows.length} empty="" shot="events-awaiting-run" />
}
