/**
 * The live demo clock. Advancing time is the only place the canvas rolls:
 * each day gained generates the new far-edge dates with THE SAME generator the
 * seeder used (catch-up Phase 28: every active anaesthetist from their start
 * date, every Slot free, then the calendar, then recurring bookings; nothing
 * invented), so the rolling horizon holds (US-01.1.2) and the far edge
 * deep-equals a fresh generation. The horizon length is the setting (FT-01.1).
 *
 * Clock display writes go straight to state (they are not domain mutations);
 * the canvas roll routes through `mutate` with one summary audit entry per
 * rolled day, source 'demo'.
 */

import { differenceInCalendarDays, parseISO } from 'date-fns'
import {
  advanceDays,
  advanceMinutes,
  horizonDatesBetween,
  horizonFor,
  type DemoClockState,
} from '../domain/clock'
import { generateCanvasForDates } from '../domain/seed'
import { mutate, resetDomainState, type Actor, type MutationMeta } from './mutate'
import type { AppStoreApi } from './appStore'
import { emitAppEvent } from './events'
import { canvasMastersFrom, withGenerated } from './slotActions'

const DEMO_ACTOR: Actor = { who: 'Demo control', role: 'system', source: 'demo' }

/** Generate and append the Slots and Lists for canvas days gained by a clock change. */
function rollCanvasForward(api: AppStoreApi, previousTodayISO: string, todayISO: string): void {
  const months = api.getState().appSettings.schedule.horizonMonths
  const newDates = horizonDatesBetween(horizonFor(previousTodayISO, months).endISO, horizonFor(todayISO, months).endISO)
  if (newDates.length === 0) return

  const state = api.getState()
  const generated = generateCanvasForDates(canvasMastersFrom(state), newDates)

  const metas: MutationMeta[] = newDates.map((dateISO) => ({
    entityType: 'canvas',
    entityId: dateISO,
    action: 'canvas.rollForward',
    after: {
      slots: generated.slots.filter((s) => s.dateISO === dateISO).length,
      lists: generated.lists.filter((l) => l.dateISO === dateISO).length,
    },
  }))

  mutate(api, DEMO_ACTOR, metas, (s) => ({ schedule: withGenerated(s.schedule, generated).schedule }))
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

const MORNING_MINUTES = 8 * 60

/**
 * Advance forward to 08:00 on the next calendar day (rolling the canvas exactly
 * as the day advances do). Forward-only, so it always lands on the following
 * morning regardless of the current time of day.
 */
export function advanceClockToNextMorning(api: AppStoreApi): void {
  const { minutesSinceMidnight } = api.getState().clock
  const minutesToNextMorning = 24 * 60 - minutesSinceMidnight + MORNING_MINUTES
  advanceClockMinutes(api, minutesToNextMorning)
}

/**
 * Forward jump to 08:00 on `dateISO`, rolling the canvas over every day gained.
 * No-op when the target is today or in the past (the clock cannot rewind).
 */
export function advanceClockToDate(api: AppStoreApi, dateISO: string): void {
  const clock = api.getState().clock
  const daysDelta = differenceInCalendarDays(parseISO(dateISO), parseISO(clock.todayISO))
  if (daysDelta <= 0) return
  const totalMinutes = daysDelta * 24 * 60 + (MORNING_MINUTES - clock.minutesSinceMidnight)
  advanceClockMinutes(api, totalMinutes)
}

/** Reset to the pristine seed (clock included; the shell slice is preserved). */
export function resetDemo(api: AppStoreApi): void {
  resetDomainState(api)
}
