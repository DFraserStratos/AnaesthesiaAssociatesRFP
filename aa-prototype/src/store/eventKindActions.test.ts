/**
 * Pre-op, post-op and billing events in the store (catch-up Phase 39b;
 * US-03.7.1, US-03.7.2, US-05.5.2, DM-46): add, edit and remove until
 * reviewed, the one review step with its price frozen, the List's run
 * bundling the same party's events as dated lines, the next run's own
 * invoice, the BCTI feed, the Contract event fees and Regenerate.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { completeAnswered } from '../test/completeAnswered'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, cancelBooking, submitList } from './lifecycle'
import { runBillingForList, wireBillingRun } from './billingRun'
import { bctiRecords, pairForInvoice } from './ledgerSelectors'
import {
  approveProcedureEvent,
  declineProcedureEvent,
  eventsAwaitingReview,
  liveInvoiceForProcedure,
  removeProcedureEvent,
  runEventInvoicing,
  updateProcedureEvent,
} from './procedureEventActions'
import { addBillingEvent, addPrePostOpEvent, bundledEventsOf, eventLinesFor, eventPriceNow, type PrePostOpEventInput } from './eventKindActions'
import { addContractEventFee, editContractEventFee, removeContractEventFee } from './contractEventFeeActions'
import { regenerateInvoiceFromLock } from './locks'
import { bookingsForList } from './selectors'
import { editContract } from './contractActions'
import type { List } from '../domain/types'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const PROC = 'P0012'
const BOOKING = 'BK0012'
const LIST = 'L-25490-2026-07-20-AM'
const OWNER_ID = '25490'
const DOYLE_PROC = 'P0029'
const DOYLE_LIST = 'L-43015-2026-07-14-AM'

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

function actorFor(anaesthetistId: string): Actor {
  return { who: api.getState().masters.anaesthetists[anaesthetistId]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }
}
const owner = () => actorFor(OWNER_ID)
const colleague = () => actorFor('34821')

function authorise(listId: string) {
  const anaesthetistId = api.getState().schedule.lists[listId]!.anaesthetistId!
  const who = actorFor(anaesthetistId)
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, who, b.id)
  if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') {
    const out = submitList(api, who, listId)
    if (!out.ok) throw new Error(out.message)
  }
  const out = authoriseList(api, OFFICE, listId)
  if (!out.ok) throw new Error(out.message)
}

const ward = (patch: Partial<PrePostOpEventInput> = {}): PrePostOpEventInput => ({
  kind: 'postOp',
  type: 'postOpWardReview',
  occurredOnISO: '2026-07-21',
  startTime: '08:00',
  recording: { kind: 'time', minutes: 45 },
  party: { sameAs: true },
  ...patch,
})
const accPreOp = (): PrePostOpEventInput => ({
  kind: 'preOp',
  type: 'accPreOpAssessment',
  code: 'CS250',
  occurredOnISO: '2026-07-13',
  recording: { kind: 'fixedFee', source: 'typed', amount: 60 },
  party: { sameAs: true },
})

function add(input: PrePostOpEventInput, actor: Actor = owner(), procedureId = PROC): string {
  const out = addPrePostOpEvent(api, actor, procedureId, input)
  if (!out.ok) throw new Error(out.message)
  return out.value.eventId
}
function approve(eventId: string, officePrice?: { amount: number; reason: string }) {
  const out = approveProcedureEvent(api, OFFICE, eventId, officePrice !== undefined ? { officePrice } : {})
  if (!out.ok) throw new Error(out.message)
}
const immutable = () => {
  const s = api.getState()
  return { booking: s.schedule.bookings[BOOKING], procedures: Object.values(s.schedule.procedures).filter((p) => p.bookingId === BOOKING), lock: s.billing.locks[BOOKING] }
}

describe('adding (US-03.7.1 AC 1, 5; the guard)', () => {
  it('the owner and the office add events on a SUBMITTED List; the Booking, Procedures and lock are untouched', () => {
    const before = structuredClone(immutable())
    const a = add(ward())
    const b = add(accPreOp(), OFFICE)
    const c = addBillingEvent(api, owner(), PROC, { direction: 'charge', description: 'Nerve catheter', amount: 180, occurredOnISO: '2026-07-21', party: { sameAs: true } })
    expect(c.ok).toBe(true)
    expect(immutable()).toEqual(before)
    const s = api.getState()
    expect(s.schedule.procedureEvents[a]).toMatchObject({ kind: 'postOp', startTime: '08:00', billable: true, review: { state: 'awaitingReview' }, detail: { type: 'postOpWardReview', recording: { kind: 'time', minutes: 45 } } })
    expect(s.schedule.procedureEvents[b]).toMatchObject({ kind: 'preOp', addedBy: { role: 'office' }, detail: { code: 'CS250' } })
    expect(eventsAwaitingReview(s).map((e) => e.id)).toEqual(expect.arrayContaining([a, b]))
    const audit = s.audit.filter((e) => e.entityId === a)
    expect(audit[0]).toMatchObject({ action: 'procedureEvent.add', role: 'anaesthetist' })
  })

  it('refuses another anaesthetist, a cancelled Booking, a date out of the rule, and a modifier-free shape only', () => {
    expect(addPrePostOpEvent(api, colleague(), PROC, ward())).toMatchObject({ ok: false, code: 'notOwnProcedure' })
    expect(addPrePostOpEvent(api, owner(), PROC, ward({ occurredOnISO: '2026-07-19' }))).toMatchObject({ ok: false, code: 'dateBeforeProcedure', message: 'A post-op event cannot be dated before the procedure.' })
    expect(addPrePostOpEvent(api, owner(), PROC, ward({ occurredOnISO: '2026-07-22' }))).toMatchObject({ ok: false, code: 'dateInFuture' })
    expect(addPrePostOpEvent(api, owner(), PROC, { ...accPreOp(), occurredOnISO: '2026-07-21' })).toMatchObject({ ok: false, code: 'dateAfterProcedure' })
    expect(addPrePostOpEvent(api, owner(), PROC, ward({ party: { sameAs: false, party: { kind: 'party', id: ' ' } } }))).toMatchObject({ ok: false, code: 'partyMissing' })
    expect(cancelBooking(api, OFFICE, BOOKING, 'Patient unwell').ok).toBe(true)
    expect(addPrePostOpEvent(api, owner(), PROC, ward())).toMatchObject({ ok: false, code: 'bookingCancelled' })
  })

  it('refuses on a Draft List with no anaesthetist', () => {
    // A Draft List's shape (catch-up Phase 31): no anaesthetist. Set directly: only the guard is under test.
    api.setState((s) => {
      const { anaesthetistId: _a, ...rest } = s.schedule.lists[LIST]!
      return { schedule: { ...s.schedule, lists: { ...s.schedule.lists, [LIST]: rest as unknown as List } } }
    })
    expect(addPrePostOpEvent(api, OFFICE, PROC, ward())).toMatchObject({ ok: false, code: 'listUnassigned', message: 'Assign the List first.' })
  })

  it('an event dated on another day is on no List', () => {
    const before = bookingsForList(api.getState(), 'L-25490-2026-07-21-AM').map((b) => b.id)
    add(ward())
    expect(bookingsForList(api.getState(), 'L-25490-2026-07-21-AM').map((b) => b.id)).toEqual(before)
    expect(bookingsForList(api.getState(), LIST).filter((b) => b.id === BOOKING)).toHaveLength(1)
  })
})

describe('edit and remove until reviewed', () => {
  it('the adder edits and removes while awaiting review; an approved event is locked', () => {
    const id = add(ward())
    expect(updateProcedureEvent(api, owner(), id, { detail: { kind: 'postOp', type: 'hduReview', recording: { kind: 'time', minutes: 30 } } }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[id]!.detail).toMatchObject({ type: 'hduReview' })
    approve(id)
    expect(updateProcedureEvent(api, owner(), id, { occurredOnISO: '2026-07-20' })).toMatchObject({ ok: false, code: 'approved' })
    expect(removeProcedureEvent(api, owner(), id)).toMatchObject({ ok: false, code: 'approved' })
    const other = add(ward())
    expect(removeProcedureEvent(api, owner(), other).ok).toBe(true)
    expect(api.getState().audit.find((e) => e.entityId === other && e.action === 'procedureEvent.remove')).toBeDefined()
  })

  it('editing a declined event sends it back to review', () => {
    const id = add(ward())
    expect(declineProcedureEvent(api, OFFICE, id, 'Wrong day').ok).toBe(true)
    expect(updateProcedureEvent(api, owner(), id, { occurredOnISO: '2026-07-20' }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[id]!.review.state).toBe('awaitingReview')
  })

  it('an un-ticked event is never reviewed or invoiced, and stays editable', () => {
    const id = add(ward({ billable: false }))
    expect(eventsAwaitingReview(api.getState()).some((e) => e.id === id)).toBe(false)
    authorise(LIST)
    expect(api.getState().schedule.procedureEvents[id]!.invoiceId).toBeUndefined()
    expect(runEventInvoicing(api, OFFICE)).toMatchObject({ ok: false })
    expect(updateProcedureEvent(api, owner(), id, { startTime: '09:00' }).ok).toBe(true)
  })
})

describe('review, then the run (OQ-121, D69)', () => {
  it('prices at approval from the Contract as it stands, and freezes it', () => {
    const id = add(ward())
    expect(eventPriceNow(api.getState(), api.getState().schedule.procedureEvents[id]!)).toMatchObject({ kind: 'priced', pricing: { amount: 75, timeUnits: 3, rate: 25 } })
    // An edit to the Contract's rate before approval reaches the event.
    expect(editContract(api, OFFICE, 'CT-STG-ACC', { pricing: { kind: 'rvgContractRate', unitRate: 30 } }).ok).toBe(true)
    approve(id)
    expect(api.getState().schedule.procedureEvents[id]!.pricing).toMatchObject({ basis: 'time', amount: 90, contractId: 'CT-STG-ACC', pricingKind: 'rvgContractRate' })
    // After approval it no longer moves.
    expect(editContract(api, OFFICE, 'CT-STG-ACC', { pricing: { kind: 'rvgContractRate', unitRate: 40 } }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[id]!.pricing?.amount).toBe(90)
  })

  it("bundles the same party's events onto the Procedure's invoice in its List's run, as dated lines", () => {
    const baseline = createAppStore()
    const unwireB = wireBillingRun(baseline)
    const prev = api
    api = baseline
    authorise(LIST)
    const plain = liveInvoiceForProcedure(baseline.getState(), PROC)!
    unwireB()
    api = prev

    const pre = add(accPreOp())
    const w = add(ward())
    const charge = addBillingEvent(api, owner(), PROC, { direction: 'charge', description: 'Nerve catheter', amount: 180, occurredOnISO: '2026-07-21', party: { sameAs: true } })
    const credit = addBillingEvent(api, owner(), PROC, { direction: 'credit', description: 'Goodwill adjustment', amount: 40, occurredOnISO: '2026-07-21', party: { sameAs: true } })
    if (!charge.ok || !credit.ok) throw new Error('add')
    for (const id of [pre, w, charge.value.eventId, credit.value.eventId]) approve(id)
    const bctis = bctiRecords(api.getState()).length
    authorise(LIST)
    const s = api.getState()
    const inv = liveInvoiceForProcedure(s, PROC)!
    expect(inv.subtotal).toBeCloseTo(plain.subtotal + 60 + 75 + 180 - 40, 2)
    const lines = eventLinesFor(s, inv.id)
    expect(lines.map((l) => [l.description, l.amount])).toEqual([
      ['Pre-op event · ACC pre-op assessment · CS250 · 13 Jul 2026 · Fixed fee', 60],
      ['Post-op event · Post-op ward review · 21 Jul 2026 · 45 min', 75],
      ['Billing event · Nerve catheter · 21 Jul 2026', 180],
      ['Credit · Goodwill adjustment · 21 Jul 2026', -40],
    ])
    expect(lines.every((l) => l.serviceDateISO !== undefined && l.eventId !== undefined)).toBe(true)
    for (const id of [pre, w, charge.value.eventId, credit.value.eventId]) {
      const e = s.schedule.procedureEvents[id]!
      expect(e.invoiceId).toBe(inv.id)
      expect(lines.some((l) => l.id === e.invoiceLineId)).toBe(true)
    }
    // The pair and its one payable leg include the lines; no new invoice, pair or BCTI beyond the List's own.
    expect(pairForInvoice(s, inv.id)?.receivable.amount).toBeCloseTo(inv.total, 2)
    expect(Object.values(s.billing.invoices).filter((i) => i.bookingId === BOOKING)).toHaveLength(1)
    expect(bctiRecords(s).length - bctis).toBe(Object.values(s.billing.invoices).filter((i) => i.bookingId !== undefined && s.schedule.bookings[i.bookingId]?.listId === LIST && i.noCharge !== true).length)
    // Nothing is left for the next run; the run twice raises nothing.
    expect(runEventInvoicing(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingToInvoice' })
    expect(runBillingForList(api, LIST)).toMatchObject({ ok: false, code: 'alreadyBilled' })
    // Regenerate reproduces the invoice with its event lines.
    const regen = regenerateInvoiceFromLock(api.getState(), inv.id)
    expect(regen.ok && regen.comparison.identical).toBe(true)
    expect(bundledEventsOf(api.getState(), inv.id)).toHaveLength(4)
  })

  it("an event billed to another party never joins the Procedure's invoice: its own invoice in the next run, one more BCTI", () => {
    const other = add(ward({ party: { sameAs: false, personInput: { kind: 'other', name: 'Ward 5 Trust', email: 'accounts@ward5.example' } } }))
    approve(other)
    authorise(LIST)
    const s1 = api.getState()
    const inv = liveInvoiceForProcedure(s1, PROC)!
    expect(eventLinesFor(s1, inv.id)).toHaveLength(0)
    expect(s1.schedule.procedureEvents[other]!.invoiceId).toBeUndefined()
    const bctis = bctiRecords(s1).length
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const s2 = api.getState()
    const own = s2.billing.invoices[run.value.invoiceIds[0]!]!
    expect(own).toMatchObject({ kind: 'additional', eventId: other, procedureIds: [PROC], lineage: [{ role: 'additionalTo', invoiceId: inv.id }], subtotal: 75 })
    expect(own.billedTo?.name).toBe('Ward 5 Trust')
    expect(bctiRecords(s2).length).toBe(bctis + 1)
    expect(runEventInvoicing(api, OFFICE)).toMatchObject({ ok: false })
    const regen = regenerateInvoiceFromLock(s2, own.id)
    expect(regen.ok && regen.comparison.identical).toBe(true)
  })

  it('an event approved after the Procedure is invoiced is its own invoice; a Contract fee replaces its time', () => {
    authorise(LIST)
    const id = add(ward({ type: 'painConsult', recording: { kind: 'time', minutes: 40 } }))
    approve(id)
    expect(api.getState().schedule.procedureEvents[id]!.pricing).toMatchObject({ basis: 'contractEventFee', amount: 120, holderCode: 'STGACC-PAIN', replacedMinutes: 40 })
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const inv = api.getState().billing.invoices[run.value.invoiceIds[0]!]!
    expect(inv.subtotal).toBe(120)
    expect(api.getState().billing.invoiceLines[Object.keys(api.getState().billing.invoiceLines).find((k) => api.getState().billing.invoiceLines[k]!.invoiceId === inv.id)!]!.description).toBe(
      'Post-op event · Pain consult · 21 Jul 2026 · 40 min, Contract fee',
    )
  })

  it('a timed event on a fixed price needs the office price (noEventRate), and bills at it', () => {
    const doyle = api.getState().schedule.lists[DOYLE_LIST]!.anaesthetistId!
    const id = add(ward({ occurredOnISO: '2026-07-15', recording: { kind: 'time', minutes: 30 } }), actorFor(doyle), DOYLE_PROC)
    expect(approveProcedureEvent(api, OFFICE, id)).toMatchObject({ ok: false, code: 'noEventRate', message: 'This procedure has a fixed price, so a timed event is not calculated. Set a price in review.' })
    expect(approveProcedureEvent(api, OFFICE, id, { officePrice: { amount: 60, reason: '' } })).toMatchObject({ ok: false, code: 'officeReasonRequired' })
    approve(id, { amount: 60, reason: 'Agreed with the surgeon' })
    expect(api.getState().schedule.procedureEvents[id]!.pricing).toMatchObject({ basis: 'officePrice', amount: 60, officeReason: 'Agreed with the surgeon', pricingKind: 'fixed' })
    // A billing event there is typed and never refused.
    const charge = addBillingEvent(api, actorFor(doyle), DOYLE_PROC, { direction: 'charge', description: 'Extra consult', amount: 50, occurredOnISO: '2026-07-15', party: { sameAs: true } })
    expect(charge.ok).toBe(true)
    // Approved before its List is invoiced: the next run bills it on its own (never held, D69).
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const inv = api.getState().billing.invoices[run.value.invoiceIds[0]!]!
    expect(inv).toMatchObject({ subtotal: 60, kind: 'additional', eventId: id })
    // No invoice on the Procedure yet: nothing to relate to, traceable by its Procedure and event.
    expect(inv.lineage ?? []).toEqual([])
    expect(inv.procedureIds).toEqual([DOYLE_PROC])
  })

  it('a credit that would take its invoice below $0.00 goes back to review', () => {
    const credit = addBillingEvent(api, owner(), PROC, { direction: 'credit', description: 'Write off', amount: 99999, occurredOnISO: '2026-07-21', party: { sameAs: true } })
    if (!credit.ok) throw new Error(credit.message)
    approve(credit.value.eventId)
    authorise(LIST)
    const e = api.getState().schedule.procedureEvents[credit.value.eventId]!
    expect(e.invoiceId).toBeUndefined()
    expect(e.review).toMatchObject({ state: 'awaitingReview', reason: 'Needs a change: the credit is more than the invoice.' })
  })

  it('a credit is not offered once the Procedure is invoiced (39 credit note is the route)', () => {
    authorise(LIST)
    expect(addBillingEvent(api, owner(), PROC, { direction: 'credit', description: 'Goodwill', amount: 40, occurredOnISO: '2026-07-21', party: { sameAs: true } })).toMatchObject({ ok: false, code: 'creditAfterInvoice' })
  })
})

describe('Contract event fees', () => {
  it('office only, one per type, edited in place; an approved event keeps its frozen price', () => {
    expect(addContractEventFee(api, owner(), 'CT-STG-ACC', { eventType: 'postOpWardReview', fixedPrice: 90 })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(addContractEventFee(api, OFFICE, 'CT-STG-ACC', { eventType: 'painConsult', fixedPrice: 90 })).toMatchObject({ ok: false, code: 'typeTaken' })
    const added = addContractEventFee(api, OFFICE, 'CT-STG-ACC', { eventType: 'postOpWardReview', holderCode: 'STGACC-WARD', fixedPrice: 90 })
    if (!added.ok) throw new Error(added.message)
    expect(added.value.feeId).toBe('CEF002')
    const id = add(ward())
    approve(id)
    expect(api.getState().schedule.procedureEvents[id]!.pricing).toMatchObject({ basis: 'contractEventFee', amount: 90, replacedMinutes: 45 })
    expect(editContractEventFee(api, OFFICE, added.value.feeId, { eventType: 'postOpWardReview', fixedPrice: 95 }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[id]!.pricing?.amount).toBe(90)
    const pending = add(ward())
    expect(eventPriceNow(api.getState(), api.getState().schedule.procedureEvents[pending]!)).toMatchObject({ pricing: { amount: 95 } })
    expect(removeContractEventFee(api, OFFICE, added.value.feeId).ok).toBe(true)
    expect(eventPriceNow(api.getState(), api.getState().schedule.procedureEvents[pending]!)).toMatchObject({ pricing: { amount: 75, basis: 'time' } })
    expect(api.getState().audit.filter((e) => e.action.startsWith('contractEventFee.')).map((e) => e.action)).toEqual(['contractEventFee.add', 'contractEventFee.edit', 'contractEventFee.remove'])
  })

  it("never changes a Procedure's invoiced price", () => {
    const a = createAppStore()
    const unwireA = wireBillingRun(a)
    const prev = api
    api = a
    expect(addContractEventFee(a, OFFICE, 'CT-STG-ACC', { eventType: 'otherPostOp', fixedPrice: 999 }).ok).toBe(true)
    authorise(LIST)
    const withFee = liveInvoiceForProcedure(a.getState(), PROC)!.subtotal
    unwireA()
    api = prev
    authorise(LIST)
    expect(liveInvoiceForProcedure(api.getState(), PROC)!.subtotal).toBe(withFee)
  })
})
