/**
 * The anaesthetist's edit window to AUTHORISED (catch-up Phase 38a; US-07.2.1,
 * US-07.2.3, FT-07.2, RV-19, D63): an anaesthetist edits their own ACTIVE and
 * SUBMITTED Lists, never AUTHORISED, a Draft List or a colleague's; every change
 * is audited and raises "Changed since submitted"; the last change stands; a
 * Booking re-opened or added on a SUBMITTED List blocks authorise until it is
 * completed again.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  authoriseList,
  completeBooking,
  editBooking,
  incompleteBookingsOn,
  reassignBooking,
  uncompleteBooking,
} from './lifecycle'
import { createBooking } from './bookingActions'
import { editPatient } from './intake'
import { changedSinceSubmitted } from './lookback'
import { bookingsForList } from './selectors'
import type { Actor } from './mutate'
import { ANAE, SEED_LIST_IDS } from '../domain/seed'
import { nextTestNhi } from './testNhi'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const MORRISON: Actor = { who: 'Dr Kate Morrison', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.morrison }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

const MON_AM = SEED_LIST_IDS.souterMon20Am
const MON_PM = SEED_LIST_IDS.souterMon20Pm

function store(): BoundAppStore {
  return createAppStore()
}
function firstBooking(api: BoundAppStore, listId: string): string {
  const b = bookingsForList(api.getState(), listId).find((x) => x.cancellation === undefined)
  if (b === undefined) throw new Error(`no booking on ${listId}`)
  return b.id
}
function draftListId(api: BoundAppStore): string {
  const d = Object.values(api.getState().schedule.lists).find((l) => l.state === 'DRAFT' && l.removedAtISO === undefined)
  if (d === undefined) throw new Error('no Draft List seeded')
  return d.id
}

describe('the edit window (D63)', () => {
  it('the seeded Mon 20 Jul Lists are SUBMITTED and Dr Souter can change their Bookings, audited as her', () => {
    const api = store()
    expect(api.getState().schedule.lists[MON_PM]?.state).toBe('SUBMITTED')
    const id = firstBooking(api, MON_PM)
    expect(editBooking(api, SOUTER, id, { notes: 'Corrected next day' }).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ entityId: id, role: 'anaesthetist', who: SOUTER.who })
  })

  it('refuses a colleague on her SUBMITTED List, anyone on AUTHORISED, and an anaesthetist on a Draft List', () => {
    const api = store()
    const id = firstBooking(api, MON_PM)
    const notOwn = editBooking(api, MORRISON, id, { notes: 'no' })
    expect(notOwn.ok).toBe(false)
    if (!notOwn.ok) expect(notOwn.code).toBe('notOwnList')

    const draft = createBooking(api, SOUTER, draftListId(api), {
      patient: { nhi: nextTestNhi(), name: 'X', dobISO: '1990-01-01' },
      sourceText: { text: 'Test', source: 'anaesthetist' },
    })
    expect(draft.ok).toBe(false)
    if (!draft.ok) expect(draft.code).toBe('notOwnList')

    expect(authoriseList(api, OFFICE, MON_PM).ok).toBe(true)
    for (const actor of [SOUTER, OFFICE]) {
      const locked = editBooking(api, actor, id, { notes: 'late' })
      expect(locked.ok).toBe(false)
      if (!locked.ok) expect(locked.code).toBe('listAuthorised')
    }
  })

  it('the last write stands: office then anaesthetist, anaesthetist then office', () => {
    const api = store()
    const id = firstBooking(api, MON_AM)
    expect(editBooking(api, OFFICE, id, { notes: 'office' }).ok).toBe(true)
    expect(editBooking(api, SOUTER, id, { notes: 'souter' }).ok).toBe(true)
    expect(api.getState().schedule.bookings[id]?.notes).toBe('souter')
    expect(editBooking(api, OFFICE, id, { notes: 'office again' }).ok).toBe(true)
    expect(api.getState().schedule.bookings[id]?.notes).toBe('office again')
    expect(api.getState().schedule.lists[MON_AM]?.state).toBe('SUBMITTED')
  })

  it('moves a Booking between her own Lists when either is SUBMITTED; never onto a colleague', () => {
    const api = store()
    const id = firstBooking(api, MON_AM)
    expect(reassignBooking(api, SOUTER, id, MON_PM).ok).toBe(true)
    expect(api.getState().schedule.bookings[id]?.listId).toBe(MON_PM)
    const colleague = Object.values(api.getState().schedule.lists).find(
      (l) => l.state === 'ACTIVE' && l.anaesthetistId === ANAE.morrison,
    )
    expect(colleague).toBeDefined()
    const refused = reassignBooking(api, SOUTER, id, colleague!.id)
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.code).toBe('notOwnList')
  })
})

describe('authorise is completion-gated (catch-up Phase 38a)', () => {
  it('a Booking re-opened on a SUBMITTED List blocks authorise, naming it, until completed again', () => {
    const api = store()
    const id = firstBooking(api, MON_PM)
    expect(uncompleteBooking(api, SOUTER, id).ok).toBe(true)
    expect(incompleteBookingsOn(api.getState(), MON_PM).map((b) => b.id)).toEqual([id])

    const refused = authoriseList(api, OFFICE, MON_PM)
    expect(refused.ok).toBe(false)
    if (!refused.ok) {
      expect(refused.code).toBe('bookingsNotCompleted')
      expect(refused.details).toEqual([id])
    }
    expect(api.getState().schedule.lists[MON_PM]?.state).toBe('SUBMITTED')

    // The office may complete it itself (it corrects directly).
    expect(completeBooking(api, OFFICE, id).ok).toBe(true)
    expect(authoriseList(api, OFFICE, MON_PM).ok).toBe(true)
  })

  it('a Booking added to a SUBMITTED List blocks authorise too', () => {
    const api = store()
    const added = createBooking(api, SOUTER, MON_AM, {
      patient: { nhi: nextTestNhi(), name: 'Late Addition', dobISO: '1980-02-02' },
      sourceText: { text: 'Arthroscopy', source: 'anaesthetist' },
    })
    expect(added.ok).toBe(true)
    const refused = authoriseList(api, OFFICE, MON_AM)
    expect(refused.ok).toBe(false)
    if (!refused.ok && added.ok) expect(refused.details).toEqual([added.value.bookingId])
  })
})

describe('changedSinceSubmitted', () => {
  it('no seeded submitted List starts with the cue (each staged submit follows its completions)', () => {
    const state = store().getState()
    const submitted = Object.values(state.schedule.lists).filter((l) => l.state === 'SUBMITTED')
    expect(submitted.length).toBeGreaterThan(0)
    for (const l of submitted) expect(changedSinceSubmitted(state, l.id), l.id).toBeNull()
  })

  it('is null for a freshly submitted List and after an office edit', () => {
    const api = store()
    expect(changedSinceSubmitted(api.getState(), MON_PM)).toBeNull()
    expect(editBooking(api, OFFICE, firstBooking(api, MON_PM), { notes: 'office fix' }).ok).toBe(true)
    expect(changedSinceSubmitted(api.getState(), MON_PM)).toBeNull()
  })

  it('counts the anaesthetist changes and the Bookings they touched, and ends at authorise', () => {
    const api = store()
    const [a, b] = bookingsForList(api.getState(), MON_PM).filter((x) => x.cancellation === undefined)
    expect(editBooking(api, SOUTER, a!.id, { notes: 'one' }).ok).toBe(true)
    expect(editBooking(api, SOUTER, a!.id, { notes: 'two' }).ok).toBe(true)
    expect(uncompleteBooking(api, SOUTER, b!.id).ok).toBe(true)
    const cue = changedSinceSubmitted(api.getState(), MON_PM)
    expect(cue).toMatchObject({ count: 3, bookingIds: [a!.id, b!.id].sort() })
    expect(changedSinceSubmitted(api.getState(), MON_AM)).toBeNull()

    expect(completeBooking(api, SOUTER, b!.id).ok).toBe(true)
    expect(authoriseList(api, OFFICE, MON_PM).ok).toBe(true)
    expect(changedSinceSubmitted(api.getState(), MON_PM)).toBeNull()
  })

  it("a patient edit counts only on the editing anaesthetist's own Lists, never a colleague's", () => {
    const api = store()
    const bk1 = api.getState().schedule.bookings['BK0001']!
    expect(editPatient(api, SOUTER, bk1.patientId, { phone: '021 000 1111' }, bk1.id).ok).toBe(true)
    for (const l of Object.values(api.getState().schedule.lists)) {
      if (l.state !== 'SUBMITTED' || l.anaesthetistId === ANAE.souter) continue
      expect(changedSinceSubmitted(api.getState(), l.id), l.id).toBeNull()
    }
  })

  it('the conflict entries mutate() adds are not changes', () => {
    const api = store()
    const before = api.getState().audit.length
    // An office edit that touches conflicts writes list.conflict entries under the office; none is the anaesthetist's.
    expect(editBooking(api, OFFICE, firstBooking(api, MON_PM), { notes: 'x' }).ok).toBe(true)
    expect(api.getState().audit.length).toBeGreaterThan(before)
    expect(changedSinceSubmitted(api.getState(), MON_PM)).toBeNull()
  })

  it('is deterministic', () => {
    const run = () => {
      const api = store()
      editBooking(api, SOUTER, firstBooking(api, MON_PM), { notes: 'x' })
      return changedSinceSubmitted(api.getState(), MON_PM)
    }
    expect(run()).toEqual(run())
  })
})
