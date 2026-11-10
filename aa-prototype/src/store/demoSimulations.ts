/**
 * Bar-only demo simulations with no office stand-in badge (catch-up Phase 30,
 * re-pointed in 32b). Lives in the store so the PWA import closure stays pure.
 *
 * `simulateSickness`: an anaesthetist phones in sick and the office records it.
 * Unavailability is never a conflict (D59, OQ-81 part 3 answered): the office
 * marks the session Unavailable through the product's own
 * `markUnavailableAndMoveList`, as `OFFICE_ACTOR`, and in the same commit the
 * List goes back to the office as a Draft List or on to the first open
 * colleague in the office's order (tier, then preferred pairing). The audit
 * names the office; no notice is posted.
 */

import { isClosedKey, SEED_STATUS } from '../domain/slotStatus'
import { isBackdropList } from '../domain/conflicts'
import type { AssignedList } from '../domain/types'
import { isAssignedList } from '../domain/draftLists'
import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { refuse, ok, type Outcome } from './mutate'
import { markUnavailableAndMoveList } from './listMoveActions'
import { firstOfficeColleagueSlot } from './slotActions'

export const SIMULATED_SICKNESS_NOTE = 'Unwell, short notice (phoned in, simulated)'

/** Where the simulated sickness sends the List. */
export type SicknessRoute = 'office' | 'colleague'

/**
 * The day's Lists a sickness can be recorded on: today or later, not AUTHORISED, not backdrop,
 * Lists with Bookings first. Never a Draft List: it has no anaesthetist to fall
 * sick (catch-up Phase 31).
 */
export function sicknessCandidates(state: Pick<AppState, 'schedule' | 'clock'>, dateISO: string): AssignedList[] {
  const booked = new Map<string, number>()
  for (const b of Object.values(state.schedule.bookings)) if (b.cancellation === undefined) booked.set(b.listId, (booked.get(b.listId) ?? 0) + 1)
  return Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => isAssignedList(l) && l.dateISO === dateISO && l.dateISO >= state.clock.todayISO && l.state !== 'AUTHORISED' && !isBackdropList(l))
    .sort((a, b) => Number((booked.get(b.id) ?? 0) > 0) - Number((booked.get(a.id) ?? 0) > 0) || a.session.localeCompare(b.session) || a.anaesthetistId.localeCompare(b.anaesthetistId))
}

/** The colleague session the sickness would hand this List to (the office's first pick), or undefined. */
export function sicknessColleagueSlot(state: AppState, listId: string): string | undefined {
  return firstOfficeColleagueSlot(state, listId)
}

/** Why the sickness cannot be recorded on this List by this route, or null. */
export function sicknessRefusal(state: AppState, listId: string, route: SicknessRoute = 'office'): string | null {
  const list = state.schedule.lists[listId]
  if (list === undefined) return 'List not found'
  if (!isAssignedList(list)) return 'This List has no anaesthetist yet'
  const slot = state.schedule.slots[list.slotId]
  if (slot === undefined) return 'This List has no session in the schedule'
  if (isClosedKey(state.masters.slotStatuses, slot.status)) return 'Already unavailable'
  if (list.state === 'AUTHORISED') return 'This List is authorised and locked'
  if (list.dateISO < state.clock.todayISO) return "This List's day has passed"
  if (route === 'office' && list.state !== 'ACTIVE') return 'A submitted List can only be handed on to a colleague'
  if (route === 'colleague' && sicknessColleagueSlot(state, listId) === undefined) return 'No colleague is free that session'
  return null
}

export function simulateSickness(
  api: AppStoreApi,
  listId: string,
  route: SicknessRoute = 'office',
): Outcome<{ listId: string; slotId: string; route: SicknessRoute; toAnaesthetistId?: string }> {
  const state = api.getState()
  const reason = sicknessRefusal(state, listId, route)
  if (reason !== null) return refuse('notEligible', reason)
  const list = state.schedule.lists[listId]
  if (!isAssignedList(list)) return refuse('notEligible', 'This List has no anaesthetist yet')
  const toSlotId = route === 'colleague' ? sicknessColleagueSlot(state, listId) : undefined
  const out = markUnavailableAndMoveList(
    api,
    OFFICE_ACTOR,
    list.slotId,
    SEED_STATUS.unavailable,
    toSlotId !== undefined ? { route: 'colleague', toSlotId } : { route: 'office' },
    { vacatedStatus: SEED_STATUS.unavailable, note: SIMULATED_SICKNESS_NOTE },
  )
  if (!out.ok) return refuse(out.code, out.message)
  return ok({ listId, slotId: list.slotId, route, ...(out.value.toAnaesthetistId !== undefined ? { toAnaesthetistId: out.value.toAnaesthetistId } : {}) })
}
