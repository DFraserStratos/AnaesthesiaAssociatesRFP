/**
 * Phase 06 store guard tests — the four office actions and the day-notes slice:
 * editList (field edits through the edit-rights matrix), setProcedureSplit
 * (catch-up Phase 22: the split on the Booking, its rights and refusals; it
 * replaced the office-only per-line funder allocation), addDayNote, plus the seeded
 * Tue-21 notes and the Wed-22 conflicts (real facts since catch-up Phase 30). Isolated non-persisted
 * stores seeded from buildSeed().
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, editList } from './lifecycle'
import { setProcedureSplit } from './splitActions'
import { addDayNote, initialsFor } from './dayNoteActions'
import {
  auditForEntity,
  bookingRequiresPrepayment,
  bookingsForList,
  dayNotesFor,
  listsForDate,
  proceduresForBooking,
  submittedListCount,
  submittedLists,
} from './selectors'
import type { Actor } from './mutate'
import type { FeeSplit } from '../domain/types'
import { ANAE, INS, SEED_MARKERS } from '../domain/seed'
import { payerCounterparty } from '../domain/billing/whoIsBilled'
import { assigned } from '../test/lists'
import { DEMO_TODAY } from '../domain/clock'
import { setSlotTimes } from './slotActions'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}
const MORRISON: Actor = {
  who: 'Dr Kate Morrison',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.morrison,
}

const WED22 = '2026-07-22'

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
const SOUTER_AM = marker('designDayAmList')
const MORRISON_LIST = marker('submittedListMorrison')
const FEE_SPLIT_BOOKING = marker('feeSplitBooking')
const PREPAYMENT_BOOKING = marker('prepaymentBooking')

/** The fee-split Booking's one Procedure (Prentice, Souter Mon 20 PM, SUBMITTED; fee $212). */
function feeSplitProcedure(api: BoundAppStore): { listId: string; procedureId: string; patientId: string } {
  const booking = api.getState().schedule.bookings[FEE_SPLIT_BOOKING]
  const proc = proceduresForBooking(api.getState(), FEE_SPLIT_BOOKING)[0]
  if (booking === undefined || proc === undefined) throw new Error('fee-split booking has no procedure')
  return { listId: booking.listId, procedureId: proc.id, patientId: booking.patientId }
}

/** nib takes `nib` (an amount or a percent), the payer on the Booking the rest. */
function nibAndPayer(bookingId: string, api: BoundAppStore, nib: FeeSplit['shares'][number]['basis']): FeeSplit {
  const booking = api.getState().schedule.bookings[bookingId]
  if (booking === undefined) throw new Error(`no booking ${bookingId}`)
  return {
    shares: [
      { party: { kind: 'insurer', id: INS.nib }, basis: nib },
      { party: payerCounterparty(booking), basis: { kind: 'rest' } },
    ],
  }
}

// ---------------------------------------------------------------------------
// editList
// ---------------------------------------------------------------------------

describe('editList', () => {
  it('office overrides an ACTIVE list session start/end times on its Slot, audited session.times (catch-up Phase 28)', () => {
    const api = store()
    const before = assigned(api.getState().schedule.lists[SOUTER_AM])
    expect(before?.state).toBe('ACTIVE')
    const r = setSlotTimes(api, OFFICE, before!.slotId, { startTime: '08:30', endTime: '14:15' })
    expect(r.ok).toBe(true)
    const slot = api.getState().schedule.slots[before!.slotId]
    expect(slot?.startTime).toBe('08:30')
    expect(slot?.endTime).toBe('14:15')
    expect(auditForEntity(api.getState(), before!.slotId).filter((a) => a.action === 'session.times')).toHaveLength(1)
  })

  it('office edits a SUBMITTED list (hospital/surgeon)', () => {
    const api = store()
    expect(api.getState().schedule.lists[MORRISON_LIST]?.state).toBe('SUBMITTED')
    const r = editList(api, OFFICE, MORRISON_LIST, { notes: 'Ran long, theatre 5' })
    expect(r.ok).toBe(true)
    expect(api.getState().schedule.lists[MORRISON_LIST]?.notes).toBe('Ran long, theatre 5')
  })

  it('clears a field when the patch value is empty', () => {
    const api = store()
    editList(api, OFFICE, SOUTER_AM, { notes: 'temp' })
    editList(api, OFFICE, SOUTER_AM, { notes: '' })
    expect(api.getState().schedule.lists[SOUTER_AM]?.notes).toBeUndefined()
  })

  it('anaesthetist edits own ACTIVE and own SUBMITTED (catch-up Phase 38a), never a colleague list', () => {
    const api = store()
    expect(editList(api, SOUTER, SOUTER_AM, { notes: 'mine' }).ok).toBe(true)
    const notOwn = editList(api, SOUTER, MORRISON_LIST, { notes: 'nope' })
    expect(notOwn.ok).toBe(false)
    if (!notOwn.ok) expect(notOwn.code).toBe('notOwnList')
    expect(editList(api, MORRISON, MORRISON_LIST, { notes: 'still mine' }).ok).toBe(true)
  })

  it('refuses on an AUTHORISED list', () => {
    const api = store()
    authoriseList(api, OFFICE, MORRISON_LIST)
    const r = editList(api, OFFICE, MORRISON_LIST, { notes: 'nope' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('listAuthorised')
  })
})

// ---------------------------------------------------------------------------
// setProcedureSplit (catch-up Phase 22; US-08.2.3)
// ---------------------------------------------------------------------------

describe('setProcedureSplit', () => {
  it('seeds the fee-split Booking split: nib $132.50, the payer the rest', () => {
    const api = store()
    const { procedureId, patientId } = feeSplitProcedure(api)
    expect(api.getState().schedule.procedures[procedureId]?.split).toEqual({
      shares: [
        { party: { kind: 'insurer', id: INS.nib }, basis: { kind: 'amount', amountExGst: 132.5 } },
        { party: { kind: 'patient', id: patientId }, basis: { kind: 'rest' } },
      ],
    })
  })

  it('office splits on a SUBMITTED List, audited procedure.split with before and after', () => {
    const api = store()
    const { listId, procedureId } = feeSplitProcedure(api)
    expect(api.getState().schedule.lists[listId]?.state).toBe('SUBMITTED')
    const seeded = api.getState().schedule.procedures[procedureId]?.split
    // The seed audits the office typing the seeded split.
    const splitAudits = () => auditForEntity(api.getState(), procedureId).filter((a) => a.action === 'procedure.split')
    expect(splitAudits()).toHaveLength(1)
    const next = nibAndPayer(FEE_SPLIT_BOOKING, api, { kind: 'percent', percent: 40 })
    expect(setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procedureId, next).ok).toBe(true)
    expect(api.getState().schedule.procedures[procedureId]?.split).toEqual(next)
    const audit = splitAudits()
    expect(audit).toHaveLength(2)
    expect(audit[1]).toMatchObject({ who: 'Kirsty W.', before: { split: seeded }, after: { split: next } })
  })

  it('the anaesthetist splits on her own ACTIVE and her own SUBMITTED List', () => {
    const api = store()
    expect(assigned(api.getState().schedule.lists[SOUTER_AM])?.state).toBe('ACTIVE')
    const active = bookingsForList(api.getState(), SOUTER_AM)[0]
    if (active === undefined) throw new Error('no AM bookings')
    const activeProc = proceduresForBooking(api.getState(), active.id)[0]!
    const onActive = nibAndPayer(active.id, api, { kind: 'amount', amountExGst: 100 })
    expect(setProcedureSplit(api, SOUTER, active.id, activeProc.id, onActive).ok).toBe(true)
    expect(api.getState().schedule.procedures[activeProc.id]?.split).toEqual(onActive)

    const { procedureId } = feeSplitProcedure(api)
    const onSubmitted = nibAndPayer(FEE_SPLIT_BOOKING, api, { kind: 'amount', amountExGst: 150 })
    expect(setProcedureSplit(api, SOUTER, FEE_SPLIT_BOOKING, procedureId, onSubmitted).ok).toBe(true)
    expect(api.getState().schedule.procedures[procedureId]?.split).toEqual(onSubmitted)
  })

  it("refuses another anaesthetist's List (notOwnList) and leaves the split as it was", () => {
    const api = store()
    const { procedureId } = feeSplitProcedure(api)
    const seeded = api.getState().schedule.procedures[procedureId]?.split
    const r = setProcedureSplit(api, MORRISON, FEE_SPLIT_BOOKING, procedureId, nibAndPayer(FEE_SPLIT_BOOKING, api, { kind: 'percent', percent: 50 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('notOwnList')
    expect(api.getState().schedule.procedures[procedureId]?.split).toEqual(seeded)
  })

  it('refuses everyone once the List is AUTHORISED (listAuthorised)', () => {
    const api = store()
    const { listId, procedureId } = feeSplitProcedure(api)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    const next = nibAndPayer(FEE_SPLIT_BOOKING, api, { kind: 'percent', percent: 50 })
    for (const actor of [OFFICE, SOUTER]) {
      const r = setProcedureSplit(api, actor, FEE_SPLIT_BOOKING, procedureId, next)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('listAuthorised')
      const removal = setProcedureSplit(api, actor, FEE_SPLIT_BOOKING, procedureId, null)
      expect(removal.ok).toBe(false)
      if (!removal.ok) expect(removal.code).toBe('listAuthorised')
    }
  })

  it('refuses a prepaid Booking (prepaidProcedure)', () => {
    const api = store()
    expect(bookingRequiresPrepayment(api.getState(), PREPAYMENT_BOOKING)).toBe(true)
    const proc = proceduresForBooking(api.getState(), PREPAYMENT_BOOKING)[0]!
    const r = setProcedureSplit(api, OFFICE, PREPAYMENT_BOOKING, proc.id, nibAndPayer(PREPAYMENT_BOOKING, api, { kind: 'amount', amountExGst: 100 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('prepaidProcedure')
    expect(api.getState().schedule.procedures[proc.id]?.split).toBeUndefined()
  })

  it('refuses a $ share at or above the fee beside a rest (splitInvalid)', () => {
    const api = store()
    const { procedureId } = feeSplitProcedure(api)
    const seeded = api.getState().schedule.procedures[procedureId]?.split
    for (const amountExGst of [212, 250]) {
      const r = setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procedureId, nibAndPayer(FEE_SPLIT_BOOKING, api, { kind: 'amount', amountExGst }))
      expect(r.ok).toBe(false)
      if (!r.ok) {
        expect(r.code).toBe('splitInvalid')
        expect(r.message).toContain('leaves nothing for the rest of the fee of $212.00')
      }
    }
    expect(api.getState().schedule.procedures[procedureId]?.split).toEqual(seeded)
    // Only the seed's own audit row: the refusals wrote nothing.
    expect(auditForEntity(api.getState(), procedureId).filter((a) => a.action === 'procedure.split')).toHaveLength(1)
  })

  it('null removes the split, audited with the old split before and null after', () => {
    const api = store()
    const { procedureId } = feeSplitProcedure(api)
    const seeded = api.getState().schedule.procedures[procedureId]?.split
    const before = auditForEntity(api.getState(), procedureId).filter((a) => a.action === 'procedure.split').length
    expect(setProcedureSplit(api, SOUTER, FEE_SPLIT_BOOKING, procedureId, null).ok).toBe(true)
    const proc = api.getState().schedule.procedures[procedureId]
    expect(proc !== undefined && 'split' in proc).toBe(false)
    const audit = auditForEntity(api.getState(), procedureId).filter((a) => a.action === 'procedure.split')
    expect(audit).toHaveLength(before + 1)
    expect(audit.at(-1)).toMatchObject({ who: 'Dr Melanie Souter', before: { split: seeded }, after: { split: null } })
  })
})

// ---------------------------------------------------------------------------
// addDayNote + day-notes seed
// ---------------------------------------------------------------------------

describe('addDayNote', () => {
  it('appends a note to the date, derives initials, audits dayNote.add', () => {
    const api = store()
    const before = dayNotesFor(api.getState(), DEMO_TODAY).length
    const r = addDayNote(api, OFFICE, DEMO_TODAY, 'Dr Hughes to cover St Georges PM.', true)
    expect(r.ok).toBe(true)
    const notes = dayNotesFor(api.getState(), DEMO_TODAY)
    expect(notes.length).toBe(before + 1)
    const added = notes[notes.length - 1]
    expect(added?.initials).toBe('KW')
    expect(added?.flagged).toBe(true)
    expect(added?.by).toBe('Kirsty W.')
    if (r.ok) {
      expect(auditForEntity(api.getState(), r.value.dayNoteId).some((a) => a.action === 'dayNote.add')).toBe(true)
    }
  })

  it('rejects an empty note and persists notes on a fresh date', () => {
    const api = store()
    expect(addDayNote(api, OFFICE, DEMO_TODAY, '   ').ok).toBe(false)
    expect(dayNotesFor(api.getState(), '2026-08-15').length).toBe(0)
    addDayNote(api, OFFICE, '2026-08-15', 'Public holiday, skeleton roster.')
    expect(dayNotesFor(api.getState(), '2026-08-15').length).toBe(1)
  })

  it('initialsFor handles single and multi word names', () => {
    expect(initialsFor('Kirsty W.')).toBe('KW')
    expect(initialsFor('Dr Melanie Souter')).toBe('DMS')
    expect(initialsFor('')).toBe('?')
  })
})

describe('seeded day notes', () => {
  it('seeds the three Tue-21 notes, one flagged', () => {
    const api = store()
    const notes = dayNotesFor(api.getState(), DEMO_TODAY)
    expect(notes.length).toBe(3)
    expect(notes.map((n) => n.initials)).toEqual(['KW', 'RT', 'KW'])
    expect(notes.filter((n) => n.flagged).length).toBe(1)
    expect(notes[2]?.flagged).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Wed-22 conflicts (real facts since catch-up Phase 30) + submitted-list selectors
// ---------------------------------------------------------------------------

describe('Wed-22 conflicts (real facts since catch-up Phase 30)', () => {
  it('seeds hospital-closure conflicts on Wed 22 (never an availability one, D59), leaving Tue 21 pristine', () => {
    const api = store()
    const wed = listsForDate(api.getState(), WED22)
    const kinds = wed.flatMap((l) => l.conflicts.map((c) => c.kind as string))
    expect(kinds).toContain('holiday')
    expect(kinds.every((k) => k === 'holiday')).toBe(true)
    const tue = listsForDate(api.getState(), DEMO_TODAY)
    expect(tue.every((l) => l.conflicts.length === 0)).toBe(true)
  })
})

describe('submitted-list selectors', () => {
  it('counts the seeded SUBMITTED lists (the derived review badge)', () => {
    const api = store()
    // Morrison + Whitaker (Phase 02) + the Phase-09 billing-failure exemplar +
    // the Phase-11 locked-target list (Delaney Fri 17) + S3's two Souter Lists
    // + catch-up Phase 21's payer review List (Chen Fri 17) + catch-up Phase 21a's review-flags List (Chen Tue 14).
    expect(submittedListCount(api.getState())).toBe(8)
    expect(submittedLists(api.getState()).every((l) => l.state === 'SUBMITTED')).toBe(true)
  })
})
