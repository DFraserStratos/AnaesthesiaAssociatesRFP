/**
 * Credit notes and credit-and-rebill (catch-up Phase 39, work item 4), driven
 * through the real payment, payables and 38b review and run actions: one test
 * per `reversalPlan` case, the immutability of the original, the ledger in
 * balance afterwards, the second credit refused, a chain of two, another
 * party, zero replacements, the anaesthetist's own credit, the split's equal
 * total and the audit entries.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { completeAnswered } from '../test/completeAnswered'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { receivePayment } from './paymentActions'
import { approveAndPayPairForDemo } from './payablesActions'
import { anaesthetistLedgerPosition, bctiRecords, ledgerPositionOf, pairForInvoice } from './ledgerSelectors'
import {
  approveProcedureEvent,
  declineProcedureEvent,
  liveInvoiceForProcedure,
  raiseRefusal,
  removeProcedureEvent,
  runEventInvoicing,
  updateProcedureEvent,
} from './procedureEventActions'
import {
  creditEventForInvoice,
  creditNoteForInvoice,
  creditRefusalFor,
  currentReversalPlan,
  invoiceStanding,
  negativeInvoicesFor,
  rebillOriginFor,
  replacementEventsOf,
  replacementsOf,
  reviewRowsAwaiting,
  submitCredit,
  updateCredit,
  type CreditInput,
} from './creditActions'
import type { Actor } from './mutate'
import { outstandingPayableRowsFor, outstandingTotalFor } from './selectors'
import { ANAE, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { bctisFor } from '../domain/billing/bcti'
import { toCents } from '../domain/billing/money'
import { CREDIT_MESSAGES } from '../shared/procedureEventCopy'
import type { Invoice } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SHARMA_TUE14 = projectedListId(ANAE.sharma, '2026-11-17', 'AM')

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

function ownerActor(anaesthetistId: string): Actor {
  return { who: api.getState().masters.anaesthetists[anaesthetistId]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }
}
const sharma = () => ownerActor(ANAE.sharma)
const souter = () => ownerActor(ANAE.souter)

function authorise(listId: string) {
  const anaesthetistId = api.getState().schedule.lists[listId]!.anaesthetistId!
  const owner = ownerActor(anaesthetistId)
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
  if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') {
    const out = submitList(api, owner, listId)
    if (!out.ok) throw new Error(out.message)
  }
  const out = authoriseList(api, OFFICE, listId)
  if (!out.ok) throw new Error(out.message)
}

/** Sarah Mitchell's staged original: Dr Sharma's Tue 14 Jul AM List, authorised, billed and in Xero. */
function stageMitchell(): { bookingId: string; procedureId: string; original: Invoice } {
  authorise(SHARMA_TUE14)
  const b = Object.values(api.getState().schedule.bookings).find((x) => x.listId === SHARMA_TUE14 && x.cancellation === undefined)!
  const procedureId = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === b.id)!.id
  const original = liveInvoiceForProcedure(api.getState(), procedureId)!
  return { bookingId: b.id, procedureId, original }
}

function pay(invoiceId: string, amount: number, key: string) {
  const pair = pairForInvoice(api.getState(), invoiceId)!
  const out = receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount, idempotencyKey: key, source: 'webhook' })
  if (!out.ok || !out.value.applied) throw new Error(out.ok ? 'not applied' : out.message)
}

const rebill = (unitAmount: number, description = 'Anaesthesia, corrected') => ({ occurredOnISO: '2026-11-18', party: { sameAs: true as const }, lines: [{ description, quantity: 1, unitAmount }] })

const creditInput = (invoiceId: string, over: Partial<CreditInput> = {}): CreditInput => ({ invoiceId, reason: 'Wrong amount', cause: 'correction', replacements: [], ...over })

/** Submit, approve and run: the credit issued. */
function issue(actor: Actor, input: CreditInput) {
  const sub = submitCredit(api, actor, input)
  if (!sub.ok) throw new Error(sub.message)
  const appr = approveProcedureEvent(api, OFFICE, sub.value.creditEventId)
  if (!appr.ok) throw new Error(appr.message)
  const run = runEventInvoicing(api, OFFICE)
  if (!run.ok) throw new Error(run.message)
  const note = api.getState().billing.creditNotes[run.value.creditNoteIds[0]!]!
  return { sub: sub.value, run: run.value, note, negative: api.getState().billing.negativeInvoices[note.negativeInvoiceId!]! }
}

/** The records a credit must never write (US-07.3.2). */
function frozen(bookingId: string, invoiceId: string) {
  const s = api.getState()
  return structuredClone({
    booking: s.schedule.bookings[bookingId],
    procedures: Object.values(s.schedule.procedures).filter((p) => p.bookingId === bookingId),
    lock: s.billing.locks[bookingId],
    invoice: s.billing.invoices[invoiceId],
    lines: Object.values(s.billing.invoiceLines).filter((l) => l.invoiceId === invoiceId),
  })
}

/** Heather Sinclair's seeded credit (catch-up Phase 40, D24): $260.00 already held for her, nothing to net. */
const SEEDED_HELD = 260
const plusSeededHeld = (amount: number): number => (toCents(amount) + toCents(SEEDED_HELD)) / 100

function expectInBalance() {
  const pos = ledgerPositionOf(api.getState())
  expect(pos.imbalance).toBe(0)
  expect(pos.checks).toEqual([])
  return pos
}

const actions = () => api.getState().audit.map((a) => a.action)

describe('the reversal cases, through the real actions', () => {
  it('unpaid: the credit note equals the original, the negative invoice is all offset, the draft ACCPAY is voided, and a rebill with a new total is issued', () => {
    const { bookingId, procedureId, original } = stageMitchell()
    const before = frozen(bookingId, original.id)
    const payable = pairForInvoice(api.getState(), original.id)!.payable!
    const anaesthetistBefore = anaesthetistLedgerPosition(api.getState(), ANAE.sharma)

    const sub = submitCredit(api, OFFICE, creditInput(original.id, { replacements: [rebill(200)] }))
    expect(sub.ok).toBe(true)
    if (!sub.ok) return
    const s1 = api.getState()
    const creditEvent = s1.schedule.procedureEvents[sub.value.creditEventId]!
    const replacement = s1.schedule.procedureEvents[sub.value.replacementEventIds[0]!]!
    // Linked both ways, both awaiting the one review step.
    expect(creditEvent).toMatchObject({ kind: 'credit', procedureId, review: { state: 'awaitingReview' }, detail: { kind: 'credit', credit: { originalInvoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacementEventIds: [replacement.id] } } })
    expect(replacement).toMatchObject({ kind: 'additionalInvoice', review: { state: 'awaitingReview' }, replaces: { creditEventId: creditEvent.id, originalInvoiceId: original.id } })
    expect(invoiceStanding(s1, original.id)).toBe('creditPending')
    expect(creditEventForInvoice(s1, original.id)?.id).toBe(creditEvent.id)
    expect(replacementEventsOf(s1, creditEvent.id).map((e) => e.id)).toEqual([replacement.id])
    expect(reviewRowsAwaiting(s1).find((r) => r.event.id === creditEvent.id)?.replacements.map((e) => e.id)).toEqual([replacement.id])
    expect(reviewRowsAwaiting(s1).some((r) => r.event.id === replacement.id)).toBe(false)

    expect(approveProcedureEvent(api, OFFICE, creditEvent.id).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[replacement.id]!.review.state).toBe('approved')
    const run = runEventInvoicing(api, OFFICE)
    expect(run.ok).toBe(true)
    if (!run.ok) return
    expect(run.value.creditNoteIds).toHaveLength(1)
    expect(run.value.invoiceIds).toHaveLength(1)

    const s = api.getState()
    const note = s.billing.creditNotes[run.value.creditNoteIds[0]!]!
    expect(note).toMatchObject({ creditNoteNumber: 'CN-2026-0001', originalInvoiceId: original.id, counterparty: original.counterparty, subtotal: original.subtotal, gst: original.gst, total: original.total, reason: 'Wrong amount', cause: 'correction' })
    const originalLines = Object.values(s.billing.invoiceLines).filter((l) => l.invoiceId === original.id)
    expect(note.lines.map((l) => l.amount)).toEqual(originalLines.map((l) => l.amount))
    expect(note.lines.every((l) => l.description.startsWith('Credit: '))).toBe(true)

    const negative = s.billing.negativeInvoices[note.negativeInvoiceId!]!
    expect(negative).toMatchObject({ number: 'CN-2026-0001-P', anaesthetistId: ANAE.sharma, amount: payable.amount, offsetAmount: payable.amount, recoveryDue: 0, status: 'offset', cause: 'credit' })
    // Beside Dr Sharma's seeded HSNEG05 (Heather Sinclair's credit, catch-up Phase 40), by number.
    expect(negativeInvoicesFor(s, ANAE.sharma).map((n) => n.id)).toEqual([negative.id, 'HSNEG05'])

    const rebillInvoice = s.billing.invoices[run.value.invoiceIds[0]!]!
    expect(rebillInvoice).toMatchObject({ kind: 'additional', total: 230, lineage: [{ role: 'rebillOf', invoiceId: original.id }] })
    expect(note.replacementInvoiceIds).toEqual([rebillInvoice.id])
    expect(replacementsOf(s, original.id).map((i) => i.id)).toEqual([rebillInvoice.id])
    expect(rebillOriginFor(s, rebillInvoice.id)?.id).toBe(original.id)
    expect(creditNoteForInvoice(s, original.id)?.id).toBe(note.id)
    expect(invoiceStanding(s, original.id)).toBe('credited')
    expect(invoiceStanding(s, rebillInvoice.id)).toBe('live')
    expect(liveInvoiceForProcedure(s, procedureId)?.id).toBe(rebillInvoice.id)
    expect(s.schedule.procedureEvents[creditEvent.id]!.detail).toMatchObject({ credit: { creditNoteId: note.id, negativeInvoiceId: negative.id } })
    expect(s.schedule.procedureEvents[replacement.id]!.invoiceId).toBe(rebillInvoice.id)

    // Both sides moved in Xero: the ACCREC credited, the draft ACCPAY voided, the rebill's pair created.
    const pair = pairForInvoice(s, original.id)!
    expect(s.xero.accRecs[pair.receivable.xeroAccRecId!]!.status).toBe('credited')
    expect(s.xero.accPays[pair.payable!.xeroAccPayId!]!.status).toBe('voided')
    expect(note.xero).toEqual({ accRecCreditNoteId: expect.any(String), accPayVoided: true })
    expect(pairForInvoice(s, rebillInvoice.id)!.receivable.xeroAccRecId).toBeDefined()

    // The ledger is in balance; the anaesthetist's position moved by the reversal and then the rebill.
    const pos = expectInBalance()
    expect([pos.creditsHeldForPayers, pos.recoveryDueFromAnaesthetists]).toEqual([SEEDED_HELD, 0])
    const anaesthetistAfter = anaesthetistLedgerPosition(s, ANAE.sharma)
    expect(toCents(anaesthetistAfter.awaitingCollection) - toCents(anaesthetistBefore.awaitingCollection)).toBe(toCents(230) - toCents(payable.amount))
    expect(anaesthetistAfter.inBalance).toBe(true)

    expect(frozen(bookingId, original.id)).toEqual(before)
  })

  it('half paid: what the payer paid is held for them, the release is cancelled, the ACCPAYCREDIT is allocated', () => {
    const { original } = stageMitchell()
    const half = Math.round(original.total * 50) / 100
    pay(original.id, half, 'half')
    const { note, negative } = issue(OFFICE, creditInput(original.id))
    expect(note.reversal).toMatchObject({ heldForPayer: half, recoveryDue: 0, releaseCancelled: half, offsetAgainstPayable: original.total })
    expect(negative).toMatchObject({ amount: original.total, offsetAmount: original.total, recoveryDue: 0, status: 'offset' })
    const s = api.getState()
    const pair = pairForInvoice(s, original.id)!
    expect(pair.payable).toMatchObject({ releasedAmount: 0, reversedAmount: original.total })
    const accPayCredit = s.xero.creditNotes[note.xero!.accPayCreditNoteId!]!
    expect(accPayCredit).toMatchObject({ type: 'ACCPAYCREDIT', creditNoteNumber: `${note.creditNoteNumber}-P`, total: original.total, allocated: original.total })
    const accRecCredit = s.xero.creditNotes[note.xero!.accRecCreditNoteId!]!
    expect(accRecCredit).toMatchObject({ type: 'ACCRECCREDIT', total: original.total })
    expect(toCents(accRecCredit.total) - toCents(accRecCredit.allocated)).toBe(toCents(half))
    expect(s.billing.negativeInvoices[negative.id]!.accPayCreditNoteId).toBe(accPayCredit.id)
    const pos = expectInBalance()
    expect(pos.creditsHeldForPayers).toBe(plusSeededHeld(half))
    expect(pos.payablesDue).toBe(0)
  })

  it('fully paid, not paid out: all held for the payer, nothing to net', () => {
    const { original } = stageMitchell()
    pay(original.id, original.total, 'full')
    const { negative } = issue(OFFICE, creditInput(original.id))
    expect(negative).toMatchObject({ offsetAmount: original.total, recoveryDue: 0, status: 'offset' })
    const pos = expectInBalance()
    expect([pos.creditsHeldForPayers, pos.recoveryDueFromAnaesthetists]).toEqual([plusSeededHeld(original.total), 0])
  })

  it('fully paid and paid out in a payment run: the paid-out part is left to net', () => {
    const { original } = stageMitchell()
    pay(original.id, original.total, 'full')
    // (catch-up Phase 39a: paid out as an approved one-line run for this pair, paid in Xero.)
    expect(approveAndPayPairForDemo(api, OFFICE, pairForInvoice(api.getState(), original.id)!.id).ok).toBe(true)
    expect(pairForInvoice(api.getState(), original.id)!.payable!.disbursedAmount).toBe(original.total)
    const { negative, note } = issue(OFFICE, creditInput(original.id))
    expect(negative).toMatchObject({ amount: original.total, offsetAmount: 0, recoveryDue: original.total, status: 'toNet' })
    expect(api.getState().xero.creditNotes[note.xero!.accPayCreditNoteId!]).toMatchObject({ allocated: 0, total: original.total })
    const pos = expectInBalance()
    expect([pos.creditsHeldForPayers, pos.recoveryDueFromAnaesthetists]).toEqual([plusSeededHeld(original.total), original.total])
    expect(anaesthetistLedgerPosition(api.getState(), ANAE.sharma).recoveryDue).toBe(original.total)
  })

  it('a payment recorded while the credit waits for review is in the reversal at issue time', () => {
    const { original } = stageMitchell()
    const sub = submitCredit(api, OFFICE, creditInput(original.id))
    if (!sub.ok) throw new Error(sub.message)
    expect(currentReversalPlan(api.getState(), original.id)?.heldForPayer).toBe(0)
    pay(original.id, 50, 'while-waiting')
    expect(approveProcedureEvent(api, OFFICE, sub.value.creditEventId).ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const note = api.getState().billing.creditNotes[run.value.creditNoteIds[0]!]!
    expect(note.reversal.heldForPayer).toBe(50)
    expectInBalance()
  })
})

describe('the rules', () => {
  it('a second credit refuses while one is pending and after one is issued', () => {
    const { original } = stageMitchell()
    const first = submitCredit(api, OFFICE, creditInput(original.id))
    expect(first.ok).toBe(true)
    expect(submitCredit(api, OFFICE, creditInput(original.id))).toMatchObject({ ok: false, code: 'correctionPending', message: CREDIT_MESSAGES.correctionPending })
    if (!first.ok) return
    approveProcedureEvent(api, OFFICE, first.value.creditEventId)
    runEventInvoicing(api, OFFICE)
    expect(submitCredit(api, OFFICE, creditInput(original.id))).toMatchObject({ ok: false, code: 'alreadyCredited' })
  })

  it('a replacement can itself be credited (a chain of two)', () => {
    const { procedureId, original } = stageMitchell()
    const first = issue(OFFICE, creditInput(original.id, { replacements: [rebill(150)] }))
    const r1 = first.run.invoiceIds[0]!
    const second = issue(OFFICE, creditInput(r1, { reason: 'Still wrong', replacements: [rebill(120)] }))
    const r2 = second.run.invoiceIds[0]!
    const s = api.getState()
    expect(second.note).toMatchObject({ creditNoteNumber: 'CN-2026-0002', originalInvoiceId: r1 })
    expect(invoiceStanding(s, r1)).toBe('credited')
    expect(rebillOriginFor(s, r2)?.id).toBe(r1)
    expect(liveInvoiceForProcedure(s, procedureId)?.id).toBe(r2)
    expectInBalance()
  })

  it('a credit to another party is accepted and audited', () => {
    const { original } = stageMitchell()
    const { note } = issue(OFFICE, creditInput(original.id, { party: { sameAs: false, personInput: { kind: 'other', name: 'Mei Chen', email: 'mei.chen@example.com' } } }))
    expect(note.counterparty.kind).toBe('payer')
    expect(note.delivery).toMatchObject({ method: 'email', status: 'sent', sends: [{ to: 'mei.chen@example.com' }] })
    expect(actions()).toContain('credit.partyChanged')
    expectInBalance()
  })

  it("a credited invoice leaves the anaesthetist's Outstanding and its rebill joins it (web Accounts reads the ledger)", () => {
    const { original } = stageMitchell()
    const has = (invoiceId: string) => outstandingPayableRowsFor(api.getState(), ANAE.sharma).some((r) => r.invoiceId === invoiceId)
    expect(has(original.id)).toBe(true)
    const { run } = issue(OFFICE, creditInput(original.id, { replacements: [rebill(150)] }))
    const rows = outstandingPayableRowsFor(api.getState(), ANAE.sharma)
    expect(has(original.id)).toBe(false)
    expect(has(run.invoiceIds[0]!)).toBe(true)
    expect(outstandingTotalFor(rows)).toBe(anaesthetistLedgerPosition(api.getState(), ANAE.sharma).owedToThem)
  })

  it('a credit with zero replacements issues the credit only, and the Procedure then has no live invoice', () => {
    const { procedureId, original } = stageMitchell()
    const { run } = issue(OFFICE, creditInput(original.id))
    expect(run.invoiceIds).toEqual([])
    expect(liveInvoiceForProcedure(api.getState(), procedureId)).toBeUndefined()
    expect(raiseRefusal(api.getState(), { role: 'office' }, procedureId)?.code).toBe('notInvoiced')
  })

  it("an anaesthetist's credit on their own Procedure goes through the same review and issue; refused on a colleague's and with a split", () => {
    const { original } = stageMitchell()
    expect(submitCredit(api, souter(), creditInput(original.id))).toMatchObject({ ok: false, code: 'notOwnProcedure', message: CREDIT_MESSAGES.notOwnProcedure })
    expect(submitCredit(api, sharma(), creditInput(original.id, { cause: 'split', replacements: [rebill(50), rebill(50)] }))).toMatchObject({ ok: false, code: 'splitOfficeOnly' })
    const { note, sub } = issue(sharma(), creditInput(original.id, { replacements: [rebill(90)] }))
    expect(note.issuedBy).toEqual({ who: sharma().who, role: 'anaesthetist' })
    expect(api.getState().schedule.procedureEvents[sub.creditEventId]!.addedBy).toMatchObject({ role: 'anaesthetist', anaesthetistId: ANAE.sharma })
    const submitted = api.getState().audit.find((a) => a.action === 'credit.submitted')!
    expect(submitted).toMatchObject({ role: 'anaesthetist', source: 'anaesthetist', entityType: 'creditNote' })
  })

  it('a plain credit and a rebill with a different total are accepted (no equal-total rule outside the split)', () => {
    const { original } = stageMitchell()
    const out = submitCredit(api, OFFICE, creditInput(original.id, { replacements: [rebill(original.subtotal + 123.45)] }))
    expect(out.ok).toBe(true)
  })

  it('refuses without a reason, a prepayment invoice and an AA fee invoice', () => {
    const { original } = stageMitchell()
    expect(submitCredit(api, OFFICE, creditInput(original.id, { reason: '  ' }))).toMatchObject({ ok: false, code: 'reasonRequired' })
    const prepay = Object.values(api.getState().billing.invoices).find((i) => i.bookingId === SEED_PREPAID_BOOKING_ID && i.kind === 'prePayment')!
    // Catch-up Phase 41 (D31): a prepayment invoice is creditable in full, never split.
    expect(submitCredit(api, OFFICE, { ...creditInput(prepay.id), cause: 'split' })).toMatchObject({ ok: false, code: 'kindNotCreditable', message: CREDIT_MESSAGES.prepaymentNoSplit })
    const fee = Object.values(api.getState().billing.aaFeeInvoices)[0]!
    expect(submitCredit(api, OFFICE, creditInput(fee.id))).toMatchObject({ ok: false, code: 'kindNotCreditable', message: CREDIT_MESSAGES.aaFeeNotCreditable })
    expect(creditRefusalFor(api.getState(), { role: 'office' }, original.id)).toBeNull()
  })

  it("passes every 38b pricing refusal on a replacement, naming which", () => {
    const { original } = stageMitchell()
    const out = submitCredit(api, OFFICE, creditInput(original.id, { replacements: [rebill(10), { ...rebill(10), lines: [{ description: '', quantity: 1, unitAmount: 10 }] }] }))
    expect(out).toMatchObject({ ok: false, code: 'descriptionMissing', details: { replacementIndex: 1 } })
  })
})

describe('the split (OQ-77 part 1: the components add up to the credited invoice)', () => {
  it('refuses a mismatch, needs two components, and issues each component as its own invoice', () => {
    const { original } = stageMitchell()
    const a = Math.round(original.subtotal * 60) / 100
    const b = Math.round((original.subtotal - a) * 100) / 100
    expect(submitCredit(api, OFFICE, creditInput(original.id, { cause: 'split', reason: 'Split requested', replacements: [rebill(original.subtotal)] }))).toMatchObject({ ok: false, code: 'splitNeedsTwo' })
    const off = submitCredit(api, OFFICE, creditInput(original.id, { cause: 'split', reason: 'Split requested', replacements: [rebill(a), rebill(b + 0.01)] }))
    expect(off).toMatchObject({ ok: false, code: 'splitTotalMismatch', details: { leftToAllocate: -0.01 } })
    const { run, sub } = issue(OFFICE, creditInput(original.id, { cause: 'split', reason: 'Split requested', replacements: [rebill(a, 'Component one'), rebill(b, 'Component two')] }))
    expect(run.invoiceIds).toHaveLength(2)
    expect(replacementEventsOf(api.getState(), sub.creditEventId).map((e) => e.replaces?.componentIndex)).toEqual([0, 1])
    const subtotals = run.invoiceIds.map((id) => toCents(api.getState().billing.invoices[id]!.subtotal))
    expect(subtotals.reduce((x, y) => x + y, 0)).toBe(toCents(original.subtotal))
    expectInBalance()
  })
})

describe('review as one unit (38b review actions extended)', () => {
  it('a replacement cannot be approved, declined or removed on its own', () => {
    const { original } = stageMitchell()
    const sub = submitCredit(api, OFFICE, creditInput(original.id, { replacements: [rebill(100)] }))
    if (!sub.ok) throw new Error(sub.message)
    const rid = sub.value.replacementEventIds[0]!
    expect(approveProcedureEvent(api, OFFICE, rid)).toMatchObject({ ok: false, code: 'partOfCorrection' })
    expect(declineProcedureEvent(api, OFFICE, rid, 'no')).toMatchObject({ ok: false, code: 'partOfCorrection' })
    expect(removeProcedureEvent(api, OFFICE, rid)).toMatchObject({ ok: false, code: 'partOfCorrection' })
  })

  it('declining the credit declines its replacements; an edit sends the whole correction back to review; removal takes them all', () => {
    const { original } = stageMitchell()
    const sub = submitCredit(api, sharma(), creditInput(original.id, { replacements: [rebill(100)] }))
    if (!sub.ok) throw new Error(sub.message)
    const cid = sub.value.creditEventId
    const rid = sub.value.replacementEventIds[0]!
    expect(declineProcedureEvent(api, OFFICE, cid, '')).toMatchObject({ ok: false, code: 'reasonRequired' })
    expect(declineProcedureEvent(api, OFFICE, cid, 'Wrong party').ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[rid]!.review).toMatchObject({ state: 'declined', reason: 'Wrong party' })
    expect(invoiceStanding(api.getState(), original.id)).toBe('live')

    // The raiser edits one replacement's lines through 38b's update: the whole correction goes back to review.
    expect(updateProcedureEvent(api, sharma(), rid, { lines: [{ description: 'Corrected', quantity: 1, unitAmount: 80 }] }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[cid]!.review.state).toBe('awaitingReview')
    expect(api.getState().schedule.procedureEvents[rid]!.review.state).toBe('awaitingReview')

    // The office rewrites it through the sheet: one replacement kept, one added.
    const out = updateCredit(api, OFFICE, cid, { reason: 'Less work than expected', cause: 'correction', replacements: [{ ...rebill(80), eventId: rid }, rebill(20, 'Second line')] })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.replacementEventIds[0]).toBe(rid)
    expect(replacementEventsOf(api.getState(), cid)).toHaveLength(2)

    expect(removeProcedureEvent(api, OFFICE, cid).ok).toBe(true)
    const events = api.getState().schedule.procedureEvents
    expect([events[cid], events[rid], events[out.value.replacementEventIds[1]!]]).toEqual([undefined, undefined, undefined])
    expect(actions()).toEqual(expect.arrayContaining(['credit.submitted', 'credit.declined', 'credit.updated', 'credit.removed']))
  })

  it('a correction is approved once, a payment while it waits notwithstanding', () => {
    const { original } = stageMitchell()
    const sub = submitCredit(api, OFFICE, creditInput(original.id))
    if (!sub.ok) throw new Error(sub.message)
    pay(original.id, 10, 'p1')
    expect(approveProcedureEvent(api, OFFICE, sub.value.creditEventId).ok).toBe(true)
    expect(approveProcedureEvent(api, OFFICE, sub.value.creditEventId)).toMatchObject({ ok: false, code: 'notAwaitingReview' })
  })
})

describe('the audit (US-13.5.2: every step of a correction is its own entry)', () => {
  it('records each step with its source and role, entityType creditNote for the credit note', () => {
    const { original } = stageMitchell()
    const { note } = issue(OFFICE, creditInput(original.id, { replacements: [rebill(100)] }))
    const audit = api.getState().audit
    for (const action of ['credit.submitted', 'credit.approved', 'credit.issued', 'creditNote.create', 'xero.creditNoteCreated']) {
      expect(audit.find((a) => a.action === action), action).toMatchObject({ entityType: 'creditNote' })
    }
    expect(audit.find((a) => a.action === 'creditNote.create')).toMatchObject({ entityId: note.id, source: 'office', role: 'office' })
    expect(audit.some((a) => a.action === 'creditNote.sent' || a.action === 'creditNote.toPost' || a.action === 'creditNote.notSent')).toBe(true)
    expect(actions()).toEqual(expect.arrayContaining(['invoice.credited', 'ledger.receivableCredited', 'negativeInvoice.create', 'ledger.payableReversed', 'invoice.additionalCreated', 'invoice.rebilled', 'xero.accPayVoided', 'xero.pairCreated']))
    expect(audit.find((a) => a.action === 'xero.creditNoteCreated')).toMatchObject({ source: 'system', role: 'system' })
  })
})

describe('the BCTI count (OQ-60, provisional)', () => {
  it('a credit with one rebill adds exactly one BCTI for the month; a credit with no replacement adds none', () => {
    const { original } = stageMitchell()
    const month = original.raisedAtISO!.slice(0, 7)
    const count = () => bctiRecords(api.getState()).length
    const monthCount = () => bctisFor(bctiRecords(api.getState()), ANAE.sharma, month, { paidOnly: false }).length
    const [all, inMonth] = [count(), monthCount()]
    const first = issue(OFFICE, creditInput(original.id, { replacements: [rebill(100)] }))
    expect([count(), monthCount()]).toEqual([all + 1, inMonth + 1])
    issue(OFFICE, creditInput(first.run.invoiceIds[0]!))
    expect([count(), monthCount()]).toEqual([all + 1, inMonth + 1])
  })
})

describe('determinism', () => {
  it('two stores give the same credit notes, negative invoices and invoices', () => {
    const run = () => {
      api = createAppStore()
      const u = wireBillingRun(api)
      const { original } = stageMitchell()
      pay(original.id, 50, 'd1')
      issue(OFFICE, creditInput(original.id, { replacements: [rebill(77.77)] }))
      u()
      const b = api.getState().billing
      return { creditNotes: b.creditNotes, negativeInvoices: b.negativeInvoices, invoices: b.invoices, xero: api.getState().xero.creditNotes }
    }
    expect(run()).toEqual(run())
  })
})
