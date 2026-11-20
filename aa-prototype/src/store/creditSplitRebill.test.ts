/**
 * Credit notes, session 2 (catch-up Phase 39, work items 9 to 11 and 14):
 * the rebill from a copy of the original's lines, the combined split behind
 * `canSplitCombined`, the anaesthetist's credit and `creditOptionFor`, and the
 * demo trigger bodies (`stageCombinedProcedure`, `stageRefundAfterPayout`,
 * `officeReviewsCredit`), all through the real review step and the next run.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { completeAnswered } from '../test/completeAnswered'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { setProcedureContract } from './contractSelectionActions'
import { bctiRecords, ledgerPositionOf, pairForInvoice } from './ledgerSelectors'
import { approveProcedureEvent, liveInvoiceForProcedure, removeProcedureEvent, runEventInvoicing, updateProcedureEvent } from './procedureEventActions'
import {
  canSplitCombined,
  creditOptionFor,
  creditRefusalFor,
  invoiceStanding,
  rebillReplacementFor,
  replacementsOf,
  splitCombinedProcedure,
  splitTargetFor,
  submitCredit,
  updateCredit,
  type CreditInput,
  type CreditReplacementInput,
} from './creditActions'
import { COMBINED_DEMO, mitchellLiveInvoice, officeReviewsCredit, officeReviewsCreditRefusal, refundAfterPayoutRefusal, stageCombinedProcedure, stageCombinedRefusal, stageRefundAfterPayout, stagedCombined } from './creditDemo'
import { NO_EVENT_AWAITING_ON_BOOKING, officeReviewRefusal, officeReviewsAdditionalInvoice } from './eventDemo'
import { regenerateInvoiceFromLock } from './locks'
import { createBooking } from './bookingActions'
import type { Actor } from './mutate'
import { ANAE, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { PAT_39 } from '../domain/seed/patients'
import { PRICED_ITEM } from '../domain/seed/pricedItems'
import { projectedListId } from '../domain/slots'
import { priceFreeFormInvoice } from '../domain/billing/additionalInvoice'
import { splitTotalCheck } from '../domain/billing/creditNote'
import { CREDIT_DEMO_COPY, CREDIT_MESSAGES, SPLIT_MESSAGES } from '../shared/procedureEventCopy'
import type { Invoice } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SHARMA_TUE14 = projectedListId(ANAE.sharma, '2026-07-14', 'AM')

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
const souter = () => ownerActor(ANAE.souter)
const delaney = () => ownerActor(ANAE.delaney)

function authorise(listId: string) {
  const owner = ownerActor(api.getState().schedule.lists[listId]!.anaesthetistId!)
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
  if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') {
    const out = submitList(api, owner, listId)
    if (!out.ok) throw new Error(out.message)
  }
  const out = authoriseList(api, OFFICE, listId)
  if (!out.ok) throw new Error(out.message)
}

/** Sarah Mitchell's original, as `stage-post-op` leaves it. */
function stageMitchell(): Invoice {
  authorise(SHARMA_TUE14)
  return mitchellLiveInvoice(api.getState())!
}

/** The staged Merivale combination, as the trigger leaves it. */
function stageCombined() {
  const out = stageCombinedProcedure(api)
  if (!out.ok) throw new Error(out.message)
  return { ...out.value, original: api.getState().billing.invoices[out.value.invoiceId]! }
}

const component = (unitAmount: number, description: string): CreditReplacementInput => ({ occurredOnISO: '2026-07-21', party: { sameAs: true }, lines: [{ description, quantity: 1, unitAmount }] })

const creditInput = (invoiceId: string, over: Partial<CreditInput> = {}): CreditInput => ({ invoiceId, reason: 'Wrong amount', cause: 'correction', replacements: [], ...over })

/** Approve and run: the credit issued. */
function approveAndRun(creditEventId: string) {
  const appr = approveProcedureEvent(api, OFFICE, creditEventId)
  if (!appr.ok) throw new Error(appr.message)
  const run = runEventInvoicing(api, OFFICE)
  if (!run.ok) throw new Error(run.message)
  return { run: run.value, note: api.getState().billing.creditNotes[run.value.creditNoteIds[0]!]! }
}

function issue(actor: Actor, input: CreditInput) {
  const sub = submitCredit(api, actor, input)
  if (!sub.ok) throw new Error(sub.message)
  return { sub: sub.value, ...approveAndRun(sub.value.creditEventId) }
}

function expectInBalance() {
  const pos = ledgerPositionOf(api.getState())
  expect(pos.imbalance).toBe(0)
  expect(pos.checks).toEqual([])
}

function linesOf(invoiceId: string) {
  return Object.values(api.getState().billing.invoiceLines)
    .filter((l) => l.invoiceId === invoiceId)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
}

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

// ---------------------------------------------------------------------------
// Work item 9: the rebill from a copy
// ---------------------------------------------------------------------------

describe('the rebill from a copy of the original lines (US-08.6.6)', () => {
  it('an unedited copy rebills to the same total, and Regenerate reports identical on the rebill', () => {
    const original = stageMitchell()
    const copy = rebillReplacementFor(api.getState(), original.id)!
    expect(copy.party).toEqual({ sameAs: true })
    expect(copy.occurredOnISO).toBe('2026-07-21')
    const { run } = issue(OFFICE, creditInput(original.id, { reason: 'Wrong amount', replacements: [copy] }))
    const rebill = api.getState().billing.invoices[run.invoiceIds[0]!]!
    expect(rebill).toMatchObject({ kind: 'additional', subtotal: original.subtotal, gst: original.gst, total: original.total, counterparty: original.counterparty })
    expect(linesOf(rebill.id).map((l) => [l.description, l.amount])).toEqual(linesOf(original.id).map((l) => [l.description, l.amount]))
    expect(replacementsOf(api.getState(), original.id).map((i) => i.id)).toEqual([rebill.id])
    const regen = regenerateInvoiceFromLock(api.getState(), rebill.id)
    expect(regen.ok && regen.comparison.identical).toBe(true)
    expectInBalance()
  })

  it('a corrected line changes only that line', () => {
    // Dr Souter's three-procedure Booking on Mon 13 Jul AM bills one invoice with a line per Procedure.
    const listId = projectedListId(ANAE.souter, '2026-07-13', 'AM')
    authorise(listId)
    const original = Object.values(api.getState().billing.invoices).find((i) => i.kind === 'standard' && i.bookingId === 'BK0184')!
    const lines = linesOf(original.id)
    expect(lines.length).toBeGreaterThan(1)
    const copy = rebillReplacementFor(api.getState(), original.id)!
    const corrected = { ...copy, lines: copy.lines.map((l, i) => (i === 1 ? { ...l, unitAmount: l.unitAmount - 20 } : l)) }
    const { run } = issue(OFFICE, creditInput(original.id, { replacements: [corrected] }))
    const rebill = linesOf(run.invoiceIds[0]!)
    expect(rebill.map((l) => l.description)).toEqual(lines.map((l) => l.description))
    rebill.forEach((l, i) => expect(l.amount).toBe(i === 1 ? Math.round((lines[i]!.amount - 20) * 100) / 100 : lines[i]!.amount))
    expect(api.getState().billing.invoices[run.invoiceIds[0]!]!.subtotal).toBe(Math.round((original.subtotal - 20) * 100) / 100)
    expectInBalance()
  })

  it('a party change re-addresses the rebill', () => {
    const original = stageMitchell()
    const copy = rebillReplacementFor(api.getState(), original.id)!
    const moved: CreditReplacementInput = { ...copy, party: { sameAs: false, personInput: { kind: 'other', name: 'Mei Chen', email: 'mei.chen@example.com' } } }
    const { run } = issue(OFFICE, creditInput(original.id, { reason: 'Wrong billable party', replacements: [moved] }))
    const rebill = api.getState().billing.invoices[run.invoiceIds[0]!]!
    expect(rebill.counterparty.kind).toBe('payer')
    expect(rebill.counterparty).not.toEqual(original.counterparty)
    expect(rebill.total).toBe(original.total)
    expect(rebill.delivery).toMatchObject({ status: 'sent', sends: [{ to: 'mei.chen@example.com' }] })
  })

  it('copies only the lines: the draft prices through priceFreeFormInvoice to the original total', () => {
    const { original } = stageCombined()
    const copy = rebillReplacementFor(api.getState(), original.id)!
    const priced = priceFreeFormInvoice(copy.lines)
    expect(priced.kind === 'priced' && priced.total).toBe(original.total)
    expect(rebillReplacementFor(api.getState(), 'NOPE')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Work item 10: split a combined Procedure
// ---------------------------------------------------------------------------

describe('the combined split (US-08.6.4, OQ-77)', () => {
  it('a three-way split equal to the credit raises three linked replacements with their own pairs, credits the original in full and keeps the ledger in balance', () => {
    const { bookingId, procedureId, original } = stageCombined()
    expect(original.subtotal).toBe(3700)
    expect(canSplitCombined(api.getState(), procedureId, { role: 'office' })).toBeNull()
    expect(splitTargetFor(api.getState(), procedureId)?.id).toBe(original.id)
    const before = frozen(bookingId, original.id)
    const bctis = bctiRecords(api.getState()).length
    const sub = splitCombinedProcedure(api, OFFICE, {
      procedureId,
      reason: 'Split requested',
      replacements: [component(2000, 'Facelift'), component(1000, 'Upper blepharoplasty'), component(700, 'Fat grafting')],
    })
    if (!sub.ok) throw new Error(sub.message)
    expect(invoiceStanding(api.getState(), original.id)).toBe('creditPending')
    const { run, note } = approveAndRun(sub.value.creditEventId)
    expect(run.invoiceIds).toHaveLength(3)
    const parts = run.invoiceIds.map((id) => api.getState().billing.invoices[id]!)
    expect(parts.map((p) => p.subtotal)).toEqual([2000, 1000, 700])
    for (const p of parts) {
      expect(p.kind).toBe('additional')
      expect(p.lineage).toContainEqual({ role: 'rebillOf', invoiceId: original.id })
      expect(pairForInvoice(api.getState(), p.id)).toBeDefined()
    }
    expect(new Set(parts.map((p) => pairForInvoice(api.getState(), p.id)!.id)).size).toBe(3)
    expect(note).toMatchObject({ cause: 'split', total: original.total, replacementInvoiceIds: run.invoiceIds })
    expect(api.getState().billing.negativeInvoices[note.negativeInvoiceId!]).toMatchObject({ amount: original.total, status: 'offset' })
    expect(invoiceStanding(api.getState(), original.id)).toBe('credited')
    expect(bctiRecords(api.getState()).length).toBe(bctis + 3)
    expectInBalance()
    expect(frozen(bookingId, original.id)).toEqual(before)
    const split = api.getState().audit.find((a) => a.action === 'invoice.split')!
    expect(split).toMatchObject({ entityType: 'invoice', entityId: original.id })
    expect(split.after).toMatchObject({ componentCount: 3, creditedSubtotal: 3700, creditedTotal: original.total, componentSubtotals: [2000, 1000, 700], componentNumbers: parts.map((p) => p.invoiceNumber) })
  })

  it('refuses components a cent above or below the credit, and accepts per-invoice GST rounding', () => {
    const { procedureId, original } = stageCombined()
    const input = (a: number, b: number) => ({ procedureId, reason: 'Split requested', replacements: [component(a, 'Facelift'), component(b, 'Add ons')] })
    expect(splitCombinedProcedure(api, OFFICE, input(2000, 1700.01))).toMatchObject({ ok: false, code: 'splitTotalMismatch' })
    expect(splitCombinedProcedure(api, OFFICE, input(2000, 1699.99))).toMatchObject({ ok: false, code: 'splitTotalMismatch' })
    // 1001.10 + 2698.90: GST rounded on each invoice comes to a cent more than the credited GST.
    const check = splitTotalCheck(original, input(1001.1, 2698.9).replacements.map((r) => r.lines))
    expect(check).toMatchObject({ ok: true, leftToAllocate: 0, gstRounding: 0.01 })
    const sub = splitCombinedProcedure(api, OFFICE, input(1001.1, 2698.9))
    expect(sub.ok).toBe(true)
    if (!sub.ok) return
    const { run } = approveAndRun(sub.value.creditEventId)
    const totals = run.invoiceIds.map((id) => api.getState().billing.invoices[id]!.total)
    expect(Math.round(totals.reduce((s, t) => s + t, 0) * 100) / 100).toBe(Math.round((original.total + 0.01) * 100) / 100)
    expectInBalance()
  })

  it('a two-way split', () => {
    const { procedureId } = stageCombined()
    const sub = splitCombinedProcedure(api, OFFICE, { procedureId, reason: 'Split requested', replacements: [component(3000, 'Facelift'), component(700, 'Add ons')] })
    if (!sub.ok) throw new Error(sub.message)
    expect(approveAndRun(sub.value.creditEventId).run.invoiceIds).toHaveLength(2)
    expectInBalance()
  })

  it('each refusal: office only, not yet invoiced, a prepaid Procedure, fewer than two, pending and credited', () => {
    // Before authorise the split is a normal admin edit: no path here, and a price edit raises no credit.
    const made = createBooking(api, OFFICE, COMBINED_DEMO.listId, {
      patient: { name: 'Lorraine Petrie', dobISO: '1964-08-19', nhi: 'ZBN1004' },
      sourceText: { text: 'Facelift', source: 'email' },
      governingContractId: PRICED_ITEM.merFaceLift2,
    })
    if (!made.ok) throw new Error(made.message)
    expect(made.value.patientId).toBe(PAT_39.combined)
    const draftProcedure = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === made.value.bookingId)!.id
    expect(canSplitCombined(api.getState(), draftProcedure, { role: 'office' })).toEqual({ code: 'notYetInvoiced', message: SPLIT_MESSAGES.notYetInvoiced })
    expect(setProcedureContract(api, OFFICE, draftProcedure, PRICED_ITEM.merFaceLift1).ok).toBe(true)
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24).
    expect(Object.values(api.getState().schedule.procedureEvents).filter((e) => e.kind === 'credit' && !e.id.startsWith('HS'))).toEqual([])
    expect(stagedCombined(api.getState())?.bookingId).toBe(made.value.bookingId)
    expect(stageCombinedRefusal(api.getState())).toBe(CREDIT_DEMO_COPY.alreadyStaged)

    // A prepaid Procedure's only invoice is its prepayment invoice.
    const prepaid = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === SEED_PREPAID_BOOKING_ID && api.getState().billing.invoices['INV0001']!.procedureIds!.includes(p.id))!
    expect(canSplitCombined(api.getState(), prepaid.id, { role: 'office' })).toEqual({ code: 'prepaidNotSplittable', message: SPLIT_MESSAGES.prepaidNotSplittable })

    const original = stageMitchell()
    const procedureId = original.procedureIds![0]!
    expect(canSplitCombined(api.getState(), procedureId, { role: 'anaesthetist', anaesthetistId: ANAE.sharma })).toEqual({ code: 'splitOfficeOnly', message: CREDIT_MESSAGES.splitOfficeOnly })
    expect(splitCombinedProcedure(api, ownerActor(ANAE.sharma), { procedureId, reason: 'Split', replacements: [component(100, 'a'), component(107, 'b')] })).toMatchObject({ ok: false, code: 'splitOfficeOnly' })
    expect(splitCombinedProcedure(api, OFFICE, { procedureId, reason: 'Split', replacements: [component(original.subtotal, 'a')] })).toMatchObject({ ok: false, code: 'splitNeedsTwo' })
    const sub = splitCombinedProcedure(api, OFFICE, { procedureId, reason: 'Split', replacements: [component(100, 'a'), component(original.subtotal - 100, 'b')] })
    if (!sub.ok) throw new Error(sub.message)
    expect(canSplitCombined(api.getState(), procedureId, { role: 'office' })).toMatchObject({ code: 'correctionPending' })
    approveAndRun(sub.value.creditEventId)
    // Once split, the credited invoice's live components stand in for it (the `rebillOf` lineage, Phase 39 review): the target is the first one.
    const components = replacementsOf(api.getState(), original.id)
    expect(splitTargetFor(api.getState(), procedureId)?.id).toBe(components[0]!.id)
    expect(canSplitCombined(api.getState(), procedureId, { role: 'office' })).toBeNull()
    expect(creditRefusalFor(api.getState(), { role: 'office' }, original.id, 'split', { procedureId })).toMatchObject({ code: 'alreadyCredited' })
  })

  it('is deterministic: two stores give the same split', () => {
    const runOnce = () => {
      const { procedureId } = stageCombined()
      const sub = splitCombinedProcedure(api, OFFICE, { procedureId, reason: 'Split requested', replacements: [component(2000, 'a'), component(1700, 'b')] })
      if (!sub.ok) throw new Error(sub.message)
      approveAndRun(sub.value.creditEventId)
      const s = api.getState()
      return structuredClone({ invoices: s.billing.invoices, creditNotes: s.billing.creditNotes, negatives: s.billing.negativeInvoices })
    }
    const first = runOnce()
    unwire()
    api = createAppStore()
    unwire = wireBillingRun(api)
    expect(runOnce()).toEqual(first)
  })
})

// ---------------------------------------------------------------------------
// Work item 11: the anaesthetist's credit note (Dr Souter's David Chen, HBK03 / HP03)
// ---------------------------------------------------------------------------

describe("the anaesthetist's credit note (US-08.6.5)", () => {
  it('creditOptionFor: enabled on her own invoiced Procedure, hidden on a colleague, disabled while pending and once credited', () => {
    expect(creditOptionFor(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.souter }, 'HP03')).toEqual({ kind: 'enabled', invoiceId: 'HINV03', invoiceIds: ['HINV03'] })
    expect(creditOptionFor(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.sharma }, 'HP03')).toEqual({ kind: 'hidden' })
    expect(creditOptionFor(api.getState(), { role: 'office' }, 'HP03')).toEqual({ kind: 'enabled', invoiceId: 'HINV03', invoiceIds: ['HINV03'] })
    const sub = submitCredit(api, souter(), creditInput('HINV03', { reason: 'Less work than expected' }))
    if (!sub.ok) throw new Error(sub.message)
    expect(creditOptionFor(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.souter }, 'HP03')).toEqual({ kind: 'disabled', invoiceId: 'HINV03', reason: CREDIT_MESSAGES.correctionPending })
    approveAndRun(sub.value.creditEventId)
    expect(creditOptionFor(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.souter }, 'HP03')).toEqual({ kind: 'disabled', invoiceId: 'HINV03', reason: CREDIT_MESSAGES.alreadyCredited })
  })

  it('creditOptionFor: hidden with the caption on a prepaid Procedure whose only invoice is its prepayment invoice, hidden before invoicing', () => {
    const prepaid = api.getState().billing.invoices['INV0001']!.procedureIds![0]!
    expect(creditOptionFor(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.souter }, prepaid)).toEqual({ kind: 'hidden', caption: CREDIT_MESSAGES.prepaymentNotCreditable })
    const unbilled = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === 'BK0184')!.id
    expect(creditOptionFor(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.souter }, unbilled)).toEqual({ kind: 'hidden' })
  })

  it('her credit with a new invoice for the work done, through review and the run: the credit note, the negative invoice offset against her unpaid payable, the ledger in balance', () => {
    const original = api.getState().billing.invoices['HINV03']!
    const { run, note } = issue(souter(), creditInput('HINV03', { reason: 'Less work than expected', replacements: [component(400, 'Hip hemiarthroplasty, shorter case')] }))
    expect(note).toMatchObject({ originalInvoiceId: 'HINV03', total: original.total, issuedBy: { role: 'anaesthetist' } })
    expect(api.getState().billing.negativeInvoices[note.negativeInvoiceId!]).toMatchObject({ anaesthetistId: ANAE.souter, amount: original.total, offsetAmount: original.total, recoveryDue: 0, status: 'offset' })
    expect(api.getState().billing.invoices[run.invoiceIds[0]!]).toMatchObject({ subtotal: 400, kind: 'additional' })
    expect(liveInvoiceForProcedure(api.getState(), 'HP03')?.id).toBe(run.invoiceIds[0])
    expectInBalance()
  })

  it("refused on a colleague's Procedure, for a prepayment invoice and with cause split", () => {
    expect(submitCredit(api, delaney(), creditInput('HINV03'))).toMatchObject({ ok: false, code: 'notOwnProcedure', message: 'You can only credit invoices for your own procedures.' })
    expect(submitCredit(api, souter(), creditInput('INV0001'))).toMatchObject({ ok: false, code: 'kindNotCreditable', message: CREDIT_MESSAGES.prepaymentNotCreditable })
    expect(submitCredit(api, souter(), creditInput('HINV03', { cause: 'split', replacements: [component(200, 'a'), component(252.61, 'b')] }))).toMatchObject({ ok: false, code: 'splitOfficeOnly' })
    expect(creditRefusalFor(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.souter }, 'HINV03')).toBeNull()
  })

  it('she edits and removes her credit while it awaits review, as one unit', () => {
    const sub = submitCredit(api, souter(), creditInput('HINV03', { reason: 'Less work than expected', replacements: [component(400, 'Shorter case')] }))
    if (!sub.ok) throw new Error(sub.message)
    const [rid] = sub.value.replacementEventIds
    expect(updateProcedureEvent(api, souter(), rid!, { lines: [{ description: 'Shorter case', quantity: 1, unitAmount: 380 }] }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[rid!]!.detail).toMatchObject({ lines: [{ unitAmount: 380 }] })
    expect(updateCredit(api, souter(), sub.value.creditEventId, { reason: 'Paid twice', cause: 'correction', replacements: [] }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[rid!]).toBeUndefined()
    expect(removeProcedureEvent(api, delaney(), sub.value.creditEventId)).toMatchObject({ ok: false, code: 'notYours' })
    expect(removeProcedureEvent(api, souter(), sub.value.creditEventId).ok).toBe(true)
    expect(invoiceStanding(api.getState(), 'HINV03')).toBe('live')
  })
})

// ---------------------------------------------------------------------------
// Work item 14: the demo trigger bodies
// ---------------------------------------------------------------------------

describe('the demo trigger bodies', () => {
  it('stageCombinedProcedure: a billed, post-paid Merivale combination to the patient, then "Already staged"', () => {
    expect(stageCombinedRefusal(api.getState())).toBeNull()
    const { bookingId, procedureId, original } = stageCombined()
    const s = api.getState()
    expect(s.schedule.bookings[bookingId]).toMatchObject({ listId: COMBINED_DEMO.listId, patientId: PAT_39.combined, completed: true })
    expect(s.schedule.procedures[procedureId]).toMatchObject({ governingContractId: PRICED_ITEM.merFaceLift2, payer: { kind: 'patient' } })
    expect(s.schedule.lists[COMBINED_DEMO.listId]!.state).toBe('AUTHORISED')
    expect(original).toMatchObject({ kind: 'standard', counterparty: { kind: 'patient', id: PAT_39.combined }, subtotal: 3700, total: 4255 })
    expect(pairForInvoice(s, original.id)?.receivable.xeroAccRecId).toBeDefined()
    expect(stageCombinedRefusal(s)).toBe(CREDIT_DEMO_COPY.alreadyStaged)
    expect(stageCombinedProcedure(api)).toMatchObject({ ok: false, message: CREDIT_DEMO_COPY.alreadyStaged })
  })

  it('stageRefundAfterPayout: paid in full and paid out, so the credit leaves the whole amount to net', () => {
    expect(refundAfterPayoutRefusal(api.getState(), undefined)).toBe(CREDIT_DEMO_COPY.stagePostOpFirst)
    const original = stageMitchell()
    expect(refundAfterPayoutRefusal(api.getState(), undefined)).toBeNull()
    expect(refundAfterPayoutRefusal(api.getState(), 'INV0001')).toBe(CREDIT_DEMO_COPY.kindNotHere)
    const out = stageRefundAfterPayout(api, undefined)
    expect(out).toMatchObject({ ok: true, value: { invoiceId: original.id, payee: 'Dr Sharma', paidOut: original.total } })
    const pair = pairForInvoice(api.getState(), original.id)!
    expect([pair.receivable.receivedAmount, pair.payable!.disbursedAmount]).toEqual([original.total, original.total])
    expect(refundAfterPayoutRefusal(api.getState(), original.id)).toBe(CREDIT_DEMO_COPY.alreadyPaidOut)
    const { note } = issue(OFFICE, creditInput(original.id, { replacements: [rebillReplacementFor(api.getState(), original.id)!] }))
    expect(api.getState().billing.negativeInvoices[note.negativeInvoiceId!]).toMatchObject({ status: 'toNet', recoveryDue: original.total, offsetAmount: 0 })
    expect(refundAfterPayoutRefusal(api.getState(), original.id)).toBe(CREDIT_DEMO_COPY.invoiceCredited)
    expectInBalance()
  })

  it('stageRefundAfterPayout: refused while a credit waits for review', () => {
    const original = stageMitchell()
    expect(submitCredit(api, OFFICE, creditInput(original.id)).ok).toBe(true)
    expect(refundAfterPayoutRefusal(api.getState(), original.id)).toBe(CREDIT_DEMO_COPY.creditWaiting)
  })

  it("officeReviewsCredit: approves the oldest credit on the Booking with its replacements and issues it; 38b's stand-in skips a credit and a replacement", () => {
    expect(officeReviewsCreditRefusal(api.getState(), 'HBK03')).toBe(CREDIT_DEMO_COPY.noCreditAwaiting)
    const sub = submitCredit(api, souter(), creditInput('HINV03', { reason: 'Less work than expected', replacements: [component(400, 'Shorter case')] }))
    if (!sub.ok) throw new Error(sub.message)
    expect(officeReviewsCreditRefusal(api.getState(), 'HBK03')).toBeNull()
    // 38b's stand-in reviews the seeded additional invoice (EV0001), never the credit or its replacement.
    const additional = officeReviewsAdditionalInvoice(api, 'HBK03')
    expect(additional.ok).toBe(true)
    expect(api.getState().schedule.procedureEvents['EV0001']!.invoiceId).toBeDefined()
    expect(officeReviewRefusal(api.getState(), 'HBK03')).toBe(NO_EVENT_AWAITING_ON_BOOKING)
    const out = officeReviewsCredit(api, 'HBK03')
    expect(out).toMatchObject({ ok: true, value: { creditNoteNumber: 'CN-2026-0001' } })
    expect(invoiceStanding(api.getState(), 'HINV03')).toBe('credited')
    expect(replacementsOf(api.getState(), 'HINV03')).toHaveLength(1)
    expect(officeReviewsCreditRefusal(api.getState(), 'HBK03')).toBe(CREDIT_DEMO_COPY.noCreditAwaiting)
    expectInBalance()
  })
})
