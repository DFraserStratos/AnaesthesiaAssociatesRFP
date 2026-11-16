/**
 * The payer on the Booking (catch-up Phase 21; US-11.2.1 to US-11.2.4): its
 * one writer, every creation path naming a payer, the seeded payer review List,
 * the child payer warning and the billing run.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { authoriseList } from './lifecycle'
import { setBookingPayer } from './payerActions'
import { createBooking } from './bookingActions'
import { runBillingForList } from './billingRun'
import { billablePartyForProcedureId, proceduresForBooking } from './selectors'
import type { AppState } from './appStore'
import { clearWarning, openWarnings, warningsForBooking } from './warnings'
import { setProcedureContract } from './contractSelectionActions'
import { buildSeed, PAT_REVIEW, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import type { Actor } from './mutate'

const marker = (key: string) => SEED_MARKERS[key]!.entityId
const invoicesForBooking = (s: AppState, bookingId: string) =>
  Object.values(s.billing.invoices).filter((i) => i.bookingId === bookingId && i.kind === 'standard')
const GRACE = marker('guardianMinorBooking')
const CHILD = marker('childPayer')
const CONTACT_MISSING = marker('payerContactMissing')
const TRUST = marker('familyTrustPayer')
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

describe('setBookingPayer: the one writer', () => {
  it('ticks a guardian with a BP id, audited "Payer", and the invoice follows at an unchanged fee (US-11.2.2 AC2)', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), CHILD)[0]!
    expect(billablePartyForProcedureId(api.getState(), p.id)).toEqual({ kind: 'patient', id: PAT_REVIEW.childPayer })
    const r = setBookingPayer(api, OFFICE_ACTOR, CHILD, { kind: 'other', name: 'Mere Moana', relationship: 'Mother', email: 'mere.moana@example.net' })
    expect(r.ok).toBe(true)
    const payer = api.getState().schedule.bookings[CHILD]!.payer
    expect(payer).toMatchObject({ kind: 'other', name: 'Mere Moana', relationship: 'Mother' })
    expect(payer.kind === 'other' && payer.id).toBe('BP0004')
    expect(billablePartyForProcedureId(api.getState(), p.id)).toEqual({ kind: 'payer', id: 'BP0004' })
    const audit = api.getState().audit.at(-1)!
    expect(audit).toMatchObject({ action: 'booking.payer', entityId: CHILD, before: { payer: 'Ella Moana (Patient)' }, after: { payer: 'Mere Moana (Mother)' } })
    // The child warning goes once another payer is ticked.
    expect(warningsForBooking(api.getState(), CHILD).some((w) => w.ruleId === 'childPayer')).toBe(false)
  })

  it('refuses a blank name, a malformed email and an incomplete address, and accepts a postal address alone', () => {
    const api = createAppStore()
    expect(setBookingPayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'other', name: ' ' })).toMatchObject({ ok: false, message: "Enter the payer's name." })
    expect(setBookingPayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'patient', email: 'not an email' })).toMatchObject({ ok: false, message: 'Enter a valid email.' })
    expect(setBookingPayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'patient', postalAddress: { line1: '4 Beach Road', city: 'Christchurch', postcode: '81' } })).toMatchObject({ ok: false, message: 'Enter a four-digit postcode.' })
    expect(setBookingPayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'patient', postalAddress: { line1: '4 Beach Road', city: 'Christchurch', postcode: '8081' } }).ok).toBe(true)
  })

  it('lets the anaesthetist change it on their own List until AUTHORISED, and no one after', () => {
    const api = createAppStore()
    // Dr Souter's own ACTIVE List.
    const own = Object.values(api.getState().schedule.bookings).find((b) => b.listId === SEED_LIST_IDS.souterAm21)!
    expect(setBookingPayer(api, SOUTER, own.id, { kind: 'other', name: 'Sam Lee', relationship: 'Guardian', email: 'sam@example.net' }).ok).toBe(true)
    // Not her List.
    expect(setBookingPayer(api, SOUTER, CHILD, { kind: 'patient' }).ok).toBe(false)
    // The office, then AUTHORISED: refused for everyone.
    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
    expect(setBookingPayer(api, OFFICE_ACTOR, CHILD, { kind: 'patient' })).toMatchObject({ ok: false })
  })

  it('every creation path names a payer: the patient, or a ticked payer from the form', () => {
    const api = createAppStore()
    const made = createBooking(api, OFFICE_ACTOR, SEED_LIST_IDS.souterAm21, {
      patient: { name: 'New Patient', dobISO: '1980-01-01' },
      sourceText: { text: 'Knee arthroscopy', source: 'phone', from: 'Kirsty W.' },
    })
    expect(made.ok && api.getState().schedule.bookings[made.value.bookingId]!.payer).toEqual({ kind: 'patient' })
    const ticked = createBooking(api, OFFICE_ACTOR, SEED_LIST_IDS.souterAm21, {
      patient: { name: 'Second Patient', dobISO: '2012-01-01' },
      sourceText: { text: 'Grommets', source: 'phone', from: 'Kirsty W.' },
      payer: { kind: 'other', name: 'Tia Second', relationship: 'Mother', email: 'tia@example.net' },
    })
    expect(ticked.ok && api.getState().schedule.bookings[ticked.value.bookingId]!.payer).toMatchObject({ kind: 'other', name: 'Tia Second' })
  })
})

describe('the seeded payers (catch-up Phase 21)', () => {
  const seed = buildSeed()

  it('every Booking names a payer; Grace Park’s is Hana Park (Mother) with no warning', () => {
    for (const b of Object.values(seed.schedule.bookings)) expect(b.payer, b.id).toBeDefined()
    expect(seed.schedule.bookings[GRACE]!.payer).toMatchObject({ kind: 'other', id: 'BP0001', name: 'Hana Park' })
    expect(warningsForBooking(createAppStore().getState(), GRACE)).toEqual([])
  })

  it('the payer review List is SUBMITTED, off every beat, with the child, the missing contact and the family trust', () => {
    const list = seed.schedule.lists[SEED_LIST_IDS.payerReview]!
    expect(list.state).toBe('SUBMITTED')
    expect(list.anaesthetistId).not.toBe('34821')
    expect([CHILD, CONTACT_MISSING, TRUST].every((id) => seed.schedule.bookings[id]!.listId === list.id)).toBe(true)
    expect(seed.schedule.bookings[TRUST]!.payer).toMatchObject({ kind: 'other', name: 'Whitcombe Family Trust' })
  })

  it("the pristine seed's only child warning is on the childPayer Booking", () => {
    const rows = openWarnings(createAppStore().getState()).filter((r) => r.warning.ruleId === 'childPayer')
    expect(rows.map((r) => r.bookingId)).toEqual([CHILD])
  })
})

describe('the child payer warning (US-11.2.4, D4)', () => {
  it('is mild, before the procedure, never blocks authorising, and Clear holds', () => {
    const api = createAppStore()
    const [w] = warningsForBooking(api.getState(), CHILD).filter((x) => x.ruleId === 'childPayer')
    expect(w).toMatchObject({ kind: 'beforeProcedure', strength: 'mild', key: `${CHILD}:childPayer` })
    expect(clearWarning(api, OFFICE_ACTOR, CHILD, w!.key).ok).toBe(true)
    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
  })

  it('a Contract that bills its holder raises none', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), CHILD)[0]!
    expect(setProcedureContract(api, OFFICE_ACTOR, p.id, 'CT-NIB-D1').ok).toBe(true)
    expect(warningsForBooking(api.getState(), CHILD).some((x) => x.ruleId === 'childPayer')).toBe(false)
  })
})

describe('the billing run on the payer review List', () => {
  it('bills the family trust by post with its billedTo snapshot, the missing-contact patient, and the child', () => {
    const api = createAppStore()
    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
    expect(runBillingForList(api, SEED_LIST_IDS.payerReview).ok).toBe(true)
    const [trust] = invoicesForBooking(api.getState(), TRUST)
    expect(trust!.counterparty).toEqual({ kind: 'payer', id: 'BP0003' })
    expect(trust!.layout).toBe('patient')
    expect(trust!.billedTo).toEqual({ name: 'Whitcombe Family Trust', postalAddress: { line1: 'PO Box 13245', city: 'Christchurch', postcode: '8141' } })
    const [missing] = invoicesForBooking(api.getState(), CONTACT_MISSING)
    expect(missing!.billedTo).toEqual({ name: 'Kevin Doherty' })
    expect(invoicesForBooking(api.getState(), CHILD)[0]!.counterparty).toEqual({ kind: 'patient', id: PAT_REVIEW.childPayer })
  })
})

describe('review fixes (convention 18)', () => {
  it('editing the same other payer keeps the BP id; a different name is a new person with a new id', () => {
    const api = createAppStore()
    expect(setBookingPayer(api, OFFICE_ACTOR, GRACE, { kind: 'other', id: 'BP0001', name: 'hana  park', relationship: 'Mother', email: 'hana.new@example.net' }).ok).toBe(true)
    const kept = api.getState().schedule.bookings[GRACE]!.payer
    expect(kept.kind === 'other' && kept.id).toBe('BP0001')
    expect(setBookingPayer(api, OFFICE_ACTOR, GRACE, { kind: 'other', id: 'BP0001', name: 'John Park', relationship: 'Father' }).ok).toBe(true)
    const renamed = api.getState().schedule.bookings[GRACE]!.payer
    expect(renamed.kind === 'other' && renamed.id).toBe('BP0004')
  })

  it('saving the payer unchanged writes nothing (key order aside)', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    const hana = api.getState().schedule.bookings[GRACE]!.payer
    if (hana.kind !== 'other') throw new Error('expected Hana Park')
    expect(setBookingPayer(api, OFFICE_ACTOR, GRACE, { kind: 'other', id: hana.id, name: hana.name, relationship: hana.relationship, email: hana.email, phone: hana.phone, postalAddress: hana.postalAddress }).ok).toBe(true)
    expect(api.getState().audit.length).toBe(before)
  })

  it('History records the payer contact', () => {
    const api = createAppStore()
    setBookingPayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'patient', email: 'kevin@example.net' })
    expect(api.getState().audit.at(-1)).toMatchObject({ before: { payerContact: 'None' }, after: { payerContact: 'kevin@example.net' } })
  })

  it('refuses a different payer once a prepayment invoice is raised to the current one', () => {
    const api = createAppStore()
    const riley = SEED_MARKERS['prepaymentPaidBooking']?.entityId ?? 'BK0038'
    const s = api.getState()
    const hasPrepay = Object.values(s.billing.invoices).some((i) => i.bookingId === riley && i.kind === 'prePayment')
    expect(hasPrepay).toBe(true)
    expect(setBookingPayer(api, OFFICE_ACTOR, riley, { kind: 'other', name: 'Someone Else', email: 'x@example.net' })).toMatchObject({ ok: false, code: 'prepaymentRaised' })
  })
})
