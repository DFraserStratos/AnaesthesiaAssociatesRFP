/**
 * The one conflict rule (catch-up Phase 30; US-01.5.2, US-01.5.4, OQ-09):
 * facts, exclusions, the reconcile (stable, clears, re-raise), the wording and
 * the preview. Since catch-up Phase 32b (D59, DM-56) a conflict is a closed
 * hospital only: an anaesthetist's unavailability never derives one.
 */

import { describe, expect, it } from 'vitest'
import {
  CONFLICT_REASONS,
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
import type { AssignedList, HospitalHoliday, List } from './types'

const DATE = '2026-07-22'

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
  conflicts: [], origin: { kind: 'manual' as const },
  ...over,
})

const hol = (id: string, over: Partial<HospitalHoliday> = {}): HospitalHoliday => ({ id, hospitalId: 'H-SX', dateISO: DATE, name: 'Theatre maintenance closure', ...over })

function expectedFor(l: List, holidays: HospitalHoliday[] = []) {
  return expectedConflicts(l, conflictFactsFor(l, { holidays: holidayIndex({ hospitalHolidays: holidays, publicHolidays: [] }) }))
}

describe('expectedConflicts', () => {
  it('a closed session never derives a conflict: the rule reads hospital closures only (D59)', () => {
    // The facts carry no session status at all, so no status can raise one.
    expect(Object.keys(conflictFactsFor(list(), { holidays: holidayIndex({ hospitalHolidays: [], publicHolidays: [] }) }))).toEqual(['closures'])
    expect(expectedFor(list())).toEqual([])
    expect(Object.keys(CONFLICT_REASONS)).toEqual(['holiday'])
  })

  it('a closed hospital raises one holiday conflict per closure, in id order', () => {
    const e = expectedFor(list(), [hol('HH2'), hol('HH1', { name: 'Other' })])
    expect(e.map((c) => c.cause)).toEqual([holidayCause('HH1'), holidayCause('HH2')])
    expect(e.every((c) => c.kind === 'holiday')).toBe(true)
  })

  it('a holiday at another hospital or date does not apply', () => {
    expect(expectedFor(list(), [hol('HH1', { hospitalId: 'H-CES' }), hol('HH2', { dateISO: '2026-07-23' })])).toEqual([])
  })

  it('AUTHORISED and backdrop Lists never conflict; ignoreLock sees the facts', () => {
    const l = list({ state: 'AUTHORISED' })
    expect(expectedFor(l, [hol('HH1')])).toEqual([])
    const facts = conflictFactsFor(l, { holidays: holidayIndex({ hospitalHolidays: [hol('HH1')], publicHolidays: [] }) })
    expect(expectedConflicts(l, facts, { ignoreLock: true })).toHaveLength(1)
    expect(expectedFor(list({ id: 'L-HIST-1' }), [hol('HH1')])).toEqual([])
    expect(expectedFor(list({ id: 'L-RB-1' }), [hol('HH1')])).toEqual([])
  })

  it('a Draft List (no Slot) can carry a holiday conflict', () => {
    const { slotId: _s, anaesthetistId: _a, ...rest } = list()
    void _s
    void _a
    const draft = { ...rest, state: 'DRAFT' as const, draft: { origin: 'request' as const, sinceISO: '2026-07-21T08:00:00', by: 'Kirsty W.' } }
    expect(expectedFor(draft, [hol('HH1')]).map((c) => c.kind)).toEqual(['holiday'])
  })
})

describe('reconcileListConflicts', () => {
  const AT = '2026-07-21T09:00:00'

  it('is referentially stable when nothing changed', () => {
    const l = list()
    expect(reconcileListConflicts(l, [], AT).next).toBe(l)
    const e = expectedFor(l, [hol('HH1')])
    const once = reconcileListConflicts(l, e, AT).next
    expect(reconcileListConflicts(once, e, '2026-07-22T10:00:00').next).toBe(once)
  })

  it('stamps new conflicts, keeps raisedAtISO on persisting ones and reports resolved ones', () => {
    const l = list()
    const first = reconcileListConflicts(l, expectedFor(l, [hol('HH1'), hol('HH2')]), AT)
    expect(first.raised).toHaveLength(2)
    expect(first.next.conflicts.every((c) => c.raisedAtISO === AT)).toBe(true)
    const second = reconcileListConflicts(first.next, expectedFor(l, [hol('HH1')]), '2026-07-23T08:00:00')
    expect(second.resolved.map((c) => c.cause)).toEqual([holidayCause('HH2')])
    expect(second.next.conflicts).toEqual([first.next.conflicts[0]])
  })

  it('never stacks: one cause, one conflict', () => {
    const l = list()
    const e = expectedFor(l, [hol('HH1')])
    const a = reconcileListConflicts(l, e, AT).next
    expect(reconcileListConflicts(a, [...e], AT).next.conflicts).toHaveLength(1)
  })

  it('a live clear holds the conflict back, survives an unrelated change and is dropped when its cause goes', () => {
    const e = expectedFor(list(), [hol('HH1')])
    const cleared = list({ conflicts: [], origin: { kind: 'manual' as const }, conflictClears: [{ cause: e[0]!.cause, by: 'Kirsty W.', role: 'office', atISO: AT }] })
    const held = reconcileListConflicts(cleared, e, AT)
    expect(held.next.conflicts).toEqual([])
    expect(held.next).toBe(cleared)
    // An unrelated second closure arrives: the clear still holds, the new one shows.
    const withAnother = reconcileListConflicts(cleared, expectedFor(list(), [hol('HH1'), hol('HH2')]), AT)
    expect(withAnother.next.conflicts.map((c) => c.cause)).toEqual([holidayCause('HH2')])
    expect(withAnother.next.conflictClears).toHaveLength(1)
    // The cause goes: the clear is dropped; when the clash comes back it flags again.
    const gone = reconcileListConflicts(cleared, [], AT).next
    expect(gone.conflictClears).toBeUndefined()
    expect(reconcileListConflicts(gone, e, AT).next.conflicts).toHaveLength(1)
  })
})

describe('reconcileAllConflicts', () => {
  it('returns the same record when every List already agrees', () => {
    const lists = { 'L-1': list() }
    expect(reconcileAllConflicts(lists, { holidays: [], publicHolidays: [] }, 'x')).toBe(lists)
  })
})

describe('describeConflict', () => {
  const lookups = (holidays: HospitalHoliday[] = []): ConflictLookups => ({
    holidays: Object.fromEntries(holidays.map((h) => [h.id, h])),
    hospitalName: (id) => (id === 'H-SX' ? 'Southern Cross' : id),
  })

  it('names the closure', () => {
    const d = describeConflict({ kind: 'holiday', holidayId: 'HH1' }, list(), lookups([hol('HH1')]))
    expect(d).toEqual({ reason: 'Hospital closed', detail: 'Southern Cross is closed: Theatre maintenance closure.' })
  })

  it('falls back to the List hospital when the holiday is gone', () => {
    expect(describeConflict({ kind: 'holiday', holidayId: 'gone' }, list(), lookups()).detail).toBe('Southern Cross is closed on this date.')
  })

  it('never says slot and carries no en or em dash', () => {
    const texts = [
      describeConflict({ kind: 'holiday', holidayId: 'HH1' }, list(), lookups([hol('HH1')])).detail,
      describeConflict({ kind: 'holiday', holidayId: 'gone' }, list(), lookups()).detail,
    ]
    for (const t of texts) {
      expect(t.toLowerCase()).not.toContain('slot')
      expect(t).not.toMatch(/[–—]/)
    }
  })
})

describe('conflictPreview and causes', () => {
  it('previews the closure an assignment would land on', () => {
    expect(conflictPreview({ dateISO: DATE, hospitalId: 'H-SX', holidays: [hol('HH1')], publicHolidays: [] }).map((c) => c.kind)).toEqual(['holiday'])
    expect(conflictPreview({ dateISO: DATE, hospitalId: 'H-CES', holidays: [hol('HH1')], publicHolidays: [] })).toEqual([])
    expect(conflictPreview({ dateISO: DATE, hospitalId: undefined, holidays: [hol('HH1')], publicHolidays: [] })).toEqual([])
  })

  it('round-trips a cause, and an old availability cause no longer parses', () => {
    expect(conflictFromCause(holidayCause('HH900'))).toEqual({ kind: 'holiday', cause: 'holiday:HH900', holidayId: 'HH900' })
    expect(conflictFromCause('availability:S-1:unavailable')).toBeNull()
    expect(conflictFromCause('nonsense')).toBeNull()
  })
})

describe('public holidays (catch-up Phase 42)', () => {
  const pub = { id: 'PH001', dateISO: DATE, name: 'Labour Day', kind: 'national' as const, openHospitalIds: [] as string[] }
  it('a public closure yields a publicHoliday cause, beside a hospital closure', () => {
    const facts = conflictFactsFor(list(), { holidays: holidayIndex({ hospitalHolidays: [hol('HH1')], publicHolidays: [pub] }) })
    expect(expectedConflicts(list(), facts)).toEqual([
      { kind: 'holiday', cause: 'holiday:HH1', holidayId: 'HH1' },
      { kind: 'holiday', cause: 'publicHoliday:PH001', publicHolidayId: 'PH001' },
    ])
  })
  it('a hospital listed open raises none', () => {
    const facts = conflictFactsFor(list(), { holidays: holidayIndex({ hospitalHolidays: [], publicHolidays: [{ ...pub, openHospitalIds: ['H-SX'] }] }) })
    expect(expectedConflicts(list(), facts)).toEqual([])
  })
  it('reads as a public holiday and round-trips its cause', () => {
    const d = describeConflict({ kind: 'holiday', publicHolidayId: 'PH001' }, { hospitalId: 'H-STG' }, {
      holidays: {},
      publicHolidays: { PH001: pub },
      hospitalName: (id) => (id === 'H-STG' ? "St George's" : id),
    })
    expect(d.detail).toBe("St George's is closed: Labour Day (public holiday).")
    expect(conflictFromCause('publicHoliday:PH001')).toEqual({ kind: 'holiday', cause: 'publicHoliday:PH001', publicHolidayId: 'PH001' })
    expect(conflictPreview({ dateISO: DATE, hospitalId: 'H-SX', holidays: [], publicHolidays: [pub] })).toHaveLength(1)
  })
})
