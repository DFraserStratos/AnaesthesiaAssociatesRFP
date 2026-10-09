/**
 * Slot and List actions (catch-up Phase 28; EP-01, FT-01.1, FT-01.2,
 * US-01.1.4, US-01.2.3, US-01.3.3, US-01.4.1; OQ-17, OQ-27, OQ-64 answered;
 * OQ-84's recommendation, provisional in the Decisions log).
 *
 * A Slot is the AM or PM box every active anaesthetist has on every horizon
 * day; its status is the one availability mechanism. A List is created only
 * here (assignment), by the recurring-booking projection, or by the post-op
 * addendum, and moves between Slots intact. Every write goes through
 * `mutate()` with before and after metas and timestamps from the demo clock.
 * "Slot" never reaches app copy: refusals and audit labels say session.
 */

import type {
  CoverRequest,
  List,
  ListKind,
  Session,
  Slot,
  SlotStatus,
  WallTime,
} from '../domain/types'
import { LIST_KINDS, SLOT_STATUSES } from '../domain/types'
import { enumerateDatesISO, horizonDatesBetween, horizonFor } from '../domain/clock'
import { displayStatusLabel, effectiveSlotTimes, isOpenSlot, isWallTime, slotDatesFor } from '../domain/slots'
import { format, parseISO } from 'date-fns'
import {
  canvasAnaesthetists,
  closedHospitalConflict,
  generateCanvasForDates,
  SEED_LEAVE,
  type CanvasMasters,
  type GeneratedCanvas,
} from '../domain/seed'
import { pairingAcknowledgement } from '../domain/pairingPreferences'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal } from './lifecycle'
import { listInSlot, scheduleHorizon, slotFor } from './selectors'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** The generator's masters from live state: start dates, active flags, recurring bookings, the seed calendar, holidays. */
export function canvasMastersFrom(state: Pick<AppState, 'masters'>): CanvasMasters {
  return {
    anaesthetists: canvasAnaesthetists(state.masters.anaesthetists),
    permanentLists: Object.values(state.masters.permanentLists),
    // Leave set at runtime already lives on the Slots it covers; the seed's
    // calendar is the generator's input for days it has not generated yet.
    leave: SEED_LEAVE,
    holidays: Object.values(state.masters.holidays),
  }
}

/** Add generated Slots and Lists to the schedule, never replacing one that exists. */
export function withGenerated(
  schedule: AppState['schedule'],
  generated: Pick<GeneratedCanvas, 'slots' | 'lists'>,
): { schedule: AppState['schedule']; slots: number; lists: number } {
  const slots = { ...schedule.slots }
  const lists = { ...schedule.lists }
  let addedSlots = 0
  let addedLists = 0
  for (const slot of generated.slots) {
    if (slots[slot.id] === undefined) {
      slots[slot.id] = slot
      addedSlots++
    }
  }
  for (const list of generated.lists) {
    if (lists[list.id] === undefined && slots[list.slotId] !== undefined) {
      lists[list.id] = list
      addedLists++
    }
  }
  return { schedule: { ...schedule, slots, lists }, slots: addedSlots, lists: addedLists }
}

export interface NewListFields {
  kind: ListKind
  hospitalId?: string
  surgeonId?: string
  notes?: string
}

/**
 * The one place a List is created at runtime (inside a mutate recipe): it
 * allocates `LG####`, puts the List in the Slot (`slotId` plus the
 * denormalised anaesthetist, date and session), starts it ACTIVE (15b's name
 * for an assigned List; DRAFT is Phase 31's, for a List with no anaesthetist),
 * flags a closed hospital, and returns its `list.create` meta. Not exported
 * from the store's index: callers are the store's own actions.
 */
export function placeListOnSlot(
  state: Pick<AppState, 'masters' | 'counters'>,
  counters: Record<string, number>,
  slot: Slot,
  fields: NewListFields,
): { list: List; counters: Record<string, number>; meta: MutationMeta } {
  const alloc = allocateId(counters, 'list')
  const list: List = {
    id: alloc.id,
    slotId: slot.id,
    dateISO: slot.dateISO,
    anaesthetistId: slot.anaesthetistId,
    session: slot.session,
    state: 'ACTIVE',
    kind: fields.kind,
    conflicts: [],
  }
  if (fields.hospitalId !== undefined && fields.hospitalId !== '') list.hospitalId = fields.hospitalId
  if (fields.surgeonId !== undefined && fields.surgeonId !== '') list.surgeonId = fields.surgeonId
  if (fields.notes !== undefined && fields.notes.trim() !== '') list.notes = fields.notes.trim()
  const conflict = closedHospitalConflict(list, Object.values(state.masters.holidays))
  if (conflict !== null) list.conflicts.push(conflict)
  return {
    list,
    counters: alloc.counters,
    meta: {
      entityType: 'list',
      entityId: alloc.id,
      action: 'list.create',
      after: {
        slotId: slot.id,
        kind: list.kind,
        ...(list.hospitalId !== undefined ? { hospitalId: list.hospitalId } : {}),
        ...(list.surgeonId !== undefined ? { surgeonId: list.surgeonId } : {}),
      },
      stampBookingId: null,
    },
  }
}

/** An open Slot loses any cover marker once a List is in it (it is no longer open). */
export function withoutCoverRequest(slot: Slot): Slot {
  if (slot.coverRequest === undefined) return slot
  const next = { ...slot }
  delete next.coverRequest
  return next
}

// ---------------------------------------------------------------------------
// assignListToSlot (US-01.3.3)
// ---------------------------------------------------------------------------

export interface AssignListFields {
  hospitalId: string
  surgeonId: string
  kind: ListKind
  notes?: string
}

/**
 * The office assigns a surgeon and a hospital to an available session, which
 * creates its List (US-01.3.3: "an admin assigns a surgeon and hospital to an
 * available Slot"; anaesthetists do not). A hospital closed that day is
 * flagged on the new List, never blocked. A not-preferred pairing of the
 * surgeon and the session's anaesthetist is never refused: when the actor is
 * the office the same commit records 17's `list.pairingAcknowledged`
 * (US-01.3.5 "every office path", OQ-43); a preferred pairing writes nothing.
 *
 * INTERIM until Phase 30: an unavailable or holiday session is refused
 * (`slotNotAvailable`); Phase 30 makes it accept-and-flag (US-01.5.2).
 */
export function assignListToSlot(
  api: AppStoreApi,
  actor: Actor,
  slotId: string,
  fields: AssignListFields,
): Outcome<{ listId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can assign a List.')
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  if (listInSlot(state, slotId) !== undefined) return refuse('slotOccupied', 'This session already holds a List.')
  if (slot.status !== 'free') {
    return refuse(
      'slotNotAvailable',
      `This session is marked ${displayStatusLabel(slot.status).toLowerCase()}, so it is not open for a List in this build.`,
    )
  }
  if (fields.hospitalId === '') return refuse('hospitalRequired', 'Choose the hospital.')
  if (state.masters.hospitals[fields.hospitalId] === undefined) return refuse('notFound', 'Hospital not found.')
  if (fields.surgeonId === '') return refuse('surgeonRequired', 'Choose the surgeon.')
  if (state.masters.surgeons[fields.surgeonId] === undefined) return refuse('notFound', 'Surgeon not found.')
  if (!(LIST_KINDS as readonly string[]).includes(fields.kind)) return refuse('invalidKind', 'Choose private, public or pre-op.')

  const metas: MutationMeta[] = []
  let listId = ''
  mutate(api, actor, metas, (s) => {
    const placed = placeListOnSlot(s, s.counters, slot, fields)
    listId = placed.list.id
    metas.push(placed.meta)
    const ack = pairingAcknowledgement(s.officePrivate.pairingPreferences, slot.anaesthetistId, fields.surgeonId)
    if (ack !== null) {
      metas.push({ entityType: 'list', entityId: listId, action: 'list.pairingAcknowledged', after: ack, stampBookingId: null })
    }
    return {
      schedule: {
        ...s.schedule,
        slots: { ...s.schedule.slots, [slot.id]: withoutCoverRequest(slot) },
        lists: { ...s.schedule.lists, [listId]: placed.list },
      },
      counters: placed.counters,
    }
  })
  return ok({ listId })
}

// ---------------------------------------------------------------------------
// moveListToSlot / reassignList (US-01.4.1)
// ---------------------------------------------------------------------------

/**
 * Move a List into another Slot on the same day and session (US-01.4.1's
 * technical discussion: change the owner reference, consume the covering
 * anaesthetist's Slot, return the vacated Slot to available). The List keeps
 * its id, Bookings, phone notes, attachments and history; its `slotId` and
 * denormalised fields change; availability conflicts drop and holiday
 * conflicts stay; the Slot's own times travel to the target and are cleared
 * from the vacated one, which takes `vacatedStatus`.
 *
 * It reads, checks and logs NO pairing preference: Phases 32 and 32a reuse it
 * for the anaesthetist's own move, which shows no warning (US-01.4.5). The
 * office's acknowledgement is passed in by `reassignList` (`pairingAcknowledgement`).
 * A move re-checks no prepayment and recalculates no invoice (US-06.3.5,
 * US-06.5.4: an honour system). PHASE 41 SEAM: the payable's payee repoint
 * for a prepaid Booking on a move (OQ-80, D38) hangs here, after the commit.
 */
export interface MoveListOptions {
  /** What the vacated session becomes: Free by default (OQ-84's recommendation), or Unavailable or Holiday. */
  vacatedStatus?: SlotStatus
  /** The office's pairing acknowledgement, recorded in the same commit (`reassignList` only; never an anaesthetist's move). */
  pairingAcknowledgement?: MutationMeta
}

export function moveListToSlot(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  toSlotId: string,
  options: MoveListOptions = {},
): Outcome<{ listId: string; vacatedSlotId: string }> {
  const vacatedStatus = options.vacatedStatus ?? 'free'
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (actor.source === 'integration') return refuse('integrationForbidden', 'A feed cannot move a List.')
  if (list.state === 'AUTHORISED') return refuse('listAuthorised', 'An authorised List is locked and cannot be moved.')
  if (actor.role === 'anaesthetist') {
    const rights = editRefusal(actor, list)
    if (rights !== null) return rights
  }
  const from = state.schedule.slots[list.slotId]
  if (from === undefined) return refuse('notFound', "This List's session is outside the schedule.")
  const to = state.schedule.slots[toSlotId]
  if (to === undefined) return refuse('notFound', 'That session does not exist.')
  if (to.id === from.id) return refuse('sameSlot', 'The List is already in that session.')
  if (to.dateISO !== from.dateISO || to.session !== from.session) {
    return refuse('differentSession', 'A List moves to the same day and session.')
  }
  if (listInSlot(state, to.id) !== undefined) return refuse('slotOccupied', 'That session already holds a List.')
  if (to.status !== 'free') return refuse('targetNotOpen', 'That session is not free, so it cannot take the List.')
  if (!(SLOT_STATUSES as readonly string[]).includes(vacatedStatus)) {
    return refuse('invalidVacatedStatus', 'The vacated session can only become free, unavailable or holiday.')
  }

  const retainedConflicts = list.conflicts.filter((c) => c.kind !== 'availability')
  const moved: List = { ...list, slotId: to.id, anaesthetistId: to.anaesthetistId, conflicts: retainedConflicts }
  const target: Slot = withoutCoverRequest({ ...to })
  delete target.startTime
  delete target.endTime
  if (from.startTime !== undefined) target.startTime = from.startTime
  if (from.endTime !== undefined) target.endTime = from.endTime
  const vacated: Slot = { ...from, status: vacatedStatus }
  delete vacated.startTime
  delete vacated.endTime

  const metas: MutationMeta[] = [
    {
      entityType: 'list',
      entityId: list.id,
      action: 'list.reassign',
      before: { slotId: from.id, anaesthetistId: list.anaesthetistId, conflicts: list.conflicts },
      after: { slotId: to.id, anaesthetistId: to.anaesthetistId, conflicts: retainedConflicts },
      stampBookingId: null,
    },
    ...(options.pairingAcknowledgement !== undefined ? [options.pairingAcknowledgement] : []),
  ]
  if (vacatedStatus !== from.status) {
    metas.push({
      entityType: 'session',
      entityId: from.id,
      action: 'session.status',
      before: { status: from.status },
      after: { status: vacatedStatus },
      stampBookingId: null,
    })
  }
  mutate(api, actor, metas, (s) => ({
    schedule: {
      ...s.schedule,
      slots: { ...s.schedule.slots, [from.id]: vacated, [to.id]: target },
      lists: { ...s.schedule.lists, [list.id]: moved },
    },
  }))
  return ok({ listId: list.id, vacatedSlotId: from.id })
}

/**
 * The office reassigns a List to a colleague's open session on the same day
 * and session (US-01.4.1, the illness-cover case): the List moves intact and
 * the vacated session returns to Free unless the office marks it Unavailable
 * or Holiday (OQ-84's recommendation, provisional). Phase 17's acknowledgement
 * of a not-preferred pairing (the List's surgeon against the colleague) is
 * written here, the office entry point, never in `moveListToSlot`.
 */
export function reassignList(
  api: AppStoreApi,
  actor: Actor,
  listId: string,
  toAnaesthetistId: string,
  vacatedStatus: SlotStatus = 'free',
): Outcome<{ listId: string; vacatedSlotId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can reassign a List.')
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (toAnaesthetistId === list.anaesthetistId) return refuse('sameAnaesthetist', 'The List already belongs to that anaesthetist.')
  const colleague = state.masters.anaesthetists[toAnaesthetistId]
  if (colleague === undefined) return refuse('notFound', 'Target anaesthetist not found.')
  const to = slotFor(state, toAnaesthetistId, list.dateISO, list.session)
  if (to === undefined) return refuse('noTargetSession', `${colleague.name} has no session then.`)
  const ack = pairingAcknowledgement(state.officePrivate.pairingPreferences, toAnaesthetistId, list.surgeonId)
  return moveListToSlot(api, actor, listId, to.id, {
    vacatedStatus,
    ...(ack !== null
      ? { pairingAcknowledgement: { entityType: 'list', entityId: list.id, action: 'list.pairingAcknowledged', after: ack, stampBookingId: null } }
      : {}),
  })
}

// ---------------------------------------------------------------------------
// setAvailability (FT-01.2, the one mechanism)
// ---------------------------------------------------------------------------

/**
 * Set a session's availability: writes `Slot.status` and `Slot.note` directly
 * (FT-01.2, OQ-27: one mechanism, no second record, nothing reconciled). It
 * never touches the List's kind and reads nothing about Bookings (US-01.2.3).
 *   - an empty session is simply updated;
 *   - a session holding a List, marked unavailable or holiday, keeps its List
 *     and kind, and the List gets an availability conflict ("replace, never
 *     stack"). INTERIM until Phase 32 offers return to the office or assign to
 *     a colleague (US-01.5.5, the OQ-64 answer);
 *   - marking a session holding a List free writes no conflict.
 */
export function setAvailability(
  api: AppStoreApi,
  actor: Actor,
  anaesthetistId: string,
  dateISO: string,
  session: Session,
  status: SlotStatus,
  note?: string,
): Outcome<{ result: 'updated' | 'conflictFlagged' | 'noChange' }> {
  const state = api.getState()
  if (state.masters.anaesthetists[anaesthetistId] === undefined) return refuse('notFound', 'Anaesthetist not found.')
  if (actor.source === 'integration') {
    return refuse('integrationForbidden', 'Availability comes from the anaesthetist or the office, never a feed.')
  }
  if (actor.role === 'anaesthetist' && actor.anaesthetistId !== undefined && actor.anaesthetistId !== anaesthetistId) {
    return refuse('notOwnAvailability', 'Anaesthetists can only set their own availability.')
  }
  if (!(SLOT_STATUSES as readonly string[]).includes(status)) return refuse('invalidStatus', 'Choose free, unavailable or holiday.')
  const slot = slotFor(state, anaesthetistId, dateISO, session)
  if (slot === undefined) return refuse('noSlot', 'There is no session on that day: it is before the start date or outside the schedule horizon.')
  const list = listInSlot(state, slot.id)
  const trimmed = note?.trim() ?? ''
  if (slot.status === status && (slot.note ?? '') === trimmed) return ok({ result: 'noChange' })

  const next: Slot = { ...slot, status }
  if (trimmed !== '') next.note = trimmed
  else delete next.note
  if (status !== 'free') delete next.coverRequest

  const metas: MutationMeta[] = [
    {
      entityType: 'session',
      entityId: slot.id,
      action: 'session.status',
      before: { status: slot.status, ...(slot.note !== undefined ? { note: slot.note } : {}) },
      after: { status, ...(next.note !== undefined ? { note: next.note } : {}) },
      stampBookingId: null,
    },
  ]
  let flagged: List | undefined
  if (list !== undefined && status !== 'free') {
    const message = `Marked ${displayStatusLabel(status).toLowerCase()}, but this session holds a List. Rebook or reassign it.`
    flagged = { ...list, conflicts: [...list.conflicts.filter((c) => c.kind !== 'availability'), { kind: 'availability', message }] }
    metas.push({ entityType: 'list', entityId: list.id, action: 'list.conflict', after: { kind: 'availability', message }, stampBookingId: null })
  }
  mutate(api, actor, metas, (s) => ({
    schedule: {
      ...s.schedule,
      slots: { ...s.schedule.slots, [slot.id]: next },
      ...(flagged !== undefined ? { lists: { ...s.schedule.lists, [flagged.id]: flagged } } : {}),
    },
  }))
  return ok({ result: flagged !== undefined ? 'conflictFlagged' : 'updated' })
}

// ---------------------------------------------------------------------------
// Times (US-01.1.4)
// ---------------------------------------------------------------------------

export interface SlotTimesPatch {
  /** `HH:mm`; an empty string clears the override (the session follows the default). */
  startTime?: string
  endTime?: string
}

/** The office overrides one session's times (US-01.1.4 "each Slot can override"). */
export function setSlotTimes(api: AppStoreApi, actor: Actor, slotId: string, patch: SlotTimesPatch): Outcome<{ changed: boolean }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change session times.')
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  const list = listInSlot(state, slotId)
  if (list?.state === 'AUTHORISED') return refuse('listAuthorised', 'This List is authorised and locked. Its times cannot change.')
  const next: Slot = { ...slot }
  for (const key of ['startTime', 'endTime'] as const) {
    const value = patch[key]
    if (value === undefined) continue
    if (value === '') delete next[key]
    else if (!isWallTime(value)) return refuse('invalidTime', 'Times are HH:mm, for example 13:30.')
    else next[key] = value
  }
  const effective = effectiveSlotTimes(next, state.appSettings.schedule)
  if (!(effective.startTime < effective.endTime)) return refuse('invalidTimes', 'The start time must be before the end time.')
  if (next.startTime === slot.startTime && next.endTime === slot.endTime) return ok({ changed: false })
  mutate(
    api,
    actor,
    {
      entityType: 'session',
      entityId: slotId,
      action: 'session.times',
      before: { startTime: slot.startTime ?? null, endTime: slot.endTime ?? null },
      after: { startTime: next.startTime ?? null, endTime: next.endTime ?? null },
      stampBookingId: null,
    },
    (s) => ({ schedule: { ...s.schedule, slots: { ...s.schedule.slots, [slotId]: next } } }),
  )
  return ok({ changed: true })
}

/**
 * The office sets the default AM and PM times (US-01.1.4: "Admins set default
 * start and end times for AM and PM Slots"). Sessions without their own times
 * follow at once; sessions with their own keep them.
 */
export function setSlotDefaultTimes(
  api: AppStoreApi,
  actor: Actor,
  defaultTimes: Record<Session, { startTime: WallTime; endTime: WallTime }>,
): Outcome<{ changed: boolean }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the default session times.')
  for (const session of ['AM', 'PM'] as const) {
    const t = defaultTimes[session]
    if (!isWallTime(t.startTime) || !isWallTime(t.endTime)) return refuse('invalidTime', 'Times are HH:mm, for example 13:30.')
    if (!(t.startTime < t.endTime)) return refuse('invalidTimes', `The ${session} start time must be before its end time.`)
  }
  const state = api.getState()
  const before = state.appSettings.schedule.defaultTimes
  if (JSON.stringify(before) === JSON.stringify(defaultTimes)) return ok({ changed: false })
  const next = { AM: { ...defaultTimes.AM }, PM: { ...defaultTimes.PM } }
  mutate(
    api,
    actor,
    { entityType: 'settings', entityId: 'schedule', action: 'settings.scheduleDefaults', before, after: next, stampBookingId: null },
    (s) => ({ appSettings: { ...s.appSettings, schedule: { ...s.appSettings.schedule, defaultTimes: next } } }),
  )
  return ok({ changed: true })
}

// ---------------------------------------------------------------------------
// The horizon (FT-01.1)
// ---------------------------------------------------------------------------

export const HORIZON_MONTHS_MIN = 1
/** The long-horizon scale question is Phase 43's (FT-01.1: "we don't have to worry about it for now"). */
export const HORIZON_MONTHS_MAX = 24

export interface HorizonChangePreview {
  direction: 'extend' | 'shorten' | 'none'
  fromEndISO: string
  toEndISO: string
  /** Days added or removed at the far edge. */
  days: number
  /** Lists after the new end that would be dropped (none of them holds a Booking). */
  listsDropped: number
  /**
   * Lists after the new end that hold a Booking (cancelled ones included, as
   * their record points at the List) or an attachment: a shorten is refused
   * while any stands, so no record is orphaned and no file lost.
   */
  listsWithBookings: number
}

/** What changing the horizon to `months` would do (pure; the settings sheet's live preview). */
export function previewHorizonChange(
  state: Pick<AppState, 'clock' | 'appSettings'> & { schedule: Pick<AppState['schedule'], 'lists' | 'bookings'> },
  months: number,
): HorizonChangePreview {
  const fromEndISO = scheduleHorizon(state).endISO
  const toEndISO = horizonFor(state.clock.todayISO, months).endISO
  if (toEndISO === fromEndISO) return { direction: 'none', fromEndISO, toEndISO, days: 0, listsDropped: 0, listsWithBookings: 0 }
  if (toEndISO > fromEndISO) {
    return { direction: 'extend', fromEndISO, toEndISO, days: horizonDatesBetween(fromEndISO, toEndISO).length, listsDropped: 0, listsWithBookings: 0 }
  }
  const beyond = Object.values(state.schedule.lists).filter((l) => l.dateISO > toEndISO)
  const booked = new Set(Object.values(state.schedule.bookings).map((b) => b.listId))
  const withBookings = beyond.filter((l) => booked.has(l.id) || (l.attachments ?? []).length > 0).length
  return {
    direction: 'shorten',
    fromEndISO,
    toEndISO,
    days: horizonDatesBetween(toEndISO, fromEndISO).length,
    listsDropped: beyond.length - withBookings,
    listsWithBookings: withBookings,
  }
}

/**
 * The office changes the schedule horizon (FT-01.1: "flexible enough to have
 * any number of months"; shortening drops the far-edge days and extending
 * fills them). Extending generates the new far-edge dates exactly as the
 * roll-forward would (free Slots, the calendar, then recurring bookings).
 * Shortening drops every Slot after the new end with the Lists in it, and is
 * refused while any of those Lists holds a Booking.
 */
export function setHorizonMonths(api: AppStoreApi, actor: Actor, months: number): Outcome<HorizonChangePreview & { slots: number; lists: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the schedule horizon.')
  if (!Number.isInteger(months) || months < HORIZON_MONTHS_MIN || months > HORIZON_MONTHS_MAX) {
    return refuse('invalidHorizon', `The horizon is a whole number of months from ${HORIZON_MONTHS_MIN} to ${HORIZON_MONTHS_MAX}.`)
  }
  const state = api.getState()
  const fromMonths = state.appSettings.schedule.horizonMonths
  const preview = previewHorizonChange(state, months)
  // The same value is no change (as the other settings actions): nothing written.
  if (months === fromMonths) return ok({ ...preview, direction: 'none', slots: 0, lists: 0 })
  if (preview.listsWithBookings > 0) {
    const n = preview.listsWithBookings
    return refuse(
      'listsBeyondHorizon',
      `${n} ${n === 1 ? 'List' : 'Lists'} after ${format(parseISO(preview.toEndISO), 'EEE d MMM yyyy')} ${n === 1 ? 'holds' : 'hold'} Bookings or attachments (cancelled Bookings count). Move them first, or keep the longer horizon.`,
    )
  }

  let slotsChanged = 0
  let listsChanged = 0
  const droppedListIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let schedule = s.schedule
    if (preview.direction === 'extend') {
      const generated = generateCanvasForDates(canvasMastersFrom(s), horizonDatesBetween(preview.fromEndISO, preview.toEndISO))
      const added = withGenerated(schedule, generated)
      schedule = added.schedule
      slotsChanged = added.slots
      listsChanged = added.lists
    } else if (preview.direction === 'shorten') {
      const slots = { ...schedule.slots }
      const lists = { ...schedule.lists }
      for (const slot of Object.values(schedule.slots)) {
        if (slot.dateISO > preview.toEndISO) {
          delete slots[slot.id]
          slotsChanged++
        }
      }
      for (const list of Object.values(schedule.lists)) {
        if (list.dateISO > preview.toEndISO) {
          delete lists[list.id]
          droppedListIds.push(list.id)
          listsChanged++
        }
      }
      schedule = { ...schedule, slots, lists }
    }
    metas.push({
      entityType: 'settings',
      entityId: 'schedule',
      action: 'settings.horizon',
      before: { horizonMonths: fromMonths },
      after: {
        fromMonths,
        toMonths: months,
        fromEndISO: preview.fromEndISO,
        toEndISO: preview.toEndISO,
        slots: preview.direction === 'shorten' ? -slotsChanged : slotsChanged,
        lists: preview.direction === 'shorten' ? -listsChanged : listsChanged,
        ...(droppedListIds.length > 0 ? { droppedListIds: droppedListIds.sort() } : {}),
      },
      stampBookingId: null,
    })
    return { schedule, appSettings: { ...s.appSettings, schedule: { ...s.appSettings.schedule, horizonMonths: months } } }
  })
  return ok({ ...preview, slots: slotsChanged, lists: listsChanged })
}

// ---------------------------------------------------------------------------
// requestCover (Phase 03's marker, on the Slot until Phase 32 removes it)
// ---------------------------------------------------------------------------

/**
 * Record a cover offer or request on an open session (Phase 03 mobile flow).
 * `offer`: the owner offers their own free session; `request`: a colleague is
 * asked to cover someone else's. Simulated only. Refused unless the session is
 * open (free, no List). Phase 32 removes it: the anaesthetist then moves their
 * own List instead.
 */
export function requestCover(
  api: AppStoreApi,
  actor: Actor,
  slotId: string,
  kind: 'offer' | 'request',
  message?: string,
  targetAnaesthetistId?: string,
): Outcome {
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  if (actor.role !== 'anaesthetist') return refuse('anaesthetistOnly', 'Cover offers and requests come from an anaesthetist.')
  if (!isOpenSlot(slot, listInSlot(state, slotId))) {
    return refuse('notFree', 'Cover can only be offered or requested on a free session.')
  }
  if (kind === 'offer') {
    if (actor.anaesthetistId !== undefined && actor.anaesthetistId !== slot.anaesthetistId) {
      return refuse('notOwnList', 'You can only offer cover on your own free session.')
    }
  } else if (actor.anaesthetistId !== undefined && actor.anaesthetistId === slot.anaesthetistId) {
    return refuse('ownList', 'This is your own session, use Offer cover instead.')
  }
  if (slot.coverRequest !== undefined) return refuse('alreadyRequested', 'A cover request is already pending on this session.')

  const coverRequest: CoverRequest = { by: actor.who, kind, atISO: clockISO(state.clock), status: 'pending' }
  if (message !== undefined && message.trim() !== '') coverRequest.message = message.trim()
  if (targetAnaesthetistId !== undefined) coverRequest.targetAnaesthetistId = targetAnaesthetistId

  mutate(
    api,
    actor,
    {
      entityType: 'session',
      entityId: slotId,
      action: 'session.coverRequest',
      after: { kind, ...(targetAnaesthetistId !== undefined ? { targetAnaesthetistId } : {}) },
      stampBookingId: null,
    },
    (s) => ({ schedule: { ...s.schedule, slots: { ...s.schedule.slots, [slotId]: { ...slot, coverRequest } } } }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Generation helpers for the anaesthetist master and the clock
// ---------------------------------------------------------------------------

/**
 * The Slots (and projected Lists) one anaesthetist should gain or lose from
 * `fromISO` to the horizon end, given a start date and an active flag
 * (US-01.1.3, FT-01.1). Pure over the state passed in.
 */
export function anaesthetistCanvasDelta(
  state: Pick<AppState, 'masters' | 'schedule' | 'clock' | 'appSettings'>,
  anaesthetist: { registrationNumber: string; startDateISO: string; active: boolean },
  fromISO: string,
): { add: GeneratedCanvas; removeSlotIds: string[]; listsInRemoved: List[]; toISO: string } {
  const toISO = scheduleHorizon(state).endISO
  const dates = fromISO <= toISO ? enumerateDatesISO(fromISO, toISO) : []
  const want = new Set(anaesthetist.active ? slotDatesFor(anaesthetist.startDateISO, dates) : [])
  const existing = Object.values(state.schedule.slots).filter(
    (s) => s.anaesthetistId === anaesthetist.registrationNumber && s.dateISO >= fromISO,
  )
  const have = new Set(existing.map((s) => s.dateISO))
  const removeSlotIds = existing.filter((s) => !want.has(s.dateISO)).map((s) => s.id)
  const missing = [...want].filter((d) => !have.has(d)).sort()
  const masters = canvasMastersFrom(state)
  const add = generateCanvasForDates(
    {
      ...masters,
      anaesthetists: [{ id: anaesthetist.registrationNumber, startDateISO: anaesthetist.startDateISO, active: anaesthetist.active }],
    },
    missing,
  )
  const removed = new Set(removeSlotIds)
  const listsInRemoved = Object.values(state.schedule.lists).filter((l) => removed.has(l.slotId))
  return { add, removeSlotIds, listsInRemoved, toISO }
}

