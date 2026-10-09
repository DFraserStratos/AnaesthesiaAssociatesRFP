/**
 * Draft List actions (catch-up Phase 31; FT-01.6, US-01.6.1 to US-01.6.4,
 * EP-07, FT-07.1; OQ-44 and OQ-86 answered, D44, D46).
 *
 * A Draft List is a List in state DRAFT with no anaesthetist and no Slot. Only
 * the office creates, assigns, re-dates and removes one; an integration feed
 * and an anaesthetist are refused. Every write goes through `mutate()` with
 * before and after metas and timestamps from the demo clock.
 *
 * Warn, never block, except the real guards: assigning onto a closed session
 * (Unavailable, Holiday or any closed status) or into a not-preferred pairing
 * goes ahead (the reconcile in `mutate()` flags the closed session; 17's
 * acknowledgement records the pairing). Only an occupied session, an
 * incomplete pairing, a missing or passed day, a removal while Bookings wait,
 * and the office-only guard refuse.
 *
 * An office write path that records the not-preferred acknowledgement, so it
 * is on Phase 17's privacy allowlist (`apps/officePrivacy.test.ts`). It reads
 * the office slice through the pure helper and never imports
 * `store/officePrivate.ts`, so the PWA closure check holds.
 */

import { notPreferredEntryIds, notPreferredWarning, pairingAcknowledgement } from '../domain/pairingPreferences'
import { DRAFT_ASSIGN_WARNINGS, isDraftList, isRemoved, removeBlockedReason } from '../domain/draftLists'
import { isClosedKey, isOpenSlot, statusFor } from '../domain/slotStatus'
import { LIST_KINDS, type DraftList, type ListKind, type RequestSource, type Session } from '../domain/types'
import { drName } from './conflictReconcile'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { listInSlot, scheduleHorizon, slotFor } from './selectors'
import { attachListToSlot, insertDraftList, pairingRefusal, withoutCoverRequest } from './slotActions'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const REQUEST_SOURCES: readonly RequestSource[] = ['phone', 'email', 'pdf', 'other']

/** The office alone (OQ-86 answered no: "it's an office job"); a feed never writes a Draft List. */
function officeRefusal(actor: Actor, verb: string): Outcome<never> | null {
  if (actor.source === 'integration') return refuse('integrationForbidden', 'A feed cannot change a Draft List.')
  if (actor.role !== 'office') return refuse('officeOnly', `Only the office can ${verb} a Draft List.`)
  return null
}

/** The day and session a Draft List is for: required, not past, within the schedule horizon. */
function dayRefusal(state: Pick<AppState, 'clock' | 'appSettings'>, dateISO: string | undefined, session: string | undefined): Outcome<never> | null {
  if (dateISO === undefined || !ISO_DATE.test(dateISO)) return refuse('dateRequired', 'Choose the day.')
  if (session !== 'AM' && session !== 'PM') return refuse('invalidSession', 'Choose AM or PM.')
  if (dateISO < state.clock.todayISO) return refuse('datePassed', 'That day has passed. Choose today or a later day.')
  if (dateISO > scheduleHorizon(state).endISO) {
    const months = state.appSettings.schedule.horizonMonths
    return refuse('outsideCanvas', `That day is beyond the schedule, which runs ${months} months ahead.`)
  }
  return null
}

/** Bookings on a List that are not cancelled. */
function activeBookingIds(state: Pick<AppState, 'schedule'>, listId: string): string[] {
  return Object.values(state.schedule.bookings)
    .filter((b) => b.listId === listId && b.cancellation === undefined)
    .map((b) => b.id)
    .sort()
}

// ---------------------------------------------------------------------------
// createDraftList (US-01.6.1)
// ---------------------------------------------------------------------------

export interface NewDraftListInput {
  hospitalId: string
  surgeonId: string
  dateISO: string
  session: Session
  kind?: ListKind
  note?: string
  /** How the request came in: required for origin `request` only (Phase 33's `hospitalRow` passes none). */
  source?: RequestSource
}

/**
 * Log a request that has no anaesthetist yet as a Draft List (US-01.6.1).
 * Hospital, surgeon, day and session are all required (OQ-44). It takes no
 * Slot and needs no anaesthetist, so nobody's schedule changes: `schedule.slots`
 * and every other List are untouched. A hospital closed that day gets Phase
 * 30's holiday conflict from the reconcile, as any List does. Audited
 * `draftList.create`.
 */
export function createDraftList(
  api: AppStoreApi,
  actor: Actor,
  input: NewDraftListInput,
  origin: 'request' | 'hospitalRow' = 'request',
): Outcome<{ listId: string }> {
  const office = officeRefusal(actor, 'create')
  if (office !== null) return office
  const state = api.getState()
  const pairing = pairingRefusal(input, state.masters)
  if (pairing !== null) return pairing
  const day = dayRefusal(state, input.dateISO, input.session)
  if (day !== null) return day
  const kind = input.kind ?? 'private'
  if (!(LIST_KINDS as readonly string[]).includes(kind)) return refuse('invalidKind', 'Choose private, public or pre-op.')
  if (origin === 'request' && (input.source === undefined || !REQUEST_SOURCES.includes(input.source))) {
    return refuse('sourceRequired', 'Choose how the request came in.')
  }

  const metas: MutationMeta[] = []
  let listId = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'list')
    listId = alloc.id
    const note = input.note?.trim() ?? ''
    const draft: DraftList = {
      id: alloc.id,
      state: 'DRAFT',
      dateISO: input.dateISO,
      session: input.session,
      kind,
      hospitalId: input.hospitalId,
      surgeonId: input.surgeonId,
      conflicts: [],
      ...(note !== '' ? { notes: note } : {}),
      draft: {
        origin,
        ...(origin === 'request' && input.source !== undefined ? { source: input.source } : {}),
        sinceISO: clockISO(s.clock),
        by: actor.who,
      },
    }
    const lists = { ...s.schedule.lists }
    insertDraftList(lists, draft)
    metas.push({
      entityType: 'list',
      entityId: alloc.id,
      action: 'draftList.create',
      after: {
        state: 'DRAFT',
        dateISO: draft.dateISO,
        session: draft.session,
        hospitalId: draft.hospitalId,
        surgeonId: draft.surgeonId,
        kind,
        origin,
        ...(draft.draft.source !== undefined ? { source: draft.draft.source } : {}),
      },
      stampBookingId: null,
    })
    return { schedule: { ...s.schedule, lists }, counters: alloc.counters }
  })
  return ok({ listId })
}

// ---------------------------------------------------------------------------
// assignDraftList (US-01.6.3)
// ---------------------------------------------------------------------------

export interface AssignDraftListResult {
  listId: string
  /** The soft warnings the office went ahead past (each names its cause). */
  warnings: string[]
  /**
   * Bookings getting their first anaesthetist (the Booking's setup, not a
   * move). PHASE 27 SEAM: 27's prepayment routine (`syncPrepayment` with its
   * `listAssigned` cause) runs once for each, after the commit; 27 is not built
   * yet, so nothing runs. A List that went back to the office (Phase 32) had an
   * anaesthetist, so its Bookings are never listed here (honour system, D20).
   */
  firstAssignmentBookingIds: string[]
}

/**
 * Assign a Draft List: the office chooses only the anaesthetist; the session
 * is the one its day and session fix (US-01.6.3). In one commit the same List
 * id goes ACTIVE in that anaesthetist's session through `attachListToSlot`,
 * keeping its Bookings, hospital, surgeon and notes, and the draft trail gains
 * `assignedAtISO` (US-01.6.3 "Becomes active", "Audited"). A closed session
 * or a not-preferred pairing is never refused (US-01.6.3, US-01.3.5,
 * US-01.5.2): the reconcile flags the closed session, and a not-preferred
 * pairing writes 17's `list.pairingAcknowledged`.
 */
export function assignDraftList(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  input: { anaesthetistId: string },
): Outcome<AssignDraftListResult> {
  const office = officeRefusal(actor, 'assign')
  if (office !== null) return office
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'Draft List not found.')
  if (!isDraftList(list)) return refuse('notDraftList', isRemoved(list) ? 'This Draft List was removed.' : 'This List already has an anaesthetist.')
  const anaesthetist = state.masters.anaesthetists[input.anaesthetistId]
  if (anaesthetist === undefined) return refuse('anaesthetistNotFound', 'Anaesthetist not found.')
  if (!anaesthetist.active) return refuse('anaesthetistInactive', `${drName(state.masters, anaesthetist.registrationNumber)} is not active.`)
  if (list.dateISO < state.clock.todayISO) return refuse('datePassed', "This Draft List's day has passed. Change its date or remove it.")
  const pairing = pairingRefusal(list, state.masters)
  if (pairing !== null) return pairing
  const slot = slotFor(state, input.anaesthetistId, list.dateISO, list.session)
  if (slot === undefined) return refuse('noSession', `${drName(state.masters, anaesthetist.registrationNumber)} has no session that day.`)
  if (listInSlot(state, slot.id) !== undefined) {
    return refuse('slotOccupied', `${drName(state.masters, anaesthetist.registrationNumber)} already has a List that session. Resolve it first.`)
  }

  const warnings: string[] = []
  const who = drName(state.masters, anaesthetist.registrationNumber)
  if (isClosedKey(state.masters.slotStatuses, slot.status)) {
    warnings.push(DRAFT_ASSIGN_WARNINGS.closedSession(who, statusFor(state.masters.slotStatuses, slot.status)?.label ?? slot.status))
  }
  const notPreferred = notPreferredWarning(state.masters, state.officePrivate.pairingPreferences, input.anaesthetistId, list.surgeonId)
  if (notPreferred !== null) warnings.push(notPreferred.message)
  if (list.conflicts.some((c) => c.kind === 'holiday')) {
    warnings.push(DRAFT_ASSIGN_WARNINGS.hospitalHoliday(state.masters.hospitals[list.hospitalId]?.name ?? list.hospitalId))
  }

  // Only a List the office got back from an anaesthetist (Phase 32) ever had one.
  const neverAssigned = list.draft.origin !== 'movedToOffice' && list.draft.origin !== 'unavailableReturn'
  const reassignedBookings = new Set(state.audit.filter((a) => a.action === 'booking.reassign').map((a) => a.entityId))
  const firstAssignmentBookingIds = neverAssigned ? activeBookingIds(state, listId).filter((id) => !reassignedBookings.has(id)) : []

  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const atISO = clockISO(s.clock)
    const assigned = attachListToSlot(list, slot, actor.who, atISO)
    metas.push({
      entityType: 'list',
      entityId: listId,
      action: 'draftList.assign',
      before: { state: 'DRAFT', anaesthetistId: null, slotId: null },
      after: { state: 'ACTIVE', anaesthetistId: input.anaesthetistId, slotId: slot.id },
      stampBookingId: null,
    })
    const ack = pairingAcknowledgement(s.officePrivate.pairingPreferences, input.anaesthetistId, list.surgeonId)
    if (ack !== null) {
      metas.push({ entityType: 'list', entityId: listId, action: 'list.pairingAcknowledged', after: ack, stampBookingId: null })
    }
    return {
      schedule: {
        ...s.schedule,
        slots: { ...s.schedule.slots, [slot.id]: withoutCoverRequest(slot) },
        lists: { ...s.schedule.lists, [listId]: assigned },
      },
    }
  })
  return ok({ listId, warnings, firstAssignmentBookingIds })
}

// ---------------------------------------------------------------------------
// redateDraftList / removeDraftList (US-01.6.4)
// ---------------------------------------------------------------------------

/**
 * Change a Draft List's day or session (US-01.6.4 "edits its date ... shows on
 * the new day"). Its Bookings go with it (they hang off its id) and its waiting
 * time is unchanged (`sinceISO` stays). A recurring-clash Draft List keeps
 * `draft.projectedFor`, so its recurring booking never makes a second one for
 * the day it stood for. Re-triggers nothing (no Procedure, Contract or payer
 * changes). Audited `draftList.redate`; the reconcile re-evaluates its holiday
 * conflict.
 */
export function redateDraftList(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  input: { dateISO: string; session: Session },
): Outcome<{ listId: string }> {
  const office = officeRefusal(actor, 'change the date of')
  if (office !== null) return office
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'Draft List not found.')
  if (!isDraftList(list)) return refuse('notDraftList', 'Only a waiting Draft List can change its date.')
  const day = dayRefusal(state, input.dateISO, input.session)
  if (day !== null) return day
  if (input.dateISO === list.dateISO && input.session === list.session) return refuse('sameDay', 'That is its day and session already.')

  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'draftList.redate',
      before: { dateISO: list.dateISO, session: list.session },
      after: { dateISO: input.dateISO, session: input.session },
      stampBookingId: null,
    },
    (s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...list, dateISO: input.dateISO, session: input.session } } },
    }),
  )
  return ok({ listId })
}

/**
 * Remove a cancelled or unfilled Draft List (US-01.6.4 "it no longer shows and
 * the removal is recorded"). Soft: it stays DRAFT with who, when and an
 * optional reason, and leaves every view but the page's History. Refused while
 * it holds an active Booking, so no Booking is ever orphaned. Audited
 * `draftList.remove`.
 */
export function removeDraftList(api: AppStoreApi, actor: Actor, listId: string, reason?: string): Outcome<{ listId: string }> {
  const office = officeRefusal(actor, 'remove')
  if (office !== null) return office
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'Draft List not found.')
  if (!isDraftList(list)) return refuse('notDraftList', 'Only a waiting Draft List can be removed.')
  const active = activeBookingIds(state, listId)
  if (active.length > 0) return refuse('hasBookings', removeBlockedReason(active.length))
  const why = reason?.trim() ?? ''

  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'draftList.remove',
      before: { state: 'DRAFT', removedAtISO: null },
      after: { state: 'DRAFT', removedAtISO: clockISO(state.clock), ...(why !== '' ? { removeReason: why } : {}) },
      stampBookingId: null,
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        lists: {
          ...s.schedule.lists,
          [listId]: { ...list, removedAtISO: clockISO(s.clock), removedBy: actor.who, removeCause: 'office', ...(why !== '' ? { removeReason: why } : {}) },
        },
      },
    }),
  )
  return ok({ listId })
}

// ---------------------------------------------------------------------------
// The PWA stand-in's fit test
// ---------------------------------------------------------------------------

/**
 * Could this anaesthetist take this Draft List without a warning: a waiting
 * Draft List, their session that day open (free, no List), and no active
 * not-preferred pairing with its surgeon. A boolean and no names, so the PWA
 * stand-in can skip a not-preferred pairing without ever seeing one (D44).
 */
export function draftListFitsAnaesthetist(state: Pick<AppState, 'schedule' | 'masters' | 'officePrivate' | 'appSettings'>, listId: string, anaesthetistId: string): boolean {
  const list = state.schedule.lists[listId]
  if (!isDraftList(list)) return false
  const slot = slotFor(state, anaesthetistId, list.dateISO, list.session)
  if (slot === undefined || !isOpenSlot(slot, listInSlot(state, slot.id), state.masters.slotStatuses)) return false
  return notPreferredEntryIds(state.officePrivate.pairingPreferences, anaesthetistId, list.surgeonId).length === 0
}

/**
 * Could this anaesthetist take a request from this surgeon without a warning
 * (no active not-preferred pairing)? A boolean and no names, for the PWA
 * stand-in's fallback request (D44).
 */
export function surgeonFitsAnaesthetist(state: Pick<AppState, 'officePrivate'>, anaesthetistId: string, surgeonId: string): boolean {
  return notPreferredEntryIds(state.officePrivate.pairingPreferences, anaesthetistId, surgeonId).length === 0
}
