/**
 * The Paid by sheet's one Save and "Another person" on a split (catch-up
 * Phase 22a; US-11.2.2, US-08.2.3, DM-28): the payer and the split are both
 * refused or both written; the split's "Payer" share follows the payer; a
 * share can name another person with their own BP id, invoiced to them, and
 * only a share to the patient warns for a child.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type AppState } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { authoriseList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { savePaidBy } from './paidByActions'
import { setProcedureSplit } from './splitActions'
import { payerRecordFor, proceduresForBooking } from './selectors'
import { SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import { payerContactMissing, childPayerOn } from '../domain/billing/whoIsBilled'
import { reviewInputFor } from './reviewSelectors'
import { reviewFlagsForBooking } from '../domain/billing/reviewFlags'

const TWO = SEED_MARKERS.twoPayerBooking!.entityId
type Api = ReturnType<typeof createAppStore>
const procs = (api: Api) => proceduresForBooking(api.getState(), TWO)
const standardInvoices = (s: AppState, bookingId: string) =>
  Object.values(s.billing.invoices).filter((i) => i.bookingId === bookingId && i.kind === 'standard')
const NEW_PERSON = { kind: 'other' as const, name: 'Ruth Halvorsen', relationship: 'Daughter', postalAddress: { line1: '12 Avon Street', city: 'Christchurch', postcode: '8011' } }

describe('"Another person" on a split (US-08.2.3, DM-28)', () => {
  it('names a person with a new BP id on the share; authorising invoices each share to its own person', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    const payerRef = { kind: 'payer' as const, id: 'BP0004' }
    const r = setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, {
      shares: [
        { party: payerRef, basis: { kind: 'percent', percent: 50 } },
        { person: NEW_PERSON, basis: { kind: 'rest' } },
      ],
    })
    expect(r.ok).toBe(true)
    const share = procs(api)[0]!.split!.shares[1]!
    expect(share.person).toMatchObject({ kind: 'other', id: 'BP0006', name: 'Ruth Halvorsen' })
    expect(share.party).toEqual({ kind: 'payer', id: 'BP0006' })
    expect(payerRecordFor(api.getState(), 'BP0006', TWO)?.name).toBe('Ruth Halvorsen')

    expect(authoriseList(api, OFFICE_ACTOR, SEED_LIST_IDS.payerReview).ok).toBe(true)
    expect(runBillingForList(api, SEED_LIST_IDS.payerReview).ok).toBe(true)
    const invoices = standardInvoices(api.getState(), TWO)
    const byId = new Map(invoices.map((i) => [i.counterparty.id, i]))
    expect([...byId.keys()].sort()).toEqual(['BP0004', 'BP0005', 'BP0006'])
    expect(byId.get('BP0006')!.billedTo).toMatchObject({ name: 'Ruth Halvorsen', postalAddress: { line1: '12 Avon Street' } })
    expect(byId.get('BP0006')!.delivery?.method).toBe('post')
  })

  it('keeps the person’s id when edited by the same name; a renamed person is a new id', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    const payerRef = { kind: 'payer' as const, id: 'BP0004' }
    setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, { shares: [{ party: payerRef, basis: { kind: 'percent', percent: 50 } }, { person: NEW_PERSON, basis: { kind: 'rest' } }] })
    const edit = (name: string) =>
      setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, {
        shares: [{ party: payerRef, basis: { kind: 'percent', percent: 50 } }, { person: { ...NEW_PERSON, id: 'BP0006', name, email: 'ruth@example.net' }, basis: { kind: 'rest' } }],
      })
    expect(edit('ruth  halvorsen').ok).toBe(true)
    expect(procs(api)[0]!.split!.shares[1]!.person).toMatchObject({ id: 'BP0006', email: 'ruth@example.net' })
    expect(edit('Ruth Smith').ok).toBe(true)
    expect(procs(api)[0]!.split!.shares[1]!.person).toMatchObject({ id: 'BP0007', name: 'Ruth Smith' })
  })

  it('refuses a person with no name and a share claiming a person this split does not hold', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    const blank = setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, { shares: [{ party: { kind: 'payer', id: 'BP0004' }, basis: { kind: 'rest' } }, { person: { ...NEW_PERSON, name: ' ' }, basis: { kind: 'percent', percent: 10 } }] })
    expect(blank).toMatchObject({ ok: false, code: 'payerNameRequired' })
    const forged = setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, {
      shares: [
        { party: { kind: 'payer', id: 'BP0004' }, basis: { kind: 'rest' } },
        { party: { kind: 'payer', id: 'BP0001' }, person: { kind: 'other', id: 'BP0001', name: 'Hana Park' }, basis: { kind: 'percent', percent: 10 } },
      ],
    })
    expect(forged).toMatchObject({ ok: false, code: 'partyUnknown' })
  })

  it('asks for another person’s contact (US-11.2.3) and never warns for them as a child; a share to the patient does', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, {
      shares: [{ party: { kind: 'payer', id: 'BP0004' }, basis: { kind: 'percent', percent: 50 } }, { person: { kind: 'other', name: 'No Contact' }, basis: { kind: 'rest' } }],
    })
    const s = api.getState()
    const proc = procs(api)[0]!
    const patient = s.masters.patients[s.schedule.bookings[TWO]!.patientId]
    const contract = s.masters.contracts[proc.governingContractId!]
    expect(payerContactMissing(proc, patient, contract)).toBe(true)
    const flags = reviewFlagsForBooking(reviewInputFor(s, s.schedule.bookings[TWO]!)!)
    expect(flags.some((f) => f.shot === 'review-payer-contact' && f.procedureId === proc.id)).toBe(true)
    // A child patient: only a share billed to the patient warns.
    const child = { dobISO: '2015-01-01' }
    expect(childPayerOn(proc, child, contract, '2026-07-17')).toBe(false)
    expect(childPayerOn({ ...proc, split: { shares: [{ party: { kind: 'patient', id: 'x' }, basis: { kind: 'rest' } }] } }, child, contract, '2026-07-17')).toBe(true)
  })
})

describe('savePaidBy: one Save for who pays, the offer and the split', () => {
  it('writes nothing when the split is refused, even though the payer alone would save', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    const before = api.getState().audit.length
    const r = savePaidBy(api, OFFICE_ACTOR, p1!.id, {
      payer: { input: { kind: 'patient' }, alsoApplyTo: [] },
      split: { shares: [{ party: { kind: 'patient', id: 'x' }, basis: { kind: 'percent', percent: 150 } }] },
    })
    expect(r.ok).toBe(false)
    expect(api.getState().audit.length).toBe(before)
    expect(procs(api)[0]!.payer).toMatchObject({ id: 'BP0004' })
  })

  it('writes nothing when the payer is refused, even though the split alone would save', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    const before = api.getState().audit.length
    const r = savePaidBy(api, OFFICE_ACTOR, p1!.id, {
      payer: { input: { kind: 'other', name: '' }, alsoApplyTo: [] },
      split: { shares: [{ party: { kind: 'payer', id: 'BP0004' }, basis: { kind: 'percent', percent: 50 } }, { person: NEW_PERSON, basis: { kind: 'rest' } }] },
    })
    expect(r).toMatchObject({ ok: false, code: 'payerNameRequired' })
    expect(api.getState().audit.length).toBe(before)
    expect(procs(api)[0]!.split).toBeUndefined()
  })

  it('writes both; the split’s "Payer" share follows the new payer', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    const r = savePaidBy(api, OFFICE_ACTOR, p1!.id, {
      payer: { input: { kind: 'other', name: 'Inga Halvorsen', relationship: 'Daughter', email: 'inga@example.net' }, alsoApplyTo: [] },
      split: { shares: [{ party: { kind: 'payer', id: 'BP0004' }, basis: { kind: 'percent', percent: 50 } }, { person: NEW_PERSON, basis: { kind: 'rest' } }] },
    })
    expect(r.ok).toBe(true)
    const proc = procs(api)[0]!
    expect(proc.payer).toMatchObject({ id: 'BP0006', name: 'Inga Halvorsen' })
    expect(proc.split!.shares[0]!.party).toEqual({ kind: 'payer', id: 'BP0006' })
    expect(proc.split!.shares[1]!.party).toEqual({ kind: 'payer', id: 'BP0007' })
    const actions = api.getState().audit.slice(-2).map((a) => a.action)
    expect(actions).toEqual(['procedure.payer', 'procedure.split'])
  })

  it('a payer change alone re-points an existing split’s "Payer" share', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, { shares: [{ party: { kind: 'payer', id: 'BP0004' }, basis: { kind: 'percent', percent: 40 } }, { person: NEW_PERSON, basis: { kind: 'rest' } }] })
    expect(savePaidBy(api, OFFICE_ACTOR, p1!.id, { payer: { input: { kind: 'patient' }, alsoApplyTo: [] } }).ok).toBe(true)
    const proc = procs(api)[0]!
    expect(proc.payer.kind).toBe('patient')
    expect(proc.split!.shares[0]!.party.kind).toBe('patient')
    expect(proc.split!.shares[1]!.person?.id).toBe('BP0006')
  })

  it('re-points the old payer’s share on an offered Procedure the change applied to (review fix)', () => {
    const api = createAppStore()
    const grace = SEED_MARKERS.guardianMinorBooking!.entityId
    const [g1, g2] = proceduresForBooking(api.getState(), grace)
    // Grace Park's second Procedure has no fee before its times, so give the split to the first and change the payer from the second.
    expect(setProcedureSplit(api, OFFICE_ACTOR, grace, g1!.id, { shares: [{ party: { kind: 'payer', id: 'BP0001' }, basis: { kind: 'percent', percent: 50 } }, { person: NEW_PERSON, basis: { kind: 'rest' } }] }).ok).toBe(true)
    const r = savePaidBy(api, OFFICE_ACTOR, g2!.id, { payer: { input: { kind: 'other', name: 'Ana Park', relationship: 'Aunt', email: 'ana@example.net' }, alsoApplyTo: [g1!.id] } })
    expect(r.ok).toBe(true)
    const [a, b] = proceduresForBooking(api.getState(), grace)
    expect(b!.payer).toMatchObject({ name: 'Ana Park' })
    const newId = b!.payer.kind === 'other' ? b!.payer.id : ''
    expect(a!.payer).toMatchObject({ id: newId })
    expect(a!.split!.shares[0]!.party).toEqual({ kind: 'payer', id: newId })
  })

  it('an unchanged split re-saved writes nothing', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    const split = { shares: [{ party: { kind: 'payer' as const, id: 'BP0004' }, basis: { kind: 'percent' as const, percent: 50 } }, { person: NEW_PERSON, basis: { kind: 'rest' as const } }] }
    setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, split)
    const before = api.getState().audit.length
    const stored = procs(api)[0]!.split!
    expect(setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, stored).ok).toBe(true)
    expect(api.getState().audit.length).toBe(before)
  })

  it('a stored person re-sent with changed details keeps the details this split holds', () => {
    const api = createAppStore()
    const [p1] = procs(api)
    setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, { shares: [{ party: { kind: 'payer', id: 'BP0004' }, basis: { kind: 'percent', percent: 50 } }, { person: NEW_PERSON, basis: { kind: 'rest' } }] })
    const forged = setProcedureSplit(api, OFFICE_ACTOR, TWO, p1!.id, {
      shares: [
        { party: { kind: 'payer', id: 'BP0004' }, basis: { kind: 'percent', percent: 40 } },
        { party: { kind: 'payer', id: 'BP0006' }, person: { kind: 'other', id: 'BP0006', name: '', email: 'bad' }, basis: { kind: 'rest' } },
      ],
    })
    expect(forged.ok).toBe(true)
    expect(procs(api)[0]!.split!.shares[1]!.person).toMatchObject({ id: 'BP0006', name: 'Ruth Halvorsen' })
  })
})
