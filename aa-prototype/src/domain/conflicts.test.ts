/**
 * The one conflict rule (catch-up Phase 30; US-01.5.2, US-01.5.4, OQ-09):
 * facts, exclusions, the reconcile (stable, clears, re-raise), the wording and
 * the preview.
 */

import { describe, expect, it } from 'vitest'
import {
  availabilityCause,
  conflictFromCause,
  conflictPreview,
  describeConflict,
  expectedConflicts,
  holidayCause,
  holidayIndex,
  conflictFactsFor,
  reconcileAllConflicts,
  reconcileListConflicts,
  type ConflictLookups,
} from './conflicts'
import { SEED_STATUS } from './slotStatus'
import { seedSlotStatusRecords } from './seed'
import type { AssignedList, HospitalHoliday, List, Slot, SlotStatus } from './types'

const statuses = seedSlotStatusRecords()
const DATE = '2026-07-22'

const slot = (status: string, over: Partial<Slot> = {}): Slot => ({
  id: 'S-1-2026-07-22-AM',
  anaesthetistId: 'A1',
  dateISO: DATE,
  session: 'AM',
  status,
  ...over,
})

const list = (over: Partial<AssignedList> = {}): AssignedList => ({
  id: 'L-1',
  slotId: 'S-1-2026-07-22-AM',
  dateISO: DATE,
  anaesthetistId: 'A1',
  session: 'AM',
  state: 'ACTIVE',
  kind: 'private',
  hospitalId: 'H-SX',
  surgeonId: 'S-PATEL',
  conflicts: [],
  ...over,
})

const hol = (id: string, over: Partial<HospitalHoliday> = {}): HospitalHoliday => ({ id, hospitalId: 'H-SX', dateISO: DATE, name: 'Theatre maintenance closure', ...over })

function expectedFor(l: List, s: Slot, holidays: HospitalHoliday[] = [], st = statuses) {
  return expectedConflicts(l, conflictFactsFor(l, { slots: { [s.id]: s }, statuses: st, holidays: holidayIndex(holidays) }))
}

describe('expectedConflicts', () => {
  it('a closed status raises one availability conflict keyed on the status ID', () => {
    const e = expectedFor(list(), slot(SEED_STATUS.unavailable))
    expect(e).toEqual([{ kind: 'availability', cause: availabilityCause('S-1-2026-07-22-AM', 'unavailable'), slotId: 'S-1-2026-07-22-AM', statusKey: 'unavailable' }])
  })

  it('Free and any other bookable status raise nothing', () => {
    expect(expectedFor(list(), slot(SEED_STATUS.free))).toEqual([])
    const { isDefault: _default, ...freeRest } = statuses[SEED_STATUS.free]!
    void _default
    const bookable: SlotStatus = { ...freeRest, key: 'ST0001', label: 'Open late' }
    expect(expectedFor(list(), slot('ST0001'), [], { ...statuses, ST0001: bookable })).toEqual([])
  })

  it('a closed hospital raises one holiday conflict per closure, in id order', () => {
    const e = expectedFor(list(), slot(SEED_STATUS.free), [hol('HH2'), hol('HH1', { name: 'Other' })])
    expect(e.map((c) => c.cause)).toEqual([holidayCause('HH1'), holidayCause('HH2')])
  })

  it('a holiday at another hospital or date does not apply', () => {
    expect(expectedFor(list(), slot(SEED_STATUS.free), [hol('HH1', { hospitalId: 'H-CES' }), hol('HH2', { dateISO: '2026-07-23' })])).toEqual([])
  })

  it('AUTHORISED and backdrop Lists never conflict; ignoreLock sees the facts', () => {
    const l = list({ state: 'AUTHORISED' })
    expect(expectedFor(l, slot(SEED_STATUS.unavailable), [hol('HH1')])).toEqual([])
    const facts = conflictFactsFor(l, { slots: { [slot('x').id]: slot(SEED_STATUS.unavailable) }, statuses, holidays: holidayIndex([hol('HH1')]) })
    expect(expectedConflicts(l, facts, { ignoreLock: true })).toHaveLength(2)
    expect(expectedFor(list({ id: 'L-HIST-1' }), slot(SEED_STATUS.unavailable), [hol('HH1')])).toEqual([])
    expect(expectedFor(list({ id: 'L-RB-1' }), slot(SEED_STATUS.unavailable))).toEqual([])
  })

  it('a List with no Slot record gets no availability conflict but can carry a holiday one', () => {
    const l = list({ slotId: 'S-missing' })
    expect(expectedFor(l, slot(SEED_STATUS.unavailable), [hol('HH1')]).map((c) => c.kind)).toEqual(['holiday'])
  })

  it('the cause changes with the status, so a clear of Unavailable does not hide Holiday', () => {
    const a = expectedFor(list(), slot(SEED_STATUS.unavailable))[0]!
    const b = expectedFor(list(), slot(SEED_STATUS.holiday))[0]!
    expect(a.cause).not.toBe(b.cause)
  })
})

describe('reconcileListConflicts', () => {
  const AT = '2026-07-21T09:00:00'

  it('is referentially stable when nothing changed', () => {
    const l = list()
    expect(reconcileListConflicts(l, [], AT).next).toBe(l)
    const e = expectedFor(l, slot(SEED_STATUS.unavailable))
    const once = reconcileListConflicts(l, e, AT).next
    expect(reconcileListConflicts(once, e, '2026-07-22T10:00:00').next).toBe(once)
  })

  it('stamps new conflicts, keeps raisedAtISO on persisting ones and reports resolved ones', () => {
    const l = list()
    const first = reconcileListConflicts(l, expectedFor(l, slot(SEED_STATUS.unavailable), [hol('HH1')]), AT)
    expect(first.raised).toHaveLength(2)
    expect(first.next.conflicts.every((c) => c.raisedAtISO === AT)).toBe(true)
    const second = reconcileListConflicts(first.next, expectedFor(l, slot(SEED_STATUS.free), [hol('HH1')]), '2026-07-23T08:00:00')
    expect(second.resolved.map((c) => c.kind)).toEqual(['availability'])
    expect(second.next.conflicts).toEqual([first.next.conflicts[0]])
  })

  it('never stacks: one cause, one conflict', () => {
    const l = list()
    const e = expectedFor(l, slot(SEED_STATUS.unavailable))
    const a = reconcileListConflicts(l, e, AT).next
    expect(reconcileListConflicts(a, [...e], AT).next.conflicts).toHaveLength(1)
  })

  it('a live clear holds the conflict back, survives an unrelated change and is dropped when its cause goes', () => {
    const e = expectedFor(list(), slot(SEED_STATUS.unavailable))
    const cleared = list({ conflicts: [], conflictClears: [{ cause: e[0]!.cause, by: 'Kirsty W.', role: 'office', atISO: AT }] })
    const held = reconcileListConflicts(cleared, e, AT)
    expect(held.next.conflicts).toEqual([])
    expect(held.next).toBe(cleared)
    // An unrelated holiday arrives: the clear still holds, the holiday shows.
    const withHoliday = reconcileListConflicts(cleared, expectedFor(list(), slot(SEED_STATUS.unavailable), [hol('HH1')]), AT)
    expect(withHoliday.next.conflicts.map((c) => c.kind)).toEqual(['holiday'])
    expect(withHoliday.next.conflictClears).toHaveLength(1)
    // The cause goes: the clear is dropped; when the clash comes back it flags again.
    const gone = reconcileListConflicts(cleared, [], AT).next
    expect(gone.conflictClears).toBeUndefined()
    expect(reconcileListConflicts(gone, e, AT).next.conflicts).toHaveLength(1)
  })
})

describe('reconcileAllConflicts', () => {
  it('returns the same record when every List already agrees', () => {
    const s = slot(SEED_STATUS.free)
    const lists = { 'L-1': list() }
    expect(reconcileAllConflicts(lists, { slots: { [s.id]: s }, statuses, holidays: [] }, 'x')).toBe(lists)
  })
})

describe('describeConflict', () => {
  const lookups = (s: Slot, holidays: HospitalHoliday[] = []): ConflictLookups => ({
    holidays: Object.fromEntries(holidays.map((h) => [h.id, h])),
    hospitalName: (id) => (id === 'H-SX' ? 'Southern Cross' : id),
    anaesthetistName: () => 'Dr Rutherford',
    slots: { [s.id]: s },
    statuses,
  })

  it('names the closure', () => {
    const s = slot(SEED_STATUS.free)
    const d = describeConflict({ kind: 'holiday', holidayId: 'HH1' }, list(), lookups(s, [hol('HH1')]))
    expect(d).toEqual({ reason: 'Hospital closed', detail: 'Southern Cross is closed: Theatre maintenance closure.' })
  })

  it('names the anaesthetist, the status label and the note', () => {
    const s = slot(SEED_STATUS.unavailable, { note: 'Unwell, short notice' })
    const d = describeConflict({ kind: 'availability', slotId: s.id, statusKey: 'unavailable' }, list(), lookups(s))
    expect(d.reason).toBe('Anaesthetist unavailable')
    expect(d.detail).toBe(`Dr Rutherford is marked ${statuses.unavailable!.label} for this session. Note: unwell, short notice.`)
  })

  it('follows a relabelled status with no write', () => {
    const s = slot(SEED_STATUS.unavailable)
    const relabelled = { ...lookups(s), statuses: { ...statuses, unavailable: { ...statuses.unavailable!, label: 'Blocked' } } }
    expect(describeConflict({ kind: 'availability', slotId: s.id, statusKey: 'unavailable' }, list(), relabelled).detail).toContain('marked Blocked')
  })

  it('never says slot and carries no en or em dash', () => {
    const s = slot(SEED_STATUS.unavailable, { note: 'Away' })
    const texts = [
      describeConflict({ kind: 'availability', slotId: s.id, statusKey: 'unavailable' }, list(), lookups(s)).detail,
      describeConflict({ kind: 'holiday', holidayId: 'HH1' }, list(), lookups(s, [hol('HH1')])).detail,
      describeConflict({ kind: 'holiday', holidayId: 'gone' }, list(), lookups(s)).detail,
    ]
    for (const t of texts) {
      expect(t.toLowerCase()).not.toContain('slot')
      expect(t).not.toMatch(/[–—]/)
    }
  })
})

describe('conflictPreview and causes', () => {
  it('previews what an assignment would raise', () => {
    const p = conflictPreview({ dateISO: DATE, hospitalId: 'H-SX', slot: slot(SEED_STATUS.unavailable), statuses, holidays: [hol('HH1')] })
    expect(p.map((c) => c.kind)).toEqual(['holiday', 'availability'])
    expect(conflictPreview({ dateISO: DATE, hospitalId: 'H-CES', slot: slot(SEED_STATUS.free), statuses, holidays: [hol('HH1')] })).toEqual([])
  })

  it('round-trips a cause', () => {
    expect(conflictFromCause(holidayCause('HH900'))).toEqual({ kind: 'holiday', cause: 'holiday:HH900', holidayId: 'HH900' })
    expect(conflictFromCause(availabilityCause('S-1', 'unavailable'))).toMatchObject({ kind: 'availability', slotId: 'S-1', statusKey: 'unavailable' })
    expect(conflictFromCause('nonsense')).toBeNull()
  })
})
