import { useState } from 'react'
import { useAppStore, useUpcomingPrepayments } from '../../../store'
import { neutral, radius } from '../../../theme/tokens'
import { Card, CountBadge, EmptyState, Pill, TextAction } from '../../../shared/ui'
import { daysToGoText, NO_PRICE_YET, PREPAYMENT_STATUS_LABEL, prepaymentTone, reminderDayText } from '../../../shared/booking/prepaymentText'
import { lastPrepaymentReminder } from '../../../store/prepaymentLetter'
import { UNASSIGNED } from '../../../shared/scheduleTerms'
import { drSurname, formatMoney, shortDay } from '../../../shared/format'

const VISIBLE_ROWS = 5

/**
 * "Pre-payments" (catch-up Phase 27; US-06.3.2): every upcoming prepaid
 * Booking on a List not yet authorised, one row per payer group, soonest
 * first, with its amount, status and days to go from the demo clock. An
 * awaiting row opens the Invoices strip to approve it; the others open the
 * Booking. A two-payer Booking names each payer under the patient. A row
 * whose invoice was reminded says when (catch-up Phase 41; US-06.3.6).
 */
export function PrepaymentsRailCard({
  onOpenBooking,
  onOpenInvoices,
}: {
  onOpenBooking: (dateISO: string, bookingId: string) => void
  /** Where an awaiting row goes; without it (the catalogue) the row opens the Booking. */
  onOpenInvoices?: () => void
}) {
  const rows = useUpcomingPrepayments()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const billing = useAppStore((s) => s.billing)
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? rows : rows.slice(0, VISIBLE_ROWS)
  const groupsPerBooking = new Map<string, number>()
  for (const r of rows) groupsPerBooking.set(r.bookingId, (groupsPerBooking.get(r.bookingId) ?? 0) + 1)

  return (
    <Card
      shot="rail-prepayments"
      headingId="admin-prepayments-heading"
      title={
        <>
          Pre-payments
          <CountBadge count={rows.length} srNoun={rows.length === 1 ? 'pre-payment' : 'pre-payments'} />
        </>
      }
    >
      {rows.length === 0 ? (
        <EmptyState>No upcoming pre-payments.</EmptyState>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {shown.map((row) => {
            const anaesthetist = row.anaesthetistId !== undefined ? anaesthetists[row.anaesthetistId] : undefined
            const awaiting = row.status === 'awaitingApproval'
            const reminded = row.invoiceId !== undefined ? lastPrepaymentReminder({ billing }, row.invoiceId) : undefined
            return (
              <li key={`${row.bookingId}:${row.payerKey}`}>
              <button
                type="button"
                className="aa-ctl"
                data-shot="rail-prepayment-row"
                data-booking-id={row.bookingId}
                data-status={row.status}
                title={awaiting && onOpenInvoices !== undefined ? 'Approve on Invoices' : 'Open the Booking'}
                onClick={() => (awaiting && onOpenInvoices !== undefined ? onOpenInvoices() : onOpenBooking(row.dateISO, row.bookingId))}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 10px', border: 'none', borderRadius: radius.ctl, background: neutral.bg, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{row.patientName}</span>
                  <span className="mono" style={{ fontSize: 12.5, color: neutral.ink }}>{row.amount !== null ? formatMoney(row.amount) : NO_PRICE_YET}</span>
                </span>
                {(groupsPerBooking.get(row.bookingId) ?? 1) > 1 && <span style={{ fontSize: 12, color: neutral.slate }}>Paid by {row.payerName}</span>}
                {row.status === 'partPaid' && (
                  <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>
                    {formatMoney(row.receivedTotal)} of {formatMoney(row.invoicedTotal)} received
                  </span>
                )}
                {reminded !== undefined && (
                  <span data-shot="rail-prepayment-reminded" style={{ fontSize: 12, color: neutral.slate }}>
                    Reminded <span className="mono">{reminderDayText(reminded.atISO)}</span>
                  </span>
                )}
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: neutral.slate }}>
                    {anaesthetist !== undefined ? drSurname(anaesthetist.name) : UNASSIGNED} · {shortDay(row.dateISO)} · {daysToGoText(row.daysToGo)}
                  </span>
                  <Pill tone={prepaymentTone(row.status)} size="sm">{PREPAYMENT_STATUS_LABEL[row.status]}</Pill>
                </span>
              </button>
              </li>
            )
          })}
        </ul>
      )}
      {rows.length > VISIBLE_ROWS && (
        <TextAction size="sm" flush ariaExpanded={expanded} onClick={() => setExpanded(!expanded)} style={{ alignSelf: 'flex-start' }}>
          {expanded ? 'Show fewer' : `Show all (${rows.length})`}
        </TextAction>
      )}
    </Card>
  )
}
