/**
 * "Alert the office" (catch-up Phase 32b; US-03.6.3, FT-13.8, D58). An
 * anaesthetist who is unsure about one of her Lists or Bookings asks the office
 * to check it, with a note. It posts an active notice to the shared pool,
 * which stays until an admin ticks it resolved (`resolveNotification`).
 *
 * - OWNER ONLY: the List's anaesthetist, on her own ACTIVE or SUBMITTED List,
 *   or a Booking on it that is not cancelled. Never the office, a feed or a
 *   colleague.
 * - A NOTE IS REQUIRED: 1 to 300 characters once trimmed.
 * - ONE ACTIVE ALERT PER TARGET: a second alert on the same List (or the same
 *   Booking) is refused while the first is still active.
 * - NOTHING ELSE CHANGES: no Booking, List, warning or submit rule is read or
 *   written beyond the post and its audit row. Whether a Booking under an open
 *   alert may be submitted is undecided (US-03.6.3): submit stays allowed and
 *   the app says nothing about it.
 * - One `mutate()` commit through the one creator, `postNotification`, audited
 *   `notification.alert` on the List or the Booking. PWA-safe: nothing here
 *   reads the office's private slice.
 */

import { surnameCommaInitial } from '../domain/names'
import type { AssignedList } from '../domain/types'
import { clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi, AppState } from './appStore'
import { activeAlertFor, postNotification, resolveNotification } from './notifications'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'

/** The longest note an alert takes. */
export const OFFICE_ALERT_NOTE_MAX = 300

export interface OfficeAlertInput {
  listId: string
  /** Alert on one Booking of the List rather than the List itself. */
  bookingId?: string
  note: string
}

/** Why this actor may not alert the office about this target, or null (the UI's visibility uses the same rule). */
export function officeAlertRefusal(
  state: Pick<AppState, 'schedule' | 'notifications'>,
  actor: Actor,
  target: { listId: string; bookingId?: string },
): { code: string; message: string } | null {
  if (actor.role !== 'anaesthetist' || actor.source === 'integration' || actor.anaesthetistId === undefined) {
    return { code: 'ownerOnly', message: "Only the List's anaesthetist alerts the office." }
  }
  const list = state.schedule.lists[target.listId]
  if (list === undefined || list.removedAtISO !== undefined) return { code: 'notFound', message: 'List not found.' }
  if (list.state === 'DRAFT' || list.anaesthetistId !== actor.anaesthetistId) return { code: 'notOwnList', message: 'You can only alert the office about your own Lists.' }
  if (list.state === 'AUTHORISED') return { code: 'listAuthorised', message: 'This List is authorised and locked.' }
  if (target.bookingId !== undefined) {
    const booking = state.schedule.bookings[target.bookingId]
    if (booking === undefined || booking.listId !== list.id) return { code: 'notFound', message: 'Booking not found.' }
    if (booking.cancellation !== undefined) return { code: 'bookingCancelled', message: 'This Booking has been cancelled.' }
  }
  if (activeAlertFor(state, target) !== undefined) return { code: 'alreadyAlerted', message: 'The office already has an alert on this.' }
  return null
}

/** Ask the office to check a List or one of its Bookings, with a note (US-03.6.3). */
export function alertOffice(api: AppStoreApi, actor: Actor, input: OfficeAlertInput): Outcome<{ notificationId: string }> {
  const state = api.getState()
  const target = { listId: input.listId, ...(input.bookingId !== undefined ? { bookingId: input.bookingId } : {}) }
  const refusal = officeAlertRefusal(state, actor, target)
  if (refusal !== null) return refuse(refusal.code, refusal.message)
  const note = input.note.trim()
  if (note === '') return refuse('noteRequired', 'Add a note for the office.')
  if (note.length > OFFICE_ALERT_NOTE_MAX) return refuse('noteTooLong', `Keep the note to ${OFFICE_ALERT_NOTE_MAX} characters.`)

  let notificationId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const list = s.schedule.lists[input.listId] as AssignedList
    const booking = input.bookingId !== undefined ? s.schedule.bookings[input.bookingId] : undefined
    const patient = booking !== undefined ? s.masters.patients[booking.patientId] : undefined
    const post = postNotification(s, {
      kind: 'officeAlert',
      atISO: clockISO(s.clock),
      byActor: actor.who,
      listId: list.id,
      ...(booking !== undefined ? { bookingId: booking.id } : {}),
      ...(patient !== undefined ? { patientName: surnameCommaInitial(patient.name) } : {}),
      fromAnaesthetistId: list.anaesthetistId,
      dateISO: list.dateISO,
      session: list.session,
      hospitalId: list.hospitalId,
      surgeonId: list.surgeonId,
      message: note,
    })
    notificationId = post.id
    // The audit row names the List or the Booking the alert is about; it stamps
    // nothing on the Booking (an alert changes no Booking state).
    metas.push({
      entityType: booking !== undefined ? 'booking' : 'list',
      entityId: booking?.id ?? list.id,
      action: 'notification.alert',
      after: { notificationId: post.id, listId: list.id, ...(booking !== undefined ? { bookingId: booking.id } : {}), note },
      stampBookingId: null,
    })
    return { notifications: post.notifications, counters: post.counters }
  })
  return ok({ notificationId })
}

// ---------------------------------------------------------------------------
// PWA stand-in: "Office resolves this alert" (catch-up Phase 32b). The PWA has
// no Admin app, so the handset demo cannot tick the notice: this plays the
// office ticking the viewed List's or Booking's active alert, through the
// product's own `resolveNotification`, as `OFFICE_SIMULATION_ACTOR`.
// ---------------------------------------------------------------------------

/** Why the office stand-in cannot resolve an alert here, or null. */
export function officeResolvesAlertRefusal(state: Pick<AppState, 'notifications'>, target: { listId: string; bookingId?: string }): string | null {
  return activeAlertFor(state, target) === undefined ? 'No open alert to the office here' : null
}

export function officeResolvesAlert(api: AppStoreApi, target: { listId: string; bookingId?: string }): Outcome<{ id: string; resolvedAt: string }> {
  const alert = activeAlertFor(api.getState(), target)
  if (alert === undefined) return refuse('noAlert', 'No open alert to the office here')
  return resolveNotification(api, OFFICE_SIMULATION_ACTOR, alert.id)
}
