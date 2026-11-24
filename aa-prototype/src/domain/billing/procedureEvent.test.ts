import { describe, expect, it } from 'vitest'
import type { ProcedureEvent } from '../types'
import {
  EVENT_KINDS,
  EVENT_RULES,
  creditDetailOf,
  defaultEventDate,
  eventLines,
  eventInvoicing,
  eventStatus,
  mayEditEvent,
  mayRaise,
  resolveEventParty,
  validateEventBase,
  type EventKindRules,
} from './procedureEvent'

const OWNER = '34821'
const COLLEAGUE = '40000'

function event(over: Partial<ProcedureEvent> = {}): ProcedureEvent {
  return {
    id: 'EV0001',
    procedureId: 'HP03',
    bookingId: 'HBK03',
    kind: 'additionalInvoice',
    occurredOnISO: '2026-10-27',
    billable: true,
    party: { sameAs: true },
    detail: { kind: 'additionalInvoice', lines: [{ description: 'Review', quantity: 1, unitAmount: 85 }] },
    review: { state: 'awaitingReview' },
    addedBy: { who: 'Dr Melanie Souter', role: 'anaesthetist', anaesthetistId: OWNER },
    addedAtISO: '2026-11-23T16:30:00',
    ...over,
  }
}

// A kind that may bundle: test-only, so 39b's branch is proven before 39b exists.
const BUNDLING: Readonly<Record<string, EventKindRules>> = {
  ...EVENT_KINDS,
  testPostOp: { addedBy: ['office', 'anaesthetist'], anaesthetistOwnOnly: true, tick: 'shown', reviewed: true, mayBundle: true, needsInvoicedProcedure: false },
}

describe('EVENT_RULES and EVENT_KINDS', () => {
  it('builds the readings as constants', () => {
    expect(EVENT_RULES).toEqual({ model: 'ownElement', review: 'office', nextRun: 'explicitRun', sameAsDefault: true, anaesthetistSees: 'ownTotalsAndParty' })
    expect(EVENT_KINDS.additionalInvoice).toEqual({ addedBy: ['office', 'anaesthetist'], anaesthetistOwnOnly: true, tick: 'fixedOn', reviewed: true, mayBundle: false, needsInvoicedProcedure: true })
  })
})

describe('the credit kind (catch-up Phase 39)', () => {
  const credit = (creditNoteId?: string) =>
    event({ kind: 'credit', review: { state: 'approved' }, detail: { kind: 'credit', credit: { originalInvoiceId: 'INV0001', reason: 'Wrong amount', cause: 'correction', replacementEventIds: [], ...(creditNoteId !== undefined ? { creditNoteId } : {}) } } })

  it('is raised by the office on any Procedure, the anaesthetist on their own, through the review step, never bundled', () => {
    expect(EVENT_KINDS.credit).toEqual({ addedBy: ['office', 'anaesthetist'], anaesthetistOwnOnly: true, tick: 'fixedOn', reviewed: true, mayBundle: false, needsInvoicedProcedure: true })
    expect(mayRaise('credit', { role: 'office' }, OWNER)).toBe(true)
    expect(mayRaise('credit', { role: 'anaesthetist', anaesthetistId: OWNER }, OWNER)).toBe(true)
    expect(mayRaise('credit', { role: 'anaesthetist', anaesthetistId: COLLEAGUE }, OWNER)).toBe(false)
  })

  it('has no lines, its detail read through creditDetailOf, and reads invoiced once its credit note is issued', () => {
    expect(eventLines(credit())).toEqual([])
    expect(eventLines(event())).toHaveLength(1)
    expect(creditDetailOf(credit())?.originalInvoiceId).toBe('INV0001')
    expect(creditDetailOf(event())).toBeUndefined()
    expect(eventStatus(credit())).toBe('approved')
    expect(eventStatus(credit('CRN0001'))).toBe('invoiced')
  })
})

describe('eventStatus (derived, never stored)', () => {
  it('reads each status', () => {
    expect(eventStatus(event({ billable: false }))).toBe('notBillable')
    expect(eventStatus(event())).toBe('awaitingReview')
    expect(eventStatus(event({ review: { state: 'declined', reason: 'x' } }))).toBe('declined')
    expect(eventStatus(event({ review: { state: 'approved' } }))).toBe('approved')
    expect(eventStatus(event({ review: { state: 'approved' }, invoiceId: 'INV0009' }))).toBe('invoiced')
  })
})

describe('mayRaise', () => {
  it('lets the office raise on any Procedure and the anaesthetist only on their own', () => {
    expect(mayRaise('additionalInvoice', { role: 'office' }, OWNER)).toBe(true)
    expect(mayRaise('additionalInvoice', { role: 'anaesthetist', anaesthetistId: OWNER }, OWNER)).toBe(true)
    expect(mayRaise('additionalInvoice', { role: 'anaesthetist', anaesthetistId: COLLEAGUE }, OWNER)).toBe(false)
    expect(mayRaise('additionalInvoice', { role: 'anaesthetist' }, OWNER)).toBe(false)
    expect(mayRaise('additionalInvoice', { role: 'system' }, OWNER)).toBe(false)
  })
  it('drops the anaesthetist when the kind is flipped to office only (the stop-condition flip)', () => {
    const officeOnly = { additionalInvoice: { ...EVENT_KINDS.additionalInvoice, addedBy: ['office'] as const } }
    expect(mayRaise('additionalInvoice', { role: 'anaesthetist', anaesthetistId: OWNER }, OWNER, officeOnly)).toBe(false)
    expect(mayRaise('additionalInvoice', { role: 'office' }, OWNER, officeOnly)).toBe(true)
  })
})

describe('mayEditEvent', () => {
  const office = { role: 'office' as const }
  const owner = { role: 'anaesthetist' as const, anaesthetistId: OWNER }
  const colleague = { role: 'anaesthetist' as const, anaesthetistId: COLLEAGUE }
  it('allows edits only while awaiting review, declined or not invoiced', () => {
    // Catch-up Phase 39b: an un-ticked event is never reviewed, so it stays editable (38b's handoff).
    for (const ev of [event(), event({ review: { state: 'declined', reason: 'x' } }), event({ billable: false })]) {
      expect(mayEditEvent(ev, office, OWNER)).toBe(true)
      expect(mayEditEvent(ev, owner, OWNER)).toBe(true)
      expect(mayEditEvent(ev, colleague, OWNER)).toBe(false)
    }
    for (const ev of [event({ review: { state: 'approved' } }), event({ review: { state: 'approved' }, invoiceId: 'I' })]) {
      expect(mayEditEvent(ev, office, OWNER)).toBe(false)
      expect(mayEditEvent(ev, owner, OWNER)).toBe(false)
    }
  })
  it('refuses an anaesthetist on an event the office raised', () => {
    const officeRaised = event({ addedBy: { who: 'Kirsty', role: 'office' } })
    expect(mayEditEvent(officeRaised, owner, OWNER)).toBe(false)
    expect(mayEditEvent(officeRaised, office, OWNER)).toBe(true)
  })
  it('refuses an anaesthetist who raised it once the Procedure is no longer theirs', () => {
    expect(mayEditEvent(event(), owner, COLLEAGUE)).toBe(false)
  })
})

describe('eventInvoicing (OQ-121, D69)', () => {
  it('always gives an additional invoice its own invoice', () => {
    expect(eventInvoicing(event(), { runInvoiceForParty: true })).toBe('ownInvoice')
    expect(eventInvoicing(event(), {})).toBe('ownInvoice')
  })
  it('bundles a bundling kind onto the run invoice for the same party, else its own; never held', () => {
    const post = event({ kind: 'testPostOp' as ProcedureEvent['kind'] })
    expect(eventInvoicing(post, { runInvoiceForParty: true }, BUNDLING)).toBe('bundleOnRunInvoice')
    expect(eventInvoicing(post, { runInvoiceForParty: false }, BUNDLING)).toBe('ownInvoice')
    expect(eventInvoicing(post, {}, BUNDLING)).toBe('ownInvoice')
  })
})

describe('resolveEventParty', () => {
  const original = { counterparty: { kind: 'hospital' as const, id: 'H-STG' }, billedTo: undefined }
  it('"same as" resolves to the original invoice, else the Procedure party', () => {
    expect(resolveEventParty(event(), { originalInvoice: original, procedureParty: { kind: 'patient', id: 'P1' } })).toEqual({ counterparty: original.counterparty, sameAs: true })
    expect(resolveEventParty(event(), { procedureParty: { kind: 'patient', id: 'P1' } })).toEqual({ counterparty: { kind: 'patient', id: 'P1' }, sameAs: true })
    expect(resolveEventParty(event(), {})).toBeUndefined()
  })
  it('returns a named party as given, with a named person and an invoice email', () => {
    const named = event({ party: { sameAs: false, party: { kind: 'insurer', id: 'INS-SX' }, invoiceEmail: ' claims@sx.example ' } })
    expect(resolveEventParty(named, { originalInvoice: original })).toEqual({ counterparty: { kind: 'insurer', id: 'INS-SX' }, invoiceEmail: 'claims@sx.example', sameAs: false })
    const person = event({ party: { sameAs: false, party: { kind: 'payer', id: 'BP0009' }, person: { kind: 'other', id: 'BP0009', name: 'Ana Chen', email: 'ana@example.com' } } })
    expect(resolveEventParty(person, { originalInvoice: original })).toEqual({ counterparty: { kind: 'payer', id: 'BP0009' }, billedTo: { name: 'Ana Chen', email: 'ana@example.com' }, sameAs: false })
  })
})

describe('validateEventBase', () => {
  const ctx = { ownerAnaesthetistId: OWNER, listDateISO: '2026-11-17', todayISO: '2026-11-24', procedureInvoiced: true }
  const input = { occurredOnISO: '2026-11-18', party: { sameAs: true as const } }
  const office = { role: 'office' as const }
  it('accepts a valid charge for the office and the owner', () => {
    expect(validateEventBase(input, 'additionalInvoice', office, ctx)).toBeNull()
    expect(validateEventBase(input, 'additionalInvoice', { role: 'anaesthetist', anaesthetistId: OWNER }, ctx)).toBeNull()
  })
  it('refuses a colleague, a role the kind does not allow and an uninvoiced Procedure', () => {
    expect(validateEventBase(input, 'additionalInvoice', { role: 'anaesthetist', anaesthetistId: COLLEAGUE }, ctx)?.code).toBe('notOwnProcedure')
    expect(validateEventBase(input, 'additionalInvoice', { role: 'system' }, ctx)?.code).toBe('kindNotAllowed')
    expect(validateEventBase(input, 'additionalInvoice', office, { ...ctx, procedureInvoiced: false })?.message).toBe('This Procedure has no invoice yet. An additional invoice is for charges after invoicing.')
  })
  it('holds both date edges', () => {
    expect(validateEventBase({ ...input, occurredOnISO: '2026-11-17' }, 'additionalInvoice', office, ctx)).toBeNull()
    expect(validateEventBase({ ...input, occurredOnISO: '2026-11-24' }, 'additionalInvoice', office, ctx)).toBeNull()
    expect(validateEventBase({ ...input, occurredOnISO: '2026-11-16' }, 'additionalInvoice', office, ctx)?.code).toBe('dateBeforeProcedure')
    expect(validateEventBase({ ...input, occurredOnISO: '2026-11-25' }, 'additionalInvoice', office, ctx)?.code).toBe('dateInFuture')
    expect(validateEventBase({ ...input, occurredOnISO: '' }, 'additionalInvoice', office, ctx)?.code).toBe('dateInvalid')
  })
  it('allows a List dated after today its own date (the future-dated List case)', () => {
    const future = { ...ctx, listDateISO: '2026-11-27' }
    expect(validateEventBase({ ...input, occurredOnISO: '2026-11-27' }, 'additionalInvoice', office, future)).toBeNull()
    expect(validateEventBase({ ...input, occurredOnISO: '2026-11-28' }, 'additionalInvoice', office, future)?.code).toBe('dateInFuture')
    expect(defaultEventDate('2026-11-27', '2026-11-24')).toBe('2026-11-27')
    expect(defaultEventDate('2026-11-17', '2026-11-24')).toBe('2026-11-24')
  })
  it('refuses a named party with nowhere to send the invoice', () => {
    const named = { ...input, party: { sameAs: false as const, party: { kind: 'party' as const, id: 'PY-X' } } }
    expect(validateEventBase(named, 'additionalInvoice', office, { ...ctx, namedPartyDelivery: { method: 'none' } })?.code).toBe('partyNoAddress')
    expect(validateEventBase(named, 'additionalInvoice', office, { ...ctx, namedPartyDelivery: { method: 'email', to: 'a@b.co' } })).toBeNull()
  })
  it('is deterministic', () => {
    expect(validateEventBase(input, 'additionalInvoice', office, ctx)).toEqual(validateEventBase(input, 'additionalInvoice', office, ctx))
  })
})
