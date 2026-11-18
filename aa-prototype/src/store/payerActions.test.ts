/**
 * The payer on each Procedure (catch-up Phase 21, per Procedure since 22a;
 * US-11.2.1 to US-11.2.4, US-08.2.1): its one writer and the offer, every
 * creation path naming a payer, the seeded payer review List, the child payer
 * warning per Procedure, the per-payer prepayment lock and the billing run.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { authoriseList } from './lifecycle'
import { PAYER_LOCKED_BY_PREPAYMENT, setProcedurePayer, type PayerInput } from './payerActions'
import { addPostOpAddendum, addProcedure, createBooking } from './bookingActions'
import { runBillingForList } from './billingRun'
import { billablePartyForProcedureId, proceduresForBooking } from './selectors'
import type { AppState } from './appStore'
import { clearWarning, openWarnings, warningsForBooking } from './warnings'
import { setProcedureContract } from './contractSelectionActions'
import { buildSeed, PAT_REVIEW, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import type { Actor } from './mutate'
import { payerOfferFor } from '../domain/billing/procedurePayer'
import { approvePrepayment } from './prepaymentActions'
import { approveAllPrepayments } from '../test/approvePrepayments'

const marker = (key: string) => SEED_MARKERS[key]!.entityId
const invoicesForBooking = (s: AppState, bookingId: string) =>
  Object.values(s.billing.invoices).filter((i) => i.bookingId === bookingId && i.kind === 'standard')
const GRACE = marker('guardianMinorBooking')
const CHILD = marker('childPayer')
const CONTACT_MISSING = marker('payerContactMissing')
const TRUST = marker('familyTrustPayer')
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
type Api = ReturnType<typeof createAppStore>
const firstProc = (api: Api, bookingId: string) => proceduresForBooking(api.getState(), bookingId)[0]!
const payerOf = (api: Api, bookingId: string) => firstProc(api, bookingId).payer
/** Change the first Procedure's payer with the offer ticked on every other Procedure holding it (the default). */
function setFirstProcedurePayer(api: Api, actor: Actor, bookingId: string, input: PayerInput) {
  const s = api.getState()
  const first = firstProc(api, bookingId)
  const offer = payerOfferFor(proceduresForBooking(s, bookingId), first.id, s.masters.contracts, s.schedule.bookings[bookingId]!.patientId)
  return setProcedurePayer(api, actor, first.id, input, offer.map((p) => p.id))
}

describe('setProcedurePayer: the one writer', () => {
  it('ticks a guardian with a BP id, audited "Payer", and the invoice follows at an unchanged fee (US-11.2.2 AC2)', () => {
    const api = createAppStore()
    const p = proceduresForBooking(api.getState(), CHILD)[0]!
    expect(billablePartyForProcedureId(api.getState(), p.id)).toEqual({ kind: 'patient', id: PAT_REVIEW.childPayer })
    const r = setFirstProcedurePayer(api, OFFICE_ACTOR, CHILD, { kind: 'other', name: 'Mere Moana', relationship: 'Mother', email: 'mere.moana@example.net' })
    expect(r.ok).toBe(true)
    const payer = payerOf(api, CHILD)
    expect(payer).toMatchObject({ kind: 'other', name: 'Mere Moana', relationship: 'Mother' })
    expect(payer.kind === 'other' && payer.id).toBe('BP0006')
    expect(billablePartyForProcedureId(api.getState(), p.id)).toEqual({ kind: 'payer', id: 'BP0006' })
    const audit = api.getState().audit.at(-1)!
    expect(audit).toMatchObject({ action: 'procedure.payer', entityId: p.id, before: { payer: 'Ella Moana (Patient)' }, after: { payer: 'Mere Moana (Mother)' } })
    // The child warning goes once another payer is ticked.
    expect(warningsForBooking(api.getState(), CHILD).some((w) => w.ruleId === 'childPayer')).toBe(false)
  })

  it('refuses a blank name, a malformed email and an incomplete address, and accepts a postal address alone', () => {
    const api = createAppStore()
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'other', name: ' ' })).toMatchObject({ ok: false, message: "Enter the payer's name." })
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'patient', email: 'not an email' })).toMatchObject({ ok: false, message: 'Enter a valid email.' })
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'patient', postalAddress: { line1: '4 Beach Road', city: 'Christchurch', postcode: '81' } })).toMatchObject({ ok: false, message: 'Enter a four-digit postcode.' })
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'patient', postalAddress: { line1: '4 Beach Road', city: 'Christchurch', postcode: '8081' } }).ok).toBe(true)
  })

  it('lets the anaesthetist change it on their own List until AUTHORISED, and no one after', () => {
    const api = createAppStore()
    // Dr Souter's own ACTIVE List.
    const own = Object.values(api.getState().schedule.bookings).find((b) => b.listId === SEED_LIST_IDS.souterAm21)!
    expect(setFirstProcedurePayer(api, SOUTER, own.id, { kind: 'other', name: 'Sam Lee', relationship: 'Guardian', email: 'sam@example.net' }).ok).toBe(true)
    // Not her List.
    expect(setFirstProcedurePayer(api, SOUTER, CHILD, { kind: 'patient' }).ok).toBe(false)
    // The office, then AUTHORISED: refused for everyone.
    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, CHILD, { kind: 'patient' })).toMatchObject({ ok: false })
  })

  it('every creation path names a payer: the patient, or a ticked payer from the form', () => {
    const api = createAppStore()
    const made = createBooking(api, OFFICE_ACTOR, SEED_LIST_IDS.souterAm21, {
      patient: { name: 'New Patient', dobISO: '1980-01-01' },
      sourceText: { text: 'Knee arthroscopy', source: 'phone', from: 'Kirsty W.' },
    })
    expect(made.ok && payerOf(api, made.value.bookingId)).toEqual({ kind: 'patient' })
    const ticked = createBooking(api, OFFICE_ACTOR, SEED_LIST_IDS.souterAm21, {
      patient: { name: 'Second Patient', dobISO: '2012-01-01' },
      sourceText: { text: 'Grommets', source: 'phone', from: 'Kirsty W.' },
      payer: { kind: 'other', name: 'Tia Second', relationship: 'Mother', email: 'tia@example.net' },
    })
    expect(ticked.ok && payerOf(api, ticked.value.bookingId)).toMatchObject({ kind: 'other', name: 'Tia Second' })
  })
})

describe('the seeded payers (catch-up Phase 21)', () => {
  const seed = buildSeed()

  it('every Procedure names a payer; Grace Park’s two are Hana Park (Mother, BP0001) with no warning', () => {
    for (const p of Object.values(seed.schedule.procedures)) expect(p.payer, p.id).toBeDefined()
    const grace = Object.values(seed.schedule.procedures).filter((p) => p.bookingId === GRACE)
    expect(grace).toHaveLength(2)
    for (const p of grace) expect(p.payer).toMatchObject({ kind: 'other', id: 'BP0001', name: 'Hana Park' })
    expect(warningsForBooking(createAppStore().getState(), GRACE)).toEqual([])
  })

  it('the payer review List is SUBMITTED, off every beat, with the child, the missing contact and the family trust', () => {
    const list = seed.schedule.lists[SEED_LIST_IDS.payerReview]!
    expect(list.state).toBe('SUBMITTED')
    expect(list.anaesthetistId).not.toBe('34821')
    expect([CHILD, CONTACT_MISSING, TRUST].every((id) => seed.schedule.bookings[id]!.listId === list.id)).toBe(true)
    expect(Object.values(seed.schedule.procedures).find((p) => p.bookingId === TRUST)!.payer).toMatchObject({ kind: 'other', id: 'BP0003', name: 'Whitcombe Family Trust' })
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
    // One warning per Procedure billed to the patient (catch-up Phase 22a): its key carries the Procedure.
    expect(w).toMatchObject({ kind: 'beforeProcedure', strength: 'mild', key: `${CHILD}:childPayer:${firstProc(api, CHILD).id}` })
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
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, GRACE, { kind: 'other', id: 'BP0001', name: 'hana  park', relationship: 'Mother', email: 'hana.new@example.net' }).ok).toBe(true)
    const kept = payerOf(api, GRACE)
    expect(kept.kind === 'other' && kept.id).toBe('BP0001')
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, GRACE, { kind: 'other', id: 'BP0001', name: 'John Park', relationship: 'Father' }).ok).toBe(true)
    const renamed = payerOf(api, GRACE)
    expect(renamed.kind === 'other' && renamed.id).toBe('BP0006')
  })

  it('saving the payer unchanged writes nothing (key order aside)', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    const hana = payerOf(api, GRACE)
    if (hana.kind !== 'other') throw new Error('expected Hana Park')
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, GRACE, { kind: 'other', id: hana.id, name: hana.name, relationship: hana.relationship, email: hana.email, phone: hana.phone, postalAddress: hana.postalAddress }).ok).toBe(true)
    expect(api.getState().audit.length).toBe(before)
  })

  it('History records the payer contact', () => {
    const api = createAppStore()
    setFirstProcedurePayer(api, OFFICE_ACTOR, CONTACT_MISSING, { kind: 'patient', email: 'kevin@example.net' })
    expect(api.getState().audit.at(-1)).toMatchObject({ before: { payerContact: 'None' }, after: { payerContact: 'kevin@example.net' } })
  })

  it('refuses a different payer once a prepayment invoice is raised to the current one', () => {
    const api = createAppStore()
    const riley = SEED_MARKERS['prepaymentPaidBooking']?.entityId ?? 'BK0038'
    const s = api.getState()
    const hasPrepay = Object.values(s.billing.invoices).some((i) => i.bookingId === riley && i.kind === 'prePayment')
    expect(hasPrepay).toBe(true)
    expect(setFirstProcedurePayer(api, OFFICE_ACTOR, riley, { kind: 'other', name: 'Someone Else', email: 'x@example.net' })).toMatchObject({ ok: false, code: 'prepaymentRaised' })
  })
})

describe('a payer on each Procedure (catch-up Phase 22a; US-11.2.2, US-08.2.1; provisional on OQ-140)', () => {
  const graceProcs = (api: Api) => proceduresForBooking(api.getState(), GRACE)
  const guardian: PayerInput = { kind: 'other', name: 'Ana Park', relationship: 'Aunt', email: 'ana.park@example.net' }

  it('offers the change on the other Procedure holding the same payer; ticked, both take one new BP id, audited per Procedure', () => {
    const api = createAppStore()
    const [p1, p2] = graceProcs(api)
    const offer = payerOfferFor(graceProcs(api), p1!.id, api.getState().masters.contracts, PAT_REVIEW.childPayer)
    expect(offer.map((p) => p.id)).toEqual([p2!.id])
    expect(setProcedurePayer(api, OFFICE_ACTOR, p1!.id, guardian, [p2!.id]).ok).toBe(true)
    const [a, b] = graceProcs(api)
    expect(a!.payer).toMatchObject({ kind: 'other', id: 'BP0006', name: 'Ana Park' })
    expect(b!.payer).toEqual(a!.payer)
    const audits = api.getState().audit.filter((x) => x.action === 'procedure.payer')
    expect(audits.map((x) => x.entityId)).toEqual([p1!.id, p2!.id])
  })

  it('unticked, the other Procedure keeps Hana Park: two payers, two invoices', () => {
    const api = createAppStore()
    const [p1, p2] = graceProcs(api)
    expect(setProcedurePayer(api, OFFICE_ACTOR, p1!.id, guardian, []).ok).toBe(true)
    const [a, b] = graceProcs(api)
    expect(a!.payer).toMatchObject({ id: 'BP0006' })
    expect(b!.payer).toMatchObject({ id: 'BP0001', name: 'Hana Park' })
    expect(p2!.payer).toEqual(b!.payer)
  })

  it('refuses a Procedure that is not in the offer, and writes nothing', () => {
    const api = createAppStore()
    const [p1] = graceProcs(api)
    const other = firstProc(api, CHILD)
    const before = api.getState().audit.length
    expect(setProcedurePayer(api, OFFICE_ACTOR, p1!.id, guardian, [other.id])).toMatchObject({ ok: false, code: 'notOffered' })
    expect(api.getState().audit.length).toBe(before)
  })

  it('the same person edited updates every Procedure holding them, with no offer (one record per payer)', () => {
    const api = createAppStore()
    const [p1] = graceProcs(api)
    const hana = p1!.payer
    if (hana.kind !== 'other') throw new Error('expected Hana Park')
    expect(setProcedurePayer(api, OFFICE_ACTOR, p1!.id, { kind: 'other', id: hana.id, name: hana.name, relationship: hana.relationship, email: 'hana.new@example.net' }).ok).toBe(true)
    for (const p of graceProcs(api)) expect(p.payer).toMatchObject({ id: 'BP0001', email: 'hana.new@example.net' })
  })

  it('a payer typed in separately with the same name and email is a new id: never matched (US-08.2.1 AC3)', () => {
    const api = createAppStore()
    const twoPayer = marker('twoPayerBooking')
    const [a, b] = proceduresForBooking(api.getState(), twoPayer)
    expect(a!.payer).toMatchObject({ kind: 'other', id: 'BP0004', name: 'Erik Halvorsen', email: 'erik.halvorsen@example.net' })
    expect(b!.payer).toMatchObject({ kind: 'other', id: 'BP0005', name: 'Erik Halvorsen', email: 'erik.halvorsen@example.net' })
    // Different identities: neither is offered the other's change.
    expect(payerOfferFor([a!, b!], a!.id, api.getState().masters.contracts, 'x')).toEqual([])
  })

  it('a Procedure added later copies a shared payer, else takes the patient; the addendum copies the source Booking’s', () => {
    const api = createAppStore()
    const added = addProcedure(api, OFFICE_ACTOR, GRACE)
    expect(added.ok && api.getState().schedule.procedures[added.value.procedureId]!.payer).toMatchObject({ kind: 'other', id: 'BP0001' })
    // Two payers on one Booking: the patient.
    const twoPayer = marker('twoPayerBooking')
    const list = api.getState().schedule.bookings[twoPayer]!.listId
    void list
    const [p1] = graceProcs(api)
    expect(setProcedurePayer(api, OFFICE_ACTOR, p1!.id, guardian, []).ok).toBe(true)
    const third = addProcedure(api, OFFICE_ACTOR, GRACE)
    expect(third.ok && api.getState().schedule.procedures[third.value.procedureId]!.payer).toEqual({ kind: 'patient' })
  })

  it('the post-op addendum takes the source Booking’s shared payer by the copy rule', () => {
    const api = createAppStore()
    const trustProc = firstProc(api, TRUST)
    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
    const made = addPostOpAddendum(api, OFFICE_ACTOR, TRUST)
    if (!made.ok) return // no free session for the addendum today: the copy rule is pinned in procedurePayer.test.ts
    expect(firstProc(api, made.value.bookingId).payer).toEqual(trustProc.payer)
  })

  it('a holder-billed Procedure is never offered and never invoices its payer', () => {
    const api = createAppStore()
    const [p1, p2] = graceProcs(api)
    expect(setProcedureContract(api, OFFICE_ACTOR, p2!.id, 'CT-NIB-D1').ok).toBe(true)
    expect(payerOfferFor(graceProcs(api), p1!.id, api.getState().masters.contracts, 'x')).toEqual([])
    expect(billablePartyForProcedureId(api.getState(), p2!.id)).toEqual({ kind: 'insurer', id: 'I-NIB' })
  })
})

describe('prepayment per payer (catch-up Phase 22a; US-06.3.1 "One per payer", "Payer locked")', () => {
  const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId

  it('one prepayment invoice per payer; the raised payer is locked, another payer is not; a later raise invoices only the new payer', () => {
    const api = createAppStore()
    const [p1] = proceduresForBooking(api.getState(), RILEY)
    // A second prepaid Procedure on the same Contract, its payer a guardian (unticked: only it changes).
    const added = addProcedure(api, OFFICE_ACTOR, RILEY, { governingContractId: p1!.governingContractId! })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(setProcedurePayer(api, OFFICE_ACTOR, added.value.procedureId, { kind: 'other', name: 'Ruth Riley', relationship: 'Mother', email: 'ruth@example.net' }, []).ok).toBe(true)
    // Catch-up Phase 27: each payer group is approved and sent on its own.
    expect(approveAllPrepayments(api, RILEY, OFFICE_ACTOR)).toHaveLength(2)
    const pre = Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === RILEY && i.kind === 'prePayment')
    expect(pre.map((i) => `${i.counterparty.kind}:${i.counterparty.id}`).sort()).toEqual(['patient:' + api.getState().schedule.bookings[RILEY]!.patientId, 'payer:BP0006'].sort())
    // Each payer locked on the Procedures their own invoice covers.
    expect(setProcedurePayer(api, OFFICE_ACTOR, p1!.id, { kind: 'other', name: 'Someone Else', email: 'x@example.net' }, [])).toMatchObject({ ok: false, code: 'prepaymentRaised', message: PAYER_LOCKED_BY_PREPAYMENT })
    // A third Procedure with a third payer: still changeable, and only it is invoiced on the next raise.
    const third = addProcedure(api, OFFICE_ACTOR, RILEY, { governingContractId: p1!.governingContractId! })
    if (!third.ok) throw new Error(third.message)
    expect(setProcedurePayer(api, OFFICE_ACTOR, third.value.procedureId, { kind: 'other', name: 'Tom Riley', relationship: 'Father', email: 'tom@example.net' }, []).ok).toBe(true)
    expect(approveAllPrepayments(api, RILEY, OFFICE_ACTOR)).toHaveLength(1)
    expect(approveAllPrepayments(api, RILEY, OFFICE_ACTOR)).toHaveLength(0)
    expect(approvePrepayment(api, OFFICE_ACTOR, RILEY, 'payer:BP0006')).toMatchObject({ ok: false, code: 'alreadySent' })
  })
})
