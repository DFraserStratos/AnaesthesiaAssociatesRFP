/**
 * Catch-up Phase 21 parity capture (drift-check step 4): every seeded
 * Procedure's billed party with the name it prints and the Xero contact it
 * lands on, every Booking's invoice grouping and totals, and every issued
 * invoice's counterparty and contact.
 *
 * Written once from the code BEFORE Phase 21 switched who is billed into
 * `phase-21-baseline.json`, and compared after it by `whoIsBilledParity.test.ts`.
 * The fixture never changes; a party that moves on purpose (Doyle) is declared
 * there, exactly. Imported only by tests.
 */

import type { AppState } from '../appStore'
import { freshAppStateBefore22a } from './phase22aAdditions'
import { billingContextForBooking, bookingsForList, counterpartyName, prepaidHeldFor, proceduresForBooking } from '../selectors'
import { buildInvoicesForBooking, type InvoiceBuildContext } from '../../domain/billing/invoiceBuild'
import { payerContactSpec } from '../xeroHandoff'
import { listHospitalFor } from '../../domain/listPairing'
import type { AssignedList, CounterpartyRef } from '../../domain/types'

export interface PartyFace {
  /** `kind:id` as the run records it. */
  ref: string
  /** The name the invoice prints. */
  name: string
  /** The Xero contact it resolves to (ContactNumber, Name). */
  contactNumber: string
  contactName: string
}

export interface BookingInvoicesRow {
  bookingId: string
  result:
    | { kind: 'invoices'; invoices: (PartyFace & { subtotal: number; total: number; procedures: string[] })[] }
    | { kind: 'exception'; code: string }
}

export interface IssuedInvoiceRow extends PartyFace {
  invoiceId: string
  bookingId: string
  total: number
}

export interface Phase21Baseline {
  bookings: BookingInvoicesRow[]
  issued: IssuedInvoiceRow[]
}

export function faceOf(state: AppState, cp: CounterpartyRef, bookingId?: string): PartyFace {
  const spec = payerContactSpec(cp, state.masters, bookingId === undefined ? undefined : state.schedule.bookings[bookingId])
  return {
    ref: `${cp.kind}:${cp.id}`,
    name: counterpartyName(state, cp, bookingId),
    contactNumber: spec.contactNumber,
    contactName: spec.name,
  }
}

export function captureBookings(state: AppState): BookingInvoicesRow[] {
  const rows: BookingInvoicesRow[] = []
  const lists = Object.values(state.schedule.lists).filter((l): l is AssignedList => l.anaesthetistId !== undefined)
  for (const list of lists) {
    for (const booking of bookingsForList(state, list.id)) {
      // Catch-up Phase 24: without the billing slice, so the price ladder's AUTHORISED and prepaid rungs are not read here (procedurePriceParity.test.ts pins them).
      const ctx = billingContextForBooking({ masters: state.masters, schedule: state.schedule }, booking)
      if (ctx === undefined) continue
      const procedures = proceduresForBooking(state, booking.id)
      // Catch-up Phase 27: a raised prepayment's Procedures are left off (was: netted by a deduction line).
      const leftOff = prepaidHeldFor(state, booking.id)
      const buildCtx: InvoiceBuildContext = {
        ...ctx,
        listDateISO: list.dateISO,
        patientId: booking.patientId,
        ...listHospitalFor(list, state.masters.hospitals),
        ...(Object.keys(leftOff).length > 0 ? { prepaidLeftOff: leftOff } : {}),
      }
      const result = buildInvoicesForBooking(booking, procedures, buildCtx)
      rows.push({
        bookingId: booking.id,
        result:
          result.kind === 'invoices'
            ? {
                kind: 'invoices',
                invoices: result.invoices.map((inv) => ({
                  ...faceOf(state, inv.counterparty, booking.id),
                  subtotal: inv.subtotal,
                  total: inv.total,
                  procedures: [...new Set(inv.lines.map((l) => l.procedureId).filter((p): p is string => p !== undefined))].sort(),
                })),
              }
            : { kind: 'exception', code: result.code },
      })
    }
  }
  return rows.sort((a, b) => a.bookingId.localeCompare(b.bookingId))
}

export function captureIssued(state: AppState): IssuedInvoiceRow[] {
  return Object.values(state.billing.invoices)
    .map((inv) => ({ invoiceId: inv.id, bookingId: inv.bookingId, total: inv.total, ...faceOf(state, inv.counterparty, inv.bookingId) }))
    .sort((a, b) => a.invoiceId.localeCompare(b.invoiceId))
}

export function captureBaseline21(): Phase21Baseline {
  // Catch-up Phase 22a's seed additions are set aside (`phase22aAdditions.ts`).
  const state = freshAppStateBefore22a()
  return { bookings: captureBookings(state), issued: captureIssued(state) }
}
