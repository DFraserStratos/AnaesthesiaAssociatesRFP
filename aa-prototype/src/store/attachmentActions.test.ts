/**
 * Attachments on a Booking or a whole List (US-03.1.3; catch-up Phase 15):
 * add and remove through the only two writers, the edit-rights matrix,
 * store-allocated ids, metadata-only audit, and List attachments travelling
 * with `reassignList`.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { addAttachment, removeAttachment } from './attachmentActions'
import { authoriseList, cancelBooking, editBooking, reassignList, submitList } from './lifecycle'
import { bookingsForList } from './selectors'
import type { Actor } from './mutate'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS, listIdForSlot } from '../domain/seed'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const FILE = { name: 'Consent form', kind: 'pdf' as const, dataUrl: 'data:image/svg+xml,%3Csvg%2F%3E' }

const ELLISON = SEED_MARKERS['pendingCaptureBooking']?.entityId ?? ''
const SOUTER_PM = SEED_LIST_IDS.souterPm21
const TUE28_AM = listIdForSlot(ANAE.souter, '2026-07-28', 'AM')

function store(): BoundAppStore {
  return createAppStore()
}

describe('the seeded List attachment', () => {
  it("Dr Souter's Tue 28 Jul AM List carries the theatre-list PDF as AT0001, and the counter continues", () => {
    const api = store()
    const list = api.getState().schedule.lists[TUE28_AM]
    expect(list?.attachments).toEqual([expect.objectContaining({ id: 'AT0001', name: "Theatre list · St George's", kind: 'pdf' })])
    const added = addAttachment(api, SOUTER, { kind: 'list', id: TUE28_AM }, FILE)
    expect(added.ok && added.value.attachmentId).toBe('AT0002')
  })
})

describe('addAttachment / removeAttachment', () => {
  it('adds and removes on a Booking, audited as booking.attachmentAdd / Remove', () => {
    const api = store()
    const added = addAttachment(api, SOUTER, { kind: 'booking', id: ELLISON }, FILE)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const booking = api.getState().schedule.bookings[ELLISON]
    expect(booking?.attachments.map((a) => a.id)).toContain(added.value.attachmentId)
    expect(booking?.lastModifiedBy).toBe(SOUTER.who)

    expect(removeAttachment(api, SOUTER, { kind: 'booking', id: ELLISON }, added.value.attachmentId).ok).toBe(true)
    expect(api.getState().schedule.bookings[ELLISON]?.attachments.some((a) => a.id === added.value.attachmentId)).toBe(false)
    const actions = api.getState().audit.filter((a) => a.entityId === ELLISON).map((a) => a.action)
    expect(actions.slice(-2)).toEqual(['booking.attachmentAdd', 'booking.attachmentRemove'])
  })

  it('adds and removes on a List, audited on the List and stamping no Booking', () => {
    const api = store()
    const bookingsBefore = api.getState().schedule.bookings
    const added = addAttachment(api, SOUTER, { kind: 'list', id: SOUTER_PM }, FILE)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(api.getState().schedule.lists[SOUTER_PM]?.attachments?.map((a) => a.id)).toEqual([added.value.attachmentId])
    expect(api.getState().schedule.bookings).toBe(bookingsBefore)
    expect(removeAttachment(api, SOUTER, { kind: 'list', id: SOUTER_PM }, added.value.attachmentId).ok).toBe(true)
    expect(api.getState().schedule.lists[SOUTER_PM]?.attachments).toEqual([])
    const actions = api.getState().audit.filter((a) => a.entityId === SOUTER_PM).map((a) => a.action)
    expect(actions.slice(-2)).toEqual(['list.attachmentAdd', 'list.attachmentRemove'])
  })

  it('allocates unique ids across add, remove and re-add', () => {
    const api = store()
    const target = { kind: 'booking' as const, id: ELLISON }
    const a = addAttachment(api, SOUTER, target, FILE)
    const b = addAttachment(api, SOUTER, target, FILE)
    if (!a.ok || !b.ok) throw new Error('expected both adds')
    expect(removeAttachment(api, SOUTER, target, a.value.attachmentId).ok).toBe(true)
    const c = addAttachment(api, SOUTER, target, FILE)
    if (!c.ok) throw new Error('expected the re-add')
    const ids = [a.value.attachmentId, b.value.attachmentId, c.value.attachmentId]
    expect(new Set(ids).size).toBe(3)
    expect(ids.every((id) => /^AT\d{4}$/.test(id))).toBe(true)
  })

  it('writes metadata only to the audit, never the data URL', () => {
    const api = store()
    const added = addAttachment(api, SOUTER, { kind: 'booking', id: ELLISON }, FILE)
    if (!added.ok) throw new Error('expected the add')
    removeAttachment(api, SOUTER, { kind: 'booking', id: ELLISON }, added.value.attachmentId)
    const entries = api.getState().audit.filter((e) => e.action.includes('attachment'))
    expect(entries).toHaveLength(2)
    for (const entry of entries) {
      expect(JSON.stringify(entry)).not.toContain('data:')
      expect(entry.after ?? entry.before).toEqual({ attachmentId: added.value.attachmentId, name: 'Consent form', kind: 'pdf' })
    }
  })

  it('editBooking can no longer write attachments, even untyped', () => {
    const api = store()
    const before = api.getState().schedule.bookings[ELLISON]?.attachments
    const patch = { notes: 'x', attachments: [{ id: 'X1', name: 'Smuggled', kind: 'photo' }] } as unknown as Parameters<typeof editBooking>[3]
    expect(editBooking(api, SOUTER, ELLISON, patch).ok).toBe(true)
    const after = api.getState().schedule.bookings[ELLISON]
    expect(after?.attachments).toEqual(before)
    expect(after?.notes).toBe('x')
    const update = api.getState().audit.at(-1)
    expect(update?.action).toBe('booking.update')
    expect(update?.after).toEqual({ notes: 'x' })
  })

  it('an attachments-only patch writes nothing and audits nothing', () => {
    const api = store()
    const auditBefore = api.getState().audit.length
    const patch = { attachments: [] } as unknown as Parameters<typeof editBooking>[3]
    expect(editBooking(api, SOUTER, ELLISON, patch).ok).toBe(true)
    expect(api.getState().audit).toHaveLength(auditBefore)
  })

  it('refuses an attachment with a blank name', () => {
    const api = store()
    expect(addAttachment(api, SOUTER, { kind: 'booking', id: ELLISON }, { ...FILE, name: '   ' })).toMatchObject({ ok: false, code: 'attachmentNameRequired' })
  })
})

describe('the rights matrix', () => {
  it('anaesthetist on their own DRAFT List only; office on DRAFT and SUBMITTED; nobody on AUTHORISED', () => {
    const api = store()
    const morrison: Actor = { who: 'Dr Kate Morrison', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.morrison }
    expect(addAttachment(api, morrison, { kind: 'list', id: SOUTER_PM }, FILE)).toMatchObject({ ok: false, code: 'notOwnList' })

    const morrisonSubmitted = SEED_MARKERS['submittedListMorrison']?.entityId ?? ''
    expect(api.getState().schedule.lists[morrisonSubmitted]?.state).toBe('SUBMITTED')
    expect(addAttachment(api, morrison, { kind: 'list', id: morrisonSubmitted }, FILE)).toMatchObject({ ok: false, code: 'listSubmitted' })
    const submittedBooking = bookingsForList(api.getState(), morrisonSubmitted).find((b) => b.cancellation === undefined)
    expect(addAttachment(api, morrison, { kind: 'booking', id: submittedBooking!.id }, FILE)).toMatchObject({ ok: false, code: 'listSubmitted' })
    expect(addAttachment(api, OFFICE, { kind: 'booking', id: submittedBooking!.id }, FILE).ok).toBe(true)
    expect(addAttachment(api, OFFICE, { kind: 'list', id: morrisonSubmitted }, FILE).ok).toBe(true)

    expect(authoriseList(api, OFFICE, morrisonSubmitted).ok).toBe(true)
    expect(addAttachment(api, OFFICE, { kind: 'list', id: morrisonSubmitted }, FILE)).toMatchObject({ ok: false, code: 'listAuthorised' })
    expect(addAttachment(api, OFFICE, { kind: 'booking', id: submittedBooking!.id }, FILE)).toMatchObject({ ok: false, code: 'listAuthorised' })
  })

  it('a cancelled Booking takes no attachment', () => {
    const api = store()
    expect(cancelBooking(api, SOUTER, ELLISON, 'Booked in error').ok).toBe(true)
    expect(addAttachment(api, SOUTER, { kind: 'booking', id: ELLISON }, FILE)).toMatchObject({ ok: false, code: 'bookingCancelled' })
  })

  it('the submitted anaesthetist List refuses after submit', () => {
    const api = store()
    const amList = SEED_LIST_IDS.souterAm21
    expect(submitList(api, SOUTER, amList).ok).toBe(true)
    expect(addAttachment(api, SOUTER, { kind: 'list', id: amList }, FILE)).toMatchObject({ ok: false, code: 'listSubmitted' })
  })
})

describe('List attachments are booking context on a Free List', () => {
  it('a Free List holding attachments is not a reassignment target, so they are never absorbed', () => {
    const api = store()
    const state = api.getState()
    const source = Object.values(state.schedule.lists).find(
      (l) => l.state === 'DRAFT' && l.statusKey !== 'free' && l.hospitalId !== undefined && l.dateISO > state.clock.todayISO &&
        Object.values(state.schedule.lists).some((t) => t.dateISO === l.dateISO && t.session === l.session && t.anaesthetistId !== l.anaesthetistId && t.statusKey === 'free' && t.state === 'DRAFT' && bookingsForList(state, t.id).length === 0),
    )!
    const target = Object.values(state.schedule.lists).find((t) => t.dateISO === source.dateISO && t.session === source.session && t.anaesthetistId !== source.anaesthetistId && t.statusKey === 'free' && t.state === 'DRAFT' && bookingsForList(state, t.id).length === 0)!
    expect(addAttachment(api, OFFICE, { kind: 'list', id: target.id }, FILE).ok).toBe(true)
    expect(reassignList(api, OFFICE, source.id, target.anaesthetistId)).toMatchObject({ ok: false, code: 'targetNotFree' })
    expect(api.getState().schedule.lists[target.id]?.attachments).toHaveLength(1)
  })
})

describe('List attachments travel with reassignList', () => {
  it('a reassigned List keeps its attachments', () => {
    const api = store()
    const state = api.getState()
    // A booked DRAFT List and a colleague whose same slot is a free, empty DRAFT List.
    const candidates = Object.values(state.schedule.lists).filter(
      (l) => l.state === 'DRAFT' && l.statusKey !== 'free' && l.hospitalId !== undefined && l.dateISO > state.clock.todayISO,
    )
    let done = false
    for (const list of candidates) {
      const target = Object.values(state.schedule.lists).find(
        (t) =>
          t.dateISO === list.dateISO &&
          t.session === list.session &&
          t.anaesthetistId !== list.anaesthetistId &&
          t.statusKey === 'free' &&
          t.state === 'DRAFT' &&
          bookingsForList(state, t.id).length === 0,
      )
      if (target === undefined) continue
      expect(addAttachment(api, OFFICE, { kind: 'list', id: list.id }, FILE).ok).toBe(true)
      const before = api.getState().schedule.lists[list.id]?.attachments
      const moved = reassignList(api, OFFICE, list.id, target.anaesthetistId)
      if (!moved.ok) continue
      const after = api.getState().schedule.lists[list.id]
      expect(after?.anaesthetistId).toBe(target.anaesthetistId)
      expect(after?.attachments).toEqual(before)
      done = true
      break
    }
    expect(done).toBe(true)
  })
})
