/**
 * The demo clock (Phase 01 — renamed from Phase 00's `demoClock.ts`).
 *
 * The whole prototype runs on a pinned demo date so seed data and screens match
 * the design mockups 1:1 (PROGRESS convention 5; Decisions log 2026-07-21).
 * Never call `Date.now()` / `new Date()` for domain logic — read the demo clock.
 *
 * The clock is PURE over an explicit state value: every function takes a
 * `DemoClockState` and returns a value or a new state. Phase 02's Zustand store
 * owns the state and drives the control-panel "advance" controls; Phase 04's
 * Start Now / Finish Now buttons stamp `now(state)` (7th review A13/B20 — the
 * tiered time-unit maths needs real elapsed minutes, so the clock supplies
 * times, not just dates).
 */

import { addDays, addMinutes, addMonths, format, parseISO } from 'date-fns'

/** ISO `YYYY-MM-DD` formatting helper (local time — the demo has one timezone). */
function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export interface DemoClockState {
  /** The demo "today". ISO `YYYY-MM-DD`. */
  todayISO: string
  /** Time of day as minutes since midnight (0..1439). */
  minutesSinceMidnight: number
}

/** Pinned demo date — the mockups' content date. ISO `YYYY-MM-DD`. */
export const DEMO_TODAY = '2026-07-21'

/** Human-readable form of {@link DEMO_TODAY} (matches the mockups' headers). */
export const DEMO_TODAY_LABEL = 'Tuesday 21 July 2026'

/**
 * Pinned demo "now" for the phone-frame status bar. A fixed display string
 * until Phase 02 wires the status bar to the advanceable clock state.
 */
export const DEMO_CLOCK_TIME = '9:41'

const MINUTES_PER_DAY = 24 * 60

/** The clock's seed state: {@link DEMO_TODAY} at 08:00 (a fixed morning time). */
export const INITIAL_CLOCK: DemoClockState = {
  todayISO: DEMO_TODAY,
  minutesSinceMidnight: 8 * 60,
}

/** The demo "today" as an ISO date string. */
export function today(state: DemoClockState): string {
  return state.todayISO
}

/**
 * The demo "now" as a Date — deterministic, built from the state value only
 * (never an argless `new Date()`; PROGRESS convention 5).
 */
export function now(state: DemoClockState): Date {
  return addMinutes(parseISO(state.todayISO), state.minutesSinceMidnight)
}

/**
 * Advance the clock by `minutes`. Rolls past midnight into the following day
 * (and handles negative values by rolling back).
 */
export function advanceMinutes(state: DemoClockState, minutes: number): DemoClockState {
  const total = state.minutesSinceMidnight + minutes
  const dayCarry = Math.floor(total / MINUTES_PER_DAY)
  return {
    todayISO:
      dayCarry === 0 ? state.todayISO : toISODate(addDays(parseISO(state.todayISO), dayCarry)),
    minutesSinceMidnight: ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY,
  }
}

/** Advance the clock by whole days, keeping the time of day. */
export function advanceDays(state: DemoClockState, days: number): DemoClockState {
  return {
    todayISO: toISODate(addDays(parseISO(state.todayISO), days)),
    minutesSinceMidnight: state.minutesSinceMidnight,
  }
}

/** The seed/canvas horizon extends this many days into the past… */
export const HORIZON_PAST_DAYS = 14
/** …and this many months into the future (RFP: bookings ~4 months out). */
export const HORIZON_FUTURE_MONTHS = 4

export interface Horizon {
  startISO: string
  endISO: string
}

/**
 * The canvas horizon around a given "today": 14 days back to 4 months forward.
 * Phase 02's seeder generates the List canvas across it, and `advanceDays`
 * rolls new far-edge days from Permanent Lists (3rd review #3).
 */
export function horizonFor(todayISO: string): Horizon {
  const t = parseISO(todayISO)
  return {
    startISO: toISODate(addDays(t, -HORIZON_PAST_DAYS)),
    endISO: toISODate(addMonths(t, HORIZON_FUTURE_MONTHS)),
  }
}

/** Every ISO date from `startISO` to `endISO`, inclusive of both ends. */
export function enumerateDatesISO(startISO: string, endISO: string): string[] {
  const out: string[] = []
  let d = parseISO(startISO)
  const end = parseISO(endISO)
  while (d.getTime() <= end.getTime()) {
    out.push(toISODate(d))
    d = addDays(d, 1)
  }
  return out
}
