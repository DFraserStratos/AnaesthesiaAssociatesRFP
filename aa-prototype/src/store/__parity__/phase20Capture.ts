/**
 * Catch-up Phase 20 parity capture: what `feeParity.test.ts` does not pin.
 * Each seeded Procedure's own billed party and Contract, its starting values
 * and any typed fixed fee; and the two seeded prepayment Bookings' pre-invoice
 * builds with their ledger lines and Xero ACCREC/ACCPAY pair (US-09.1.3).
 *
 * Written once from the code BEFORE Phase 20 into `phase-20-baseline.json`
 * and compared after it by `contractParity.test.ts`. The fixture never
 * changes; a figure that moves on purpose is declared there, exactly.
 * Imported only by tests.
 */

import { createAppStore } from '../appStore'
import { freshAppStateBefore22a } from './phase22aAdditions'
import { billingContextForBooking } from '../selectors'
import { procedureNeedsPrice } from '../../domain/billing/procedurePrice'
import { billablePartyForProcedure } from '../../domain/billing/whoIsBilled'
import type { BookingBillingContext } from '../../domain/billing/validateBookingForBilling'
import type { Contract, Procedure } from '../../domain/types'
import { approveAllPrepayments } from '../../test/approvePrepayments'
import { handoffCasesForBooking } from '../xeroHandoff'
import { SEED_MARKERS } from '../../domain/seed'
import type { AppState } from '../appStore'
import type { Actor } from '../mutate'

export interface ProcedureParityRow {
  procedureId: string
  bookingId: string
  /** `kind:id`, `exception:<code>`, or `none` on a Draft List (no billing context). */
  billedTo: string
  /** The Contract the run bills under, `(none)` for standard rates, `exception:<code>` or `none`. */
  contract: string
  rvgGroupId: string | null
  baseUnitsSelected: number | null
  fixedFee: number | null
}

export interface PrepaymentParityRow {
  bookingId: string
  invoices: { kind: string; counterparty: string; subtotal: number; gst: number; total: number; lines: { description: string; amount: number }[] }[]
  accRecs: { amountDue: number; status: string }[]
  accPays: { amountPayable: number; status: string; anaesthetistId: string }[]
}

export interface Phase20Baseline {
  procedures: ProcedureParityRow[]
  prepayments: PrepaymentParityRow[]
}

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

export function captureProcedures(state: AppState): ProcedureParityRow[] {
  const rows: ProcedureParityRow[] = []
  for (const procedure of Object.values(state.schedule.procedures)) {
    const booking = state.schedule.bookings[procedure.bookingId]
    if (booking === undefined || booking.cancellation !== undefined) continue
    // Catch-up Phase 24: without the billing slice, so the price ladder's AUTHORISED and prepaid rungs are not read here (procedurePriceParity.test.ts pins them).
    const ctx = billingContextForBooking({ masters: state.masters, schedule: state.schedule }, booking)
    let billedTo = 'none'
    let contract = 'none'
    if (ctx !== undefined) {
      const resolved = resolveContractForParity(procedure, ctx)
      if (resolved.kind === 'exception') {
        billedTo = `exception:${resolved.code}`
        contract = `exception:${resolved.code}`
      } else {
        contract = resolved.contract?.id ?? '(none)'
        const cp = billablePartyForProcedure(resolved.contract, procedure, booking.patientId, state.masters.parties)
        billedTo = cp === undefined ? 'undefined' : `${cp.kind}:${cp.id}`
      }
    }
    rows.push({
      procedureId: procedure.id,
      bookingId: procedure.bookingId,
      billedTo,
      contract,
      rvgGroupId: procedure.rvgGroupId ?? null,
      baseUnitsSelected: procedure.baseUnitsSelected ?? null,
      // The office's fixed fee became the one typed price in catch-up Phase 24.
      fixedFee: procedure.enteredPrice ?? null,
    })
  }
  return rows.sort((a, b) => a.procedureId.localeCompare(b.procedureId))
}

function prepaymentRow(state: AppState, bookingId: string): PrepaymentParityRow {
  const invoices = Object.values(state.billing.invoices)
    .filter((i) => i.bookingId === bookingId && i.kind === 'prePayment')
    .sort((a, b) => a.id.localeCompare(b.id))
  const invoiceIds = new Set(invoices.map((i) => i.id))
  const accRecs = Object.values(state.xero.accRecs)
    .filter((r) => r.invoiceId !== undefined && invoiceIds.has(r.invoiceId))
    .sort((a, b) => a.id.localeCompare(b.id))
  const accRecIds = new Set(accRecs.map((r) => r.id))
  const accPays = Object.values(state.xero.accPays)
    .filter((p) => accRecIds.has(p.accRecId))
    .sort((a, b) => a.id.localeCompare(b.id))
  return {
    bookingId,
    invoices: invoices.map((inv) => ({
      kind: inv.kind,
      counterparty: `${inv.counterparty.kind}:${inv.counterparty.id}`,
      subtotal: inv.subtotal,
      gst: inv.gst,
      total: inv.total,
      lines: Object.values(state.billing.invoiceLines)
        .filter((l) => l.invoiceId === inv.id)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((l) => ({ description: l.description, amount: l.amount })),
    })),
    accRecs: accRecs.map((r) => ({ amountDue: r.amountDue, status: r.status })),
    accPays: accPays.map((p) => ({ amountPayable: p.amountPayable, status: p.status, anaesthetistId: p.anaesthetistId })),
  }
}

/**
 * Riley: the office approves and sends her prepayment (catch-up Phase 27; it
 * was her split pre-invoice) and hands it to Xero. Nair: the seeded, paid
 * prepayment.
 */
export function capturePrepayments(): PrepaymentParityRow[] {
  const api = createAppStore()
  const riley = marker('prepaymentBooking')
  const raised = approveAllPrepayments(api, riley, OFFICE)
  if (raised.length === 0) throw new Error("Riley's prepayment was refused")
  handoffCasesForBooking(api, riley)
  const nair = marker('prepaymentPaidBooking')
  return [prepaymentRow(api.getState(), riley), prepaymentRow(api.getState(), nair)]
}

export function captureBaseline(): Phase20Baseline {
  // Catch-up Phase 22a's seed additions are set aside (`phase22aAdditions.ts`).
  return { procedures: captureProcedures(freshAppStateBefore22a()), prepayments: capturePrepayments() }
}



/**
 * The resolution the billing run made before catch-up Phase 25 (its codes as
 * the fixture recorded them). Test-only: the lock builder (`lock.ts`) is the
 * one resolver now.
 */
function resolveContractForParity(procedure: Procedure, ctx: BookingBillingContext): { kind: 'resolved'; contract: Contract } | { kind: 'exception'; code: string } {
  if (procedure.governingContractId === undefined) return { kind: 'exception', code: 'noContract' }
  const stored = ctx.contracts[procedure.governingContractId]
  if (stored === undefined) return { kind: 'exception', code: 'contractMissing' }
  if (procedureNeedsPrice(stored, ctx.listDateISO, procedure, ctx.held?.[procedure.id])) return { kind: 'exception', code: 'contractIneffective' }
  return { kind: 'resolved', contract: stored }
}
