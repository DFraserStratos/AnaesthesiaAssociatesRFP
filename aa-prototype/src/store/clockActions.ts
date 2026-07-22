/**
 * The live demo clock. Advancing time is the only place the canvas rolls:
 * each day gained generates the new far-edge dates from Permanent Lists with
 * THE SAME slot-hashed generator the seeder used, so the rolling 4-month
 * horizon holds and the far edge is byte-identical to what a fresh seed would
 * have produced (RFP design principle 6; 3rd review #3).
 *
 * Clock display writes go straight to state (they are not domain mutations);
 * the canvas roll routes through `mutate` with one summary audit entry per
 * rolled day, source 'demo'.
 */

import {
  advanceDays,
  advanceMinutes,
  enumerateDatesISO,
  horizonFor,
  type DemoClockState,
} from '../domain/clock'
import { generateListsForDates, SEED, type CanvasMasters } from '../domain/seed'
import { mutate, resetDomainState, type Actor, type MutationMeta } from './mutate'
import type { AppStoreApi } from './appStore'
import { emitAppEvent } from './events'

const DEMO_ACTOR: Actor = { who: 'Demo control', role: 'system', source: 'demo' }

/** Generate and append the Lists for canvas days gained by a clock change. */
function rollCanvasForward(api: AppStoreApi, previousTodayISO: string, todayISO: string): void {
  const previousHorizon = horizonFor(previousTodayISO)
  const nextHorizon = horizonFor(todayISO)
  if (nextHorizon.endISO <= previousHorizon.endISO) return

  const newDates = enumerateDatesISO(previousHorizon.endISO, nextHorizon.endISO).filter(
    (d) => d > previousHorizon.endISO,
  )
  if (newDates.length === 0) return

  const state = api.getState()
  const masters: CanvasMasters = {
    seed: SEED,
    anaesthetistIds: Object.keys(state.masters.anaesthetists),
    permanentLists: Object.values(state.masters.permanentLists),
    availability: Object.values(state.masters.availability),
    holidays: Object.values(state.masters.holidays),
  }
  const generated = generateListsForDates(masters, newDates)

  const metas: MutationMeta[] = newDates.map((dateISO) => ({
    entityType: 'canvas',
    entityId: dateISO,
    action: 'canvas.rollForward',
    after: { lists: generated.filter((l) => l.dateISO === dateISO).length },
  }))

  mutate(api, DEMO_ACTOR, metas, (s) => {
    const lists = { ...s.schedule.lists }
    for (const list of generated) {
      if (lists[list.id] === undefined) lists[list.id] = list
    }
    return { schedule: { ...s.schedule, lists } }
  })
}

function applyClock(api: AppStoreApi, next: DemoClockState): void {
  const previous = api.getState().clock
  api.setState({ clock: next })
  if (next.todayISO !== previous.todayISO) {
    rollCanvasForward(api, previous.todayISO, next.todayISO)
    emitAppEvent({ type: 'dayAdvanced', todayISO: next.todayISO })
  }
}

/** Advance the clock by minutes; rolling past midnight advances the day (and the canvas). */
export function advanceClockMinutes(api: AppStoreApi, minutes: number): void {
  applyClock(api, advanceMinutes(api.getState().clock, minutes))
}

/** Advance the clock by whole days, rolling the canvas forward. */
export function advanceClockDays(api: AppStoreApi, days: number): void {
  applyClock(api, advanceDays(api.getState().clock, days))
}

/** Reset to the pristine seed (clock included; the shell slice is preserved). */
export function resetDemo(api: AppStoreApi): void {
  resetDomainState(api)
}
