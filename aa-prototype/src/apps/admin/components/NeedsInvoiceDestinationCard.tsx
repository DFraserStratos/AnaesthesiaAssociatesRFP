import { useMemo, useState } from 'react'
import { needsInvoiceDestinationBookings, useAppStore } from '../../../store'
import { accent, neutral, radius } from '../../../theme/tokens'
import { shortDay } from '../../../shared/format'
import { sessionText } from '../../../domain/outOfHours'

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
    <section
      data-shot="admin-needs-invoice-destination"
      aria-labelledby="admin-needs-destination-heading"
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <h2 id="admin-needs-destination-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
        Needs an invoice destination
        {rows.length > 0 && (
          <span style={{ padding: '0 7px', borderRadius: radius.pill, background: neutral.sunken, color: neutral.slate, fontSize: 11.5, fontWeight: 700, lineHeight: '18px', fontVariantNumeric: 'tabular-nums' }}>
            {rows.length}
          </span>
        )}
      </h2>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: neutral.mist }}>Every Booking has an invoice destination.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {shown.map((row) => (
            <button
              key={row.procedureId}
              type="button"
              data-shot="needs-destination-row"
              data-booking-id={row.bookingId}
              onClick={() => onOpenBooking(row.dateISO, row.bookingId)}
              style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', border: 'none', borderRadius: 10, background: neutral.bg, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
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
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: accent.base, cursor: 'pointer' }}
        >
          {expanded ? 'Fewer' : `All ${rows.length}`}
        </button>
      )}
    </section>
  )
}
