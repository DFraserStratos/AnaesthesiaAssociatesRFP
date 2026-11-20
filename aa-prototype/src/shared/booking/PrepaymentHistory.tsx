/**
 * The prepayment history block (catch-up Phase 41, work item 18; US-06.5.3):
 * on a Booking rebooked with another anaesthetist, or on the cancelled one it
 * came from, the prepayments along the chain, oldest first. "Earlier
 * prepayment · Dr Souter · $1,200.00 ex GST · refunded" and "This
 * prepayment · Dr Beaumont · $1,350.00 ex GST"; from the cancelled Booking the
 * replacement reads "Later prepayment". Shown only when there are two or more.
 * Read-only for everyone.
 */

import { useMemo } from 'react'
import { neutral } from '../../theme/tokens'
import { prepaymentHistoryFor, type PrepaymentHistoryRow } from '../../store'
import { useBookingStore } from './draft'
import { drSurname, formatMoney } from '../format'

const STATE_TEXT: Record<PrepaymentHistoryRow['state'], string | null> = {
  refunded: 'refunded',
  credited: 'credited',
  current: null,
}

export function PrepaymentHistory({ bookingId }: { bookingId: string }) {
  const schedule = useBookingStore((s) => s.schedule)
  const masters = useBookingStore((s) => s.masters)
  const billing = useBookingStore((s) => s.billing)
  const rows = useMemo(() => prepaymentHistoryFor({ schedule, masters, billing }, bookingId), [schedule, masters, billing, bookingId])
  if (rows.length < 2) return null
  const at = rows.findIndex((r) => r.bookingId === bookingId)
  // From the cancelled Booking the replacement reads "Later prepayment"; with no row of its own, plain "Prepayment".
  const labelOf = (i: number): string => (at < 0 ? 'Prepayment' : i < at ? 'Earlier prepayment' : i === at ? 'This prepayment' : 'Later prepayment')
  return (
    <div data-shot="prepayment-history" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map((row, i) => {
        const name = row.anaesthetistId !== undefined ? masters.anaesthetists[row.anaesthetistId]?.name : undefined
        const state = STATE_TEXT[row.state]
        return (
          <div
            key={row.bookingId}
            data-shot="prepayment-history-row"
            data-booking-id={row.bookingId}
            data-state={row.state}
            style={{ fontSize: 13, lineHeight: '19px', color: row.bookingId === bookingId ? neutral.ink : neutral.slate }}
          >
            {labelOf(i)}
            {name !== undefined ? ` · ${drSurname(name)}` : ''} · <span className="mono">{formatMoney(row.amount)}</span> ex GST
            {state !== null ? ` · ${state}` : ''}
          </div>
        )
      })}
    </div>
  )
}
