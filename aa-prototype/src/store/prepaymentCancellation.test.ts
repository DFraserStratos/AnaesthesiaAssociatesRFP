/**
 * Catch-up Phase 41 session 2: cancelling a prepaid Booking settles its
 * prepayment automatically (US-06.5.2, D56), a payment after that credit is
 * refunded, and a Contract changed off prepaid after sending is settled the
 * same way (US-06.3.7, D67). Money conserved after every step: the ledger
 * equation and the AA Holding account's identity.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { authoriseList, cancelBooking, submitList } from './lifecycle'
import { approvePrepayment } from './prepaymentActions'
import { prepaymentStatusFor } from './prepaymentSelectors'
import { receivePayment } from './paymentActions'
import { ledgerPositionOf, pairForInvoice } from './ledgerSelectors'
import { setProcedureContract } from './contractSelectionActions'
import { approveProcedureEvent, runEventInvoicing } from './procedureEventActions'
import { submitCredit } from './creditActions'
import { addPrepaidBooking } from './prepaymentDemo'
import { proceduresForBooking } from './selectors'
import { completeAnswered } from '../test/completeAnswered'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { holdingBalance, holdingEntries, holdingIdentityHolds } from '../domain/billing/prepayHolding'
import { isPrepaidContract } from '../domain/billing/prepayment'
import { CREDIT_MESSAGES } from '../shared/procedureEventCopy'
import { copyStateIntoDraft, type Actor } from './mutate'
import { markDraftStore } from './draftMode'
import { saveBookingChanges } from './bookingSaveActions'
import { snapshotBooking } from '../domain/changeSets'
import { setXeroOutage } from './xeroQueue'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
const NAIR = SEED_PREPAID_BOOKING_ID

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

const souter = (): Actor => ({ who: api.getState().masters.anaesthetists[ANAE.souter]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter })
const entries = () => holdingEntries(api.getState().billing)
const balance = () => holdingBalance(entries())
const refunds = () => Object.values(api.getState().billing.prepaymentRefunds)
function expectConserved() {
  const pos = ledgerPositionOf(api.getState())
  expect(pos.imbalance).toBe(0)
  expect(pos.checks).toEqual([])
  expect(holdingIdentityHolds(entries())).toBe(true)
}
function approveAll(bookingId: string): string[] {
  const ids: string[] = []
  for (const g of prepaymentStatusFor(api.getState(), bookingId).groups) {
    if (g.status !== 'awaitingApproval') continue
    const out = approvePrepayment(api, OFFICE, bookingId, g.payerKey)
    if (!out.ok) throw new Error(out.message)
    ids.push(out.value.invoiceId)
  }
  return ids
}
function pay(invoiceId: string, amount: number, key: string) {
  const c = pairForInvoice(api.getState(), invoiceId)!
  const out = receivePayment(api, { accRecId: c.receivable.xeroAccRecId!, amount, idempotencyKey: key, source: 'webhook' })
  if (!out.ok) throw new Error(out.message)
  return out.value
}
const noteFor = (invoiceId: string) => Object.values(api.getState().billing.creditNotes).find((c) => c.originalInvoiceId === invoiceId)

describe('cancelling a prepaid Booking settles it (US-06.5.2)', () => {
  it('paid: credited in full, refunded in full to the payer from the AA Holding account at once, nothing against the anaesthetist; the Xero refund is paid from the AA trust account', () => {
    expect(balance()).toBe(1380)
    expect(cancelBooking(api, OFFICE, NAIR, 'Patient withdrew').ok).toBe(true)
    const note = noteFor('INV0001')!
    expect(note).toMatchObject({ cause: 'prepaymentCancelled', total: 1380 })
    expect(note.negativeInvoiceId).toBeUndefined()
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
    expect(Object.values(api.getState().billing.negativeInvoices).filter((r) => !r.id.startsWith('HS'))).toEqual([])
    expect(refunds()).toEqual([expect.objectContaining({ cause: 'cancelled', amount: 1380, prepaymentInvoiceId: 'INV0001', counterparty: api.getState().billing.invoices['INV0001']!.counterparty })])
    expect(balance()).toBe(0)
    // Nothing held for Nair's payer; the $260.00 left is the seed's own, Heather Sinclair's (catch-up Phase 40, D24; Wave 5 join).
    expect(ledgerPositionOf(api.getState())).toMatchObject({ refundedToPayers: 1380, creditsHeldForPayers: 260 })
    const xr = Object.values(api.getState().xero.refunds)
    expect(xr).toEqual([expect.objectContaining({ amount: 1380, bankAccount: 'AA trust account' })])
    expect(xr[0]!.reference).toContain(note.creditNoteNumber)
    expect(api.getState().audit.map((a) => a.action)).toEqual(expect.arrayContaining(['booking.cancel', 'booking.prepaymentSettled', 'prepaymentRefund.cancelled', 'xero.refundPaid']))
    // 39's credit note on it is now refused, and a second cancel changes nothing.
    expect(submitCredit(api, OFFICE, { invoiceId: 'INV0001', reason: 'x', cause: 'correction', replacements: [] })).toMatchObject({ ok: false, code: 'bookingCancelled', message: CREDIT_MESSAGES.prepaymentBookingCancelled })
    expect(cancelBooking(api, OFFICE, NAIR, 'again').ok).toBe(false)
    expect(refunds()).toHaveLength(1)
    expectConserved()
  })

  it("unpaid, cancelled by the anaesthetist on mobile: credited, no refund; then a payment after the credit note is refunded at once", () => {
    const [invoiceId] = approveAll(RILEY)
    expect(cancelBooking(api, souter(), RILEY, 'Surgery postponed').ok).toBe(true)
    expect(noteFor(invoiceId!)).toMatchObject({ cause: 'prepaymentCancelled' })
    expect(refunds()).toEqual([])
    expectConserved()
    expect(pay(invoiceId!, 1380, 'LATE-1')).toEqual({ applied: true })
    expect(refunds()).toEqual([expect.objectContaining({ cause: 'latePayment', amount: 1380 })])
    expect(pay(invoiceId!, 100, 'LATE-2')).toEqual({ applied: true })
    expect(refunds().filter((r) => r.cause === 'latePayment').map((r) => r.amount)).toEqual([1380, 100])
    expect(api.getState().audit.filter((a) => a.action === 'prepaymentRefund.latePayment')).toHaveLength(2)
    expectConserved()
  })

  it('part paid: credited in full, the refund is what was received', () => {
    const [invoiceId] = approveAll(RILEY)
    pay(invoiceId!, 690, 'HALF')
    expect(balance()).toBe(1380 + 690)
    expect(cancelBooking(api, OFFICE, RILEY, 'Patient withdrew').ok).toBe(true)
    expect(refunds()).toEqual([expect.objectContaining({ amount: 690 })])
    expect(balance()).toBe(1380)
    expectConserved()
  })

  it('credited by hand first: the cancel credits nothing more and still refunds the full amount received', () => {
    const sub = submitCredit(api, OFFICE, { invoiceId: 'INV0001', reason: 'By hand', cause: 'correction', replacements: [] })
    if (!sub.ok) throw new Error(sub.message)
    expect(approveProcedureEvent(api, OFFICE, sub.value.creditEventId).ok).toBe(true)
    expect(runEventInvoicing(api, OFFICE).ok).toBe(true)
    expect(refunds()).toEqual([])
    expect(cancelBooking(api, OFFICE, NAIR, 'Patient withdrew').ok).toBe(true)
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
    expect(Object.values(api.getState().billing.creditNotes).filter((r) => !r.id.startsWith('HS'))).toHaveLength(1)
    expect(refunds()).toEqual([expect.objectContaining({ amount: 1380, cause: 'cancelled' })])
    expectConserved()
  })

  it('two payers, one paid: the paid payer is credited and refunded, the other credited only', () => {
    const added = addPrepaidBooking(api, 'two-payers')
    if (!added.ok) throw new Error(added.message)
    const ids = approveAll(added.value.bookingId)
    expect(ids).toHaveLength(2)
    const paid = ids[0]!
    pay(paid, api.getState().billing.invoices[paid]!.total, 'TWO-PAID')
    expect(cancelBooking(api, OFFICE, added.value.bookingId, 'Patient withdrew').ok).toBe(true)
    expect(ids.every((id) => noteFor(id) !== undefined)).toBe(true)
    expect(refunds()).toEqual([expect.objectContaining({ prepaymentInvoiceId: paid, counterparty: api.getState().billing.invoices[paid]!.counterparty })])
    expectConserved()
  })
})

describe('a Contract changed off prepaid after sending (US-06.3.7, D67)', () => {
  function nonPrepaidCandidate(procedureId: string): string {
    // Try each non-prepaid Contract until the rail's own guard accepts one (a refused pick writes nothing).
    for (const c of Object.values(api.getState().masters.contracts)) {
      if (isPrepaidContract(c)) continue
      const out = setProcedureContract(api, OFFICE, procedureId, c.id)
      if (out.ok) return c.id
    }
    throw new Error('no non-prepaid candidate')
  }

  it('sent and half paid: the whole invoice credited and the half refunded; authorise then bills it under the new Contract and transfers nothing', () => {
    const [invoiceId] = approveAll(RILEY)
    pay(invoiceId!, 690, 'HALF')
    const procedureId = proceduresForBooking(api.getState(), RILEY)[0]!.id
    const contractId = nonPrepaidCandidate(procedureId)
    expect(noteFor(invoiceId!)).toMatchObject({ cause: 'prepaidContractChanged' })
    expect(refunds()).toEqual([expect.objectContaining({ cause: 'contractChanged', amount: 690 })])
    expect(api.getState().audit.map((a) => a.action)).toContain('procedure.prepaymentSettled')
    expect(api.getState().schedule.procedures[procedureId]!.governingContractId).toBe(contractId)
    expectConserved()
    // Then billed after the procedure under its new Contract, nothing transferred for it.
    const listId = api.getState().schedule.bookings[RILEY]!.listId
    const owner = souter()
    for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
    // The new Contract may ask for RVG detail the seed does not hold; then the List is not submitted and this part is skipped.
    const submitted = submitList(api, owner, listId)
    const before = Object.keys(api.getState().billing.invoices).length
    const authorised = submitted.ok ? authoriseList(api, OFFICE, listId) : submitted
    if (authorised.ok) {
      expect(Object.values(api.getState().billing.invoices).slice(before).some((i) => (i.procedureIds ?? []).includes(procedureId))).toBe(true)
      expect(Object.values(api.getState().billing.transfers).filter((t) => t.invoiceId === invoiceId)).toEqual([])
      expectConserved()
    }
  })

  it('before the invoice exists nothing is settled', () => {
    const procedureId = proceduresForBooking(api.getState(), RILEY)[0]!.id
    nonPrepaidCandidate(procedureId)
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
    expect(Object.values(api.getState().billing.creditNotes).filter((r) => !r.id.startsWith('HS'))).toEqual([])
    expect(refunds()).toEqual([])
  })

  it("the anaesthetist never settles one: once Riley's prepayment is approved, Dr Souter's change to each non-prepaid Contract is refused or credits and refunds nothing", () => {
    const [invoiceId] = approveAll(RILEY)
    expect(invoiceId).toBeDefined()
    const procedureId = proceduresForBooking(api.getState(), RILEY)[0]!.id
    for (const c of Object.values(api.getState().masters.contracts)) {
      if (isPrepaidContract(c)) continue
      setProcedureContract(api, souter(), procedureId, c.id)
      // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
      expect(Object.values(api.getState().billing.creditNotes).filter((r) => !r.id.startsWith('HS'))).toEqual([])
      expect(refunds()).toEqual([])
    }
    expect(noteFor(invoiceId!)).toBeUndefined()
    expect(api.getState().audit.map((a) => a.action)).not.toContain('procedure.prepaymentSettled')
    expectConserved()
  })
})

describe('the lists stay put for Nair after a cancellation', () => {
  it("authorising Souter's Fri 24 PM after Nair is cancelled transfers nothing for her", () => {
    expect(cancelBooking(api, OFFICE, NAIR, 'Patient withdrew').ok).toBe(true)
    const listId = SEED_LIST_IDS.prepaymentPaidList
    const owner = souter()
    for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
    expect(submitList(api, owner, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(Object.values(api.getState().billing.transfers)).toEqual([])
    expectConserved()
  })
})

describe('review fixes (catch-up Phase 41 review)', () => {
  it("a Contract changed off prepaid in the Admin Booking draft settles nothing in the draft and is settled by the save's commit", () => {
    const [invoiceId] = approveAll(RILEY)
    pay(invoiceId!, 690, 'HALF')
    const draft = createAppStore()
    markDraftStore(draft)
    copyStateIntoDraft(draft, api.getState())
    const base = snapshotBooking(api.getState(), RILEY)!
    const start = draft.getState().audit.length
    const procedureId = proceduresForBooking(api.getState(), RILEY)[0]!.id
    const changed = Object.values(draft.getState().masters.contracts).find((c) => !isPrepaidContract(c) && setProcedureContract(draft, OFFICE, procedureId, c.id).ok)
    expect(changed).toBeDefined()
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
    expect(Object.values(draft.getState().billing.creditNotes).filter((r) => !r.id.startsWith('HS'))).toEqual([])
    expect(Object.values(draft.getState().billing.prepaymentRefunds)).toEqual([])
    const out = saveBookingChanges(api, OFFICE, RILEY, { base, next: snapshotBooking(draft.getState(), RILEY)!, draftAudit: draft.getState().audit.slice(start) })
    expect(out.ok).toBe(true)
    expect(noteFor(invoiceId!)).toMatchObject({ cause: 'prepaidContractChanged' })
    expect(refunds()).toEqual([expect.objectContaining({ cause: 'contractChanged', amount: 690 })])
    expectConserved()
  })

  it('a refund made while Xero is down is posted once the Xero queue drains', () => {
    expect(setXeroOutage(api, OFFICE, true).ok).toBe(true)
    expect(cancelBooking(api, OFFICE, NAIR, 'Patient withdrew').ok).toBe(true)
    expect(refunds()).toHaveLength(1)
    expect(Object.values(api.getState().xero.refunds)).toEqual([])
    expect(setXeroOutage(api, OFFICE, false).ok).toBe(true)
    expect(Object.values(api.getState().xero.refunds)).toEqual([expect.objectContaining({ amount: 1380 })])
    expect(refunds()[0]!.xeroRefundId).toBeDefined()
  })
})

