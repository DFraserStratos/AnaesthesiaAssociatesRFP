import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { copyStateIntoDraft, type Actor } from './mutate'
import { markDraftStore } from './draftMode'
import { OFFICE_ACTOR, SECOND_OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { cancelBooking, editBooking, editProcedure } from './lifecycle'
import { addProcedure } from './bookingActions'
import { editPatient } from './intake'
import { setInvoiceDescription } from './procedureTextActions'
import { saveBookingChanges, saveBookingPatch, RECEIVED_TEXT_MESSAGE, SAVE_NHI_REQUIRED_MESSAGE } from './bookingSaveActions'
import { lastChangeSetFor } from './changeSetSelectors'
import { snapshotBooking } from '../domain/changeSets'
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
    const rewritten = { ...next, procedures: { ...next.procedures, [pid]: { ...p, procedureText: { text: 'Edited', source: 'phone' as const, receivedAtISO: '2026-07-21T08:00:00' } } } }
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
