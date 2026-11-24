import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { copyStateIntoDraft, type Actor } from './mutate'
import { markDraftStore } from './draftMode'
import { OFFICE_ACTOR, SECOND_OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { cancelBooking, editBooking, editProcedure } from './lifecycle'
import { addProcedure, removeProcedure } from './bookingActions'
import { editPatient } from './intake'
import { setInvoiceDescription } from './procedureTextActions'
import { setProcedurePayer, PAYER_LOCKED_BY_PREPAYMENT } from './payerActions'
import { setProcedureContract } from './contractSelectionActions'
import { setPrepaymentApprovalRequired } from './prepaymentActions'
import { approveAllPrepayments } from '../test/approvePrepayments'
import {
  saveBookingChanges,
  saveBookingPatch,
  RECEIVED_TEXT_MESSAGE,
  SAVE_ADD_COMPLETED_MESSAGE,
  SAVE_NHI_REQUIRED_MESSAGE,
  SAVE_REMOVE_COMPLETED_MESSAGE,
  SAVE_RVG_DETAIL_COMPLETED_MESSAGE,
} from './bookingSaveActions'
import { lastChangeSetFor } from './changeSetSelectors'
import { snapshotBooking } from '../domain/changeSets'
import type { List } from '../domain/types'
import { SEED_MARKERS } from '../domain/seed'

const BOOKING = SEED_MARKERS['pendingCaptureBooking']!.entityId

function setup(): { real: AppStoreApi; draft: AppStoreApi; base: ReturnType<typeof snapshotBooking> & object; draftStart: number } {
  const real = createAppStore()
  const draft = createAppStore()
  markDraftStore(draft)
  copyStateIntoDraft(draft, real.getState())
  const base = snapshotBooking(real.getState(), BOOKING)!
  return { real, draft, base, draftStart: draft.getState().audit.length }
}

function save(s: ReturnType<typeof setup>, actor: Actor = OFFICE_ACTOR) {
  return saveBookingChanges(s.real, actor, BOOKING, {
    base: s.base,
    next: snapshotBooking(s.draft.getState(), BOOKING)!,
    draftAudit: s.draft.getState().audit.slice(s.draftStart),
  })
}

describe('saveBookingChanges', () => {
  it('writes one change set: a booking.save header first, then the field entries, all as the office', () => {
    const s = setup()
    const before = s.real.getState().audit.length
    expect(editBooking(s.draft, OFFICE_ACTOR, BOOKING, { notes: 'Rooms called', scheduledTime: '09:35' }).ok).toBe(true)
    const out = save(s)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const added = s.real.getState().audit.slice(before)
    expect(added.length).toBeGreaterThanOrEqual(2)
    expect(new Set(added.map((e) => e.changeSetId))).toEqual(new Set([out.value.changeSetId]))
    expect(added[0]!.action).toBe('booking.save')
    expect(added[0]!.changeSetKind).toBe('save')
    expect(added.every((e) => e.who === 'Kirsty W.' && e.source === 'office')).toBe(true)
    const update = added.find((e) => e.action === 'booking.update')!
    expect(update.after).toMatchObject({ notes: 'Rooms called', scheduledTime: '09:35' })
    expect(JSON.stringify(update.after)).not.toContain('lastModified')
    expect(s.real.getState().schedule.bookings[BOOKING]!.notes).toBe('Rooms called')
    expect(lastChangeSetFor(s.real.getState(), BOOKING)?.count).toBe(2)
  })

  it('refuses an anaesthetist (their edits stay immediate)', () => {
    const s = setup()
    editBooking(s.draft, OFFICE_ACTOR, BOOKING, { notes: 'x' })
    const out = save(s, SOUTER_ACTOR)
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.code).toBe('officeOnly')
  })

  it('applies onto the real state: a field written meanwhile is left alone and before comes from the real value', () => {
    const s = setup()
    editBooking(s.draft, OFFICE_ACTOR, BOOKING, { scheduledTime: '10:05' })
    editBooking(s.real, SOUTER_ACTOR, BOOKING, { notes: 'Written meanwhile' })
    editBooking(s.real, SOUTER_ACTOR, BOOKING, { scheduledTime: '09:50' })
    const out = save(s)
    expect(out.ok).toBe(true)
    const booking = s.real.getState().schedule.bookings[BOOKING]!
    expect(booking.notes).toBe('Written meanwhile')
    expect(booking.scheduledTime).toBe('10:05')
    const update = s.real.getState().audit.findLast((e) => e.action === 'booking.update')!
    expect(update.before).toMatchObject({ scheduledTime: '09:50' })
  })

  it('blocks when the Booking was cancelled while editing, and writes nothing', () => {
    const s = setup()
    editBooking(s.draft, OFFICE_ACTOR, BOOKING, { notes: 'x' })
    expect(cancelBooking(s.real, OFFICE_ACTOR, BOOKING, 'Patient unwell').ok).toBe(true)
    const length = s.real.getState().audit.length
    const out = save(s)
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.code).toBe('blocked')
      expect(out.message).toMatch(/cancelled .*Nothing was saved\./)
    }
    expect(s.real.getState().audit.length).toBe(length)
  })

  it('gives a Procedure created in the draft a fresh id when the real store allocated one meanwhile', () => {
    const s = setup()
    const drafted = addProcedure(s.draft, OFFICE_ACTOR, BOOKING)
    const meanwhile = addProcedure(s.real, OFFICE_ACTOR, BOOKING)
    expect(drafted.ok && meanwhile.ok).toBe(true)
    if (!drafted.ok || !meanwhile.ok) return
    expect(drafted.value.procedureId).toBe(meanwhile.value.procedureId)
    const out = save(s)
    expect(out.ok).toBe(true)
    const own = Object.values(s.real.getState().schedule.procedures).filter((p) => p.bookingId === BOOKING)
    expect(own.length).toBe(Object.keys(s.base.procedures).length + 2)
    expect(own.filter((p) => p.isPrimary).length).toBe(1)
  })

  it('refuses an empty or invalid NHI, and saves a valid one', () => {
    const s = setup()
    const patientId = s.base.booking.patientId
    const next = snapshotBooking(s.draft.getState(), BOOKING)!
    const empty = saveBookingChanges(s.real, OFFICE_ACTOR, BOOKING, { base: s.base, next: { ...next, patient: { ...next.patient!, nhi: '' } } })
    expect(empty.ok ? '' : empty.message).toBe(SAVE_NHI_REQUIRED_MESSAGE)
    const bad = saveBookingChanges(s.real, OFFICE_ACTOR, BOOKING, { base: s.base, next: { ...next, patient: { ...next.patient!, nhi: 'ZZZ0000' } } })
    expect(bad.ok).toBe(false)
    expect(editPatient(s.draft, OFFICE_ACTOR, patientId, { name: 'Renamed Patient' }).ok).toBe(true)
    expect(save(s).ok).toBe(true)
    expect(s.real.getState().masters.patients[patientId]!.name).toBe('Renamed Patient')
  })

  it('never changes the text as received', () => {
    const s = setup()
    const next = snapshotBooking(s.draft.getState(), BOOKING)!
    const [pid, p] = Object.entries(next.procedures)[0]!
    const rewritten = { ...next, procedures: { ...next.procedures, [pid]: { ...p, procedureText: { text: 'Edited', source: 'phone' as const, receivedAtISO: '2026-11-24T08:00:00' } } } }
    const length = s.real.getState().audit.length
    const out = saveBookingChanges(s.real, OFFICE_ACTOR, BOOKING, { base: s.base, next: rewritten })
    expect(out.ok ? '' : out.message).toContain(RECEIVED_TEXT_MESSAGE)
    expect(s.real.getState().audit.length).toBe(length)
  })

  it("keeps the action code the draft used: an invoice description edit lands as procedure.invoiceDescription.set", () => {
    const s = setup()
    const pid = Object.keys(s.base.procedures)[0]!
    expect(setInvoiceDescription(s.draft, OFFICE_ACTOR, pid, 'Knee arthroscopy, left').ok).toBe(true)
    editProcedure(s.draft, OFFICE_ACTOR, pid, { intNotes: 'Note' })
    const out = save(s)
    expect(out.ok).toBe(true)
    const set = s.real.getState().audit.findLast((e) => e.action === 'procedure.invoiceDescription.set')!
    expect(set.after).toMatchObject({ invoiceDescription: 'Knee arthroscopy, left' })
    expect(set.changeSetId).toBe(out.ok ? out.value.changeSetId : '')
  })

  it('names each office user on their own save', () => {
    const s = setup()
    expect(saveBookingPatch(s.real, OFFICE_ACTOR, BOOKING, { booking: { notes: 'One' } }).ok).toBe(true)
    expect(saveBookingPatch(s.real, SECOND_OFFICE_ACTOR, BOOKING, { booking: { notes: 'Two' } }).ok).toBe(true)
    const saves = s.real.getState().audit.filter((e) => e.action === 'booking.save' && e.entityId === BOOKING)
    expect(saves.map((e) => e.who)).toEqual(['Kirsty W.', 'Sam T.'])
  })

  it('refuses a save with no changes', () => {
    const s = setup()
    const out = save(s)
    expect(out.ok ? '' : out.code).toBe('noChanges')
  })
})

describe('saveBookingChanges: review fixes (catch-up Phase 35 close-out)', () => {
  const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId
  const FEE_SPLIT = SEED_MARKERS['feeSplitBooking']!.entityId

  function setupFor(bookingId: string, before?: (real: AppStoreApi) => void) {
    const real = createAppStore()
    before?.(real)
    const draft = createAppStore()
    markDraftStore(draft)
    copyStateIntoDraft(draft, real.getState())
    const base = snapshotBooking(real.getState(), bookingId)!
    const draftStart = draft.getState().audit.length
    const saveIt = (next = snapshotBooking(draft.getState(), bookingId)!) =>
      saveBookingChanges(real, OFFICE_ACTOR, bookingId, { base, next, draftAudit: draft.getState().audit.slice(draftStart) })
    return { real, draft, base, saveIt }
  }
  const procsOf = (api: AppStoreApi, bookingId: string) => Object.values(api.getState().schedule.procedures).filter((p) => p.bookingId === bookingId)
  const setCompleted = (api: AppStoreApi, bookingId: string) =>
    api.setState((s) => ({ schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [bookingId]: { ...s.schedule.bookings[bookingId]!, completed: true } } } }))

  it('re-allocates a new other payer id from the real counter when the real store allocated the same id meanwhile', () => {
    const s = setupFor(BOOKING)
    const pid = Object.keys(s.base.procedures)[0]!
    expect(setProcedurePayer(s.draft, OFFICE_ACTOR, pid, { kind: 'other', name: 'Ruth Halvorsen', relationship: 'Mother', email: 'ruth@example.net' }).ok).toBe(true)
    const draftId = (s.draft.getState().schedule.procedures[pid]!.payer as { id: string }).id
    // Meanwhile the real store names a new payer on another Booking, taking the same BP id.
    const other = procsOf(s.real, RILEY)[0]!
    expect(setProcedurePayer(s.real, OFFICE_ACTOR, other.id, { kind: 'other', name: 'Tom Riley', relationship: 'Father', email: 'tom@example.net' }).ok).toBe(true)
    const realOther = (s.real.getState().schedule.procedures[other.id]!.payer as { id: string }).id
    expect(realOther).toBe(draftId)
    const counterBefore = s.real.getState().counters['billableParty']!
    expect(s.saveIt().ok).toBe(true)
    const saved = s.real.getState().schedule.procedures[pid]!.payer
    expect(saved).toMatchObject({ kind: 'other', name: 'Ruth Halvorsen' })
    expect((saved as { id: string }).id).not.toBe(realOther)
    expect((saved as { id: string }).id).toBe(`BP${String(counterBefore).padStart(4, '0')}`)
    expect(s.real.getState().counters['billableParty']).toBe(counterBefore + 1)
  })

  it('refuses, and writes nothing, when the List was authorised while editing', () => {
    const s = setupFor(BOOKING)
    editBooking(s.draft, OFFICE_ACTOR, BOOKING, { notes: 'x' })
    const listId = s.base.booking.listId
    s.real.setState((st) => ({ schedule: { ...st.schedule, lists: { ...st.schedule.lists, [listId]: { ...st.schedule.lists[listId]!, state: 'AUTHORISED' } as List } } }))
    const length = s.real.getState().audit.length
    const out = s.saveIt()
    expect(out.ok ? '' : out.message).toMatch(/authorised while you were editing/)
    expect(s.real.getState().audit.length).toBe(length)
  })

  it('lands a Contract change with a typed price in one change set', () => {
    const s = setupFor(BOOKING)
    const pid = Object.keys(s.base.procedures)[0]!
    expect(setProcedureContract(s.draft, OFFICE_ACTOR, pid, 'CT-FIX-PATIENT-STANDARD', { enteredPrice: 650 })).toMatchObject({ ok: true })
    const before = s.real.getState().audit.length
    const out = s.saveIt()
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(s.real.getState().schedule.procedures[pid]).toMatchObject({ governingContractId: 'CT-FIX-PATIENT-STANDARD', enteredPrice: 650 })
    const added = s.real.getState().audit.slice(before)
    expect(new Set(added.map((e) => e.changeSetId))).toEqual(new Set([out.value.changeSetId]))
    expect(added.some((e) => e.action === 'procedure.contract')).toBe(true)
  })

  it('refuses a blank invoice description, on an edited Procedure and on one created in the draft', () => {
    const s = setupFor(BOOKING)
    const pid = Object.keys(s.base.procedures)[0]!
    const next = snapshotBooking(s.draft.getState(), BOOKING)!
    const blank = (snap: typeof next, id: string, text: string): typeof next =>
      ({ ...snap, procedures: { ...snap.procedures, [id]: { ...snap.procedures[id]!, invoiceDescription: { ...(snap.procedures[id]!.invoiceDescription ?? {}), text } } } }) as typeof next
    expect(s.saveIt(blank(next, pid, '  '))).toMatchObject({ ok: false, code: 'invoiceDescriptionBlank' })
    const added = addProcedure(s.draft, OFFICE_ACTOR, BOOKING)
    if (!added.ok) throw new Error(added.message)
    const length = s.real.getState().audit.length
    expect(s.saveIt(blank(snapshotBooking(s.draft.getState(), BOOKING)!, added.value.procedureId, ''))).toMatchObject({ ok: false, code: 'invoiceDescriptionBlank' })
    expect(s.real.getState().audit.length).toBe(length)
  })

  it('refuses a split that does not resolve', () => {
    const s = setupFor(FEE_SPLIT)
    const next = snapshotBooking(s.draft.getState(), FEE_SPLIT)!
    const [pid, p] = Object.entries(next.procedures)[0]!
    const split = { shares: [{ ...p.split!.shares[0]!, basis: { kind: 'amount' as const, amountExGst: 99999 } }, ...p.split!.shares.slice(1)] }
    expect(s.saveIt({ ...next, procedures: { ...next.procedures, [pid]: { ...p, split } } })).toMatchObject({ ok: false, code: 'splitInvalid' })
  })

  it('refuses a payer change, and a Procedure removal, once a prepayment is raised to that payer', () => {
    // Payer change: the prepayment is raised on the real store while the draft changes the payer.
    const a = setupFor(RILEY)
    const [p1] = procsOf(a.draft, RILEY)
    expect(setProcedurePayer(a.draft, OFFICE_ACTOR, p1!.id, { kind: 'other', name: 'Someone Else', email: 'x@example.net' }).ok).toBe(true)
    expect(approveAllPrepayments(a.real, RILEY)).not.toHaveLength(0)
    expect(a.saveIt()).toMatchObject({ ok: false, code: 'prepaymentRaised', message: PAYER_LOCKED_BY_PREPAYMENT })
    // Removal: a second prepaid Procedure, invoiced, removed in the draft.
    let extra = ''
    const b = setupFor(RILEY, (real) => {
      const added = addProcedure(real, OFFICE_ACTOR, RILEY, { governingContractId: procsOf(real, RILEY)[0]!.governingContractId! })
      if (!added.ok) throw new Error(added.message)
      extra = added.value.procedureId
      approveAllPrepayments(real, RILEY)
    })
    expect(removeProcedure(b.draft, OFFICE_ACTOR, extra).ok).toBe(true)
    expect(b.saveIt()).toMatchObject({ ok: false, code: 'prepaymentRaised' })
    expect(b.real.getState().schedule.procedures[extra]).toBeDefined()
  })

  it('refuses adding or removing a Procedure on a Booking completed while editing', () => {
    const add = setupFor(BOOKING)
    expect(addProcedure(add.draft, OFFICE_ACTOR, BOOKING).ok).toBe(true)
    setCompleted(add.real, BOOKING)
    expect(add.saveIt()).toMatchObject({ ok: false, code: 'bookingCompleted', message: SAVE_ADD_COMPLETED_MESSAGE })
    let extra = ''
    const remove = setupFor(BOOKING, (real) => {
      const added = addProcedure(real, OFFICE_ACTOR, BOOKING)
      if (!added.ok) throw new Error(added.message)
      extra = added.value.procedureId
    })
    expect(removeProcedure(remove.draft, OFFICE_ACTOR, extra).ok).toBe(true)
    setCompleted(remove.real, BOOKING)
    expect(remove.saveIt()).toMatchObject({ ok: false, code: 'bookingCompleted', message: SAVE_REMOVE_COMPLETED_MESSAGE })
  })

  it('refuses, with a plain reason, a Contract change needing RVG detail on a Booking completed while editing', () => {
    const s = setupFor(BOOKING, (real) => {
      const pid = procsOf(real, BOOKING)[0]!.id
      expect(setProcedureContract(real, OFFICE_ACTOR, pid, 'CT-FIX-PATIENT-STANDARD', { enteredPrice: 500 }).ok).toBe(true)
    })
    const pid = procsOf(s.draft, BOOKING)[0]!.id
    expect(setProcedureContract(s.draft, OFFICE_ACTOR, pid, 'CT-NO-CONTRACT')).toMatchObject({ ok: true })
    setCompleted(s.real, BOOKING)
    expect(s.saveIt()).toMatchObject({ ok: false, code: 'bookingCompleted', message: SAVE_RVG_DETAIL_COMPLETED_MESSAGE })
    expect(s.real.getState().schedule.bookings[BOOKING]!.completed).toBe(true)
  })

  it('a save adding a prepaid Procedure sends one prepayment invoice, on the real store only, as the direct action does (approval off)', () => {
    const approvalOff = (real: AppStoreApi) => {
      expect(setPrepaymentApprovalRequired(real, OFFICE_ACTOR, false).ok).toBe(true)
    }
    const prepaid = (api: AppStoreApi) => Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === RILEY && i.kind === 'prePayment').length
    // The direct action on a plain store, for parity.
    const direct = createAppStore()
    approvalOff(direct)
    const directBefore = prepaid(direct)
    const contractId = procsOf(direct, RILEY)[0]!.governingContractId!
    expect(addProcedure(direct, OFFICE_ACTOR, RILEY, { governingContractId: contractId }).ok).toBe(true)
    const directAdded = prepaid(direct) - directBefore

    const s = setupFor(RILEY, approvalOff)
    const before = prepaid(s.real)
    expect(addProcedure(s.draft, OFFICE_ACTOR, RILEY, { governingContractId: contractId }).ok).toBe(true)
    expect(prepaid(s.draft)).toBe(before)
    expect(s.saveIt().ok).toBe(true)
    expect(prepaid(s.real) - before).toBe(directAdded)
    expect(directAdded).toBe(1)
  })
})
