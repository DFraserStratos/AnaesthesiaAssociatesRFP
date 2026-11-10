/**
 * The office opens and closes an out-of-hours session (catch-up Phase 32c;
 * US-01.1.6). Opening writes the third kind of Slot for one anaesthetist on
 * one day, at the default status (Free) and the out-of-hours default times
 * unless the office gives it its own; from then on it is a session like any
 * other (Assign List, a Draft List for that evening, availability, the
 * finders). Closing removes one that holds no List. PWA-safe: the PWA's office
 * stand-in opens one through `openOutOfHoursSession`.
 */

import { OUT_OF_HOURS, isOutOfHours, openOutOfHoursRefusal, outOfHoursTimesRefusal } from '../domain/outOfHours'
import { defaultSlotStatus } from '../domain/slotStatus'
import { effectiveSlotTimes, isWallTime, slotIdFor } from '../domain/slots'
import type { Slot } from '../domain/types'
import type { AppStoreApi } from './appStore'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import { listInSlot, rosterForDate } from './selectors'

/** Opens an out-of-hours session for an anaesthetist on a day (office only, today or later, one a day). */
export function openOutOfHoursSession(
  api: AppStoreApi,
  actor: Actor,
  anaesthetistId: string,
  dateISO: string,
  times: { startTime?: string; endTime?: string } = {},
): Outcome<{ slotId: string }> {
  const state = api.getState()
  const slotId = slotIdFor(anaesthetistId, dateISO, OUT_OF_HOURS)
  const refusal = openOutOfHoursRefusal({
    actor,
    dateISO,
    todayISO: state.clock.todayISO,
    hasRow: rosterForDate(state, dateISO).some((a) => a.registrationNumber === anaesthetistId),
    alreadyOpen: state.schedule.slots[slotId] !== undefined,
  })
  if (refusal !== null) return refuse(refusal.code, refusal.message)
  const defaults = state.appSettings.schedule.defaultTimes.OOH
  for (const t of [times.startTime, times.endTime]) {
    if (t !== undefined && t !== '' && !isWallTime(t)) return refuse('invalidTime', 'Times are HH:mm, for example 18:30.')
  }
  const start = times.startTime !== undefined && times.startTime !== '' ? times.startTime : defaults.startTime
  const end = times.endTime !== undefined && times.endTime !== '' ? times.endTime : defaults.endTime
  const pm = state.schedule.slots[slotIdFor(anaesthetistId, dateISO, 'PM')]
  const timesIssue = outOfHoursTimesRefusal({ startTime: start, endTime: end }, pm !== undefined ? effectiveSlotTimes(pm, state.appSettings.schedule).endTime : undefined)
  if (timesIssue !== null) return refuse('invalidTimes', timesIssue)

  const slot: Slot = { id: slotId, anaesthetistId, dateISO, session: OUT_OF_HOURS, status: defaultSlotStatus(state.masters.slotStatuses).key }
  // Times equal to the default stay unset, so a later change of the default reaches them (US-01.1.4).
  if (start !== defaults.startTime) slot.startTime = start
  if (end !== defaults.endTime) slot.endTime = end
  mutate(
    api,
    actor,
    {
      entityType: 'session',
      entityId: slotId,
      action: 'session.outOfHoursOpen',
      after: { anaesthetistId, dateISO, status: slot.status, startTime: start, endTime: end },
      stampBookingId: null,
    },
    (s) => ({ schedule: { ...s.schedule, slots: { ...s.schedule.slots, [slotId]: slot } } }),
  )
  return ok({ slotId })
}

/** Why the office cannot close this out-of-hours session, or null (the drawer's disabled reason). */
export function closeOutOfHoursRefusal(state: Parameters<typeof listInSlot>[0], slotId: string): string | null {
  const slot = state.schedule.slots[slotId]
  if (slot === undefined || !isOutOfHours(slot)) return 'Out-of-hours session not found.'
  if (listInSlot(state, slotId) !== undefined) return 'It holds a List. Reassign or return the List first.'
  return null
}

/** Closes an out-of-hours session that holds no List (office only). */
export function closeOutOfHoursSession(api: AppStoreApi, actor: Actor, slotId: string): Outcome {
  if (actor.role !== 'office' || actor.source === 'integration') return refuse('officeOnly', 'Only the office closes an out-of-hours session.')
  const state = api.getState()
  const blocked = closeOutOfHoursRefusal(state, slotId)
  if (blocked !== null) return refuse('notClosable', blocked)
  const slot = state.schedule.slots[slotId]!
  mutate(
    api,
    actor,
    {
      entityType: 'session',
      entityId: slotId,
      action: 'session.outOfHoursClose',
      before: { anaesthetistId: slot.anaesthetistId, dateISO: slot.dateISO, status: slot.status },
      stampBookingId: null,
    },
    (s) => {
      const slots = { ...s.schedule.slots }
      delete slots[slotId]
      return { schedule: { ...s.schedule, slots } }
    },
  )
  return ok(undefined)
}
