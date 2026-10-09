/**
 * Bar-only demo simulations with no office stand-in badge (catch-up Phase 30).
 * Lives in the store so the PWA import closure stays pure.
 *
 * `simulateSickness`: an anaesthetist phones in sick and the office records it
 * (OQ-81 part 3, provisional: a sickness the office records is a conflict with
 * the List and its Bookings in place). It writes the seeded Unavailable status
 * by its fixed ID through the store's availability action, as `OFFICE_ACTOR`,
 * so the one conflict rule in `mutate()` flags the List and the audit names
 * the office. Because it is an office write, Phase 32's return-or-assign (an
 * anaesthetist's choice) never applies to it.
 */

import { isClosedKey, SEED_STATUS } from '../domain/slotStatus'
import { isBackdropList } from '../domain/conflicts'
import type { AssignedList } from '../domain/types'
import { isAssignedList } from '../domain/draftLists'
import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { refuse, ok, type Outcome } from './mutate'
import { setAvailability } from './slotActions'

export const SIMULATED_SICKNESS_NOTE = 'Unwell, short notice (phoned in, simulated)'

/**
 * The day's Lists a sickness can be recorded on: not AUTHORISED, not backdrop,
 * Lists with Bookings first. Never a Draft List: it has no anaesthetist to fall
 * sick (catch-up Phase 31).
 */
export function sicknessCandidates(state: Pick<AppState, 'schedule'>, dateISO: string): AssignedList[] {
  const booked = new Map<string, number>()
  for (const b of Object.values(state.schedule.bookings)) if (b.cancellation === undefined) booked.set(b.listId, (booked.get(b.listId) ?? 0) + 1)
  return Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => isAssignedList(l) && l.dateISO === dateISO && l.state !== 'AUTHORISED' && !isBackdropList(l))
    .sort((a, b) => Number((booked.get(b.id) ?? 0) > 0) - Number((booked.get(a.id) ?? 0) > 0) || a.session.localeCompare(b.session) || a.anaesthetistId.localeCompare(b.anaesthetistId))
}

/** Why the sickness cannot be recorded on this List, or null. */
export function sicknessRefusal(state: Pick<AppState, 'schedule' | 'masters'>, listId: string): string | null {
  const list = state.schedule.lists[listId]
  if (list === undefined) return 'List not found'
  if (!isAssignedList(list)) return 'This List has no anaesthetist yet'
  const slot = state.schedule.slots[list.slotId]
  if (slot === undefined) return 'This List has no session in the schedule'
  if (isClosedKey(state.masters.slotStatuses, slot.status)) return 'Already unavailable'
  return null
}

export function simulateSickness(api: AppStoreApi, listId: string): Outcome<{ listId: string; slotId: string }> {
  const state = api.getState()
  const reason = sicknessRefusal(state, listId)
  if (reason !== null) return refuse('notEligible', reason)
  const list = state.schedule.lists[listId]
  if (!isAssignedList(list)) return refuse('notEligible', 'This List has no anaesthetist yet')
  const out = setAvailability(api, OFFICE_ACTOR, list.anaesthetistId, list.dateISO, list.session, SEED_STATUS.unavailable, SIMULATED_SICKNESS_NOTE)
  if (!out.ok) return refuse(out.code, out.message)
  return ok({ listId, slotId: list.slotId })
}
