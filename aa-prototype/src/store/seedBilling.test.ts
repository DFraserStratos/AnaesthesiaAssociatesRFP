/**
 * Seeded PAID pre-payment slice tests (Phase 09): freshAppState / a fresh
 * store install exactly the mixed + full booking's paid pre-invoice, with the
 * billing counters bumped so the first runtime billing run continues the
 * sequence (+1) without colliding. Deterministic and restored by
 * resetDomainState through the same seam.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, type BoundAppStore } from './appStore'
import { buildSeed, buildSeedBillingSlice, SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { resetDomainState } from './mutate'
import { prepaymentStatusFor } from './prepaymentSelectors'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

describe('the seeded paid pre-payment slice', () => {
  it('ships exactly one prePayment invoice and clears the gate for the mixed + full booking', () => {
    const api = createAppStore()
    const billing = api.getState().billing
    const prePayInvoices = Object.values(billing.invoices).filter((i) => i.kind === 'prePayment')
    expect(prePayInvoices).toHaveLength(1)
    const invoice = prePayInvoices[0]!
    expect(invoice.bookingId).toBe(SEED_PREPAID_BOOKING_ID)
    expect(invoice.layout).toBe('patient')
    // Catch-up Phase 27: Nair's rhinoplasty at Dr Souter's prepaid Rhinoplasty price, in full: $1,200 ex GST, $1,380 with GST.
    expect(invoice.subtotal).toBe(1200)
    expect(invoice.total).toBe(1380)
    expect(invoice.approval).toMatchObject({ mode: 'approved', by: 'Kirsty W.', role: 'office' })

    // The pre-payment case is fully paid in; its payable credits the AA Holding account, authorised and not disbursed.
    const prePair = Object.values(billing.ledger).find((p) => p.kind === 'prePayment' && p.invoiceId === invoice.id)!
    expect(prePair.kind).toBe('prePayment')
    if (prePair.kind !== 'prePayment') throw new Error('expected the prepayment pair')
    expect(prePair.bookingId).toBe(SEED_PREPAID_BOOKING_ID)
    expect(prePair.receivable.receivedAmount).toBe(invoice.total)
    expect(prePair.payable?.payee).toEqual({ kind: 'holding' })
    expect(prePair.payable?.disbursedAmount).toBe(0)
    const accPay = api.getState().xero.accPays[prePair.payable!.xeroAccPayId!]!
    expect(accPay).toMatchObject({ payeeAccount: 'aaHoldingAccount', status: 'authorised', amountDisbursed: 0 })
    expect(api.getState().xero.contacts[accPay.contactId]?.name).toBe('AA Holding account')

    // The status reads paid via the case->invoice join (money-based).
    expect(prepaymentStatusFor(api.getState(), SEED_PREPAID_BOOKING_ID).status).toBe('paid')
  })

  it('numbers the seeded pre-payment INV/BC/IL/number 0001 and the runtime run starts at 0002', () => {
    const api = createAppStore()
    // The AA-2026-#### series: the seeded pre-payment is 0001 (history uses the
    // disjoint AA-2026-H## series, so the runtime run continues cleanly at 0002).
    const prePayInvoice = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'prePayment')!
    expect(prePayInvoice.id).toBe('INV0001')
    expect(prePayInvoice.invoiceNumber).toBe('AA-2026-0001')
    expect(prePayInvoice.caseReference).toBe('BC0001')

    // First runtime run: a single-invoice list continues the sequence at 0002.
    const cosList = api.getState().schedule.bookings[marker('cosAccContractBooking')]!.listId
    expect(submitList(api, OFFICE, cosList).ok).toBe(true)
    expect(authoriseList(api, OFFICE, cosList).ok).toBe(true)
    expect(runBillingForList(api, cosList).ok).toBe(true)
    const runtime = Object.values(api.getState().billing.invoices).filter((i) => /^AA-2026-\d{4}$/.test(i.invoiceNumber) && i.kind === 'standard')
    expect(runtime).toHaveLength(1)
    expect(runtime[0]!.id).toBe('INV0002')
    expect(runtime[0]!.invoiceNumber).toBe('AA-2026-0002')
  })

  it('is deterministic (two builds deep-equal) and restored by resetDomainState', () => {
    const a = buildSeedBillingSlice(buildSeed(), SEED_PREPAID_BOOKING_ID)
    const b = buildSeedBillingSlice(buildSeed(), SEED_PREPAID_BOOKING_ID)
    expect(a).toEqual(b)

    const api = createAppStore()
    const pristine = JSON.parse(JSON.stringify(api.getState().billing)) as unknown

    // Bill something, then reset — the billing slice returns to the seeded one.
    const cosList = api.getState().schedule.bookings[marker('cosAccContractBooking')]!.listId
    submitList(api, OFFICE, cosList)
    authoriseList(api, OFFICE, cosList)
    runBillingForList(api, cosList)
    expect(Object.values(api.getState().billing.invoices).length).toBeGreaterThan(1)

    resetDomainState(api as unknown as BoundAppStore)
    expect(api.getState().billing).toEqual(pristine)
  })

  it('freshAppState composes the same slice as a fresh store', () => {
    const fromFresh = freshAppState().billing
    const fromStore = createAppStore().getState().billing
    expect(fromFresh).toEqual(fromStore)
  })
})

describe('seeded Xero pairs (catch-up Phase 16)', () => {
  it('every seeded payable equals its receivable and releases exactly what was received', () => {
    const state = createAppStore().getState()
    const pairs = Object.values(state.billing.ledger).flatMap((p) =>
      p.kind !== 'aaFee' && p.receivable.xeroAccRecId !== undefined && p.payable?.xeroAccPayId !== undefined ? [{ pair: p, payable: p.payable }] : [],
    )
    expect(pairs.length).toBeGreaterThan(5)
    // A credited pair (Heather Sinclair's, catch-up Phase 40) has its release cut by the credit: `seed40.test.ts` pins it.
    for (const { pair, payable } of pairs.filter(({ pair }) => pair.credit === undefined)) {
      const accRec = state.xero.accRecs[pair.receivable.xeroAccRecId!]!
      const accPay = state.xero.accPays[payable.xeroAccPayId!]!
      expect(accPay.amountPayable).toBe(accRec.amountDue)
      expect(payable.amount).toBe(pair.receivable.amount)
      expect(payable.releasedAmount).toBe(Math.min(pair.receivable.receivedAmount, accPay.amountPayable))
      expect(accPay.amountAuthorised).toBe(payable.releasedAmount)
      expect(accPay.amountDisbursed).toBeLessThanOrEqual(accPay.amountAuthorised)
    }
  })

  it('every seeded Xero record stores its InvoiceNumber, Reference and issue date; paid ones their paid date', () => {
    const state = createAppStore().getState()
    for (const accRec of Object.values(state.xero.accRecs).filter((r) => r.kind === 'procedure')) {
      const invoice = state.billing.invoices[accRec.invoiceId]!
      expect(accRec.invoiceNumber).toBe(invoice.invoiceNumber)
      expect(accRec.reference).toBe(invoice.caseReference)
      expect(accRec.issuedAtISO).toBeTruthy()
      // A paid invoice later credited (Heather Sinclair's, catch-up Phase 40) keeps its paid date.
      expect(accRec.paidAtISO !== undefined).toBe(accRec.status === 'paid' || (accRec.status === 'credited' && accRec.amountReceived > 0))
    }
    for (const accPay of Object.values(state.xero.accPays)) {
      const accRec = state.xero.accRecs[accPay.accRecId]!
      expect(accPay.invoiceNumber).toBe(`${accRec.invoiceNumber}-P`)
      expect(accPay.reference).toBe(accRec.reference)
      expect(accPay.anaesthetistId).toBeTruthy()
    }
  })
})
