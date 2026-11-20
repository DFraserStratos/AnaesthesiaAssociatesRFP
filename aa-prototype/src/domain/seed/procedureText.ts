/**
 * Seeded procedure texts (catch-up Phase 20a; US-02.5.7, US-08.4.6, DM-51).
 *
 * Every seed builder writes a Procedure's text with `seedText(...)`: the words
 * only, its source and time left for this pass, which runs once in
 * `buildSeedState` after every seeded Procedure is in place. The migration
 * rule: a Procedure's former description becomes its procedure text, its
 * source mapped from its Booking's `source` (hospital download to hospital
 * download, surgeon PDF to surgeon PDF, office entry to phone, the
 * anaesthetist's ad hoc entry to anaesthetist, unset to "not recorded"), and
 * its arrival time from fixed strings before the demo clock. Each seeded
 * Procedure's invoice description then comes from `startingInvoiceDescription`
 * over its text and its Contract's invoice description (no seeded edit).
 * Deterministic: no clock, no RNG.
 */

import { addDays, format, parseISO } from 'date-fns'
import type { Booking, BookingSource, List, Procedure, ProcedureText, ProcedureTextSource } from '../types'
import type { Contract } from '../billing/contracts'
import { contractInvoiceDescriptionFor, isBlankText, procedureTextKind, startingInvoiceDescription } from '../billing/procedureStack'

/** A seed builder's text: the words, with an explicit source and time only where the seed names one. */
export function seedText(text: string, source?: ProcedureTextSource, receivedAtISO?: string, from?: string): ProcedureText | null {
  if (isBlankText(text)) return null
  return { text, source: source ?? 'unrecorded', receivedAtISO: receivedAtISO ?? '', ...(from !== undefined ? { from } : {}) }
}

const SOURCE_BY_BOOKING: Record<BookingSource, ProcedureTextSource> = {
  hospitalDownload: 'hospitalDownload',
  surgeonPdf: 'surgeonPdf',
  // Catch-up Phase 41: a rebooked replacement keeps the office's wording.
  rebook: 'phone',
  admin: 'phone',
  anaesthetistAdHoc: 'anaesthetist',
}

/** The latest a seeded text can have arrived: the evening before the demo clock (Tue 21 Jul 08:00). */
const LATEST_ARRIVAL_ISO = '2026-07-20T17:30:00'

function shiftDays(dateISO: string, days: number): string {
  return format(addDays(parseISO(dateISO), days), 'yyyy-MM-dd')
}

/**
 * When a seeded text arrived, from fixed rules: the hospital's the afternoon
 * before the List, the rooms' and hand-entered a week before; never after the
 * evening before the demo clock.
 */
export function seedArrivalISO(source: ProcedureTextSource, listDateISO: string): string {
  const at =
    procedureTextKind(source) === 'hospital' ? `${shiftDays(listDateISO, -1)}T16:00:00` : `${shiftDays(listDateISO, -7)}T09:00:00`
  return at < LATEST_ARRIVAL_ISO ? at : LATEST_ARRIVAL_ISO
}

/** Stamp each seeded Procedure's text source and time, and its invoice description (in place). */
export function finaliseSeedProcedureTexts(
  procedures: Record<string, Procedure>,
  bookings: Readonly<Record<string, Booking>>,
  lists: Readonly<Record<string, List>>,
  contracts: Readonly<Record<string, Pick<Contract, 'invoiceDescription'>>>,
): void {
  for (const [id, procedure] of Object.entries(procedures)) {
    let text = procedure.procedureText
    if (text !== null && text.receivedAtISO === '') {
      const booking = bookings[procedure.bookingId]
      const source =
        text.source !== 'unrecorded' ? text.source : booking?.source !== undefined ? SOURCE_BY_BOOKING[booking.source] : 'unrecorded'
      const listDate = booking !== undefined ? lists[booking.listId]?.dateISO : undefined
      text = { ...text, source, receivedAtISO: seedArrivalISO(source, listDate ?? '2026-07-20') }
    }
    procedures[id] = {
      ...procedure,
      procedureText: text,
      invoiceDescription: startingInvoiceDescription(text, contractInvoiceDescriptionFor(procedure, contracts)),
    }
  }
}
