import { useMemo, useState } from 'react'
import { needsInvoiceDestinationBookings, useAppStore } from '../../../store'
import { accent, neutral, radius } from '../../../theme/tokens'
import { CountBadge } from '../../../shared/ui/CountBadge'
import { Card, TextAction } from '../../../shared/ui'
import { shortDay } from '../../../shared/format'
import { sessionText } from '../../../domain/outOfHours'
import { EmptyState } from '../../../shared/ui/EmptyState'

const VISIBLE_ROWS = 5

/**
 * "Needs an invoice destination" (catch-up Phase 20; US-04.3.4): every Booking
 * with a Procedure that has no Contract, all dates, soonest first, with the
 * answers so far. A row opens the Booking drawer, where the office sets the
 * Contract on the step rail and the row leaves. A work list, not a warning:
 * no Clear.
 */
export function NeedsInvoiceDestinationCard({ onOpenBooking }: { onOpenBooking: (dateISO: string, bookingId: string) => void }) {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const rows = useMemo(() => needsInvoiceDestinationBookings({ masters, schedule }), [masters, schedule])
  const hospitals = masters.hospitals
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? rows : rows.slice(0, VISIBLE_ROWS)

  return (
    <Card
      shot="admin-needs-invoice-destination"
      headingId="admin-needs-destination-heading"
      title={
        <>
          Needs an invoice destination
          <CountBadge count={rows.length} srNoun={rows.length === 1 ? 'procedure' : 'procedures'} />
        </>
      }
    >
      {rows.length === 0 ? (
        <EmptyState>Every Booking has an invoice destination.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {shown.map((row) => (
            <button
              key={row.procedureId}
              type="button"
              data-shot="needs-destination-row"
              data-booking-id={row.bookingId}
              onClick={() => onOpenBooking(row.dateISO, row.bookingId)}
              style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', border: 'none', borderRadius: radius.ctl, background: neutral.bg, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{row.patientName}</span>
              <span style={{ fontSize: 12, color: neutral.slate }}>
                {shortDay(row.dateISO)} {sessionText(row.session)}
                {row.hospitalId !== undefined ? ` · ${hospitals[row.hospitalId]?.name ?? row.hospitalId}` : ''}
              </span>
              <span style={{ fontSize: 12, color: row.answersText === 'Not started' ? neutral.mist : accent.pressed }}>{row.answersText}</span>
            </button>
          ))}
        </div>
      )}
      {rows.length > VISIBLE_ROWS && (
        <TextAction size="sm" flush onClick={() => setExpanded(!expanded)} style={{ alignSelf: 'flex-start' }}>
          {expanded ? 'Fewer' : `All ${rows.length}`}
        </TextAction>
      )}
    </Card>
  )
}
