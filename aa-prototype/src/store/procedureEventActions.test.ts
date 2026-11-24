/**
 * Events on a Procedure and the additional invoice (catch-up Phase 38b),
 * mapped to US-08.6.3's criteria: Button, Linked, Own pair, Review step, Any
 * billable party, After a fixed price, Not a correction.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { completeAnswered } from '../test/completeAnswered'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, cancelBooking, submitList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { receivePayment } from './paymentActions'
import { bctiRecords, pairForInvoice } from './ledgerSelectors'
import { bctisFor } from '../domain/billing/bcti'
import {
  addProcedureEvent,
  additionalInvoicesFor,
  approveProcedureEvent,
  approvedEventsAwaitingRun,
  declineProcedureEvent,
  eventForInvoice,
  eventsAwaitingReview,
  eventsForProcedure,
  liveInvoiceForProcedure,
  originalInvoiceFor,
  procedureOwner,
  raiseRefusal,
  removeProcedureEvent,
  runEventInvoicing,
  updateProcedureEvent,
  type ProcedureEventInput,
} from './procedureEventActions'
import type { Actor } from './mutate'
import { ANAE, SEED_LIST_IDS, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { setXeroOutage } from './xeroQueue'
import { handoffQueuedFor } from './ledgerSelectors'
import { regenerateInvoiceFromLock } from './locks'
import { bookingsForList } from './selectors'
import { resendInvoice } from './billingRun'
import { EVENT_MESSAGES } from '../shared/procedureEventCopy'

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
const sharma = () => ownerActor(ANAE.sharma)
const souter = () => ownerActor(ANAE.souter)

function bookingOn(listId: string): string {
  const b = Object.values(api.getState().schedule.bookings).find((x) => x.listId === listId && x.cancellation === undefined)
  if (b === undefined) throw new Error(`no booking on ${listId}`)
  return b.id
}
function procedureOf(bookingId: string): string {
  const p = Object.values(api.getState().schedule.procedures).find((x) => x.bookingId === bookingId)
  if (p === undefined) throw new Error(`no procedure on ${bookingId}`)
  return p.id
}
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

/** Sarah Mitchell's staged original: Dr Sharma's Tue 14 Jul AM List, authorised and billed. */
function stageMitchell(): { bookingId: string; procedureId: string } {
  authorise(SHARMA_TUE14)
  const bookingId = bookingOn(SHARMA_TUE14)
  return { bookingId, procedureId: procedureOf(bookingId) }
}

const input = (over: Partial<ProcedureEventInput> = {}): ProcedureEventInput => ({
  kind: 'additionalInvoice',
  occurredOnISO: '2026-07-15',
  party: { sameAs: true },
  lines: [{ description: 'Post-op ward review, Wed 15 Jul, 15 min', quantity: 1, unitAmount: 30 }],
  ...over,
})

/** The records an event must never write (US-07.3.2). */
function frozen(bookingId: string) {
  const s = api.getState()
  const procedureIds = Object.values(s.schedule.procedures).filter((p) => p.bookingId === bookingId).map((p) => p.id)
  const originals = Object.values(s.billing.invoices).filter((i) => i.bookingId === bookingId && i.kind !== 'additional')
  return structuredClone({
    booking: s.schedule.bookings[bookingId],
    procedures: procedureIds.map((id) => s.schedule.procedures[id]),
    lock: s.billing.locks[bookingId],
    invoices: originals,
    lines: Object.values(s.billing.invoiceLines).filter((l) => originals.some((i) => i.id === l.invoiceId)),
    pairs: Object.values(s.billing.ledger).filter((p) => p.kind !== 'aaFee' && originals.some((i) => i.id === p.invoiceId)).map((p) => ({ ...p, receivable: { ...p.receivable, xeroAccRecId: undefined } })),
  })
}

describe('the seeded event', () => {
  it('Dr Souter owns HP03 and her event awaits review, with nothing invoiced', () => {
    expect(procedureOwner(api.getState(), 'HP03')).toBe(ANAE.souter)
    expect(eventsAwaitingReview(api.getState()).map((e) => e.id)).toEqual(['EV0001'])
    expect(eventsForProcedure(api.getState(), 'HP03').map((e) => e.id)).toEqual(['EV0001'])
    expect(liveInvoiceForProcedure(api.getState(), 'HP03')?.invoiceNumber).toBe('AA-2026-H03')
    expect(Object.values(api.getState().billing.invoices).some((i) => i.kind === 'additional')).toBe(false)
  })
})

describe('raise, edit, remove (Button)', () => {
  it('the office raises one on Sarah Mitchell; nothing is invoiced and the original is untouched', () => {
    const { bookingId, procedureId } = stageMitchell()
    const before = frozen(bookingId)
    const out = addProcedureEvent(api, OFFICE, procedureId, input())
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const ev = api.getState().schedule.procedureEvents[out.value.eventId]!
    expect(ev).toMatchObject({ id: 'EV0002', kind: 'additionalInvoice', billable: true, review: { state: 'awaitingReview' }, addedBy: { who: 'Kirsty W.', role: 'office' } })
    expect(ev.addedBy.anaesthetistId).toBeUndefined()
    expect(frozen(bookingId)).toEqual(before)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedureEvent.add', entityType: 'procedureEvent', entityId: 'EV0002', who: 'Kirsty W.' })
  })

  it('Dr Sharma raises one on her own Procedure, under her own name', () => {
    const { procedureId } = stageMitchell()
    const out = addProcedureEvent(api, sharma(), procedureId, input())
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(api.getState().schedule.procedureEvents[out.value.eventId]!.addedBy).toEqual({ who: sharma().who, role: 'anaesthetist', anaesthetistId: ANAE.sharma })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedureEvent.add', role: 'anaesthetist', who: sharma().who })
  })

  it('refuses a colleague, an unauthorised List, a cancelled Booking and a bad line', () => {
    const activeBooking = bookingOn(SHARMA_TUE14)
    expect(addProcedureEvent(api, OFFICE, procedureOf(activeBooking), input())).toMatchObject({ ok: false, code: 'notInvoiced' })
    expect(raiseRefusal(api.getState(), { role: 'office' }, procedureOf(activeBooking))?.code).toBe('notInvoiced')
    const { procedureId } = stageMitchell()
    expect(addProcedureEvent(api, souter(), procedureId, input())).toMatchObject({ ok: false, code: 'notOwnProcedure', message: 'You can create an additional invoice only on your own Procedure.' })
    expect(raiseRefusal(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.souter }, procedureId)?.code).toBe('notOwnProcedure')
    expect(raiseRefusal(api.getState(), { role: 'office' }, procedureId)).toBeNull()
    expect(addProcedureEvent(api, OFFICE, procedureId, input({ lines: [{ description: '', quantity: 1, unitAmount: 30 }] }))).toMatchObject({ ok: false, code: 'descriptionMissing' })
    expect(addProcedureEvent(api, OFFICE, procedureId, input({ occurredOnISO: '2026-07-22' }))).toMatchObject({ ok: false, code: 'dateInFuture' })
    expect(addProcedureEvent(api, OFFICE, procedureId, input({ occurredOnISO: '2026-07-13' }))).toMatchObject({ ok: false, code: 'dateBeforeProcedure' })
  })

  it('refuses on a SUBMITTED List and on a cancelled Booking', () => {
    const bookingId = bookingOn(SHARMA_TUE14)
    const owner = sharma()
    for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === SHARMA_TUE14)) completeAnswered(api, owner, b.id)
    expect(submitList(api, owner, SHARMA_TUE14).ok).toBe(true)
    expect(addProcedureEvent(api, OFFICE, procedureOf(bookingId), input())).toMatchObject({ ok: false, code: 'notInvoiced' })
    expect(cancelBooking(api, OFFICE, bookingId, 'Patient unwell').ok).toBe(true)
    expect(addProcedureEvent(api, OFFICE, procedureOf(bookingId), input())).toMatchObject({ ok: false, code: 'bookingCancelled' })
  })

  it('an anaesthetist edits and removes only what they raised; the office edits any; nothing after approval', () => {
    const { procedureId } = stageMitchell()
    const officeEv = addProcedureEvent(api, OFFICE, procedureId, input())
    const hers = addProcedureEvent(api, sharma(), procedureId, input())
    if (!officeEv.ok || !hers.ok) throw new Error('raise')
    expect(updateProcedureEvent(api, sharma(), officeEv.value.eventId, { lines: [{ description: 'x', quantity: 1, unitAmount: 1 }] })).toMatchObject({ ok: false, code: 'notYours' })
    expect(removeProcedureEvent(api, sharma(), officeEv.value.eventId)).toMatchObject({ ok: false, code: 'notYours' })
    expect(updateProcedureEvent(api, sharma(), hers.value.eventId, { lines: [{ description: 'Nerve catheter review', quantity: 1, unitAmount: 45 }] }).ok).toBe(true)
    expect(updateProcedureEvent(api, OFFICE, hers.value.eventId, { occurredOnISO: '2026-07-16' }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[hers.value.eventId]).toMatchObject({ occurredOnISO: '2026-07-16', detail: { lines: [{ description: 'Nerve catheter review', unitAmount: 45 }] } })
    expect(approveProcedureEvent(api, OFFICE, hers.value.eventId).ok).toBe(true)
    expect(updateProcedureEvent(api, OFFICE, hers.value.eventId, { occurredOnISO: '2026-07-15' })).toMatchObject({ ok: false, code: 'approved', message: EVENT_MESSAGES.approvedLocked })
    expect(removeProcedureEvent(api, sharma(), hers.value.eventId)).toMatchObject({ ok: false, code: 'approved' })
    expect(removeProcedureEvent(api, OFFICE, officeEv.value.eventId).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents[officeEv.value.eventId]).toBeUndefined()
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedureEvent.remove' })
  })
})

describe('the review step (Review step)', () => {
  it('only the office approves or declines; a decline needs a reason and an edit resubmits it', () => {
    expect(approveProcedureEvent(api, souter(), 'EV0001')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(declineProcedureEvent(api, OFFICE, 'EV0001', '  ')).toMatchObject({ ok: false, code: 'reasonRequired', message: 'Give a reason.' })
    expect(declineProcedureEvent(api, OFFICE, 'EV0001', 'Please split the time').ok).toBe(true)
    expect(api.getState().schedule.procedureEvents['EV0001']!.review).toMatchObject({ state: 'declined', reason: 'Please split the time', by: { who: 'Kirsty W.' } })
    expect(approveProcedureEvent(api, OFFICE, 'EV0001')).toMatchObject({ ok: false, code: 'notAwaitingReview' })
    expect(updateProcedureEvent(api, souter(), 'EV0001', { lines: [{ description: 'Post-op ward review, Tue 23 Jun, 20 min', quantity: 1, unitAmount: 80 }] }).ok).toBe(true)
    expect(api.getState().schedule.procedureEvents['EV0001']!.review).toEqual({ state: 'awaitingReview' })
    expect(approveProcedureEvent(api, OFFICE, 'EV0001').ok).toBe(true)
    expect(approveProcedureEvent(api, OFFICE, 'EV0001')).toMatchObject({ ok: false, code: 'notAwaitingReview' })
    expect(approvedEventsAwaitingRun(api.getState()).map((e) => e.id)).toEqual(['EV0001'])
    // Approval raises nothing.
    expect(Object.values(api.getState().billing.invoices).some((i) => i.kind === 'additional')).toBe(false)
  })
})

describe('the next billing run (Own pair, Linked)', () => {
  it('invoices the seeded event as its own invoice, its own pair to Dr Souter and its own Xero pair, linked both ways', () => {
    const before = frozen('HBK03')
    const counters = api.getState().counters
    expect(approveProcedureEvent(api, OFFICE, 'EV0001').ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE)
    expect(run.ok).toBe(true)
    if (!run.ok) return
    const [invoiceId] = run.value.invoiceIds
    const s = api.getState()
    const inv = s.billing.invoices[invoiceId!]!
    expect(inv).toMatchObject({ kind: 'additional', eventId: 'EV0001', procedureIds: ['HP03'], bookingId: 'HBK03', subtotal: 85, gst: 12.75, total: 97.75, lineage: [{ role: 'additionalTo', invoiceId: 'HINV03' }] })
    expect(inv.invoiceNumber).toBe(`AA-2026-${String(counters['invoiceNumber']).padStart(4, '0')}`)
    expect(inv.counterparty).toEqual(s.billing.invoices['HINV03']!.counterparty)
    const lines = Object.values(s.billing.invoiceLines).filter((l) => l.invoiceId === invoiceId)
    expect(lines).toMatchObject([{ description: 'Post-op ward review, Tue 23 Jun, 20 min', quantity: 1, unitAmount: 85, amount: 85 }])
    const pair = pairForInvoice(s, invoiceId!)!
    expect(pair).toMatchObject({ kind: 'procedure', anaesthetistId: ANAE.souter, receivable: { amount: 97.75 }, payable: { amount: 97.75, number: `${inv.invoiceNumber}-P`, payee: { kind: 'anaesthetist', anaesthetistId: ANAE.souter } } })
    expect(pair.receivable.xeroAccRecId).toBeDefined()
    expect(pair.payable?.xeroAccPayId).toBeTruthy()
    expect(s.schedule.procedureEvents['EV0001']!.invoiceId).toBe(invoiceId)
    expect(additionalInvoicesFor(s, 'HINV03').map((i) => i.id)).toEqual([invoiceId])
    expect(originalInvoiceFor(s, invoiceId!)?.id).toBe('HINV03')
    expect(eventForInvoice(s, invoiceId!)?.id).toBe('EV0001')
    expect(frozen('HBK03')).toEqual(before)
    const actions = s.audit.slice(-12).map((a) => a.action)
    expect(actions).toEqual(expect.arrayContaining(['procedureEvent.invoiced', 'invoice.additionalCreated', 'ledger.pairCreated']))
    expect(actions).not.toContain('invoice.partyChanged')
  })

  it('never invoices twice, refuses with nothing waiting, and narrows by eventIds', () => {
    expect(runEventInvoicing(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingToInvoice', message: EVENT_MESSAGES.nothingToRun })
    const { procedureId } = stageMitchell()
    const a = addProcedureEvent(api, OFFICE, procedureId, input())
    const b = addProcedureEvent(api, OFFICE, procedureId, input({ lines: [{ description: 'Second review', quantity: 1, unitAmount: 30 }] }))
    if (!a.ok || !b.ok) throw new Error('raise')
    for (const id of [a.value.eventId, b.value.eventId, 'EV0001']) expect(approveProcedureEvent(api, OFFICE, id).ok).toBe(true)
    const narrow = runEventInvoicing(api, OFFICE, { eventIds: [b.value.eventId] })
    expect(narrow.ok && narrow.value.invoiceIds).toHaveLength(1)
    expect(api.getState().schedule.procedureEvents[a.value.eventId]!.invoiceId).toBeUndefined()
    const rest = runEventInvoicing(api, OFFICE)
    // Two events for the same party on one Procedure: two separate invoices, never bundled.
    expect(rest.ok && rest.value.invoiceIds).toHaveLength(2)
    expect(runEventInvoicing(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingToInvoice' })
    const original = liveInvoiceForProcedure(api.getState(), procedureId)!
    expect(additionalInvoicesFor(api.getState(), original.id)).toHaveLength(2)
    const numbers = Object.values(api.getState().billing.invoices).filter((i) => i.kind === 'additional').map((i) => i.invoiceNumber)
    expect(new Set(numbers).size).toBe(3)
  })

  it('Dr Sharma raises, the office approves and runs it: it pays her and leaves the original as it was (Not a correction)', () => {
    const { bookingId, procedureId } = stageMitchell()
    const before = frozen(bookingId)
    const out = addProcedureEvent(api, sharma(), procedureId, input({ lines: [{ description: 'Nerve catheter review, Wed 15 Jul', quantity: 1, unitAmount: 45 }] }))
    if (!out.ok) throw new Error(out.message)
    expect(approveProcedureEvent(api, OFFICE, out.value.eventId).ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE, { eventIds: [out.value.eventId] })
    if (!run.ok) throw new Error(run.message)
    const pair = pairForInvoice(api.getState(), run.value.invoiceIds[0]!)!
    expect(pair.anaesthetistId).toBe(ANAE.sharma)
    expect(frozen(bookingId)).toEqual(before)
  })
})

describe('any billable party (Any billable party)', () => {
  it('"Another person" typed in gets a new BP id from the payer counter; a nameless one is refused', () => {
    const { procedureId } = stageMitchell()
    const next = api.getState().counters['billableParty']
    const out = addProcedureEvent(api, OFFICE, procedureId, input({ party: { sameAs: false, personInput: { kind: 'other', name: 'Ana Mitchell', email: 'ana@example.com' } } }))
    if (!out.ok) throw new Error(out.message)
    const ev = api.getState().schedule.procedureEvents[out.value.eventId]!
    const id = `BP${String(next).padStart(4, '0')}`
    expect(ev.party).toMatchObject({ sameAs: false, party: { kind: 'payer', id }, person: { kind: 'other', id, name: 'Ana Mitchell', email: 'ana@example.com' } })
    expect(api.getState().counters['billableParty']).toBe(next! + 1)
    expect(addProcedureEvent(api, OFFICE, procedureId, input({ party: { sameAs: false, personInput: { kind: 'other', name: ' ' } } }))).toMatchObject({ ok: false, code: 'payerNameRequired' })
  })

  it('bills a named party, audited as a party change; refuses a party with nowhere to send it', () => {
    const { procedureId } = stageMitchell()
    const named = addProcedureEvent(api, OFFICE, procedureId, input({ party: { sameAs: false, party: { kind: 'payer', id: 'BP0099' }, person: { kind: 'other', id: 'BP0099', name: 'Ana Mitchell', email: 'ana@example.com' } } }))
    if (!named.ok) throw new Error(named.message)
    expect(approveProcedureEvent(api, OFFICE, named.value.eventId).ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE, { eventIds: [named.value.eventId] })
    if (!run.ok) throw new Error(run.message)
    const inv = api.getState().billing.invoices[run.value.invoiceIds[0]!]!
    expect(inv.counterparty).toEqual({ kind: 'payer', id: 'BP0099' })
    expect(inv.billedTo).toEqual({ name: 'Ana Mitchell', email: 'ana@example.com' })
    expect(inv.layout).toBe('patient')
    expect(inv.delivery).toMatchObject({ method: 'email', status: 'sent' })
    expect(api.getState().audit.some((a) => a.action === 'invoice.partyChanged' && a.entityId === inv.id)).toBe(true)
    const nowhere = addProcedureEvent(api, OFFICE, procedureId, input({ party: { sameAs: false, party: { kind: 'payer', id: 'BP0098' }, person: { kind: 'other', id: 'BP0098', name: 'No Contact' } } }))
    expect(nowhere).toMatchObject({ ok: false, code: 'partyNoAddress' })
  })
})

describe('after a fixed price (After a fixed price)', () => {
  it('authorising the prepaid Booking creates no event and no additional invoice; Dr Souter raises one by hand that links to the prepayment invoice and pays her', () => {
    const listId = api.getState().schedule.bookings[SEED_PREPAID_BOOKING_ID]!.listId
    expect(listId).toBe(SEED_LIST_IDS.prepaymentPaidList)
    const eventsBefore = Object.keys(api.getState().schedule.procedureEvents)
    authorise(listId)
    expect(Object.keys(api.getState().schedule.procedureEvents)).toEqual(eventsBefore)
    expect(Object.values(api.getState().billing.invoices).some((i) => i.kind === 'additional')).toBe(false)
    const prepayment = Object.values(api.getState().billing.invoices).find((i) => i.bookingId === SEED_PREPAID_BOOKING_ID && i.kind === 'prePayment')!
    const procedureId = prepayment.procedureIds![0]!
    const original = liveInvoiceForProcedure(api.getState(), procedureId)!
    // Left off the final invoice (27): its only invoice is the prepayment invoice.
    expect(original.id).toBe(prepayment.id)
    const out = addProcedureEvent(api, souter(), procedureId, input({ occurredOnISO: '2026-07-24', lines: [{ description: 'Extended case, 40 min over', quantity: 1, unitAmount: 120 }] }))
    if (!out.ok) throw new Error(out.message)
    expect(approveProcedureEvent(api, OFFICE, out.value.eventId).ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const inv = api.getState().billing.invoices[run.value.invoiceIds[0]!]!
    expect(inv.lineage).toEqual([{ role: 'additionalTo', invoiceId: original.id }])
    const pair = pairForInvoice(api.getState(), inv.id)!
    expect(pair.payable?.payee).toEqual({ kind: 'anaesthetist', anaesthetistId: ANAE.souter })
  })
})

describe('the BCTI count (OQ-60, provisional: an additional invoice is one BCTI)', () => {
  it('adds no record until invoiced, then exactly one, counted only once its receivable is paid in full', () => {
    const count = () => bctiRecords(api.getState()).length
    const base = count()
    expect(approveProcedureEvent(api, OFFICE, 'EV0001').ok).toBe(true)
    expect(count()).toBe(base)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    expect(count()).toBe(base + 1)
    const julyBefore = bctisFor(bctiRecords(api.getState()), ANAE.souter, '2026-07').length
    const pair = pairForInvoice(api.getState(), run.value.invoiceIds[0]!)!
    const paid = receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount: pair.receivable.amount, idempotencyKey: 'ev-pay', source: 'webhook' })
    expect(paid.ok).toBe(true)
    expect(bctisFor(bctiRecords(api.getState()), ANAE.souter, '2026-07').length).toBe(julyBefore + 1)
  })
})

describe('determinism', () => {
  it('two stores give the same events and invoices', () => {
    const run = (s: BoundAppStore) => {
      approveProcedureEvent(s, OFFICE, 'EV0001')
      runEventInvoicing(s, OFFICE)
      return { events: s.getState().schedule.procedureEvents, invoices: s.getState().billing.invoices }
    }
    expect(run(createAppStore())).toEqual(run(createAppStore()))
  })
})

describe('the run through a Xero outage, never on a List, and Regenerate (catch-up Phase 38b)', () => {
  it('a Xero outage queues the hand-off; the invoice and pair stand, and the queue sends it once Xero is back', () => {
    expect(setXeroOutage(api, OFFICE, true).ok).toBe(true)
    expect(approveProcedureEvent(api, OFFICE, 'EV0001').ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const pair = pairForInvoice(api.getState(), run.value.invoiceIds[0]!)!
    expect(pair.receivable.xeroAccRecId).toBeUndefined()
    expect(handoffQueuedFor(api.getState(), pair.id)).toBeDefined()
    expect(setXeroOutage(api, OFFICE, false).ok).toBe(true)
    expect(pairForInvoice(api.getState(), run.value.invoiceIds[0]!)!.receivable.xeroAccRecId).toBeDefined()
    expect(runEventInvoicing(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingToInvoice' })
  })

  it('an event is never a List, Slot or Booking: raising one adds none', () => {
    const { procedureId } = stageMitchell()
    const before = { lists: Object.keys(api.getState().schedule.lists), slots: Object.keys(api.getState().schedule.slots), bookings: Object.keys(api.getState().schedule.bookings) }
    expect(addProcedureEvent(api, OFFICE, procedureId, input({ occurredOnISO: '2026-07-21' })).ok).toBe(true)
    expect({ lists: Object.keys(api.getState().schedule.lists), slots: Object.keys(api.getState().schedule.slots), bookings: Object.keys(api.getState().schedule.bookings) }).toEqual(before)
    expect(bookingsForList(api.getState(), SHARMA_TUE14).map((b) => b.id)).not.toContain('EV0002')
  })

  it('Regenerate re-prices an additional invoice from its event: identical', () => {
    expect(approveProcedureEvent(api, OFFICE, 'EV0001').ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const result = regenerateInvoiceFromLock(api.getState(), run.value.invoiceIds[0]!)
    expect(result.ok && result.comparison.identical).toBe(true)
    expect(result.ok && result.total).toBe(97.75)
  })

  it('"same as" goes where the original was last sent, and a named person is snapshotted on the invoice', () => {
    const original = liveInvoiceForProcedure(api.getState(), 'HP03')!
    expect(resendInvoice(api, OFFICE, original.id, { to: 'accounts2@stgeorges.example' }).ok).toBe(true)
    expect(approveProcedureEvent(api, OFFICE, 'EV0001').ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const inv = api.getState().billing.invoices[run.value.invoiceIds[0]!]!
    expect(inv.delivery).toMatchObject({ method: 'email', status: 'sent', sends: [{ to: 'accounts2@stgeorges.example' }] })
  })
})
