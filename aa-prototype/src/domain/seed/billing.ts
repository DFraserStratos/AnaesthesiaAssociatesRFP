/**
 * Seed billing slice (Phase 09; pure, no store import so domain purity holds).
 *
 * The pristine seed ships ONE paid pre-payment slice: the mixed + full
 * pre-payment Card's full pre-invoice, materialised as an
 * `Invoice{kind:'prePayment'}` + line + a `BillingCase{status:'paid'}` so the
 * payment-cleared gate demos NOW (Phase 10's webhook flips a case to paid live;
 * this seeds one). `freshAppState()` composes this and `resetDomainState()`
 * restores it through the same seam.
 *
 * Ids are formatted to MIRROR `store/mutate.ts`'s ID_FORMATS for the four
 * billing counter kinds (invoice / invoiceLine / billingCase / invoiceNumber),
 * and the returned counters are bumped past what this slice consumes so the
 * first runtime billing run continues the sequence with no collision. There is
 * deliberately NO seed audit entry (seeding is initial state, not a mutation).
 */

import type { BillingCase, Invoice, InvoiceLine } from '../types'
import { buildPrePaymentInvoiceForCard, type InvoiceBuildContext } from '../billing/invoiceBuild'
import type { SeedState } from './index'

export interface SeedBillingSlice {
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  cases: Record<string, BillingCase>
  /** seed.counters bumped past the ids this slice consumed. */
  counters: Record<string, number>
}

/** Fixed pre-day instant the seeded pre-invoice was "raised" (never the clock). */
const SEED_PREPAYMENT_RAISED_ISO = '2026-07-14T09:00:00'

/** Mirrors store/mutate.ts ID_FORMATS for the billing kinds (kept in step). */
const FORMATS: Record<string, { prefix: string; pad: number }> = {
  invoice: { prefix: 'INV', pad: 4 },
  invoiceLine: { prefix: 'IL', pad: 4 },
  billingCase: { prefix: 'BC', pad: 4 },
  invoiceNumber: { prefix: 'AA-2026-', pad: 4 },
}

function proceduresOf(seed: SeedState, cardId: string) {
  return Object.values(seed.schedule.procedures)
    .filter((p) => p.cardId === cardId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function contextFor(seed: SeedState, cardId: string): InvoiceBuildContext | undefined {
  const card = seed.schedule.cards[cardId]
  if (card === undefined) return undefined
  const list = seed.schedule.lists[card.listId]
  if (list === undefined) return undefined
  const anaesthetist = seed.masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) return undefined
  const ctx: InvoiceBuildContext = {
    anaesthetist,
    rvgCodes: seed.masters.rvgCodes,
    contracts: seed.masters.contracts,
    contractPrices: Object.values(seed.masters.contractPrices),
    insurers: seed.masters.insurers,
    billableParties: seed.masters.billableParties,
    billingLines: Object.values(seed.schedule.billingLines),
    listDateISO: list.dateISO,
    patientId: card.patientId,
  }
  if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
  if (list.hospitalId !== undefined) ctx.listHospitalId = list.hospitalId
  return ctx
}

/**
 * Build the seeded PAID pre-payment slice for one Card (the mixed + full
 * pre-payment exemplar). Returns empty invoices/lines/cases (and the seed
 * counters unchanged) if the card has no patient-funded pre-payment procedure.
 */
export function buildSeedBillingSlice(seed: SeedState, prepaidCardId: string): SeedBillingSlice {
  const empty: SeedBillingSlice = { invoices: {}, invoiceLines: {}, cases: {}, counters: seed.counters }

  const card = seed.schedule.cards[prepaidCardId]
  const ctx = contextFor(seed, prepaidCardId)
  if (card === undefined || ctx === undefined) return empty
  const built = buildPrePaymentInvoiceForCard(card, proceduresOf(seed, prepaidCardId), ctx)
  if (built.kind !== 'invoices' || built.invoices.length === 0) return empty

  const invoices: Record<string, Invoice> = {}
  const invoiceLines: Record<string, InvoiceLine> = {}
  const cases: Record<string, BillingCase> = {}
  const n = { invoice: 0, invoiceLine: 0, billingCase: 0, invoiceNumber: 0 }
  const next = (kind: keyof typeof n): string => {
    n[kind] += 1
    const f = FORMATS[kind]!
    return `${f.prefix}${String(n[kind]).padStart(f.pad, '0')}`
  }

  for (const draft of built.invoices) {
    const caseId = next('billingCase')
    const invoiceId = next('invoice')
    const invoiceNumber = next('invoiceNumber')
    invoices[invoiceId] = {
      id: invoiceId,
      invoiceNumber,
      caseReference: caseId,
      cardId: prepaidCardId,
      counterparty: draft.counterparty,
      layout: draft.layout,
      kind: 'prePayment',
      subtotal: draft.subtotal,
      gst: draft.gst,
      total: draft.total,
      raisedAtISO: SEED_PREPAYMENT_RAISED_ISO,
    }
    for (const line of draft.lines) {
      const lineId = next('invoiceLine')
      const stored: InvoiceLine = { id: lineId, invoiceId, description: line.description, amount: line.amount }
      if (line.procedureId !== undefined) stored.procedureId = line.procedureId
      if (line.units !== undefined) stored.units = line.units
      invoiceLines[lineId] = stored
    }
    // Seeded PAID: a payment cleared before the procedure (Phase 10's webhook
    // flips a live case to paid; this seeds one so the cleared path demos now).
    cases[caseId] = { id: caseId, cardId: prepaidCardId, invoiceId, status: 'paid' }
  }

  return {
    invoices,
    invoiceLines,
    cases,
    counters: {
      ...seed.counters,
      billingCase: n.billingCase + 1,
      invoice: n.invoice + 1,
      invoiceLine: n.invoiceLine + 1,
      invoiceNumber: n.invoiceNumber + 1,
    },
  }
}
