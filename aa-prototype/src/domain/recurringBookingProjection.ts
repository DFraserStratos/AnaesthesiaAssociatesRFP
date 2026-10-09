/**
 * Recurring-booking projection (catch-up Phase 30; US-01.3.2, DM-53; OQ-81
 * parts 1 and 2).
 *
 * A recurring booking is the standing intersection of a hospital, an
 * anaesthetist and a surgeon on a day of the week and a session. It creates
 * its Lists across the horizon before any Bookings exist. The anaesthetist's
 * calendar is painted first (OQ-81 part 1): a session already closed is
 * skipped and named in the plan, so Phase 31 can turn it into a Draft List
 * (OQ-81 part 2); nothing here creates or flags a List there.
 *
 * The plan never touches a List with Bookings (cancelled ones count), a
 * SUBMITTED or AUTHORISED List, a List the office assigned or edited (no
 * `recurringBookingId`), or a List another recurring booking projected. It
 * removes only its own empty ACTIVE Lists, and only when the arrangement no
 * longer covers their session. Every List it creates is ACTIVE (FT-07.1).
 *
 * Draft Lists (catch-up Phase 31): a skipped session becomes a recurring-clash
 * Draft List in the store. A session already answered for (`answered`: a live
 * clash Draft List, one the office re-dated or removed, or a List assigned
 * from one) is neither created nor skipped again. An empty clash Draft List of
 * this recurring booking follows an edit (`draftUpdate`) and goes when the
 * arrangement no longer covers its day (`draftRemove`, a soft removal); one
 * with Bookings is kept.
 *
 * `generateCanvasForDates` (seed/canvas.ts) uses `activeOn` and paints in the
 * same order, so a fresh generation leaves `projectAllRecurringBookings` with
 * nothing to create, update or remove. Pure: no store, no React.
 */

import { addDays, format, parseISO } from 'date-fns'
import { isClosed, statusFor, type SlotStatusRecords } from './slotStatus'
import { slotIdFor } from './slots'
import type { List, ListKind, RecurringBooking, Slot, SlotStatusKey } from './types'

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

/** Is the arrangement running on this date (start and end dates; a retired one ends on its last date)? */
export function activeOn(recurringBooking: Pick<RecurringBooking, 'effectiveFromISO' | 'effectiveToISO'>, dateISO: string): boolean {
  if (recurringBooking.effectiveFromISO !== undefined && dateISO < recurringBooking.effectiveFromISO) return false
  if (recurringBooking.effectiveToISO !== undefined && dateISO > recurringBooking.effectiveToISO) return false
  return true
}

/** Does the arrangement cover this date (running, and on its weekday)? Weekends work. */
export function coversDate(recurringBooking: Pick<RecurringBooking, 'dayOfWeek' | 'effectiveFromISO' | 'effectiveToISO'>, dateISO: string): boolean {
  return parseISO(dateISO).getDay() === recurringBooking.dayOfWeek && activeOn(recurringBooking, dateISO)
}

/** The first recurring booking (in id order) that covers an anaesthetist's session on a date: the one that paints it. */
export function recurringBookingFor(
  recurringBookings: readonly RecurringBooking[],
  anaesthetistId: string,
  dateISO: string,
  session: string,
): RecurringBooking | undefined {
  let best: RecurringBooking | undefined
  for (const rb of recurringBookings) {
    if (rb.anaesthetistId !== anaesthetistId || rb.session !== session || !coversDate(rb, dateISO)) continue
    if (best === undefined || rb.id.localeCompare(best.id) < 0) best = rb
  }
  return best
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

/**
 * The key a recurring booking's day is answered under (catch-up Phase 31): the
 * recurring booking, its anaesthetist, the day and the session.
 */
export function answeredKey(recurringBookingId: string, anaesthetistId: string, dateISO: string, session: string): string {
  return `${recurringBookingId}|${anaesthetistId}|${dateISO}|${session}`
}

/** The List fields a recurring booking writes (and the Slot's own times). */
export interface ProjectedFields {
  kind: ListKind
  hospitalId: string
  surgeonId: string
  notes?: string
  startTime?: string
  endTime?: string
}

export function projectedFields(rb: RecurringBooking): ProjectedFields {
  const f: ProjectedFields = { kind: rb.kind, hospitalId: rb.hospitalId, surgeonId: rb.surgeonId }
  if (rb.notes !== undefined) f.notes = rb.notes
  if (rb.startTime !== undefined) f.startTime = rb.startTime
  if (rb.endTime !== undefined) f.endTime = rb.endTime
  return f
}

export type KeptReason = 'hasBookings' | 'hasRecords' | 'submitted' | 'authorised' | 'officeEdited' | 'movedByOffice' | 'otherRecurringBooking' | 'draft'

export const KEPT_REASON_LABELS: Record<KeptReason, string> = {
  hasBookings: 'with Bookings',
  hasRecords: 'with notes or attachments',
  movedByOffice: 'moved by the office',
  submitted: 'submitted',
  authorised: 'authorised',
  officeEdited: 'edited by the office',
  otherRecurringBooking: 'from another recurring booking',
  draft: 'Draft Lists',
}

export interface PlanCreate { recurringBookingId: string; slotId: string; dateISO: string; fields: ProjectedFields }
/** `resetTimes`: the session's own times came from the arrangement, which no longer sets them, so they go back to the default. */
export interface PlanUpdate { recurringBookingId: string; listId: string; slotId: string; dateISO: string; fields: ProjectedFields; resetTimes?: boolean }
export interface PlanRemove { recurringBookingId: string; listId: string; slotId: string; dateISO: string; resetTimes?: boolean }
/** `slotId` is absent for a Draft List (it has none). */
export interface PlanKept { recurringBookingId: string; listId: string; slotId?: string; dateISO: string; reason: KeptReason }
export interface PlanSkipped { recurringBookingId: string; slotId: string; dateISO: string; statusKey: SlotStatusKey }
/** An empty recurring-clash Draft List brought in line with an edited recurring booking. */
export interface PlanDraftUpdate { recurringBookingId: string; listId: string; dateISO: string; fields: ProjectedFields }
/** An empty recurring-clash Draft List whose day the recurring booking no longer covers: soft-removed. */
export interface PlanDraftRemove { recurringBookingId: string; listId: string; dateISO: string }

export interface ProjectionPlan {
  create: PlanCreate[]
  update: PlanUpdate[]
  remove: PlanRemove[]
  kept: PlanKept[]
  /** Sessions the arrangement covers that are already closed: each becomes a Draft List (OQ-81 part 2). */
  skipped: PlanSkipped[]
  draftUpdate: PlanDraftUpdate[]
  draftRemove: PlanDraftRemove[]
}

export interface ProjectionInputs {
  /** First date the plan may change (tomorrow). */
  fromISO: string
  /** The far end of the horizon setting (never a constant). */
  toISO: string
  slots: Readonly<Record<string, Slot>>
  lists: Readonly<Record<string, List>>
  /** The List in each Slot (28's `listIndexBySlot`). */
  listBySlot: ReadonlyMap<string, List>
  /** Lists holding any Booking, cancelled ones included. */
  bookedListIds: ReadonlySet<string>
  /** `<recurringBookingId>|<slotId>` of sessions whose projected List the office moved elsewhere, to that List's id. */
  movedFrom?: ReadonlyMap<string, string>
  /** Days already answered for by a Draft List or a List assigned from one, by `answeredKey` (`answeringLists`). */
  answered?: ReadonlyMap<string, List>
  statuses: SlotStatusRecords
}

export const emptyPlan = (): ProjectionPlan => ({ create: [], update: [], remove: [], kept: [], skipped: [], draftUpdate: [], draftRemove: [] })

function datesBetween(fromISO: string, toISO: string): string[] {
  const out: string[] = []
  if (fromISO > toISO) return out
  for (let d = parseISO(fromISO); ; d = addDays(d, 1)) {
    const iso = format(d, 'yyyy-MM-dd')
    if (iso > toISO) break
    out.push(iso)
  }
  return out
}

/** Why a List in a covered session is left alone, or null when the projection may update or remove it. */
function keptReason(list: List, recurringBookingId: string, booked: ReadonlySet<string>): KeptReason | null {
  if (list.recurringBookingId === undefined) return 'officeEdited'
  if (list.recurringBookingId !== recurringBookingId) return 'otherRecurringBooking'
  // A Draft List, or a List the office assigned from one: the office's, never repainted.
  if (list.state === 'DRAFT' || list.draft !== undefined) return 'draft'
  if (list.state === 'SUBMITTED') return 'submitted'
  if (list.state === 'AUTHORISED') return 'authorised'
  if (booked.has(list.id)) return 'hasBookings'
  // Office records on the List (a phone note, an attachment, a cleared conflict) are never thrown away or overwritten.
  if ((list.phoneNotes ?? []).length > 0 || (list.attachments ?? []).length > 0 || (list.conflictClears ?? []).length > 0) return 'hasRecords'
  return null
}

/** The arrangement set these times on the session, and no longer does. */
function timesToReset(slot: Slot | undefined, before: RecurringBooking | undefined, after: RecurringBooking | undefined): boolean {
  if (slot === undefined || before === undefined) return false
  const setStart = before.startTime !== undefined && slot.startTime === before.startTime && after?.startTime === undefined
  const setEnd = before.endTime !== undefined && slot.endTime === before.endTime && after?.endTime === undefined
  return setStart || setEnd
}

function sameFields(list: List, slot: Slot, f: ProjectedFields): boolean {
  return (
    list.kind === f.kind &&
    list.hospitalId === f.hospitalId &&
    list.surgeonId === f.surgeonId &&
    (list.notes ?? undefined) === f.notes &&
    (f.startTime === undefined || slot.startTime === f.startTime) &&
    (f.endTime === undefined || slot.endTime === f.endTime)
  )
}

const isLiveDraft = (l: List): boolean => l.state === 'DRAFT' && l.removedAtISO === undefined

function sameDraftFields(list: List, f: ProjectedFields): boolean {
  return list.kind === f.kind && list.hospitalId === f.hospitalId && list.surgeonId === f.surgeonId && (list.notes ?? undefined) === f.notes
}

/**
 * The plan for one recurring booking added (`before` undefined), edited, or
 * retired (`after` carrying its end date) over `fromISO` to `toISO`.
 * `claimed` (internal, for the all-bookings plan) holds Slots an earlier
 * arrangement already paints in this plan.
 */
export function projectRecurringBookingChange(
  input: ProjectionInputs & { before?: RecurringBooking; after?: RecurringBooking },
  claimed?: Set<string>,
): ProjectionPlan {
  const plan = emptyPlan()
  const id = input.after?.id ?? input.before?.id
  if (id === undefined) return plan
  const after = input.after
  const dates = datesBetween(input.fromISO, input.toISO)
  const covered = new Set<string>()
  // Draft Lists (and Lists assigned from one) that answer for a day this plan covers.
  const coveredAnswering = new Set<string>()

  if (after !== undefined) {
    for (const dateISO of dates) {
      if (!coversDate(after, dateISO)) continue
      const slotId = slotIdFor(after.anaesthetistId, dateISO, after.session)
      const slot = input.slots[slotId]
      // No Slot: the anaesthetist is inactive or not started that day.
      if (slot === undefined) continue
      covered.add(slotId)
      if (claimed?.has(slotId)) continue
      const list = input.listBySlot.get(slotId)
      const fields = projectedFields(after)
      const answering: List | undefined = input.answered?.get(answeredKey(id, after.anaesthetistId, dateISO, after.session))
      if (answering !== undefined && answering.id !== list?.id) {
        // The day is answered (catch-up Phase 31): never a second List or Draft List for it.
        coveredAnswering.add(answering.id)
        claimed?.add(slotId)
        if (isLiveDraft(answering) && answering.recurringBookingId === id) {
          if (input.bookedListIds.has(answering.id)) plan.kept.push({ recurringBookingId: id, listId: answering.id, dateISO: answering.dateISO, reason: 'hasBookings' })
          else if (!sameDraftFields(answering, fields)) plan.draftUpdate.push({ recurringBookingId: id, listId: answering.id, dateISO: answering.dateISO, fields })
        } else if (answering.state !== 'DRAFT') {
          plan.kept.push({ recurringBookingId: id, listId: answering.id, ...(answering.slotId !== undefined ? { slotId: answering.slotId } : {}), dateISO: answering.dateISO, reason: 'draft' })
        }
        continue
      }
      const movedListId = input.movedFrom?.get(`${id}|${slotId}`)
      if (list === undefined && movedListId !== undefined) {
        // Its List was moved by the office to a colleague: that date is served.
        plan.kept.push({ recurringBookingId: id, listId: movedListId, slotId, dateISO, reason: 'movedByOffice' })
        claimed?.add(slotId)
        continue
      }
      if (list === undefined) {
        if (isClosed(statusFor(input.statuses, slot.status))) {
          plan.skipped.push({ recurringBookingId: id, slotId, dateISO, statusKey: slot.status })
          claimed?.add(slotId)
        } else {
          plan.create.push({ recurringBookingId: id, slotId, dateISO, fields })
          claimed?.add(slotId)
        }
        continue
      }
      const reason = keptReason(list, id, input.bookedListIds)
      if (reason !== null) {
        plan.kept.push({ recurringBookingId: id, listId: list.id, slotId, dateISO, reason })
        // One session counts once in the all-bookings plan, whichever arrangement reaches it first.
        claimed?.add(slotId)
        continue
      }
      claimed?.add(slotId)
      const resetTimes = timesToReset(slot, input.before, after)
      if (!sameFields(list, slot, fields) || resetTimes) {
        plan.update.push({ recurringBookingId: id, listId: list.id, slotId, dateISO, fields, ...(resetTimes ? { resetTimes } : {}) })
      }
    }
  }

  // Its own projected Lists in range whose session the arrangement no longer
  // covers (retired, ended, or moved to another day, session or anaesthetist).
  // A clash Draft List is judged by the day it answers for (`projectedFor`), not
  // the day the office re-dated it to: one whose day has passed is never removed.
  const own = Object.values(input.lists)
    .filter((l) => {
      const day = l.draft?.projectedFor?.dateISO ?? l.dateISO
      return l.recurringBookingId === id && day >= input.fromISO && day <= input.toISO
    })
    .filter((l) => (l.slotId !== undefined ? !covered.has(l.slotId) : isLiveDraft(l) && !coveredAnswering.has(l.id)))
    .filter((l) => !coveredAnswering.has(l.id))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.id.localeCompare(b.id))
  for (const list of own) {
    if (list.slotId === undefined) {
      // An empty clash Draft List goes (soft) with the arrangement; one with Bookings stays for the office.
      if (input.bookedListIds.has(list.id)) plan.kept.push({ recurringBookingId: id, listId: list.id, dateISO: list.dateISO, reason: 'hasBookings' })
      else plan.draftRemove.push({ recurringBookingId: id, listId: list.id, dateISO: list.dateISO })
      continue
    }
    const reason = keptReason(list, id, input.bookedListIds)
    if (reason !== null) plan.kept.push({ recurringBookingId: id, listId: list.id, slotId: list.slotId, dateISO: list.dateISO, reason })
    else {
      const rb = input.before ?? after
      const slot = input.slots[list.slotId]
      const resetTimes = slot !== undefined && rb !== undefined && ((rb.startTime !== undefined && slot.startTime === rb.startTime) || (rb.endTime !== undefined && slot.endTime === rb.endTime))
      plan.remove.push({ recurringBookingId: id, listId: list.id, slotId: list.slotId, dateISO: list.dateISO, ...(resetTimes ? { resetTimes } : {}) })
    }
  }
  return plan
}

/**
 * The view-level "Apply to canvas now": every recurring booking re-painted
 * onto sessions that have come free, and its own untouched Lists brought back
 * in line. It never removes. Earlier ids win a session two arrangements cover,
 * as in the generator.
 */
export function projectAllRecurringBookings(input: ProjectionInputs & { recurringBookings: readonly RecurringBooking[] }): ProjectionPlan {
  const plan = emptyPlan()
  const claimed = new Set<string>()
  const ordered = [...input.recurringBookings].sort((a, b) => a.id.localeCompare(b.id))
  for (const rb of ordered) {
    const one = projectRecurringBookingChange({ ...input, before: rb, after: rb }, claimed)
    plan.create.push(...one.create)
    plan.update.push(...one.update)
    plan.kept.push(...one.kept)
    plan.skipped.push(...one.skipped)
    plan.draftUpdate.push(...one.draftUpdate)
  }
  return plan
}

/** The first date the plan changes (for "Show on day grid"). */
export function firstAffectedDate(plan: ProjectionPlan): string | undefined {
  const dates = [...plan.create, ...plan.update, ...plan.remove, ...plan.skipped, ...plan.draftUpdate, ...plan.draftRemove].map((e) => e.dateISO).sort()
  return dates[0]
}
