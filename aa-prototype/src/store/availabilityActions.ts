/**
 * Availability actions (catch-up Phase 29; US-01.2.1, US-01.5.3, FT-01.2;
 * OQ-17, OQ-27 and OQ-64, answered): one session, a range of days off ahead,
 * a repeating series, and one instance changed or deleted.
 *
 * ONE MECHANISM: every action here writes the Slot's own status (and note)
 * directly. A series is a rule that writes its Slots and records each
 * single-instance edit or delete as an exception, so no later series write,
 * clock roll-forward or horizon extension overwrites it; nothing reads
 * availability from the series, only from Slots. Where a Slot holds a List, the
 * List keeps showing in place of the status and is never edited here: its
 * availability conflict comes from the one rule `mutate()` runs (catch-up
 * Phase 30, `domain/conflicts.ts`).
 *
 * Each action is one `mutate()`, all or nothing on refusal, with one audit
 * entry plus one per List conflict raised or resolved (appended by the
 * reconcile), and timestamps from the demo clock.
 * Refusals and audit labels say session, never "slot" (OQ-64).
 */

import type { AvailabilitySeries, Session, Slot, SlotStatusKey } from '../domain/types'
import {
  defaultSlotStatusKey,
  displayStatusLabel,
  isOpenForBooking,
  shortDateLabel,
  slotsInRange,
  statusFor,
  validateAvailabilityRange,
  type SessionChoice,
  type SlotStatusRecords,
} from '../domain/slotStatus'
import {
  instanceKey,
  seriesLine,
  planSeriesWrite,
  seriesInstances,
  validateSeriesDraft,
  type AvailabilitySeriesDraft,
} from '../domain/availabilitySeries'
import type { SeriesCalendarEntry } from '../domain/seed/canvas'
import { slotIdFor } from '../domain/slots'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type MutationResult, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { listIndexBySlot, scheduleHorizon } from './selectors'

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

/** What an availability action did, for the UI's one result line. */
export interface AvailabilityOutcome {
  /** Sessions whose status or note changed. */
  set: number
  /** Sessions already as asked. */
  unchanged: number
  /**
   * Lists the write flagged with a conflict. Only the office's writes can flag
   * one (an anaesthetist's closed status over a List is refused, catch-up
   * Phase 32); no screen reads it today, the store's tests do.
   */
  flagged: string[]
  /** Lists whose availability flag was cleared. */
  cleared: string[]
  /** Series instances changed or deleted on their own (an exception written). */
  seriesEdited: number
  /** Sessions a series left as they were (already set to something else). */
  leftAsIs: number
  /** Changed sessions that hold a List (the List stays in place either way). */
  holdingLists: number
  /** The status written (the default status for a removal). */
  statusKey: SlotStatusKey
  seriesId?: string
}

function emptyOutcome(statusKey: SlotStatusKey): AvailabilityOutcome {
  return { set: 0, unchanged: 0, flagged: [], cleared: [], seriesEdited: 0, leftAsIs: 0, holdingLists: 0, statusKey }
}

// ---------------------------------------------------------------------------
// Shared guards
// ---------------------------------------------------------------------------

type GuardState = Pick<AppState, 'masters'>

/** Who may set this anaesthetist's availability (an anaesthetist their own; the office anyone's; never a feed). */
function actorRefusal<T>(state: GuardState, actor: Actor, anaesthetistId: string): Outcome<T> | null {
  if (state.masters.anaesthetists[anaesthetistId] === undefined) return refuse('notFound', 'Anaesthetist not found.')
  if (actor.source === 'integration') {
    return refuse('integrationForbidden', 'Availability comes from the anaesthetist or the office, never a feed.')
  }
  if (actor.role === 'anaesthetist' && actor.anaesthetistId !== undefined && actor.anaesthetistId !== anaesthetistId) {
    return refuse('notOwnAvailability', 'Anaesthetists can only set their own availability.')
  }
  return null
}

/**
 * An anaesthetist may not change or remove a status only the office may set
 * (for example an office hold): the refusal names it.
 */
export function replacedStatusRefusal<T>(statuses: SlotStatusRecords, actor: Actor, slots: readonly Slot[]): Outcome<T> | null {
  if (actor.role !== 'anaesthetist') return null
  const locked = slots.find((slot) => statusFor(statuses, slot.status)?.anaesthetistCanSet === false)
  if (locked === undefined) return null
  const label = displayStatusLabel(locked.status, statuses)
  return refuse('statusNotSettable', `${label} on ${shortDateLabel(locked.dateISO)} ${locked.session} is set by the office. Ask the office to change it.`)
}

/** The status must exist, be in use, and (for an anaesthetist) be one they may set. */
export function statusRefusal<T>(statuses: SlotStatusRecords, actor: Actor, statusKey: SlotStatusKey): Outcome<T> | null {
  const status = statusFor(statuses, statusKey)
  if (status === undefined) return refuse('statusNotFound', 'Choose an availability status.')
  if (status.retiredAtISO !== undefined) return refuse('statusRetired', `${status.label} is no longer in use. Choose another status.`)
  if (actor.role === 'anaesthetist' && !status.anaesthetistCanSet) {
    return refuse('statusNotSettable', `${status.label} is set by the office.`)
  }
  return null
}

// ---------------------------------------------------------------------------
// The per-session write (shared by every action, setAvailability included)
// ---------------------------------------------------------------------------

export interface SessionWrite {
  slot: Slot
  statusKey: SlotStatusKey
  /** The note to keep ('' or undefined clears it). */
  note?: string
  /** The series that sets this session; null clears the pointer; undefined keeps it. */
  seriesId?: string | null
}

export interface SessionWriteResult {
  slots: Record<string, Slot>
  changedSlotIds: string[]
  unchanged: number
  holdingLists: number
  /**
   * Lists an ANAESTHETIST's write would leave in a session she is newly marking
   * closed (catch-up Phase 32; US-01.5.5, RV-30). Every caller refuses with
   * `holdsList` before it writes when this is non-empty, so the move sheet's
   * unavailable prompt ("Return to the office" or "Hand on to a colleague") is
   * the only way through. Always empty for the office.
   */
  heldListIds: string[]
  /**
   * Her SUBMITTED or AUTHORISED Lists such a write would strand: only the
   * office can move those, so the write is refused outright (no prompt to open).
   */
  lockedLists: { id: string; dateISO: string; session: string; state: string }[]
}

/**
 * The return-or-assign guard (US-01.5.5): refused, before any write, when an
 * anaesthetist would mark closed a session that holds a List. The refusal
 * carries every affected List (`details.listIds`, in date order) so the UI can
 * prompt for each in turn. The office's paths (a sickness phoned in, a
 * hospital closure) keep the derived conflict (US-01.5.2, OQ-81 part 3).
 */
export function holdsListRefusal<T>(result: Pick<SessionWriteResult, 'heldListIds'> & Partial<Pick<SessionWriteResult, 'lockedLists'>>): Outcome<T> | null {
  const locked = result.lockedLists?.[0]
  if (locked !== undefined) {
    const when = `${shortDateLabel(locked.dateISO)} ${locked.session}`
    const what = locked.state === 'AUTHORISED' ? 'authorised' : 'submitted'
    return refuse('holdsLockedList', `Your ${when} List has been ${what}, so only the office can move it. Ask the office to change this session.`, { listIds: [locked.id] })
  }
  const listIds = result.heldListIds
  if (listIds.length === 0) return null
  const message =
    listIds.length === 1
      ? 'This session has a List. Choose whether it goes back to the office or to a colleague first.'
      : `${listIds.length} of these sessions have Lists. Choose where each one goes first.`
  return refuse('holdsList', message, { listIds: [...listIds] })
}


/**
 * Apply session writes inside a mutate recipe: write each Slot's status and
 * note directly. This is the one place every Slot-status write passes through
 * (one-off, range, series create or delete, instance edits, the office's
 * sickness record), so the return-or-assign guard lives here (catch-up Phase
 * 32): for an anaesthetist actor it reports, in `heldListIds`, every List a
 * closed status would strand, and each caller refuses (`holdsListRefusal`)
 * before writing. It never touches a List: for the office the List in a
 * session keeps its surgeon, hospital, Bookings, times and kind, and the one
 * conflict rule in `mutate()` flags it when the status is closed and resolves
 * the flag when it is bookable again (catch-up Phase 30; OQ-81 part 3).
 */
export function applySessionWrites(
  state: Pick<AppState, 'schedule' | 'masters'>,
  actor: Actor,
  writes: readonly SessionWrite[],
): SessionWriteResult {
  const statuses = state.masters.slotStatuses
  const slots = { ...state.schedule.slots }
  const listBySlot = listIndexBySlot(state.schedule.lists)
  const result: SessionWriteResult = { slots, changedSlotIds: [], unchanged: 0, holdingLists: 0, heldListIds: [], lockedLists: [] }

  for (const write of writes) {
    const current = slots[write.slot.id] ?? write.slot
    const note = write.note?.trim() ?? ''
    const nextSeries = write.seriesId === undefined ? current.seriesId : (write.seriesId ?? undefined)
    const status = statusFor(statuses, write.statusKey)
    const statusChanged = current.status !== write.statusKey
    const sessionChanged = statusChanged || (current.note ?? '') !== note || current.seriesId !== nextSeries
    if (!sessionChanged) {
      result.unchanged += 1
      continue
    }
    const next: Slot = { ...current, status: write.statusKey }
    if (note !== '') next.note = note
    else delete next.note
    if (nextSeries !== undefined) next.seriesId = nextSeries
    else delete next.seriesId
    slots[next.id] = next
    result.changedSlotIds.push(next.id)
    const held = listBySlot.get(current.id)
    if (held !== undefined) {
      result.holdingLists += 1
      if (actor.role === 'anaesthetist' && statusChanged && !isOpenForBooking(status)) {
        if (held.state === 'ACTIVE') result.heldListIds.push(held.id)
        else result.lockedLists.push({ id: held.id, dateISO: held.dateISO, session: held.session, state: held.state })
      }
    }
  }
  result.heldListIds.sort((a, b) => {
    const la = state.schedule.lists[a]
    const lb = state.schedule.lists[b]
    return (la?.dateISO ?? '').localeCompare(lb?.dateISO ?? '') || (la?.session ?? '').localeCompare(lb?.session ?? '') || a.localeCompare(b)
  })
  return result
}

/** An availability outcome's List counts, from the mutation's conflict result. */
function conflictCounts(result: MutationResult): Pick<AvailabilityOutcome, 'flagged' | 'cleared'> {
  const raised = new Set(result.conflictsRaised)
  return { flagged: [...result.conflictsRaised], cleared: result.conflictsResolved.filter((id) => !raised.has(id)) }
}

/**
 * When a write lands on a series instance with a new status or note, the
 * series records it as an `edited` exception, so a later series write or new
 * Slot never overwrites it. Returns the updated series record (or the same one).
 */
function withEditedExceptions(
  series: Readonly<Record<string, AvailabilitySeries>>,
  slotsBefore: Readonly<Record<string, Slot>>,
  writes: readonly SessionWrite[],
  changed: ReadonlySet<string>,
): { series: Record<string, AvailabilitySeries>; edited: number } {
  const next: Record<string, AvailabilitySeries> = { ...series }
  let edited = 0
  if (!writes.some((w) => slotsBefore[w.slot.id]?.seriesId !== undefined)) return { series: series as Record<string, AvailabilitySeries>, edited }
  for (const write of writes) {
    const before = slotsBefore[write.slot.id]
    if (before?.seriesId === undefined || !changed.has(write.slot.id)) continue
    const owner = next[before.seriesId]
    if (owner === undefined) continue
    const note = write.note?.trim() ?? ''
    next[owner.id] = {
      ...owner,
      exceptions: {
        ...owner.exceptions,
        [instanceKey(before.dateISO, before.session)]: { kind: 'edited', statusKey: write.statusKey, ...(note !== '' ? { note } : {}) },
      },
    }
    edited += 1
  }
  return { series: next, edited }
}

// ---------------------------------------------------------------------------
// setAvailabilityOne (28's setAvailability keeps its signature and calls this)
// ---------------------------------------------------------------------------

/**
 * One session's status, as Phase 28's `setAvailability` does it: the same
 * guards, the same per-session write and clash rule, a `session.status` audit
 * entry, and an `edited` exception when the session is a series instance.
 */
export function setOneSessionAvailability(
  api: AppStoreApi,
  actor: Actor,
  anaesthetistId: string,
  dateISO: string,
  session: Session,
  statusKey: SlotStatusKey,
  note?: string,
): Outcome<{ result: 'updated' | 'conflictFlagged' | 'noChange' }> {
  const state = api.getState()
  const guard = actorRefusal<{ result: 'updated' | 'conflictFlagged' | 'noChange' }>(state, actor, anaesthetistId)
  if (guard !== null) return guard
  const bad = statusRefusal<{ result: 'updated' | 'conflictFlagged' | 'noChange' }>(state.masters.slotStatuses, actor, statusKey)
  if (bad !== null) return bad
  const slot = state.schedule.slots[slotIdFor(anaesthetistId, dateISO, session)]
  if (slot === undefined) return refuse('noSlot', 'There is no session on that day: it is before the start date or outside the schedule horizon.')
  const locked = replacedStatusRefusal<{ result: 'updated' | 'conflictFlagged' | 'noChange' }>(state.masters.slotStatuses, actor, [slot])
  if (locked !== null) return locked
  const writes: SessionWrite[] = [{ slot, statusKey, ...(note !== undefined ? { note } : {}) }]
  const preview = applySessionWrites(state, actor, writes)
  const held = holdsListRefusal<{ result: 'updated' | 'conflictFlagged' | 'noChange' }>(preview)
  if (held !== null) return held
  if (preview.changedSlotIds.length === 0) return ok({ result: 'noChange' })

  const metas: MutationMeta[] = []
  const mutation = mutate(api, actor, metas, (s) => {
    const applied = applySessionWrites(s, actor, writes)
    const next = applied.slots[slot.id]
    const labelOf = (key: SlotStatusKey) => displayStatusLabel(key, s.masters.slotStatuses, true)
    if (applied.changedSlotIds.length > 0) {
      metas.push({
        entityType: 'session',
        entityId: slot.id,
        action: 'session.status',
        before: { status: slot.status, statusLabel: labelOf(slot.status), ...(slot.note !== undefined ? { note: slot.note } : {}) },
        after: { status: statusKey, statusLabel: labelOf(statusKey), ...(next?.note !== undefined ? { note: next.note } : {}) },
        stampBookingId: null,
      })
    }
    const series = withEditedExceptions(s.schedule.availabilitySeries, s.schedule.slots, writes, new Set(applied.changedSlotIds))
    return { schedule: { ...s.schedule, slots: applied.slots, availabilitySeries: series.series } }
  })
  return ok({ result: mutation.conflictsRaised.length > 0 ? 'conflictFlagged' : 'updated' })
}

// ---------------------------------------------------------------------------
// setAvailabilityRange (US-01.2.1, US-01.5.3: days off ahead)
// ---------------------------------------------------------------------------

export interface AvailabilityRangeInput {
  anaesthetistId: string
  fromISO: string
  toISO: string
  sessions: SessionChoice
  statusKey: SlotStatusKey
  note?: string
}

/** Sessions per status, keyed by the status's long label at the time (the audit is a snapshot). */
function countByStatus(slots: readonly Slot[], statuses: SlotStatusRecords): Record<string, number> {
  const out: Record<string, number> = {}
  for (const slot of slots) {
    const label = displayStatusLabel(slot.status, statuses, true)
    out[label] = (out[label] ?? 0) + 1
  }
  return out
}

/**
 * Mark one session, both sessions of a day, or a date range, to a status, with
 * an optional note (US-01.2.1, US-01.5.3). A session that is a series instance
 * becomes an edited instance. All or nothing: any refusal writes nothing.
 */
export function setAvailabilityRange(api: AppStoreApi, actor: Actor, input: AvailabilityRangeInput): Outcome<AvailabilityOutcome> {
  const state = api.getState()
  const guard = actorRefusal<AvailabilityOutcome>(state, actor, input.anaesthetistId)
  if (guard !== null) return guard
  const bad = statusRefusal<AvailabilityOutcome>(state.masters.slotStatuses, actor, input.statusKey)
  if (bad !== null) return bad
  const issues = validateAvailabilityRange({
    fromISO: input.fromISO,
    toISO: input.toISO,
    todayISO: state.clock.todayISO,
    horizonEndISO: scheduleHorizon(state).endISO,
  })
  if (issues.length > 0) return refuse('invalidRange', issues.join(' '))
  if (!['AM', 'PM', 'both'].includes(input.sessions)) return refuse('invalidSessions', 'Choose AM, PM or both.')

  const writes: SessionWrite[] = []
  for (const { dateISO, session } of slotsInRange(input.fromISO, input.toISO, input.sessions)) {
    const slot = state.schedule.slots[slotIdFor(input.anaesthetistId, dateISO, session)]
    if (slot === undefined) {
      return refuse('noSlot', `There is no ${session} session on ${shortDateLabel(dateISO)}: it is before the start date.`)
    }
    writes.push({ slot, statusKey: input.statusKey, ...(input.note !== undefined ? { note: input.note } : {}) })
  }

  const locked = replacedStatusRefusal<AvailabilityOutcome>(state.masters.slotStatuses, actor, writes.map((w) => w.slot))
  if (locked !== null) return locked

  const outcome = emptyOutcome(input.statusKey)
  const preview = applySessionWrites(state, actor, writes)
  const held = holdsListRefusal<AvailabilityOutcome>(preview)
  if (held !== null) return held
  if (preview.changedSlotIds.length === 0) return ok({ ...outcome, unchanged: preview.unchanged })

  const metas: MutationMeta[] = []
  const mutation = mutate(api, actor, metas, (s) => {
    const applied = applySessionWrites(s, actor, writes)
    const changed = new Set(applied.changedSlotIds)
    const series = withEditedExceptions(s.schedule.availabilitySeries, s.schedule.slots, writes, changed)
    outcome.set = applied.changedSlotIds.length
    outcome.unchanged = applied.unchanged
    outcome.holdingLists = applied.holdingLists
    outcome.seriesEdited = series.edited
    const before = writes.map((w) => s.schedule.slots[w.slot.id]).filter((x): x is Slot => x !== undefined)
    const after = writes.map((w) => applied.slots[w.slot.id]).filter((x): x is Slot => x !== undefined)
    const note = input.note?.trim() ?? ''
    metas.push({
      entityType: 'anaesthetist',
      entityId: input.anaesthetistId,
      action: 'availability.setRange',
      before: { statuses: countByStatus(before, s.masters.slotStatuses) },
      after: {
        fromISO: input.fromISO,
        toISO: input.toISO,
        sessions: input.sessions,
        status: input.statusKey,
        statusLabel: displayStatusLabel(input.statusKey, s.masters.slotStatuses, true),
        ...(note !== '' ? { note } : {}),
        statuses: countByStatus(after, s.masters.slotStatuses),
        set: outcome.set,
        ...(series.edited > 0 ? { seriesInstancesEdited: series.edited } : {}),
      },
      stampBookingId: null,
    })
    return { schedule: { ...s.schedule, slots: applied.slots, availabilitySeries: series.series } }
  })
  Object.assign(outcome, conflictCounts(mutation))
  return ok(outcome)
}

// ---------------------------------------------------------------------------
// clearAvailability ("Remove" a day off, "Delete this one")
// ---------------------------------------------------------------------------

/**
 * Return one session to the default status (Free) with no note. If it is a
 * series instance, the series records a `deleted` exception and the session
 * leaves the series, so no later write puts it back.
 */
export function clearAvailability(api: AppStoreApi, actor: Actor, slotId: string): Outcome<AvailabilityOutcome> {
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  const guard = actorRefusal<AvailabilityOutcome>(state, actor, slot.anaesthetistId)
  if (guard !== null) return guard
  const issues = validateAvailabilityRange({
    fromISO: slot.dateISO,
    toISO: slot.dateISO,
    todayISO: state.clock.todayISO,
    horizonEndISO: scheduleHorizon(state).endISO,
  })
  if (issues.length > 0) return refuse('invalidRange', issues.join(' '))
  const locked = replacedStatusRefusal<AvailabilityOutcome>(state.masters.slotStatuses, actor, [slot])
  if (locked !== null) return locked

  const defaultKey = defaultSlotStatusKey(state.masters.slotStatuses)
  const outcome = emptyOutcome(defaultKey)
  const writes: SessionWrite[] = [{ slot, statusKey: defaultKey, seriesId: null }]
  const ownerId = slot.seriesId
  const preview = applySessionWrites(state, actor, writes)
  if (preview.changedSlotIds.length === 0) return ok({ ...outcome, unchanged: 1 })

  const metas: MutationMeta[] = []
  const mutation = mutate(api, actor, metas, (s) => {
    const applied = applySessionWrites(s, actor, writes)
    outcome.set = applied.changedSlotIds.length
    outcome.holdingLists = applied.holdingLists
    let availabilitySeries = s.schedule.availabilitySeries
    const owner = ownerId === undefined ? undefined : availabilitySeries[ownerId]
    if (owner !== undefined) {
      availabilitySeries = {
        ...availabilitySeries,
        [owner.id]: { ...owner, exceptions: { ...owner.exceptions, [instanceKey(slot.dateISO, slot.session)]: { kind: 'deleted' } } },
      }
      outcome.seriesEdited = 1
    }
    metas.push({
      entityType: 'session',
      entityId: slot.id,
      action: 'availability.cleared',
      before: {
        status: slot.status,
        statusLabel: displayStatusLabel(slot.status, s.masters.slotStatuses, true),
        ...(slot.note !== undefined ? { note: slot.note } : {}),
        ...(ownerId !== undefined ? { seriesId: ownerId } : {}),
      },
      after: { status: defaultKey, statusLabel: displayStatusLabel(defaultKey, s.masters.slotStatuses, true) },
      stampBookingId: null,
    })
    return { schedule: { ...s.schedule, slots: applied.slots, availabilitySeries } }
  })
  Object.assign(outcome, conflictCounts(mutation))
  return ok(outcome)
}

// ---------------------------------------------------------------------------
// Series (US-01.5.3)
// ---------------------------------------------------------------------------

/** A series record from the form's draft (the one build: the guard's preview and the write agree). */
function seriesFromDraft(draft: AvailabilitySeriesDraft, id: string, createdAtISO: string): AvailabilitySeries {
  const note = draft.note?.trim() ?? ''
  return {
    id,
    anaesthetistId: draft.anaesthetistId,
    statusKey: draft.statusKey,
    sessions: draft.sessions,
    ...(note !== '' ? { note } : {}),
    weekdays: [...draft.weekdays].sort((a, b) => a - b),
    everyWeeks: draft.everyWeeks,
    startISO: draft.startISO,
    ...(draft.untilISO !== undefined ? { untilISO: draft.untilISO } : {}),
    exceptions: {},
    createdAtISO,
  }
}

/**
 * The session writes a series makes from its start to the horizon end.
 * `adoptSlotIds` (catch-up Phase 32): sessions the unavailable prompt already
 * set to the series' status when their Lists moved first; the series takes them
 * as its own instances rather than leaving them "as they are".
 */
function seriesWrites(
  series: AvailabilitySeries,
  slots: Readonly<Record<string, Slot>>,
  horizonEndISO: string,
  statuses: SlotStatusRecords,
  adoptSlotIds: ReadonlySet<string> = new Set(),
): { writes: SessionWrite[]; leftAsIs: number } {
  const plan = planSeriesWrite(series, slots, { fromISO: series.startISO, toISO: horizonEndISO }, statuses)
  const writes: SessionWrite[] = plan.set.flatMap((p) => {
    const slot = slots[p.slotId]
    return slot === undefined ? [] : [{ slot, statusKey: p.statusKey, ...(p.note !== undefined ? { note: p.note } : {}), seriesId: series.id }]
  })
  let adopted = 0
  for (const slotId of plan.leftAsIs) {
    const slot = slots[slotId]
    if (slot === undefined || !adoptSlotIds.has(slotId) || slot.seriesId !== undefined || slot.status !== series.statusKey) continue
    writes.push({ slot, statusKey: series.statusKey, ...(series.note !== undefined ? { note: series.note } : {}), seriesId: series.id })
    adopted += 1
  }
  return { writes, leftAsIs: plan.leftAsIs.length - adopted }
}

/**
 * Create repeating days off: store the rule, then write it onto the existing
 * Slots from its start to the horizon end, filling only sessions at the default
 * status and in no other series (the rest are left as they are and counted).
 * New Slots beyond today's horizon get it as they are generated
 * (`seriesCalendarFor`).
 */
export function createAvailabilitySeries(
  api: AppStoreApi,
  actor: Actor,
  draft: AvailabilitySeriesDraft,
  /**
   * Catch-up Phase 31 (Phase 29's handoff): the office may start a series past
   * the horizon's far end, which no screen offers; "Stage recurring clash"
   * uses it so the roll forward paints the day. Office only.
   */
  options: {
    beyondHorizon?: boolean
    /** Catch-up Phase 32: sessions her Lists left first, from the unavailable prompt, for the series to take as its own. */
    adoptSlotIds?: readonly string[]
  } = {},
): Outcome<AvailabilityOutcome> {
  const state = api.getState()
  const guard = actorRefusal<AvailabilityOutcome>(state, actor, draft.anaesthetistId)
  if (guard !== null) return guard
  const bad = statusRefusal<AvailabilityOutcome>(state.masters.slotStatuses, actor, draft.statusKey)
  if (bad !== null) return bad
  const horizonEndISO = scheduleHorizon(state).endISO
  const issues = validateSeriesDraft(draft, {
    todayISO: state.clock.todayISO,
    horizonEndISO: options.beyondHorizon === true && actor.role === 'office' ? '9999-12-31' : horizonEndISO,
    statuses: state.masters.slotStatuses,
    requireSettable: actor.role === 'anaesthetist',
  })
  if (issues.length > 0) return refuse('invalidSeries', issues.join(' '))

  // The return-or-assign guard (US-01.5.5): plan the series on today's Slots first.
  const preview = seriesFromDraft(draft, 'preview', clockISO(state.clock))
  const adopt = new Set(options.adoptSlotIds ?? [])
  const held = holdsListRefusal<AvailabilityOutcome>(applySessionWrites(state, actor, seriesWrites(preview, state.schedule.slots, horizonEndISO, state.masters.slotStatuses, adopt).writes))
  if (held !== null) return held

  const outcome = emptyOutcome(draft.statusKey)
  const metas: MutationMeta[] = []
  const mutation = mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'availabilitySeries')
    const series = seriesFromDraft(draft, alloc.id, clockISO(s.clock))
    const { writes, leftAsIs } = seriesWrites(series, s.schedule.slots, horizonEndISO, s.masters.slotStatuses, adopt)
    const applied = applySessionWrites(s, actor, writes)
    outcome.seriesId = series.id
    outcome.set = applied.changedSlotIds.length
    outcome.unchanged = applied.unchanged
    outcome.leftAsIs = leftAsIs
    outcome.holdingLists = applied.holdingLists
    metas.push({
      entityType: 'anaesthetist',
      entityId: draft.anaesthetistId,
      action: 'availability.seriesCreated',
      after: {
        seriesId: series.id,
        rule: seriesLine(series, s.masters.slotStatuses),
        startISO: series.startISO,
        ...(series.untilISO !== undefined ? { untilISO: series.untilISO } : {}),
        set: outcome.set,
        leftAsIs: outcome.leftAsIs,
      },
      stampBookingId: null,
    })
    return {
      schedule: {
        ...s.schedule,
        slots: applied.slots,
        availabilitySeries: { ...s.schedule.availabilitySeries, [series.id]: series },
      },
      counters: alloc.counters,
    }
  })
  Object.assign(outcome, conflictCounts(mutation))
  return ok(outcome)
}

/**
 * Delete a series: it ends from today (kept for history). Every session from
 * today on that it still holds at its own status returns to the default
 * (Free); an edited instance keeps its edited status as a one-off and leaves
 * the series; past instances are untouched.
 */
export function deleteAvailabilitySeries(api: AppStoreApi, actor: Actor, seriesId: string): Outcome<AvailabilityOutcome> {
  const state = api.getState()
  const series = state.schedule.availabilitySeries[seriesId]
  if (series === undefined) return refuse('notFound', 'Those repeating days off were not found.')
  if (series.endedAtISO !== undefined) return refuse('seriesEnded', 'Those repeating days off were already deleted.')
  const guard = actorRefusal<AvailabilityOutcome>(state, actor, series.anaesthetistId)
  if (guard !== null) return guard

  const todayISO = state.clock.todayISO
  const defaultKey = defaultSlotStatusKey(state.masters.slotStatuses)
  const outcome = emptyOutcome(defaultKey)
  outcome.seriesId = seriesId
  const metas: MutationMeta[] = []
  const mutation = mutate(api, actor, metas, (s) => {
    const current = s.schedule.availabilitySeries[seriesId] ?? series
    const writes: SessionWrite[] = []
    const keptIds = new Set<string>()
    for (const slot of Object.values(s.schedule.slots)) {
      if (slot.seriesId !== seriesId || slot.dateISO < todayISO) continue
      const exception = current.exceptions[instanceKey(slot.dateISO, slot.session)]
      if (exception?.kind === 'edited' || slot.status !== current.statusKey) {
        // A day changed on its own keeps its status as a one-off and leaves the series.
        writes.push({ slot, statusKey: slot.status, ...(slot.note !== undefined ? { note: slot.note } : {}), seriesId: null })
        keptIds.add(slot.id)
      } else {
        writes.push({ slot, statusKey: defaultKey, seriesId: null })
      }
    }
    writes.sort((a, b) => a.slot.id.localeCompare(b.slot.id))
    const applied = applySessionWrites(s, actor, writes)
    outcome.set = applied.changedSlotIds.filter((id) => !keptIds.has(id)).length
    outcome.unchanged = keptIds.size
    outcome.holdingLists = applied.holdingLists
    metas.push({
      entityType: 'anaesthetist',
      entityId: current.anaesthetistId,
      action: 'availability.seriesDeleted',
      before: { seriesId, rule: seriesLine(current, s.masters.slotStatuses) },
      after: { endedFromISO: todayISO, returnedToDefault: outcome.set, keptAsOneOff: keptIds.size },
      stampBookingId: null,
    })
    return {
      schedule: {
        ...s.schedule,
        slots: applied.slots,
        availabilitySeries: { ...s.schedule.availabilitySeries, [seriesId]: { ...current, endedAtISO: clockISO(s.clock) } },
      },
    }
  })
  Object.assign(outcome, conflictCounts(mutation))
  return ok(outcome)
}

// ---------------------------------------------------------------------------
// Series on new Slots: the one helper every generating path uses
// ---------------------------------------------------------------------------

/**
 * The active series' instances on the dates being generated, as the
 * generator's calendar input (an `edited` exception carries its own status; a
 * `deleted` one is absent). Every generating path (the clock's roll-forward, a
 * horizon extension, a new or reactivated anaesthetist, an earlier start date)
 * passes these to `generateCanvasForDates` through `canvasMastersFrom`, so a
 * series is painted with the anaesthetist's calendar BEFORE recurring bookings
 * (OQ-81 part 1) and a recurring booking on a series-closed session comes back
 * as a `RecurringClash` (Phase 31's Draft List), never placed.
 */
export function seriesCalendarFor(
  state: { schedule: Pick<AppState['schedule'], 'availabilitySeries'> },
  datesISO: readonly string[],
): SeriesCalendarEntry[] {
  if (datesISO.length === 0) return []
  const sorted = [...datesISO].sort()
  const wanted = new Set(datesISO)
  const fromISO = sorted[0]
  const toISO = sorted[sorted.length - 1]
  if (fromISO === undefined || toISO === undefined) return []
  const entries: SeriesCalendarEntry[] = []
  const ordered = Object.values(state.schedule.availabilitySeries).sort((a, b) => a.id.localeCompare(b.id))
  for (const series of ordered) {
    if (series.endedAtISO !== undefined) continue
    for (const instance of seriesInstances(series, fromISO, toISO)) {
      if (!wanted.has(instance.dateISO)) continue
      entries.push({
        anaesthetistId: series.anaesthetistId,
        dateISO: instance.dateISO,
        session: instance.session,
        status: instance.statusKey,
        ...(instance.note !== undefined ? { note: instance.note } : {}),
        seriesId: series.id,
      })
    }
  }
  return entries
}
