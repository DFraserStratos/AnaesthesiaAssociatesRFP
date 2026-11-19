/**
 * The AA Holding account and the transfer (catch-up Phase 27a; US-06.5.1,
 * US-09.1.3, FT-06.5, FT-09.1, DM-21; D38, D53, D72): the collect payable is
 * held and never paid out by hand or by the run; authorising the List writes
 * one transfer per prepayment invoice to whoever did the List, mirrored as a
 * journal; money arriving later follows the transfer; a move changes nothing.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { authoriseList, cancelBooking, reassignBooking, submitList } from './lifecycle'
import { reassignList } from './slotActions'
import { moveBookingToAnaesthetist, moveListToOffice, pushListToSlot } from './listMoveActions'
import { addProcedure } from './bookingActions'
import { slotIdFor } from '../domain/slots'
import { PRICED_ITEM } from '../domain/seed/pricedItems'
import { receivePayment } from './paymentActions'
import { disbursePayable, payablesDue, runPayables } from './payablesActions'
import { armHandoffFault } from './demoSettingsActions'
import { postTransferJournal } from './xeroHandoff'
import { settlePrepaymentsForList } from './prepaymentSettlement'
import { addPrepaidBooking } from './prepaymentDemo'
import { gstActivityFor, paymentHistoryFor, proceduresForBooking } from './selectors'
import { completeAnswered } from '../test/completeAnswered'
import { approveAllPrepayments } from '../test/approvePrepayments'
import { SEED_LIST_IDS, SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { HOLDING_SYSTEM_ONLY, holdingBalance, holdingEntries } from '../domain/billing/prepayHolding'
import { journalQueuedFor, pairForInvoice } from './ledgerSelectors'
import { processXeroQueue } from './xeroQueue'
import { XERO_FAULT_ERROR } from './xeroGate'
import type { LedgerTransfer } from '../domain/types'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
const NAIR = SEED_PREPAID_BOOKING_ID
const NAIR_LIST = SEED_LIST_IDS.prepaymentPaidList

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

const balance = () => holdingBalance(holdingEntries(api.getState().billing))
const transfers = () => Object.values(api.getState().billing.transfers)
const listOf = (bookingId: string) => api.getState().schedule.bookings[bookingId]!.listId

function completeAndSubmit(listId: string) {
  const anaesthetistId = api.getState().schedule.lists[listId]!.anaesthetistId!
  const owner: Actor = { who: api.getState().masters.anaesthetists[anaesthetistId]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
  if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') {
    const out = submitList(api, owner, listId)
    if (!out.ok) throw new Error(out.message)
  }
}
function authorise(listId: string) {
  completeAndSubmit(listId)
  const out = authoriseList(api, OFFICE, listId)
  if (!out.ok) throw new Error(out.message)
}
function caseOfInvoice(invoiceId: string) {
  return pairForInvoice(api.getState(), invoiceId)!
}
/** Whoever a transfer pays (its `in` leg's payee). */
function toOf(t: LedgerTransfer | undefined): string | undefined {
  return t !== undefined && t.in.payee.kind === 'anaesthetist' ? t.in.payee.anaesthetistId : undefined
}
function pay(invoiceId: string, amount: number, key: string) {
  const c = caseOfInvoice(invoiceId)
  const out = receivePayment(api, { accRecId: c.receivable.xeroAccRecId!, amount, idempotencyKey: key, source: 'webhook' })
  if (!out.ok) throw new Error(out.message)
}

describe('held in the AA Holding account', () => {
  it("fresh: the account holds Nair's $1,380.00, one Received entry; nothing is due to any anaesthetist", () => {
    const entries = holdingEntries(api.getState().billing)
    expect(entries.map((e) => [e.kind, e.amount, e.invoiceNumber, e.bookingId])).toEqual([['received', 1380, 'AA-2026-0001', NAIR]])
    expect(balance()).toBe(1380)
    expect(payablesDue(api.getState())).toEqual({ count: 0, total: 0, byAnaesthetist: [] })
    expect(api.getState().billing.ledger.BC0001?.kind).toBe('prePayment')
  })

  it('a manual payout of the held payable is refused; the run pays nothing out of the account', () => {
    // (catch-up Phase 36: a payable is named by its pair; BC0001's is the held ACCPAY XPB0.)
    const held = api.getState().billing.ledger.BC0001
    expect(held?.kind === 'prePayment' && held.payable?.xeroAccPayId).toBe('XPB0')
    expect(disbursePayable(api, OFFICE, 'BC0001')).toMatchObject({ ok: false, code: 'holdingSystemOnly', message: HOLDING_SYSTEM_ONLY })
    expect(runPayables(api, OFFICE)).toMatchObject({ ok: true, value: { disbursedCount: 0 } })
    expect(api.getState().xero.accPays.XPB0).toMatchObject({ amountDisbursed: 0, status: 'authorised' })
  })

  it("Riley approved and half paid: the balance rises by half; nothing reaches Dr Souter; a new collect case is tagged", () => {
    const [invoiceId] = approveAllPrepayments(api, RILEY)
    expect(caseOfInvoice(invoiceId!).kind).toBe('prePayment')
    pay(invoiceId!, 690, 'T-RILEY-HALF')
    expect(balance()).toBe(2070)
    expect(payablesDue(api.getState()).count).toBe(0)
    expect(runPayables(api, OFFICE)).toMatchObject({ ok: true, value: { disbursedCount: 0 } })
  })
})

describe('the transfer at authorisation (OQ-125 provisional)', () => {
  it("authorising Nair's List writes one transfer to Dr Souter, posts its journal, and the payables run pays it", () => {
    const invoicesBefore = Object.keys(api.getState().billing.invoices).filter((id) => api.getState().billing.invoices[id]!.kind === 'prePayment')
    const receiptsBefore = Object.keys(api.getState().billing.receipts).length
    const paymentsBefore = Object.keys(api.getState().xero.payments).length
    const gstBefore = gstActivityFor(api.getState(), '34821', '2026-07-01', '2026-07-31')
    authorise(NAIR_LIST)
    expect(transfers()).toHaveLength(1)
    const t = transfers()[0]!
    // (catch-up Phase 36: the transfer is two legs, `out` from the AA Holding account and `in` to the anaesthetist.)
    expect(t).toMatchObject({
      kind: 'prepayTransfer',
      collectPairId: 'BC0001',
      invoiceId: 'INV0001',
      bookingId: NAIR,
      out: { amount: 1380 },
      in: { amount: 1380, releasedAmount: 1380, disbursedAmount: 0, payee: { kind: 'anaesthetist', anaesthetistId: '34821' } },
    })
    // The journal: MJ- numbered, two lines, the invoice number, no patient name.
    const journal = api.getState().xero.journals[t.xeroJournalId!]!
    expect(journal.journalNumber).toMatch(/^MJ-\d{4}$/)
    expect(journal.reference).toBe('AA-2026-0001')
    expect(journal.lines.map((l) => [api.getState().xero.contacts[l.contactId]!.name, l.debit, l.credit])).toEqual([
      ['AA Holding account', 1380, 0],
      ['Dr Melanie Souter', 0, 1380],
    ])
    expect(JSON.stringify(journal)).not.toContain('Nair')
    // Not an invoice, an ACCREC, a payment or a receipt: GST does not move.
    expect(Object.keys(api.getState().billing.invoices).filter((id) => api.getState().billing.invoices[id]!.kind === 'prePayment')).toEqual(invoicesBefore)
    expect(Object.keys(api.getState().billing.receipts)).toHaveLength(receiptsBefore)
    expect(Object.keys(api.getState().xero.payments)).toHaveLength(paymentsBefore)
    expect(gstActivityFor(api.getState(), '34821', '2026-07-01', '2026-07-31')).toEqual(gstBefore)
    // The account falls; exactly the transferred payable is due.
    expect(balance()).toBe(0)
    expect(payablesDue(api.getState())).toEqual({ count: 1, total: 1380, byAnaesthetist: [{ anaesthetistId: '34821', count: 1, total: 1380 }] })
    const run = runPayables(api, OFFICE)
    expect(run).toMatchObject({ ok: true, value: { disbursedCount: 1, totalDisbursed: 1380, paidIds: [t.id] } })
    expect(api.getState().billing.transfers[t.id]!.in.disbursedAmount).toBe(1380)
    const dsb = Object.values(api.getState().xero.disbursements).find((d) => d.transferId === t.id)
    expect(dsb).toMatchObject({ amount: 1380 })
    expect(dsb?.accPayId).toBeUndefined()
    // The collect pair is never paid.
    expect(api.getState().xero.accPays.XPB0).toMatchObject({ amountDisbursed: 0, status: 'authorised' })
    expect(api.getState().audit.some((e) => e.action === 'prepayment.transfer' && e.entityId === NAIR && e.role === 'system')).toBe(true)
  })

  it('is idempotent per collect case and never runs on submit', () => {
    completeAndSubmit(NAIR_LIST)
    expect(transfers()).toHaveLength(0)
    expect(settlePrepaymentsForList(api, NAIR_LIST)).toMatchObject({ ok: false, code: 'listNotAuthorised' })
    expect(authoriseList(api, OFFICE, NAIR_LIST).ok).toBe(true)
    expect(transfers()).toHaveLength(1)
    expect(settlePrepaymentsForList(api, NAIR_LIST)).toMatchObject({ ok: true, value: { transferIds: [] } })
    expect(transfers()).toHaveLength(1)
  })

  it("Riley part paid, then authorised: the full amount moves, half released; the rest arrives and follows, the account's balance does not move", () => {
    const [invoiceId] = approveAllPrepayments(api, RILEY)
    pay(invoiceId!, 690, 'T-RILEY-HALF')
    authorise(listOf(RILEY))
    const t = transfers().find((x) => x.invoiceId === invoiceId)!
    expect(t).toMatchObject({ in: { amount: 1380, releasedAmount: 690 }, out: { amount: 690 } })
    expect(balance()).toBe(1380) // Nair's, still held: her List is not authorised.
    expect(payablesDue(api.getState())).toEqual({ count: 1, total: 690, byAnaesthetist: [{ anaesthetistId: toOf(t), count: 1, total: 690 }] })
    pay(invoiceId!, 690, 'T-RILEY-REST')
    expect(api.getState().billing.transfers[t.id]!.in.releasedAmount).toBe(1380)
    expect(balance()).toBe(1380)
    expect(runPayables(api, OFFICE)).toMatchObject({ ok: true, value: { totalDisbursed: 1380 } })
    expect(paymentHistoryFor(api.getState(), '34821').find((r) => r.invoiceNumber === api.getState().billing.invoices[invoiceId!]!.invoiceNumber)).toMatchObject({ status: 'paidOut', releasedAmount: 1380, disbursedAmount: 1380 })
  })

  it('an unsent prepayment gets no transfer (it is billed on the final invoice instead)', () => {
    authorise(listOf(RILEY))
    expect(transfers()).toEqual([])
  })

  it('two payers: two invoices, two collect payables, two transfers each linked to its own invoice', () => {
    const added = addPrepaidBooking(api, 'two-payers')
    if (!added.ok) throw new Error(added.message)
    const bookingId = added.value.bookingId
    const invoiceIds = approveAllPrepayments(api, bookingId)
    expect(invoiceIds).toHaveLength(2)
    const payers = invoiceIds.map((id) => api.getState().billing.invoices[id]!.counterparty.kind).sort()
    expect(payers).toEqual(['patient', 'payer'])
    for (const id of invoiceIds) {
      const c = caseOfInvoice(id)
      expect(c.kind).toBe('prePayment')
      expect(api.getState().xero.accPays[c.payable!.xeroAccPayId!]?.payeeAccount).toBe('aaHoldingAccount')
      pay(id, api.getState().billing.invoices[id]!.total, `T-TWO-${id}`)
    }
    const held = balance()
    authorise(listOf(bookingId))
    const mine = transfers().filter((t) => t.bookingId === bookingId)
    expect(mine.map((t) => t.invoiceId).sort()).toEqual([...invoiceIds].sort())
    expect(new Set(mine.map((t) => t.payerKey)).size).toBe(2)
    const total = invoiceIds.reduce((s, id) => s + api.getState().billing.invoices[id]!.total, 0)
    expect(balance()).toBeCloseTo(held - total, 2)
    expect(payablesDue(api.getState()).count).toBe(2)
  })

  it('a cancelled Booking gets no transfer (Phase 41 credits or refunds it)', () => {
    const [invoiceId] = approveAllPrepayments(api, RILEY)
    pay(invoiceId!, 1380, 'T-RILEY-FULL')
    const listId = listOf(RILEY)
    expect(cancelBooking(api, OFFICE, RILEY, 'Patient unwell').ok).toBe(true)
    authorise(listId)
    expect(transfers().filter((t) => t.bookingId === RILEY)).toEqual([])
    expect(balance()).toBe(2760)
  })
})

describe('a move changes nothing; the transfer pays whoever did the List', () => {
  function colleagueFor(listId: string) {
    const from = api.getState().schedule.lists[listId]!.anaesthetistId
    return Object.values(api.getState().masters.anaesthetists).find((a) => a.active && a.registrationNumber !== from)!.registrationNumber
  }

  it('the office reassigns the List: the collect pair and the balance are untouched; the transfer pays the new anaesthetist', () => {
    const [invoiceId] = approveAllPrepayments(api, RILEY)
    pay(invoiceId!, 1380, 'T-RILEY-FULL')
    const listId = listOf(RILEY)
    const snap = () => JSON.stringify({ a: api.getState().xero.accPays, c: caseOfInvoice(invoiceId!), e: holdingEntries(api.getState().billing) })
    const before = snap()
    const to = colleagueFor(listId)
    const moved = reassignList(api, OFFICE, listId, to)
    if (!moved.ok) throw new Error(moved.message)
    expect(snap()).toBe(before)
    expect(transfers()).toEqual([])
    const newListId = api.getState().schedule.bookings[RILEY]!.listId
    authorise(newListId)
    const t = transfers().find((x) => x.invoiceId === invoiceId)!
    expect(toOf(t)).toBe(to)
    expect(paymentHistoryFor(api.getState(), '34821').some((r) => r.pairId === t.collectPairId)).toBe(false)
    expect(paymentHistoryFor(api.getState(), to).some((r) => r.pairId === t.collectPairId)).toBe(true)
  })

  it('the office moves the single Booking to a colleague: nothing here changes until that List is authorised', () => {
    const [invoiceId] = approveAllPrepayments(api, RILEY)
    pay(invoiceId!, 1380, 'T-RILEY-FULL')
    const before = JSON.stringify({ a: api.getState().xero.accPays, t: api.getState().billing.transfers })
    const souterId = api.getState().schedule.lists[listOf(RILEY)]!.anaesthetistId
    // A colleague's ACTIVE List holding no other Booking, so authorising it needs only Riley completed.
    const holds = (listId: string) => Object.values(api.getState().schedule.bookings).some((b) => b.listId === listId && b.cancellation === undefined)
    const candidates = Object.values(api.getState().schedule.lists)
      .filter((l) => l.anaesthetistId !== undefined && l.anaesthetistId !== souterId && l.state === 'ACTIVE' && l.dateISO >= '2026-07-21' && !holds(l.id))
      .sort((a, b) => Number(b.dateISO === '2026-07-24') - Number(a.dateISO === '2026-07-24') || a.id.localeCompare(b.id))
    const moved = candidates.find((l) => reassignBooking(api, OFFICE, RILEY, l.id).ok)
    expect(moved).toBeDefined()
    expect(JSON.stringify({ a: api.getState().xero.accPays, t: api.getState().billing.transfers })).toBe(before)
    authorise(moved!.id)
    expect(toOf(transfers().find((x) => x.invoiceId === invoiceId))).toBe(moved!.anaesthetistId)
    expect(api.getState().audit.filter((e) => e.entityId === RILEY && e.action === 'prepayment.transfer')).toHaveLength(1)
    expect(proceduresForBooking(api.getState(), RILEY)).toHaveLength(1)
  })
})

describe("the anaesthetist's own moves change nothing here either", () => {
  const SOUTER_ME: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
  const others = () => Object.values(api.getState().masters.anaesthetists).filter((a) => a.active && a.registrationNumber !== '34821').map((a) => a.registrationNumber)

  it("Dr Souter moves her own List to a colleague (32): one list.ownerMove, no list.reassign; authorised, the transfer pays the colleague", () => {
    const [invoiceId] = approveAllPrepayments(api, RILEY)
    pay(invoiceId!, 1380, 'T-RILEY-FULL')
    const listId = listOf(RILEY)
    const before = JSON.stringify({ a: api.getState().xero.accPays, c: caseOfInvoice(invoiceId!), t: api.getState().billing.transfers })
    const from = api.getState().audit.length
    const to = others().find((id) => pushListToSlot(api, SOUTER_ME, listId, slotIdFor(id, '2026-07-24', 'AM')).ok)
    expect(to, 'a colleague with a free Fri 24 Jul AM').toBeDefined()
    const moves = api.getState().audit.slice(from).map((e) => e.action)
    expect(moves.filter((a) => a === 'list.ownerMove')).toHaveLength(1)
    expect(moves).not.toContain('list.reassign')
    expect(moves.some((a) => a.startsWith('prepayment.') || a.startsWith('xero.'))).toBe(false)
    expect(JSON.stringify({ a: api.getState().xero.accPays, c: caseOfInvoice(invoiceId!), t: api.getState().billing.transfers })).toBe(before)
    authorise(api.getState().schedule.bookings[RILEY]!.listId)
    expect(toOf(transfers().find((t) => t.invoiceId === invoiceId))).toBe(to)
  })

  it('Dr Souter moves the single prepaid Booking to a colleague (32a): untouched until that List is authorised, then the colleague is paid', () => {
    const [invoiceId] = approveAllPrepayments(api, RILEY)
    pay(invoiceId!, 1380, 'T-RILEY-FULL')
    const before = JSON.stringify({ a: api.getState().xero.accPays, c: caseOfInvoice(invoiceId!), t: api.getState().billing.transfers })
    const to = others().find((id) => moveBookingToAnaesthetist(api, SOUTER_ME, RILEY, id).ok)
    expect(to, 'a colleague who can take the Booking').toBeDefined()
    expect(JSON.stringify({ a: api.getState().xero.accPays, c: caseOfInvoice(invoiceId!), t: api.getState().billing.transfers })).toBe(before)
    authorise(api.getState().schedule.bookings[RILEY]!.listId)
    expect(toOf(transfers().find((t) => t.invoiceId === invoiceId))).toBe(to)
    expect(paymentHistoryFor(api.getState(), '34821').some((r) => r.pairId === caseOfInvoice(invoiceId!).id)).toBe(false)
  })
})

describe('a prepayment paid while its List is with the office', () => {
  it('is received into the AA Holding account with no anaesthetist named (the review fix)', () => {
    const [invoiceId] = approveAllPrepayments(api, RILEY)
    const listId = listOf(RILEY)
    const souter: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
    const out = moveListToOffice(api, souter, listId)
    if (!out.ok) throw new Error(out.message)
    expect(api.getState().schedule.lists[listId]?.anaesthetistId).toBeUndefined()
    pay(invoiceId!, 1380, 'T-RILEY-OFFICE')
    expect(balance()).toBe(2760)
    const receipt = Object.values(api.getState().billing.receipts).find((r) => r.idempotencyKey === 'T-RILEY-OFFICE')!
    expect(receipt.anaesthetistId).toBeUndefined()
  })
})

describe('two prepaid Procedures billing one payer', () => {
  it('one invoice, one collect payable, one transfer for both', () => {
    const added = addProcedure(api, OFFICE, RILEY, { governingContractId: PRICED_ITEM.souterBleph })
    if (!added.ok) throw new Error(added.message)
    const ids = approveAllPrepayments(api, RILEY)
    expect(ids).toHaveLength(1)
    const invoice = api.getState().billing.invoices[ids[0]!]!
    expect(invoice.procedureIds).toHaveLength(2)
    pay(ids[0]!, invoice.total, 'T-RILEY-BOTH')
    authorise(listOf(RILEY))
    const mine = transfers().filter((t) => t.bookingId === RILEY)
    expect(mine).toHaveLength(1)
    expect(mine[0]).toMatchObject({ invoiceId: ids[0], in: { amount: invoice.total, releasedAmount: invoice.total } })
  })
})

describe('a journal fault is recorded, not thrown; the retry posts it once', () => {
  it('the run hands off first, so an armed fault meets the first Xero call on the List', () => {
    completeAndSubmit(NAIR_LIST)
    expect(armHandoffFault(api, OFFICE, { bookingId: NAIR }).ok).toBe(true)
    expect(authoriseList(api, OFFICE, NAIR_LIST).ok).toBe(true)
    // Forte's septoplasty hand-off on Nair's Booking took the fault; the transfer and its journal still landed.
    expect(transfers()).toHaveLength(1)
    expect(transfers()[0]!.xeroJournalId).toBeDefined()
  })

  it('a fault on the journal: the transfer stands, its journal waits in the Xero sync queue; the retry posts one journal; a second call is a no-op', () => {
    unwire() // settle by hand, so the fault meets the journal
    completeAndSubmit(NAIR_LIST)
    expect(authoriseList(api, OFFICE, NAIR_LIST).ok).toBe(true)
    expect(armHandoffFault(api, OFFICE, { bookingId: NAIR }).ok).toBe(true)
    expect(settlePrepaymentsForList(api, NAIR_LIST).ok).toBe(true)
    const t = transfers()[0]!
    const queued = journalQueuedFor(api.getState(), t.id)
    expect(queued?.lastError).toBe(XERO_FAULT_ERROR)
    expect(t.xeroJournalId).toBeUndefined()
    expect(api.getState().settings.failNextHandoff).toBe(false)
    // A fresh call while queued does not post past the queue; the queue's retry posts it once.
    expect(postTransferJournal(api, t.id)).toMatchObject({ ok: true, value: { queued: true } })
    expect(processXeroQueue(api, { force: true }).sent).toBe(1)
    expect(postTransferJournal(api, t.id).ok).toBe(true)
    expect(Object.keys(api.getState().xero.journals)).toHaveLength(1)
    expect(journalQueuedFor(api.getState(), t.id)).toBeUndefined()
  })
})
