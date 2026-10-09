/**
 * The live clock & the rolling canvas: day advances generate the new far-edge
 * days with THE SAME generator the seeder used (deep-match proven; catch-up
 * Phase 28: every active anaesthetist's Slots, free, then the calendar, then
 * recurring bookings, nothing invented), midnight rollovers advance the day,
 * reset restores the pristine seed — plus the 85-anaesthetist generator scale
 * test (P10's "structure must support 85").
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
import { authoriseList, cancelBooking, editBooking } from './lifecycle'
import { processMessage } from './integrationActions'
import { addDayNote } from './dayNoteActions'
import { wireBillingRun } from './billingRun'
import type { Actor } from './mutate'
import { canvasAnaesthetists, generateCanvasForDates, SEED_LEAVE, SEED_MARKERS, ANAE, type CanvasMasters } from '../domain/seed'
import { HOSP, SURG, seedSlotStatusRecords } from '../domain/seed'
import { enumerateDatesISO, horizonFor } from '../domain/clock'
import type { PermanentList, Slot } from '../domain/types'
import { projectedListId } from '../domain/slots'

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

function slotsPerAnaesthetistPerDayOk(slots: Slot[], anaesthetistIds: string[], dates: string[]): boolean {
  const byKey = new Map<string, number>()
  for (const slot of slots) {
    byKey.set(`${slot.anaesthetistId}|${slot.dateISO}`, (byKey.get(`${slot.anaesthetistId}|${slot.dateISO}`) ?? 0) + 1)
  }
  return dates.every((d) => anaesthetistIds.every((a) => byKey.get(`${a}|${d}`) === 2))
}

const MONTHS = 4

describe('clock roll-forward', () => {
  it('advanceDays keeps the invariant across the whole new horizon and deep-matches a fresh generation', () => {
    const api = createAppStore()
    const before = api.getState()
    const oldEnd = horizonFor(before.clock.todayISO, MONTHS).endISO

    advanceClockDays(api, 3)
    const state = api.getState()
    expect(state.clock.todayISO).toBe('2026-07-24')

    const newHorizon = horizonFor(state.clock.todayISO, MONTHS)
    const anaesthetistIds = Object.keys(state.masters.anaesthetists)
    const dates = enumerateDatesISO(newHorizon.startISO, newHorizon.endISO)
    const slots = Object.values(state.schedule.slots)
    expect(slotsPerAnaesthetistPerDayOk(slots, anaesthetistIds, dates)).toBe(true)

    // The rolled far edge is identical to a fresh generation (the generator is
    // pure and order-independent, and draws nothing).
    const newDates = dates.filter((d) => d > oldEnd)
    expect(newDates.length).toBe(3)
    const masters: CanvasMasters = {
      anaesthetists: canvasAnaesthetists(state.masters.anaesthetists),
      permanentLists: Object.values(state.masters.permanentLists),
      leave: SEED_LEAVE,
      series: [],
      statuses: state.masters.slotStatuses,
      holidays: Object.values(state.masters.holidays),
    }
    const fresh = generateCanvasForDates(masters, newDates)
    const byId = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id))
    expect(byId(slots.filter((s) => newDates.includes(s.dateISO)))).toEqual(byId(fresh.slots))
    expect(byId(Object.values(state.schedule.lists).filter((l) => newDates.includes(l.dateISO)))).toEqual(byId(fresh.lists))
    // Nothing invented: every rolled session is free unless a recurring booking projected a List.
    const listSlots = new Set(fresh.lists.map((l) => l.slotId))
    for (const slot of fresh.slots) if (!listSlots.has(slot.id)) expect(slot.status, slot.id).toBe('free')

    // One summary audit entry per rolled day, source demo.
    const rollEntries = state.audit.filter((a) => a.action === 'canvas.rollForward')
    expect(rollEntries.map((e) => e.entityId)).toEqual(newDates)
    expect(rollEntries.every((e) => e.source === 'demo')).toBe(true)
    expect(rollEntries[0]?.after).toMatchObject({ slots: anaesthetistIds.length * 2 })
  })

  it('advanceMinutes rolls midnight into a day advance (canvas included)', () => {
    const api = createAppStore()
    const oldEnd = horizonFor(api.getState().clock.todayISO, MONTHS).endISO
    // 08:00 + 16h05 crosses midnight.
    advanceClockMinutes(api, 16 * 60 + 5)
    const state = api.getState()
    expect(state.clock.todayISO).toBe('2026-07-22')
    expect(state.clock.minutesSinceMidnight).toBe(5)
    const farEdge = Object.values(state.schedule.slots).filter((s) => s.dateISO > oldEnd)
    expect(farEdge.length).toBe(Object.keys(state.masters.anaesthetists).length * 2)
  })

  it('advancing within the day never touches the canvas', () => {
    const api = createAppStore()
    const before = Object.keys(api.getState().schedule.slots).length
    advanceClockMinutes(api, 90)
    expect(api.getState().clock.minutesSinceMidnight).toBe(8 * 60 + 90)
    expect(Object.keys(api.getState().schedule.slots).length).toBe(before)
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
    const oldEnd = horizonFor(api.getState().clock.todayISO, MONTHS).endISO
    advanceClockToDate(api, '2026-07-28')
    const state = api.getState()
    expect(state.clock.todayISO).toBe('2026-07-28')
    expect(state.clock.minutesSinceMidnight).toBe(8 * 60)
    expect(Object.values(state.schedule.slots).some((s) => s.dateISO > oldEnd)).toBe(true)
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
      const marker = SEED_MARKERS['pendingCaptureBooking']
      if (marker === undefined) throw new Error('missing marker')
      expect(editBooking(api, OFFICE, marker.entityId, { notes: 'scribble' }).ok).toBe(true)
      expect(cancelBooking(api, OFFICE, marker.entityId, 'test').ok).toBe(true)
      expect(processMessage(api, 'MSG-STG-1001').ok).toBe(true)
      expect(addDayNote(api, OFFICE, '2026-07-21', 'reset-test note').ok).toBe(true)
      const splitList = projectedListId(ANAE.souter, '2026-07-20', 'AM')
      expect(api.getState().schedule.lists[splitList]?.state).toBe('SUBMITTED')
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
  it('generates 85 anaesthetists x the full horizon (~23,000 Slots) within 2 seconds, invariants intact', () => {
    const anaesthetistIds = Array.from({ length: 85 }, (_, i) => `A${String(i + 1).padStart(3, '0')}`)
    const patterns: Array<Pick<PermanentList, 'dayOfWeek' | 'session' | 'kind'> & {
      hospitalId: string | null
      surgeonId: string | null
    }> = [
      { dayOfWeek: 1, session: 'AM', kind: 'private', hospitalId: HOSP.stg, surgeonId: SURG.hale },
      { dayOfWeek: 2, session: 'AM', kind: 'public', hospitalId: HOSP.cph, surgeonId: null },
      { dayOfWeek: 3, session: 'PM', kind: 'private', hospitalId: HOSP.sx, surgeonId: SURG.patel },
      { dayOfWeek: 4, session: 'AM', kind: 'private', hospitalId: HOSP.forte, surgeonId: SURG.lim },
      { dayOfWeek: 5, session: 'PM', kind: 'preop', hospitalId: null, surgeonId: null },
    ]
    const permanentLists: PermanentList[] = anaesthetistIds.flatMap((anaesthetistId, i) =>
      patterns.slice(0, 3 + (i % 3)).map((p, j) => ({
        id: `SPL-${anaesthetistId}-${j}`,
        anaesthetistId,
        dayOfWeek: p.dayOfWeek,
        session: p.session,
        kind: p.kind,
        hospitalId: p.hospitalId,
        surgeonId: p.surgeonId,
      })),
    )
    const masters: CanvasMasters = {
      anaesthetists: anaesthetistIds.map((id) => ({ id, startDateISO: '2020-01-06', active: true })),
      permanentLists,
      leave: [],
      series: [],
      statuses: seedSlotStatusRecords(),
      holidays: [],
    }
    const horizon = horizonFor('2026-07-21', MONTHS)
    const dates = enumerateDatesISO(horizon.startISO, horizon.endISO)

    const startedAt = performance.now()
    const generated = generateCanvasForDates(masters, dates)
    const elapsedMs = performance.now() - startedAt

    expect(generated.slots.length).toBe(85 * dates.length * 2)
    expect(new Set(generated.slots.map((s) => s.id)).size).toBe(generated.slots.length)
    expect(new Set(generated.lists.map((l) => l.slotId)).size).toBe(generated.lists.length)
    expect(slotsPerAnaesthetistPerDayOk(generated.slots, anaesthetistIds, dates)).toBe(true)
    expect(elapsedMs).toBeLessThan(2000)

    // The demo seed itself is untouched by scale runs (pure function).
    const demo = createAppStore().getState()
    expect(Object.keys(demo.masters.anaesthetists).length).toBe(14)
  })
})
