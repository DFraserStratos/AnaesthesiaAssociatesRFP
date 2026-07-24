/**
 * The live clock & the rolling canvas: day advances generate the new far-edge
 * days with THE SAME slot-hashed generator the seeder used (deep-match
 * proven), midnight rollovers advance the day, reset restores the pristine
 * seed — plus the 85-anaesthetist generator scale test (P10's "structure must
 * support 85").
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type AppState } from './appStore'
import {
  advanceClockDays,
  advanceClockMinutes,
  advanceClockToDate,
  advanceClockToNextMorning,
  resetDemo,
} from './clockActions'
import { authoriseList, cancelCard, editCard, submitList } from './lifecycle'
import { processMessage } from './integrationActions'
import { addDayNote } from './dayNoteActions'
import { wireBillingRun } from './billingRun'
import type { Actor } from './mutate'
import {
  generateListsForDates,
  SEED,
  SEED_MARKERS,
  listIdForSlot,
  ANAE,
  type CanvasMasters,
} from '../domain/seed'
import { HOSP, SURG } from '../domain/seed'
import { enumerateDatesISO, horizonFor } from '../domain/clock'
import type { List, PermanentList } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function domainSnapshot(state: AppState) {
  // Every domain slice reset touches (all of AppState except the preserved shell).
  return {
    clock: state.clock,
    masters: state.masters,
    schedule: state.schedule,
    audit: state.audit,
    settings: state.settings,
    counters: state.counters,
    dayNotes: state.dayNotes,
    billing: state.billing,
    xero: state.xero,
    integrations: state.integrations,
  }
}

function listsPerAnaesthetistPerDayOk(lists: List[], anaesthetistIds: string[], dates: string[]): boolean {
  const byKey = new Map<string, number>()
  for (const list of lists) {
    byKey.set(`${list.anaesthetistId}|${list.dateISO}`, (byKey.get(`${list.anaesthetistId}|${list.dateISO}`) ?? 0) + 1)
  }
  return dates.every((d) => anaesthetistIds.every((a) => byKey.get(`${a}|${d}`) === 2))
}

describe('clock roll-forward', () => {
  it('advanceDays keeps the invariant across the whole new horizon and deep-matches a fresh generation', () => {
    const api = createAppStore()
    const before = api.getState()
    const oldEnd = horizonFor(before.clock.todayISO).endISO

    advanceClockDays(api, 3)
    const state = api.getState()
    expect(state.clock.todayISO).toBe('2026-07-24')

    const newHorizon = horizonFor(state.clock.todayISO)
    const anaesthetistIds = Object.keys(state.masters.anaesthetists)
    const dates = enumerateDatesISO(newHorizon.startISO, newHorizon.endISO)
    const lists = Object.values(state.schedule.lists)
    expect(listsPerAnaesthetistPerDayOk(lists, anaesthetistIds, dates)).toBe(true)

    // The rolled far edge is byte-identical to a fresh generation (the
    // slot-hashed generator is order-independent).
    const newDates = dates.filter((d) => d > oldEnd)
    expect(newDates.length).toBe(3)
    const masters: CanvasMasters = {
      seed: SEED,
      anaesthetistIds,
      permanentLists: Object.values(state.masters.permanentLists),
      availability: Object.values(state.masters.availability),
      holidays: Object.values(state.masters.holidays),
    }
    const fresh = generateListsForDates(masters, newDates)
    const rolled = lists
      .filter((l) => newDates.includes(l.dateISO))
      .sort((a, b) => a.id.localeCompare(b.id))
    expect(rolled).toEqual([...fresh].sort((a, b) => a.id.localeCompare(b.id)))

    // One summary audit entry per rolled day, source demo.
    const rollEntries = state.audit.filter((a) => a.action === 'canvas.rollForward')
    expect(rollEntries.map((e) => e.entityId)).toEqual(newDates)
    expect(rollEntries.every((e) => e.source === 'demo')).toBe(true)
  })

  it('advanceMinutes rolls midnight into a day advance (canvas included)', () => {
    const api = createAppStore()
    const oldEnd = horizonFor(api.getState().clock.todayISO).endISO
    // 08:00 + 16h05 crosses midnight.
    advanceClockMinutes(api, 16 * 60 + 5)
    const state = api.getState()
    expect(state.clock.todayISO).toBe('2026-07-22')
    expect(state.clock.minutesSinceMidnight).toBe(5)
    const farEdge = Object.values(state.schedule.lists).filter((l) => l.dateISO > oldEnd)
    expect(farEdge.length).toBe(Object.keys(state.masters.anaesthetists).length * 2)
  })

  it('advancing within the day never touches the canvas', () => {
    const api = createAppStore()
    const before = Object.keys(api.getState().schedule.lists).length
    advanceClockMinutes(api, 90)
    expect(api.getState().clock.minutesSinceMidnight).toBe(8 * 60 + 90)
    expect(Object.keys(api.getState().schedule.lists).length).toBe(before)
  })

  it('advanceToNextMorning lands on 08:00 the next day, from any time of day', () => {
    const api = createAppStore()
    // Seeded at 08:00 exactly: still rolls to the FOLLOWING morning.
    advanceClockToNextMorning(api)
    expect(api.getState().clock.todayISO).toBe('2026-07-22')
    expect(api.getState().clock.minutesSinceMidnight).toBe(8 * 60)
    // From an afternoon time it also lands on the next morning.
    advanceClockMinutes(api, 9 * 60) // -> 17:00 same day
    advanceClockToNextMorning(api)
    expect(api.getState().clock.todayISO).toBe('2026-07-23')
    expect(api.getState().clock.minutesSinceMidnight).toBe(8 * 60)
  })

  it('advanceToDate jumps forward to 08:00 on the target and rolls the canvas', () => {
    const api = createAppStore()
    const oldEnd = horizonFor(api.getState().clock.todayISO).endISO
    advanceClockToDate(api, '2026-07-28')
    const state = api.getState()
    expect(state.clock.todayISO).toBe('2026-07-28')
    expect(state.clock.minutesSinceMidnight).toBe(8 * 60)
    expect(Object.values(state.schedule.lists).some((l) => l.dateISO > oldEnd)).toBe(true)
  })

  it('advanceToDate is a no-op for today or a past date (the clock cannot rewind)', () => {
    const api = createAppStore()
    advanceClockMinutes(api, 3 * 60) // 11:00 today
    const before = api.getState().clock
    advanceClockToDate(api, before.todayISO) // today
    advanceClockToDate(api, '2026-07-01') // past
    expect(api.getState().clock).toEqual(before)
  })
})

describe('reset determinism', () => {
  it('reset after mutations restores the pristine seed exactly (twice)', () => {
    const pristine = domainSnapshot(createAppStore().getState())

    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      // Dirty every domain slice: schedule/audit (edit + cancel), clock (advance),
      // integrations (fire a message), dayNotes (add a note), and billing/xero
      // (submit + authorise runs billing and hands off the Xero pair).
      advanceClockDays(api, 5)
      const marker = SEED_MARKERS['pendingCaptureCard']
      if (marker === undefined) throw new Error('missing marker')
      expect(editCard(api, OFFICE, marker.entityId, { notes: 'scribble' }).ok).toBe(true)
      expect(cancelCard(api, OFFICE, marker.entityId, 'test').ok).toBe(true)
      expect(processMessage(api, 'MSG-STG-1001').ok).toBe(true)
      expect(addDayNote(api, OFFICE, '2026-07-21', 'reset-test note').ok).toBe(true)
      const splitList = listIdForSlot(ANAE.souter, '2026-07-20', 'AM')
      expect(submitList(api, OFFICE, splitList).ok).toBe(true)
      expect(authoriseList(api, OFFICE, splitList).ok).toBe(true)
      // Sanity: those slices are genuinely dirty before we reset.
      expect(Object.keys(api.getState().integrations.messages).length).toBeGreaterThan(0)
      expect(Object.keys(api.getState().billing.invoices).length).toBeGreaterThan(0)
      expect(Object.keys(api.getState().xero.accRecs).length).toBeGreaterThan(0)

      resetDemo(api)
      expect(domainSnapshot(api.getState())).toEqual(pristine)

      advanceClockDays(api, 2)
      resetDemo(api)
      expect(domainSnapshot(api.getState())).toEqual(pristine)
    } finally {
      unwire()
    }
  })

  it('reset preserves the shell slice', () => {
    const api = createAppStore()
    api.getState().setCurrentApp('admin')
    resetDemo(api)
    expect(api.getState().shell.currentApp).toBe('admin')
  })
})

describe('canvas generator scale (the RFP production scale)', () => {
  it('generates 85 anaesthetists x the full horizon (~23,000 Lists) within 2 seconds, invariants intact', () => {
    const anaesthetistIds = Array.from({ length: 85 }, (_, i) => `A${String(i + 1).padStart(3, '0')}`)
    const patterns: Array<Pick<PermanentList, 'dayOfWeek' | 'session' | 'statusKey'> & {
      hospitalId: string | null
      surgeonId: string | null
    }> = [
      { dayOfWeek: 1, session: 'AM', statusKey: 'private', hospitalId: HOSP.stg, surgeonId: SURG.hale },
      { dayOfWeek: 2, session: 'AM', statusKey: 'public', hospitalId: HOSP.cph, surgeonId: null },
      { dayOfWeek: 3, session: 'PM', statusKey: 'private', hospitalId: HOSP.sx, surgeonId: SURG.patel },
      { dayOfWeek: 4, session: 'AM', statusKey: 'private', hospitalId: HOSP.forte, surgeonId: SURG.lim },
      { dayOfWeek: 5, session: 'PM', statusKey: 'preop', hospitalId: null, surgeonId: null },
    ]
    const permanentLists: PermanentList[] = anaesthetistIds.flatMap((anaesthetistId, i) =>
      patterns.slice(0, 3 + (i % 3)).map((p, j) => ({
        id: `SPL-${anaesthetistId}-${j}`,
        anaesthetistId,
        dayOfWeek: p.dayOfWeek,
        session: p.session,
        statusKey: p.statusKey,
        hospitalId: p.hospitalId,
        surgeonId: p.surgeonId,
      })),
    )
    const masters: CanvasMasters = {
      seed: SEED,
      anaesthetistIds,
      permanentLists,
      availability: [],
      holidays: [],
    }
    const horizon = horizonFor('2026-07-21')
    const dates = enumerateDatesISO(horizon.startISO, horizon.endISO)

    const startedAt = performance.now()
    const lists = generateListsForDates(masters, dates)
    const elapsedMs = performance.now() - startedAt

    expect(lists.length).toBe(85 * dates.length * 2)
    expect(new Set(lists.map((l) => l.id)).size).toBe(lists.length)
    expect(listsPerAnaesthetistPerDayOk(lists, anaesthetistIds, dates)).toBe(true)
    expect(elapsedMs).toBeLessThan(2000)

    // The demo seed itself is untouched by scale runs (pure function).
    const demo = createAppStore().getState()
    expect(Object.keys(demo.masters.anaesthetists).length).toBe(14)
  })
})
