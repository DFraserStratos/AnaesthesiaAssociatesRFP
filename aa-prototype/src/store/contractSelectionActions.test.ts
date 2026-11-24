/**
 * The step rail's writes (catch-up Phase 20; US-04.3.8, US-04.3.9, US-03.4.1,
 * FT-03.4, US-04.3.4, US-03.2.3).
 */

import { completeAnswered } from '../test/completeAnswered'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { setProcedureContract, setRailAnswers } from './contractSelectionActions'
import { setProcedurePrice } from './pricingActions'
import { authoriseList, completeBooking, editList, editProcedure, submitList } from './lifecycle'
import { addProcedure, createBooking } from './bookingActions'
import { bookingsForList, needsInvoiceDestinationBookings, proceduresForBooking, rvgCodeToFillFor } from './selectors'
import { approvePrepayment } from './prepaymentActions'
import { prepaymentStatusFor } from './prepaymentSelectors'
import { approveAllPrepayments } from '../test/approvePrepayments'
import type { Actor } from './mutate'
import { SEED_MARKERS } from '../domain/seed'
import { NO_CONTRACT_MESSAGE as NEEDS_DESTINATION_FAILURE } from '../domain/billing/completion'
import { nextTestNhi } from './testNhi'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
const COLLEAGUE: Actor = { who: 'Dr Mark Delaney', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '27731' }

const marker = (key: string) => SEED_MARKERS[key]!.entityId
const store = (): BoundAppStore => createAppStore()
const proc = (api: BoundAppStore, id: string) => api.getState().schedule.procedures[id]!
const firstProcOf = (api: BoundAppStore, bookingId: string) => proceduresForBooking(api.getState(), bookingId)[0]!
const listOf = (api: BoundAppStore, bookingId: string) => api.getState().schedule.bookings[bookingId]!.listId

/** Riley: Souter Fri 24 AM, Forte, Ms Lim, on Dr Souter's prepaid Rhinoplasty. */
const RILEY_PROC = 'P0036'
/** The first pre-op: Souter Thu 23 PM at AA rooms, no Contract, answered Patient › Standard. */
const pickUp = () => marker('railPickUpBooking')

function completeOthers(api: BoundAppStore, listId: string): void {
  for (const b of bookingsForList(api.getState(), listId)) {
    if (b.completed || b.cancellation !== undefined) continue
    for (const p of proceduresForBooking(api.getState(), b.id)) {
      if (p.governingContractId === undefined) setProcedureContract(api, OFFICE, p.id, 'CT-NO-CONTRACT')
      if (proc(api, p.id).rvgGroupId === undefined) editProcedure(api, OFFICE, p.id, { rvgGroupId: 'RG046' })
      editProcedure(api, OFFICE, p.id, { anaestheticStartISO: '2026-11-26T13:00:00', handoverISO: '2026-11-26T13:30:00' })
    }
    completeAnswered(api, OFFICE, b.id)
  }
}

describe('setProcedureContract', () => {
  it('the office sets a Contract on a Procedure that needs an invoice destination; answers so far cleared; one audit with before and after', () => {
    const api = store()
    const p = firstProcOf(api, pickUp())
    expect(p.railAnswers).toEqual({ destination: 'patient', narrow: 'standard' })
    expect(setProcedureContract(api, OFFICE, p.id, 'CT-NO-CONTRACT')).toMatchObject({ ok: true })
    expect(proc(api, p.id)).toMatchObject({ governingContractId: 'CT-NO-CONTRACT' })
    expect(proc(api, p.id).railAnswers).toBeUndefined()
    const audit = api.getState().audit.filter((a) => a.entityId === p.id && a.action === 'procedure.contract')
    expect(audit).toHaveLength(1)
    expect(audit[0]).toMatchObject({ who: 'Kirsty W.', before: { railAnswers: { destination: 'patient', narrow: 'standard' } }, after: { governingContractId: 'CT-NO-CONTRACT' } })
    expect(needsInvoiceDestinationBookings(api.getState()).some((r) => r.procedureId === p.id)).toBe(false)
  })

  it('the anaesthetist finishes the office pick on their own ACTIVE List, and changes it after submit with no reason', () => {
    const api = store()
    const p = firstProcOf(api, pickUp())
    expect(setProcedureContract(api, SOUTER, p.id, 'CT-NO-CONTRACT')).toMatchObject({ ok: true })
    expect(rvgCodeToFillFor(api.getState(), p.id)).toBe(true)
    const listId = listOf(api, pickUp())
    completeOthers(api, listId)
    expect(submitList(api, SOUTER, listId)).toMatchObject({ ok: true })
    expect(setProcedureContract(api, SOUTER, p.id, 'CT-FIX-PATIENT-STANDARD', { enteredPrice: 2000 })).toMatchObject({ ok: true })
    expect(proc(api, p.id)).toMatchObject({ governingContractId: 'CT-FIX-PATIENT-STANDARD', enteredPrice: 2000 })
    expect(authoriseList(api, OFFICE, listId)).toMatchObject({ ok: true })
    expect(setProcedureContract(api, SOUTER, p.id, 'CT-NO-CONTRACT')).toMatchObject({ ok: false, code: 'listAuthorised' })
    expect(setProcedureContract(api, OFFICE, p.id, 'CT-NO-CONTRACT')).toMatchObject({ ok: false, code: 'listAuthorised' })
  })

  it("refuses a colleague's List, a non-candidate and an unknown Contract", () => {
    const api = store()
    const p = firstProcOf(api, pickUp())
    expect(setProcedureContract(api, COLLEAGUE, p.id, 'CT-NO-CONTRACT')).toMatchObject({ ok: false, code: 'notOwnList' })
    expect(setProcedureContract(api, OFFICE, p.id, 'CT-STG-D1')).toMatchObject({ ok: false, code: 'notACandidate', message: 'That Contract does not apply to this Booking.' })
    expect(setProcedureContract(api, OFFICE, p.id, 'CT-NOPE')).toMatchObject({ ok: false, code: 'contractUnknown' })
  })

  it('never lets the anaesthetist onto or off a prepaid Contract; the office may', () => {
    const api = store()
    expect(setProcedureContract(api, SOUTER, RILEY_PROC, 'CT-NO-CONTRACT')).toMatchObject({ ok: false, code: 'prepaidOfficeOnly', message: 'Only the office changes a prepaid Contract.' })
    const p = firstProcOf(api, pickUp())
    expect(setProcedureContract(api, SOUTER, p.id, 'CT-FIX-PATIENT-PREPAID')).toMatchObject({ ok: false, code: 'prepaidOfficeOnly' })
    expect(setProcedureContract(api, OFFICE, RILEY_PROC, 'CT-NO-CONTRACT')).toMatchObject({ ok: true })
  })

  it('clears a typed price, keeps the recorded RVG code and units, and fills the default RVG code only when empty', () => {
    const api = store()
    const p = firstProcOf(api, pickUp())
    setProcedureContract(api, OFFICE, p.id, 'CT-FIX-PATIENT-STANDARD', { enteredPrice: 650 })
    editProcedure(api, OFFICE, p.id, { rvgGroupId: 'RG046', baseUnitsSelected: 6 })
    const before = proc(api, p.id)
    expect(setProcedureContract(api, OFFICE, p.id, 'CT-NO-CONTRACT')).toMatchObject({ ok: true })
    const after = proc(api, p.id)
    expect(after.enteredPrice).toBeUndefined()
    expect(after.rvgGroupId).toBe(before.rvgGroupId)
    expect(after.baseUnitsSelected).toBe(before.baseUnitsSelected)
  })

  it('keeps a Disabled Contract already on the Procedure (D81), and offers it to no one new', () => {
    const api = store()
    api.setState((s) => ({ masters: { ...s.masters, contracts: { ...s.masters.contracts, 'CT-NIB-D1': { ...s.masters.contracts['CT-NIB-D1']!, status: 'disabled' } } } }))
    const onNib = Object.values(api.getState().schedule.procedures).find((p) => p.governingContractId === 'CT-NIB-D1' && api.getState().schedule.lists[listOf(api, p.bookingId)]?.state === 'ACTIVE')!
    expect(setProcedureContract(api, OFFICE, onNib.id, 'CT-NIB-D1')).toMatchObject({ ok: true })
    const other = firstProcOf(api, pickUp())
    expect(setProcedureContract(api, OFFICE, other.id, 'CT-NIB-D1')).toMatchObject({ ok: false, code: 'notACandidate' })
  })

  it('editProcedure cannot set the Contract or what rides with it', () => {
    const api = store()
    const p = firstProcOf(api, pickUp())
    expect(editProcedure(api, OFFICE, p.id, { governingContractId: 'CT-NO-CONTRACT' } as never)).toMatchObject({ ok: false, code: 'contractThroughRail' })
  })
})

describe('setRailAnswers and the typed amount (setProcedurePrice since catch-up Phase 24)', () => {
  it('keeps the answers so far on a Procedure with no Contract; never Prepaid for the anaesthetist', () => {
    const api = store()
    const p = firstProcOf(api, marker('needsInvoiceDestinationBooking'))
    expect(setRailAnswers(api, OFFICE, p.id, { destination: 'hospital' })).toMatchObject({ ok: true })
    expect(proc(api, p.id).railAnswers).toEqual({ destination: 'hospital' })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedure.railAnswers' })
    expect(setRailAnswers(api, SOUTER, p.id, { destination: 'patient', narrow: 'prepaid' })).toMatchObject({ ok: false, code: 'prepaidOfficeOnly' })
    expect(setRailAnswers(api, OFFICE, RILEY_PROC, { destination: 'patient' })).toMatchObject({ ok: false, code: 'contractSet' })
  })

  it('an answer off the Contract\'s path releases it, saved and audited at once; the RVG code stays; prepaid only by the office', () => {
    const api = store()
    const p = firstProcOf(api, pickUp())
    setProcedureContract(api, OFFICE, p.id, 'CT-NO-CONTRACT')
    const code = proc(api, p.id).rvgGroupId
    expect(setRailAnswers(api, OFFICE, p.id, { destination: 'hospital' }, { releaseContract: true })).toMatchObject({ ok: true })
    expect(proc(api, p.id).governingContractId).toBeUndefined()
    expect(proc(api, p.id).railAnswers).toEqual({ destination: 'hospital' })
    expect(proc(api, p.id).rvgGroupId).toBe(code)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedure.contract', after: { governingContractId: undefined, railAnswers: { destination: 'hospital' } } })
    expect(setRailAnswers(api, SOUTER, RILEY_PROC, { destination: 'patient', narrow: 'standard' }, { releaseContract: true })).toMatchObject({ ok: false, code: 'prepaidOfficeOnly' })
  })

  it('types an amount: the office on any fallback, the anaesthetist only on No contract · Fixed price', () => {
    const api = store()
    const p = firstProcOf(api, pickUp())
    setProcedureContract(api, OFFICE, p.id, 'CT-FIX-PATIENT-STANDARD')
    expect(setProcedurePrice(api, SOUTER, p.id, 2000)).toMatchObject({ ok: true })
    expect(proc(api, p.id).enteredPrice).toBe(2000)
    const sx = Object.values(api.getState().schedule.procedures).find((x) => x.governingContractId === 'CT-SXAP' && api.getState().schedule.lists[listOf(api, x.bookingId)]?.state === 'ACTIVE')!
    const sxList = api.getState().schedule.lists[listOf(api, sx.bookingId)]!
    const owner: Actor = { who: 'Owner', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: sxList.anaesthetistId! }
    expect(setProcedureContract(api, owner, sx.id, 'CT-FIX-HOSPITAL-PY-SX-TAG-SXAP')).toMatchObject({ ok: true })
    expect(setProcedurePrice(api, owner, sx.id, 300)).toMatchObject({ ok: false, code: 'officeTypesAmount', message: 'The office types this amount.' })
    expect(setProcedurePrice(api, OFFICE, sx.id, 300)).toMatchObject({ ok: true })
  })
})

describe('creation, added Procedures and completion (US-04.3.4, US-03.2.3)', () => {
  it('a Booking created without a Contract needs an invoice destination; completion refuses it in those words', () => {
    const api = store()
    const listId = listOf(api, pickUp())
    const made = createBooking(api, OFFICE, listId, { patient: { nhi: nextTestNhi(), name: 'Test Person', dobISO: '1980-05-06' }, sourceText: { text: 'Pre-op assessment', source: 'anaesthetist' } })
    expect(made.ok).toBe(true)
    if (!made.ok) return
    const p = firstProcOf(api, made.value.bookingId)
    expect(p.governingContractId).toBeUndefined()
    expect(needsInvoiceDestinationBookings(api.getState()).some((r) => r.bookingId === made.value.bookingId)).toBe(true)
    expect(completeBooking(api, OFFICE, made.value.bookingId)).toMatchObject({ ok: false, message: NEEDS_DESTINATION_FAILURE })
  })

  it('a Booking created with a Contract is checked like the rail', () => {
    const api = store()
    const listId = listOf(api, pickUp())
    expect(createBooking(api, OFFICE, listId, { patient: { nhi: nextTestNhi(), name: 'Test Person', dobISO: '1980-05-06' }, sourceText: { text: 'X', source: 'anaesthetist' }, governingContractId: 'CT-STG-D1' })).toMatchObject({ ok: false, code: 'notACandidate' })
    const made = createBooking(api, OFFICE, listId, { patient: { nhi: nextTestNhi(), name: 'Test Person', dobISO: '1980-05-06' }, sourceText: { text: 'X', source: 'anaesthetist' }, governingContractId: 'CT-NO-CONTRACT' })
    expect(made.ok).toBe(true)
  })

  it('an added Procedure picks its own Contract or has none (the payer is the Booking\'s, catch-up Phase 21)', () => {
    const api = store()
    const guardian = marker('guardianMinorBooking')
    const first = firstProcOf(api, guardian)
    const none = addProcedure(api, OFFICE, guardian)
    expect(none.ok).toBe(true)
    if (!none.ok) return
    expect(proc(api, none.value.procedureId).governingContractId).toBeUndefined()
    // A Procedure added later copies the Booking's shared payer (catch-up Phase 22a, US-11.2.2).
    expect(proc(api, none.value.procedureId).payer).toMatchObject({ kind: 'other', id: 'BP0001' })
    void first
    const picked = addProcedure(api, OFFICE, guardian, { governingContractId: 'CT-NO-CONTRACT' })
    expect(picked.ok && proc(api, picked.value.procedureId).governingContractId).toBe('CT-NO-CONTRACT')
  })

  it("a List's hospital change re-defaults nothing", () => {
    const api = store()
    const booking = marker('needsInvoiceDestinationBooking')
    const listId = listOf(api, booking)
    const before = proceduresForBooking(api.getState(), booking).map((p) => p.governingContractId)
    expect(editList(api, OFFICE, listId, { hospitalId: 'H-STG' })).toMatchObject({ ok: true })
    expect(proceduresForBooking(api.getState(), booking).map((p) => p.governingContractId)).toEqual(before)
  })
})

describe('review-pass fixes (catch-up Phase 20)', () => {
  it("an anaesthetist confirming the same fallback never clears the office's typed amount", () => {
    const api = store()
    const sx = Object.values(api.getState().schedule.procedures).find((x) => x.governingContractId === 'CT-SXAP' && api.getState().schedule.lists[listOf(api, x.bookingId)]?.state === 'ACTIVE')!
    const owner: Actor = { who: 'Owner', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: api.getState().schedule.lists[listOf(api, sx.bookingId)]!.anaesthetistId! }
    expect(setProcedureContract(api, OFFICE, sx.id, 'CT-FIX-HOSPITAL-PY-SX-TAG-SXAP', { enteredPrice: 1234 })).toMatchObject({ ok: true })
    const audits = api.getState().audit.length
    expect(setProcedureContract(api, owner, sx.id, 'CT-FIX-HOSPITAL-PY-SX-TAG-SXAP')).toMatchObject({ ok: true })
    expect(proc(api, sx.id).enteredPrice).toBe(1234)
    expect(api.getState().audit.length).toBe(audits)
  })

  it('raises no prepayment invoice on Prepaid · Fixed price with no amount typed', () => {
    const api = store()
    const p = firstProcOf(api, pickUp())
    expect(setProcedureContract(api, OFFICE, p.id, 'CT-FIX-PATIENT-PREPAID')).toMatchObject({ ok: true })
    // Catch-up Phase 27: the payer group waits with no price; Approve and send is refused until an amount is typed.
    const [group] = prepaymentStatusFor(api.getState(), pickUp()).groups
    expect(group).toMatchObject({ status: 'awaitingApproval', amount: null, ready: false })
    const invoicesBefore = Object.keys(api.getState().billing.invoices).length
    expect(approvePrepayment(api, OFFICE, pickUp(), group!.payerKey)).toMatchObject({ ok: false, code: 'noPrice' })
    expect(Object.keys(api.getState().billing.invoices)).toHaveLength(invoicesBefore)
  })

  it('refuses Prepaid answers for the anaesthetist at creation too', () => {
    const api = store()
    const made = createBooking(api, SOUTER, listOf(api, pickUp()), {
      patient: { nhi: nextTestNhi(), name: 'Test Person', dobISO: '1980-05-06' },
      sourceText: { text: 'X', source: 'anaesthetist' },
      railAnswers: { destination: 'patient', narrow: 'prepaid' },
    })
    expect(made).toMatchObject({ ok: false, code: 'prepaidOfficeOnly' })
  })

  it('lists each Booking once on Needs an invoice destination, however many Procedures need one', () => {
    const api = store()
    const booking = marker('needsInvoiceDestinationBooking')
    expect(addProcedure(api, OFFICE, booking).ok).toBe(true)
    expect(needsInvoiceDestinationBookings(api.getState()).filter((r) => r.bookingId === booking)).toHaveLength(1)
  })

  it('keeps a sent prepayment invoice, never rewritten, when the office moves the Procedure off prepaid, and credits it (catch-up Phase 41)', () => {
    const api = store()
    const riley = marker('prepaymentBooking')
    const [invoiceId] = approveAllPrepayments(api, riley)
    expect(invoiceId).toBeDefined()
    const invoiceBefore = api.getState().billing.invoices[invoiceId!]
    expect(setProcedureContract(api, OFFICE, RILEY_PROC, 'CT-NO-CONTRACT')).toMatchObject({ ok: true })
    // The sent invoice stays as it was; catch-up Phase 41 (D67) settles it as a cancellation: credited in full, no group left.
    expect(api.getState().billing.invoices[invoiceId!]).toEqual(invoiceBefore)
    const status = prepaymentStatusFor(api.getState(), riley)
    expect(status.status).toBe('none')
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
    expect(Object.values(api.getState().billing.creditNotes).filter((r) => !r.id.startsWith('HS')).map((c) => [c.originalInvoiceId, c.cause])).toEqual([[invoiceId, 'prepaidContractChanged']])
  })
})
