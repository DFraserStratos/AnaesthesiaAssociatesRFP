/**
 * Warnings in the store (catch-up Phase 15a; FT-13.7, US-13.7.1 to US-13.7.3).
 *
 * Warnings are DERIVED: `domain/warnings` evaluates each Booking from facts
 * built here. The only stored state is an office clearance, kept in
 * `schedule.warningClearances` (keyed by warning key) outside the Booking, so
 * clearing never touches a Booking an AUTHORISED List has locked and never
 * changes a Booking's `lastModifiedBy`. A warning never blocks anything: no
 * guard in lifecycle.ts reads this module.
 *
 * Components select the slices these read (`schedule`, `billing`,
 * `appSettings`, `clock`) and memoise the call; never return these arrays
 * straight from a zustand selector.
 */

import {
  evaluateWarnings,
  strengthRank,
  strongerOf,
  WARNING_RULES,
  type Warning,
  type WarningFacts,
  type WarningRule,
  type WarningStrength,
} from '../domain/warnings'
import type { Booking, Procedure } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import { prepaymentStatusFor } from './selectors'

/** The state slices the warning selectors read. */
export type WarningState = Pick<AppState, 'schedule' | 'billing' | 'appSettings' | 'clock'>

function proceduresByBooking(state: Pick<AppState, 'schedule'>): Map<string, Procedure[]> {
  const out = new Map<string, Procedure[]>()
  for (const p of Object.values(state.schedule.procedures)) {
    const arr = out.get(p.bookingId)
    if (arr === undefined) out.set(p.bookingId, [p])
    else arr.push(p)
  }
  for (const arr of out.values()) arr.sort((a, b) => a.id.localeCompare(b.id))
  return out
}

function factsFor(state: WarningState, booking: Booking, procedures: readonly Procedure[]): WarningFacts | undefined {
  const list = state.schedule.lists[booking.listId]
  if (list === undefined) return undefined
  return {
    booking,
    list,
    procedures,
    prepaymentStatus: prepaymentStatusFor(state, booking.id),
    todayISO: state.clock.todayISO,
  }
}

/** The facts every rule may read for one Booking (undefined when it or its List is missing). */
export function warningFactsFor(state: WarningState, bookingId: string): WarningFacts | undefined {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return undefined
  const procedures = Object.values(state.schedule.procedures)
    .filter((p) => p.bookingId === bookingId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return factsFor(state, booking, procedures)
}

function evaluate(state: WarningState, facts: WarningFacts | undefined, rules: readonly WarningRule[]): Warning[] {
  if (facts === undefined) return []
  return evaluateWarnings(facts, rules, state.appSettings.warningRules, state.schedule.warningClearances)
}

/** Every warning on one Booking, open and cleared, strong first. */
export function warningsForBooking(
  state: WarningState,
  bookingId: string,
  rules: readonly WarningRule[] = WARNING_RULES,
): Warning[] {
  return evaluate(state, warningFactsFor(state, bookingId), rules)
}

/** Every warning on a List's Bookings (open and cleared), in Booking order. */
export function warningsForList(
  state: WarningState,
  listId: string,
  rules: readonly WarningRule[] = WARNING_RULES,
): Warning[] {
  const byBooking = proceduresByBooking(state)
  return Object.values(state.schedule.bookings)
    .filter((b) => b.listId === listId)
    .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
    .flatMap((b) => evaluate(state, factsFor(state, b, byBooking.get(b.id) ?? []), rules))
}

/** An open warning with what the to-do list shows beside it. */
export interface OpenWarningRow {
  warning: Warning
  bookingId: string
  listId: string
  dateISO: string
  session: 'AM' | 'PM'
  patientId: string
  anaesthetistId: string
  scheduledTime?: string
}

/**
 * Every OPEN warning on every non-cancelled Booking (the dashboard to-do list,
 * US-13.7.2), sorted by the List's date, then strong before mild, then the
 * Booking's time.
 */
export function openWarnings(state: WarningState, rules: readonly WarningRule[] = WARNING_RULES): OpenWarningRow[] {
  const byBooking = proceduresByBooking(state)
  const rows: OpenWarningRow[] = []
  for (const booking of Object.values(state.schedule.bookings)) {
    if (booking.cancellation !== undefined) continue
    const facts = factsFor(state, booking, byBooking.get(booking.id) ?? [])
    if (facts === undefined) continue
    for (const warning of evaluate(state, facts, rules)) {
      if (warning.clearance !== undefined) continue
      rows.push({
        warning,
        bookingId: booking.id,
        listId: facts.list.id,
        dateISO: facts.list.dateISO,
        session: facts.list.session,
        patientId: booking.patientId,
        anaesthetistId: facts.list.anaesthetistId,
        scheduledTime: booking.scheduledTime,
      })
    }
  }
  return rows.sort(
    (a, b) =>
      a.dateISO.localeCompare(b.dateISO) ||
      strengthRank(b.warning.strength) - strengthRank(a.warning.strength) ||
      a.session.localeCompare(b.session) ||
      (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') ||
      a.warning.key.localeCompare(b.warning.key),
  )
}

export interface ListWarningSummary {
  open: number
  strongest: WarningStrength
}

/** Open-warning count and strongest strength per List on one date (the Day view outline). */
export function warningSummaryByList(
  state: WarningState,
  dateISO: string,
  rules: readonly WarningRule[] = WARNING_RULES,
): Map<string, ListWarningSummary> {
  const out = new Map<string, ListWarningSummary>()
  for (const row of openWarnings(state, rules)) {
    if (row.dateISO !== dateISO) continue
    const prev = out.get(row.listId)
    out.set(
      row.listId,
      prev === undefined
        ? { open: 1, strongest: row.warning.strength }
        : { open: prev.open + 1, strongest: strongerOf(prev.strongest, row.warning.strength) },
    )
  }
  return out
}

/**
 * The office clears a warning once it has been dealt with (US-13.7.2; the
 * recording of clearing is a provisional reading). Office role only (the
 * simulated office qualifies). Allowed on any List state, AUTHORISED
 * included, because only `schedule.warningClearances` changes.
 */
export function clearWarning(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  key: string,
  rules: readonly WarningRule[] = WARNING_RULES,
): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can clear a warning.')
  const state = api.getState()
  const warning = warningsForBooking(state, bookingId, rules).find((w) => w.key === key)
  if (warning === undefined) return refuse('notFound', 'This warning is no longer raised on the Booking.')
  if (warning.clearance !== undefined) return refuse('alreadyCleared', 'This warning is already cleared.')

  const atISO = clockISO(state.clock)
  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.warningCleared',
      after: { ruleId: warning.ruleId, strength: warning.strength, warning: warning.text },
      stampBookingId: null,
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        warningClearances: {
          ...s.schedule.warningClearances,
          [key]: { key, bookingId, ruleId: warning.ruleId, strength: warning.strength, by: actor.who, role: actor.role, atISO },
        },
      },
    }),
  )
  return ok(undefined)
}
