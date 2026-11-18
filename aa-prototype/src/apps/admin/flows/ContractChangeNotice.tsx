/**
 * The Contract panel's change warning (catch-up Phase 25a; US-04.1.2,
 * US-04.2.15, D79): a warning `Notice` with its sentence, then the Procedures it
 * names in a dense table (the Admin Review table anatomy), each with Open to its
 * Booking on the Day view. One component for the three warnings (a dated
 * change, a disable, a range that left authorised Procedures at their old
 * price); the rows come from the pure lists in `contractChanges.ts`. It only
 * lists: nothing here moves or re-prices a Procedure.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Notice } from '../../../shared/ui'
import { TableShell, Td, Th } from '../../../shared/table'
import { accent } from '../../../theme/tokens'

export interface ChangeNoticeColumn {
  label: string
  align?: 'left' | 'right'
  mono?: boolean
}

export interface ChangeNoticeRow {
  key: string
  /** The Booking it opens on the Day view. */
  bookingId: string
  dateISO: string
  patientName: string
  /** One cell per column after the patient. */
  cells: ReactNode[]
}

export function ContractChangeNotice({
  title,
  children,
  columns,
  rows,
  shot,
  rowShot,
  live = false,
}: {
  title: ReactNode
  children?: ReactNode
  columns: readonly ChangeNoticeColumn[]
  rows: readonly ChangeNoticeRow[]
  shot: string
  rowShot: string
  /** Announce it (`role="status"`): only where it answers a choice just made (Replaces set, Disable clicked). */
  live?: boolean
}) {
  return (
    <Notice tone="warning" {...(live ? { live: 'status' as const } : {})} title={title} shot={shot}>
      {children}
      <TableShell label="Procedures" density="dense" style={{ marginTop: 6 }}>
        <thead>
          <tr>
            <Th>Patient</Th>
            {columns.map((c) => (
              <Th key={c.label} align={c.align ?? 'left'}>{c.label}</Th>
            ))}
            <Th align="right">Booking</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} data-shot={rowShot} data-booking-id={r.bookingId}>
              <Td bold>{r.patientName}</Td>
              {r.cells.map((cell, i) => (
                <Td key={columns[i]?.label ?? i} align={columns[i]?.align ?? 'left'} mono={columns[i]?.mono === true} nowrap={columns[i]?.mono === true}>
                  {cell}
                </Td>
              ))}
              <Td align="right" nowrap>
                <Link to={`/admin/day/${r.dateISO}/bookings/${r.bookingId}`} className="aa-ctl" style={{ color: accent.base, fontWeight: 600 }} aria-label={`Open ${r.patientName}'s Booking`}>
                  Open
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Notice>
  )
}
