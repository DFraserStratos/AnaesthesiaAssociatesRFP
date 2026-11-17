/**
 * Catch-up Phase 22a parity capture (work item 1): every seeded Booking's
 * invoice grouping, totals, printed name, `billedTo` and Xero contact, its
 * prepayment invoices as a raise would build them, and every issued invoice's
 * addressee, `billedTo`, Procedures and Xero contact.
 *
 * Written once from the code BEFORE Phase 22a moved the payer from the Booking
 * onto each Procedure into `phase-22a-baseline.json`, and compared after it by
 * `procedurePayerParity.test.ts`. The fixture never changes and no difference
 * is declared: every existing Booking's Procedures share one payer after the
 * move. The Procedures and the Booking 22a's seed adds are taken out before
 * the capture (`withoutPhase22aAdditions`), so the comparison is over exactly
 * what existed before. Imported only by tests.
 */

import { freshAppState, type AppState } from '../appStore'
import { billingContextForBooking, bookingsForList, invoiceAddresseeName, prePaidByProcedure, proceduresForBooking } from '../selectors'
import { buildInvoicesForBooking, buildPrePaymentInvoiceForBooking, type InvoiceBuildContext } from '../../domain/billing/invoiceBuild'
import { listHospitalFor } from '../../domain/listPairing'
import type { AssignedList, InvoiceBilledTo } from '../../domain/types'
import { faceOf, type PartyFace } from './phase21Capture'
import { withoutPhase22aAdditions, type Phase22aAdditions } from './phase22aAdditions'
import { withoutPhase23Additions } from './phase23Additions'

export interface BuiltInvoiceFace extends PartyFace {
  subtotal: number
  total: number
  procedures: string[]
  billedTo?: InvoiceBilledTo
}

export interface BookingRow22a {
  bookingId: string
  result: { kind: 'invoices'; invoices: BuiltInvoiceFace[] } | { kind: 'exception'; code: string }
  /** The prepayment invoices a raise would build now (only for a Booking with a prepaid Procedure). */
  prepayment?: { kind: 'invoices'; invoices: BuiltInvoiceFace[] } | { kind: 'exception'; code: string }
}

export interface IssuedRow22a extends PartyFace {
  invoiceId: string
  bookingId: string
  kind: string
  total: number
  addressee: string
  billedTo?: InvoiceBilledTo
  procedureIds?: string[]
  delivery?: string
}

export interface Phase22aBaseline {
  bookings: BookingRow22a[]
  issued: IssuedRow22a[]
}

function face(state: AppState, inv: { counterparty: Parameters<typeof faceOf>[1]; subtotal: number; total: number; lines: { procedureId?: string }[]; billedTo?: InvoiceBilledTo }, bookingId: string): BuiltInvoiceFace {
  return {
    ...faceOf(state, inv.counterparty, bookingId),
    subtotal: inv.subtotal,
    total: inv.total,
    procedures: [...new Set(inv.lines.map((l) => l.procedureId).filter((p): p is string => p !== undefined))].sort(),
    ...(inv.billedTo !== undefined ? { billedTo: inv.billedTo } : {}),
  }
}

export function captureBookings22a(state: AppState): BookingRow22a[] {
  const rows: BookingRow22a[] = []
  const lists = Object.values(state.schedule.lists).filter((l): l is AssignedList => l.anaesthetistId !== undefined)
  for (const list of lists) {
    for (const booking of bookingsForList(state, list.id)) {
      // Catch-up Phase 24: without the billing slice, so the price ladder's AUTHORISED and prepaid rungs are not read here (procedurePriceParity.test.ts pins them).
      const ctx = billingContextForBooking({ masters: state.masters, schedule: state.schedule }, booking)
      if (ctx === undefined) continue
      const procedures = proceduresForBooking(state, booking.id)
      const prePaid = prePaidByProcedure(state, booking.id)
      const buildCtx: InvoiceBuildContext = {
        ...ctx,
        listDateISO: list.dateISO,
        patientId: booking.patientId,
        ...listHospitalFor(list, state.masters.hospitals),
        ...(Object.keys(prePaid).length > 0 ? { prePaidByProcedure: prePaid } : {}),
      }
      const result = buildInvoicesForBooking(booking, procedures, buildCtx)
      const pre = buildPrePaymentInvoiceForBooking(booking, procedures, { ...buildCtx, prePaidByProcedure: undefined })
      const prepayment =
        pre.kind === 'exception'
          ? { kind: 'exception' as const, code: pre.code }
          : pre.invoices.length > 0
            ? { kind: 'invoices' as const, invoices: pre.invoices.map((inv) => face(state, inv, booking.id)) }
            : undefined
      rows.push({
        bookingId: booking.id,
        result: result.kind === 'invoices' ? { kind: 'invoices', invoices: result.invoices.map((inv) => face(state, inv, booking.id)) } : { kind: 'exception', code: result.code },
        ...(prepayment !== undefined ? { prepayment } : {}),
      })
    }
  }
  return rows.sort((a, b) => a.bookingId.localeCompare(b.bookingId))
}

export function captureIssued22a(state: AppState): IssuedRow22a[] {
  return Object.values(state.billing.invoices)
    .map((inv) => ({
      invoiceId: inv.id,
      bookingId: inv.bookingId,
      kind: inv.kind,
      total: inv.total,
      ...faceOf(state, inv.counterparty, inv.bookingId),
      addressee: invoiceAddresseeName(state, inv),
      ...(inv.billedTo !== undefined ? { billedTo: inv.billedTo } : {}),
      ...(inv.procedureIds !== undefined ? { procedureIds: [...inv.procedureIds].sort() } : {}),
      ...(inv.delivery !== undefined ? { delivery: inv.delivery.method } : {}),
    }))
    .sort((a, b) => a.invoiceId.localeCompare(b.invoiceId))
}

export function captureBaseline22a(additions: Phase22aAdditions = { procedureIds: [], bookingIds: [] }): Phase22aBaseline {
  // Catch-up Phase 23's three-procedure Booking is set aside too: it came after this capture.
  const state = withoutPhase22aAdditions(withoutPhase23Additions(freshAppState()), additions)
  return { bookings: captureBookings22a(state), issued: captureIssued22a(state) }
}
