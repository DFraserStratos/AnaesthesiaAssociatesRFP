/**
 * Draft List demo triggers' bodies (catch-up Phase 31). What normal use cannot
 * show in a presentation: a request arriving from a surgeon's room before the
 * presenter is ready, a Draft List on the day on screen, and the nightly roll
 * forward painting a recurring booking onto a day its anaesthetist has
 * already blocked out. Every write goes through the product's own actions as
 * the simulated office. The registry entries live in `shared/demoTriggers`.
 */

import { addDays, differenceInCalendarDays, format, getISODay, parseISO } from 'date-fns'
import { coversDate } from '../domain/recurringBookingProjection'
import { nextWeekday, isDraftList } from '../domain/draftLists'
import { CANNED_DAY_DRAFT_LISTS, CANNED_DRAFT_LIST_REQUESTS } from '../domain/seed'
import { SEED_STATUS } from '../domain/slotStatus'
import type { RecurringBooking, Session, Weekday } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { createDraftList } from './draftListActions'
import { createAvailabilitySeries } from './availabilityActions'
import { refuse, ok, type Outcome } from './mutate'
import { scheduleHorizon } from './selectors'

export const STAGED_CLASH_NOTE = 'Unavailable · staged for the demo'

/** A waiting Draft List with this hospital, surgeon, day and session already exists. */
function alreadyWaiting(state: Pick<AppState, 'schedule'>, p: { hospitalId: string; surgeonId: string; dateISO: string; session: Session }): boolean {
  return Object.values(state.schedule.lists).some(
    (l) => isDraftList(l) && l.hospitalId === p.hospitalId && l.surgeonId === p.surgeonId && l.dateISO === p.dateISO && l.session === p.session,
  )
}

/** The canned request's day, relative to the demo clock. */
export function cannedRequestDay(state: Pick<AppState, 'clock'>, requestId: string): { dateISO: string; session: Session } | undefined {
  const r = CANNED_DRAFT_LIST_REQUESTS.find((x) => x.id === requestId)
  return r === undefined ? undefined : { dateISO: nextWeekday(state.clock.todayISO, r.weekday), session: r.session }
}

/** Why "Simulate incoming request" cannot run for this choice, or null. */
export function incomingRequestRefusal(state: Pick<AppState, 'clock' | 'appSettings' | 'schedule'>, requestId: string): string | null {
  const r = CANNED_DRAFT_LIST_REQUESTS.find((x) => x.id === requestId)
  const day = cannedRequestDay(state, requestId)
  if (r === undefined || day === undefined) return 'Unknown request'
  if (day.dateISO > scheduleHorizon(state).endISO) return 'That day is beyond the schedule'
  if (alreadyWaiting(state, { ...r, ...day })) return 'Already waiting on Draft Lists'
  return null
}

/** A surgeon's room sends a request with no anaesthetist yet: the office logs it as a Draft List. */
export function simulateIncomingDraftListRequest(api: AppStoreApi, requestId: string): Outcome<{ listId: string; dateISO: string; session: Session }> {
  const reason = incomingRequestRefusal(api.getState(), requestId)
  if (reason !== null) return refuse('notAvailable', reason)
  const r = CANNED_DRAFT_LIST_REQUESTS.find((x) => x.id === requestId)!
  const day = cannedRequestDay(api.getState(), requestId)!
  const out = createDraftList(api, OFFICE_SIMULATION_ACTOR, { hospitalId: r.hospitalId, surgeonId: r.surgeonId, ...day, kind: 'private', source: r.source, note: r.note })
  if (!out.ok) return out
  return ok({ listId: out.value.listId, ...day })
}

/** Why "Add Draft List for this day" cannot run, or null. */
export function dayDraftListRefusal(state: Pick<AppState, 'clock' | 'appSettings' | 'schedule'>, dateISO: string, choiceId: string): string | null {
  const c = CANNED_DAY_DRAFT_LISTS.find((x) => x.id === choiceId)
  if (c === undefined) return 'Unknown choice'
  if (dateISO < state.clock.todayISO) return 'This day has passed'
  if (dateISO > scheduleHorizon(state).endISO) return 'Beyond the schedule'
  if (alreadyWaiting(state, { ...c, dateISO })) return 'Already added'
  return null
}

/** A Draft List for the day on screen, which shows in the band and the rail card at once. */
export function addDraftListForDay(api: AppStoreApi, dateISO: string, choiceId: string): Outcome<{ listId: string }> {
  const reason = dayDraftListRefusal(api.getState(), dateISO, choiceId)
  if (reason !== null) return refuse('notAvailable', reason)
  const c = CANNED_DAY_DRAFT_LISTS.find((x) => x.id === choiceId)!
  return createDraftList(api, OFFICE_SIMULATION_ACTOR, { hospitalId: c.hospitalId, surgeonId: c.surgeonId, dateISO, session: c.session, kind: 'private', source: c.source })
}

/**
 * A recurring booking's first unpainted day: the first day past the horizon's
 * far end that it covers (its next roll-forward day), and how many presses of
 * "Next day" paint it.
 */
export function firstUnpaintedDay(state: Pick<AppState, 'clock' | 'appSettings'>, rb: RecurringBooking): { dateISO: string; presses: number } | undefined {
  const end = scheduleHorizon(state).endISO
  for (let i = 1; i <= 14; i++) {
    const dateISO = format(addDays(parseISO(end), i), 'yyyy-MM-dd')
    if (coversDate(rb, dateISO)) return { dateISO, presses: differenceInCalendarDays(parseISO(dateISO), parseISO(end)) }
  }
  return undefined
}

/** The day is already staged: a staged series covers that day and session and it is still unpainted. */
export function stagedAlready(state: Pick<AppState, 'clock' | 'appSettings' | 'schedule'>, rb: RecurringBooking): boolean {
  const day = firstUnpaintedDay(state, rb)
  if (day === undefined) return false
  return Object.values(state.schedule.availabilitySeries).some(
    (s) => s.anaesthetistId === rb.anaesthetistId && s.note === STAGED_CLASH_NOTE && s.startISO === day.dateISO && (s.sessions === rb.session || s.sessions === 'both'),
  )
}

/**
 * "Stage recurring clash" (US-01.3.2 AC2 through the roll forward): marks the
 * recurring booking's anaesthetist Unavailable on its first unpainted day, as
 * a one-day series the generator paints first (Phase 29's beyond-horizon
 * option), as the simulated office. The clock's Next day then paints that
 * day, and the recurring booking becomes a Draft List through the ordinary
 * rule: no special path.
 */
export function stageRecurringClash(api: AppStoreApi, recurringBookingId: string): Outcome<{ dateISO: string; session: Session; presses: number }> {
  const state = api.getState()
  const rb = state.masters.recurringBookings[recurringBookingId]
  if (rb === undefined || rb.retiredAtISO !== undefined) return refuse('notFound', 'Recurring booking not found')
  const day = firstUnpaintedDay(state, rb)
  if (day === undefined) return refuse('notRunning', 'It does not run in the next two weeks past the schedule')
  if (stagedAlready(state, rb)) return refuse('alreadyStaged', 'Already staged')
  const out = createAvailabilitySeries(
    api,
    OFFICE_SIMULATION_ACTOR,
    {
      anaesthetistId: rb.anaesthetistId,
      statusKey: SEED_STATUS.unavailable,
      sessions: rb.session,
      weekdays: [getISODay(parseISO(day.dateISO)) as Weekday],
      everyWeeks: 1,
      startISO: day.dateISO,
      untilISO: day.dateISO,
      note: STAGED_CLASH_NOTE,
    },
    { beyondHorizon: true },
  )
  if (!out.ok) return out
  return ok({ dateISO: day.dateISO, session: rb.session, presses: day.presses })
}

/** The active recurring bookings, soonest first unpainted day first (the trigger's choices). */
export function stageableRecurringBookings(state: Pick<AppState, 'clock' | 'appSettings' | 'masters'>): { rb: RecurringBooking; dateISO: string }[] {
  return Object.values(state.masters.recurringBookings)
    .filter((rb) => rb.retiredAtISO === undefined)
    .flatMap((rb) => {
      const day = firstUnpaintedDay(state, rb)
      return day === undefined ? [] : [{ rb, dateISO: day.dateISO }]
    })
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.rb.session.localeCompare(b.rb.session) || a.rb.id.localeCompare(b.rb.id))
}
