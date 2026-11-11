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

import { createAppStore, freshAppState } from '../appStore'
import { billingContextForBooking } from '../selectors'
import { counterpartyForProcedure, resolveContractForProcedure } from '../../domain/billing/invoiceBuild'
import { raisePreProcedureInvoice } from '../prepaymentActions'
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
    const ctx = billingContextForBooking(state, booking)
    let billedTo = 'none'
    let contract = 'none'
    if (ctx !== undefined) {
      const resolved = resolveContractForProcedure(procedure, { ...ctx, patientId: booking.patientId })
      if (resolved.kind === 'exception') {
        billedTo = `exception:${resolved.code}`
        contract = `exception:${resolved.code}`
      } else {
        contract = resolved.contract?.id ?? '(none)'
        const cp = counterpartyForProcedure(procedure, resolved.contract, booking.patientId, state.masters.parties)
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
      fixedFee: procedure.priceOverride?.kind === 'fixedFee' ? procedure.priceOverride.amount : null,
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

/** Riley: the office raises her split pre-invoice and hands it to Xero. Nair: the seeded, paid full prepayment. */
export function capturePrepayments(): PrepaymentParityRow[] {
  const api = createAppStore()
  const riley = marker('prepaymentBooking')
  const raised = raisePreProcedureInvoice(api, OFFICE, riley)
  if (!raised.ok) throw new Error(`Riley's pre-invoice was refused: ${raised.message}`)
  handoffCasesForBooking(api, riley)
  const nair = marker('prepaymentPaidBooking')
  return [prepaymentRow(api.getState(), riley), prepaymentRow(api.getState(), nair)]
}

export function captureBaseline(): Phase20Baseline {
  return { procedures: captureProcedures(freshAppState()), prepayments: capturePrepayments() }
}


