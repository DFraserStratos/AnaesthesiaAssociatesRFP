/**
 * bookingAsAt (catch-up Phase 35): undoing a Booking's audit back to a cut
 * reproduces each earlier state, and every seeded Booking walks back to its
 * first entry.
 */

import { describe, expect, it } from 'vitest'
import { bookingAsAt } from '../domain/bookingAsAt'
import { diffSnapshots, snapshotBooking, type BookingSnapshot, type SnapshotSource } from '../domain/changeSets'
import { buildSeed } from '../domain/seed'
import type { AuditEntry } from '../domain/types'
import { createAppStore } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { editBooking, editProcedure } from './lifecycle'
import { addProcedure, removeProcedure, setPrimaryProcedure } from './bookingActions'
import { setProcedureContract } from './contractSelectionActions'

type Source = SnapshotSource & { audit: readonly AuditEntry[] }

const obj = (v: unknown): Record<string, unknown> => (v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

/** The audit filtered to one Booking's entities: it, its Procedures (removed ones too), its patient. */
function entriesFor(source: Source, bookingId: string): AuditEntry[] {
  const booking = source.schedule.bookings[bookingId]!
  const procedureIds = new Set(Object.values(source.schedule.procedures).filter((p) => p.bookingId === bookingId).map((p) => p.id))
  for (const e of source.audit) {
    if (e.entityType !== 'procedure') continue
    if (obj(e.before).bookingId === bookingId || obj(e.after).bookingId === bookingId) procedureIds.add(e.entityId)
  }
  return source.audit.filter(
    (e) =>
      (e.entityType === 'booking' && e.entityId === bookingId) ||
      (e.entityType === 'procedure' && procedureIds.has(e.entityId)) ||
      (e.entityType === 'patient' && e.entityId === booking.patientId),
  )
}

function expectSame(actual: BookingSnapshot, expected: BookingSnapshot): void {
  expect(diffSnapshots(expected, actual)).toEqual([])
  expect(actual.patient === undefined).toBe(expected.patient === undefined)
}

describe('bookingAsAt: a scripted round trip on the real store', () => {
  it('undoes office edits step by step back to each earlier snapshot', () => {
    const api = createAppStore()
    const s0 = api.getState()
    const booking = Object.values(s0.schedule.bookings)
      .filter((b) => s0.schedule.lists[b.listId]?.state === 'ACTIVE' && !b.completed && b.cancellation === undefined)
      .find((b) => Object.values(s0.schedule.procedures).some((p) => p.bookingId === b.id && p.isPrimary))
    expect(booking).toBeDefined()
    const id = booking!.id
    const primary = Object.values(s0.schedule.procedures).find((p) => p.bookingId === id && p.isPrimary)!

    const marks: Array<{ afterEntryId: string; snapshot: BookingSnapshot }> = []
    const mark = () => {
      const state = api.getState()
      marks.push({ afterEntryId: state.audit[state.audit.length - 1]!.id, snapshot: snapshotBooking(state, id)! })
    }
    mark()

    expect(editBooking(api, OFFICE_ACTOR, id, { scheduledTime: '15:45' }).ok).toBe(true)
    mark()
    expect(editBooking(api, OFFICE_ACTOR, id, { notes: 'Bring the long-acting block kit', scheduledTime: '16:00' }).ok).toBe(true)
    mark()
    expect(editProcedure(api, OFFICE_ACTOR, primary.id, { intNotes: 'Difficult airway noted' }).ok).toBe(true)
    mark()
    const added = addProcedure(api, OFFICE_ACTOR, id)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    mark()
    const second = addProcedure(api, OFFICE_ACTOR, id)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    mark()
    expect(removeProcedure(api, OFFICE_ACTOR, added.value.procedureId).ok).toBe(true)
    mark()
    // A Contract on the kept added Procedure: the first one the step rail allows.
    const contracted = Object.keys(api.getState().masters.contracts).some(
      (cid) => setProcedureContract(api, OFFICE_ACTOR, second.value.procedureId, cid).ok,
    )
    expect(contracted).toBe(true)
    mark()
    expect(setPrimaryProcedure(api, OFFICE_ACTOR, second.value.procedureId).ok).toBe(true)
    mark()
    expect(editBooking(api, OFFICE_ACTOR, id, { notes: '' }).ok).toBe(true)
    mark()

    const state = api.getState()
    const final = snapshotBooking(state, id)!
    const entries = entriesFor(state, id)
    for (const m of marks) {
      const result = bookingAsAt(final, entries, { afterEntryId: m.afterEntryId }, { modifiers: state.masters.modifiers })
      expect(result.incompleteAt).toBeUndefined()
      expectSame(result.snapshot, m.snapshot)
    }
    // The newest cut changes nothing.
    expectSame(bookingAsAt(final, entries, { afterEntryId: marks[marks.length - 1]!.afterEntryId }).snapshot, final)
  })

  it('a time cut keeps every entry at or before the time, by audit order', () => {
    const api = createAppStore()
    const s0 = api.getState()
    const booking = Object.values(s0.schedule.bookings).find(
      (b) => s0.schedule.lists[b.listId]?.state === 'ACTIVE' && !b.completed && b.cancellation === undefined,
    )!
    const before = snapshotBooking(s0, booking.id)!
    const atISO = s0.audit[s0.audit.length - 1]!.atISO
    expect(editBooking(api, OFFICE_ACTOR, booking.id, { scheduledTime: '06:15' }).ok).toBe(true)
    const state = api.getState()
    const now = snapshotBooking(state, booking.id)!
    const edit = state.audit[state.audit.length - 1]!
    // The edit shares the clock's minute or comes later; a cut just before it restores the old time.
    const cutISO = edit.atISO > atISO ? atISO : undefined
    if (cutISO !== undefined) expectSame(bookingAsAt(now, entriesFor(state, booking.id), { atISO: cutISO }).snapshot, before)
    // A cut at the edit's own time keeps it (the same minute is not undone).
    expectSame(bookingAsAt(now, entriesFor(state, booking.id), { atISO: edit.atISO }).snapshot, now)
  })
})

describe('bookingAsAt: the seed', () => {
  it('walks every seeded Booking back to its first entry', () => {
    const seed = buildSeed()
    const failures: string[] = []
    let walked = 0
    for (const booking of Object.values(seed.schedule.bookings)) {
      const now = snapshotBooking(seed, booking.id)!
      const entries = entriesFor(seed, booking.id)
      if (entries.length === 0) continue
      walked++
      const result = bookingAsAt(now, entries, { afterEntryId: entries[0]!.id }, { modifiers: seed.masters.modifiers })
      if (result.incompleteAt !== undefined) failures.push(`${booking.id} ${result.incompleteAt.action} ${result.incompleteAt.entryId}`)
    }
    expect(walked).toBeGreaterThan(100)
    expect(failures).toEqual([])
  })

  it('a seeded Booking at its creation has none of the Procedures added after; its claims undo one by one', () => {
    const seed = buildSeed()
    const claimed = Object.values(seed.schedule.procedures).find((p) => p.modifierClaims.length > 0 && seed.schedule.bookings[p.bookingId]!.completed)!
    const bookingId = claimed.bookingId
    const entries = entriesFor(seed, bookingId)
    expect(entries[0]!.action).toBe('booking.create')
    const now = snapshotBooking(seed, bookingId)!
    const at = bookingAsAt(now, entries, { afterEntryId: entries[0]!.id }, { modifiers: seed.masters.modifiers })
    expect(at.incompleteAt).toBeUndefined()
    expect(at.snapshot.procedures).toEqual({})
    expect(at.snapshot.booking.completed).toBe(false)
    // Just before the first claim, the Procedure has no claims.
    const firstClaim = entries.findIndex((e) => e.action === 'procedure.modifierClaim' && e.entityId === claimed.id)
    const beforeClaims = bookingAsAt(now, entries, { afterEntryId: entries[firstClaim - 1]!.id }, { modifiers: seed.masters.modifiers })
    expect(beforeClaims.incompleteAt).toBeUndefined()
    expect(beforeClaims.snapshot.procedures[claimed.id]!.modifierClaims).toEqual([])
    // Without the modifier master, a claim named by its printed code cannot be undone.
    const blind = bookingAsAt(now, entries, { afterEntryId: entries[0]!.id })
    expect(blind.incompleteAt?.action).toBe('procedure.modifierClaim')
  })

  it('stops at an entry it cannot undo, leaving the state just after it', () => {
    const seed = buildSeed()
    const booking = Object.values(seed.schedule.bookings)[0]!
    const now = snapshotBooking(seed, booking.id)!
    const entries = entriesFor(seed, booking.id)
    const odd: AuditEntry = {
      id: 'A9998',
      entityType: 'booking',
      entityId: booking.id,
      who: 'x',
      role: 'office',
      source: 'office',
      action: 'booking.somethingNew',
      before: { notes: 'a' },
      after: { notes: 'b' },
      atISO: '2026-07-21T10:00:00',
    }
    const result = bookingAsAt(now, [...entries, odd], { afterEntryId: entries[0]!.id })
    expect(result.incompleteAt).toEqual({ entryId: 'A9998', action: 'booking.somethingNew' })
    expectSame(result.snapshot, now)
    // An unknown action with nothing to undo is passed over.
    const header: AuditEntry = { ...odd, id: 'A9999', action: 'booking.note' }
    delete header.before
    delete header.after
    expect(bookingAsAt(now, [...entries, header], { afterEntryId: entries[entries.length - 1]!.id }).incompleteAt).toBeUndefined()
  })
})
