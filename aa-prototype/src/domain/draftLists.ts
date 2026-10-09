/**
 * Draft Lists (catch-up Phase 31; FT-01.6, US-01.6.1 to US-01.6.4, EP-07,
 * DM-03, DM-52; OQ-44, OQ-86 and OQ-81 part 2, answered). Pure: no React, no
 * store, no clock reads (the caller passes "now").
 *
 * A Draft List is a List in state DRAFT with no anaesthetist and no Slot. This
 * module holds its guards, its one order (`compareDraftLists`), its waiting
 * time, who could take it by availability alone (`draftListAvailability`; the
 * not-preferred grouping and tier order are Phase 17's helper's, applied in the
 * Admin sheet, never here), and the one rule for OQ-81 part 2
 * (`recurringClashDraft`). It knows nothing of pairing preferences or tiers.
 */

import { addDays, differenceInMinutes, format, parseISO } from 'date-fns'
import { activeOn, answeredKey } from './recurringBookingProjection'
import { isClosed, isOpenForBooking, statusFor, type SlotStatusRecords } from './slotStatus'
import { slotIdFor } from './slots'
import type {
  AnaesthetistId,
  AssignedList,
  DraftList,
  IsoDateTime,
  List,
  RecurringBooking,
  Session,
  Slot,
  SlotStatusKey,
} from './types'

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/** A removed Draft List (US-01.6.4): kept for History, gone from every other view. */
export function isRemoved(list: Pick<List, 'removedAtISO'>): boolean {
  return list.removedAtISO !== undefined
}

/** A live Draft List: state DRAFT and not removed. */
export function isDraftList(list: List | undefined): list is DraftList {
  return list !== undefined && list.state === 'DRAFT' && !isRemoved(list)
}

/** A List with its anaesthetist and Slot (ACTIVE, SUBMITTED or AUTHORISED). */
export function isAssignedList(list: List | undefined): list is AssignedList {
  return list !== undefined && list.state !== 'DRAFT'
}

/** The removal reason (display only) the projection writes when a recurring booking's change takes its empty Draft List away. */
export const RECURRING_BOOKING_CHANGED = 'Recurring booking changed'

// ---------------------------------------------------------------------------
// Order and waiting time
// ---------------------------------------------------------------------------

const SESSION_ORDER: Record<Session, number> = { AM: 0, PM: 1 }

/**
 * THE order for Draft Lists everywhere (US-01.6.2 "sorted in ascending date
 * order", soonest first): date, then AM before PM, then the longer wait first
 * (earlier `draft.sinceISO`), then id. The page, the rail card, the band's
 * lanes and the PWA stand-in's pick all sort through it.
 */
export function compareDraftLists(a: Pick<List, 'id' | 'dateISO' | 'session' | 'draft'>, b: Pick<List, 'id' | 'dateISO' | 'session' | 'draft'>): number {
  return (
    a.dateISO.localeCompare(b.dateISO) ||
    SESSION_ORDER[a.session] - SESSION_ORDER[b.session] ||
    (a.draft?.sinceISO ?? '').localeCompare(b.draft?.sinceISO ?? '') ||
    a.id.localeCompare(b.id)
  )
}

/**
 * Whole minutes a Draft List has waited (US-01.6.2): from `draft.sinceISO` to
 * now, or to its assignment or removal once it stopped waiting, so a finished
 * one shows how long it waited and that figure never grows. A re-date keeps
 * `sinceISO`, so the wait survives a date change.
 */
export function waitingMinutes(list: Pick<List, 'draft' | 'removedAtISO'>, nowISO: IsoDateTime): number {
  if (list.draft === undefined) return 0
  const end = list.draft.assignedAtISO ?? list.removedAtISO ?? nowISO
  return Math.max(0, differenceInMinutes(parseISO(end), parseISO(list.draft.sinceISO)))
}

// ---------------------------------------------------------------------------
// Who could take it (by availability only)
// ---------------------------------------------------------------------------

export interface DraftAvailabilityRow {
  anaesthetistId: AnaesthetistId
  slotId: string
  statusKey: SlotStatusKey
  /** The status's own label (an admin-added status keeps its name). */
  statusLabel: string
}

export interface OccupiedRow extends DraftAvailabilityRow {
  /** The List already in that session. */
  listId: string
}

export interface DraftListAvailability {
  /** The session is empty and open for bookings. */
  free: DraftAvailabilityRow[]
  /** The session is empty and closed (Unavailable, Holiday or any closed status). Selectable, with a warning. */
  notAvailable: DraftAvailabilityRow[]
  /** The session already holds a List: never selectable. */
  occupied: OccupiedRow[]
}

/**
 * Everybody potentially available for a Draft List's day and session
 * (US-01.6.3's note; the availability finder's reading, US-01.4.2), by
 * availability alone. Active anaesthetists only, in the order given (the
 * roster); one with no Slot that day (not started yet) is left out. No
 * preference or tier knowledge: Phase 17's helper ranks `free` and
 * `notAvailable` in the Admin sheet. There is no emergency group (no
 * emergency-only status exists): an admin-added status lands by its bookable
 * flag and keeps its label.
 */
export function draftListAvailability(input: {
  list: Pick<List, 'dateISO' | 'session'>
  anaesthetists: readonly { registrationNumber: AnaesthetistId; active: boolean }[]
  slots: Readonly<Record<string, Slot>>
  /** The id of the List in each Slot (assigned Lists only). */
  listIdBySlot: ReadonlyMap<string, string>
  statuses: SlotStatusRecords
}): DraftListAvailability {
  const out: DraftListAvailability = { free: [], notAvailable: [], occupied: [] }
  for (const a of input.anaesthetists) {
    if (!a.active) continue
    const slotId = slotIdFor(a.registrationNumber, input.list.dateISO, input.list.session)
    const slot = input.slots[slotId]
    if (slot === undefined) continue
    const status = statusFor(input.statuses, slot.status)
    const row: DraftAvailabilityRow = { anaesthetistId: a.registrationNumber, slotId, statusKey: slot.status, statusLabel: status?.label ?? slot.status }
    const listId = input.listIdBySlot.get(slotId)
    if (listId !== undefined) out.occupied.push({ ...row, listId })
    else if (isOpenForBooking(status)) out.free.push(row)
    else if (isClosed(status)) out.notAvailable.push(row)
  }
  return out
}

// ---------------------------------------------------------------------------
// The recurring clash (OQ-81 part 2)
// ---------------------------------------------------------------------------

/** One clash, whichever path found it: a session a recurring booking covers whose Slot is closed. */
export interface NormalisedClash {
  recurringBookingId: string
  anaesthetistId: AnaesthetistId
  dateISO: string
  session: Session
}

/**
 * Phase 28's generator `RecurringClash` and Phase 30's projection `skipped`
 * entry both carry the Slot's id; the Slot gives the anaesthetist, day and
 * session, so both normalise to the same record.
 */
export function normaliseClash(clash: { recurringBookingId: string; slotId: string }, slots: Readonly<Record<string, Slot>>): NormalisedClash | undefined {
  const slot = slots[clash.slotId]
  if (slot === undefined) return undefined
  return { recurringBookingId: clash.recurringBookingId, anaesthetistId: slot.anaesthetistId, dateISO: slot.dateISO, session: slot.session }
}

/** The stable id of a recurring-clash Draft List, e.g. `LD-RCB016-2026-07-21-AM`. Never collides with the seed's `LD-00n` or runtime `LG####`. */
export function recurringClashListId(recurringBookingId: string, dateISO: string, session: Session): string {
  return `LD-${recurringBookingId}-${dateISO}-${session}`
}

/**
 * The one rule for OQ-81 part 2 (settled in the room): a recurring booking
 * that lands on a session the anaesthetist has already marked closed becomes a
 * Draft List with the recurring booking's hospital, surgeon, kind and notes,
 * no anaesthetist and no Slot, rather than a List flagged on someone who will
 * not be there. `null` for a day before today (history is never rewritten) or
 * a day the recurring booking is not running.
 */
export function recurringClashDraft(
  clash: NormalisedClash,
  recurringBooking: RecurringBooking,
  todayISO: string,
  nowISO: IsoDateTime,
  by: string,
): DraftList | null {
  if (clash.dateISO < todayISO) return null
  if (!activeOn(recurringBooking, clash.dateISO)) return null
  const list: DraftList = {
    id: recurringClashListId(clash.recurringBookingId, clash.dateISO, clash.session),
    state: 'DRAFT',
    dateISO: clash.dateISO,
    session: clash.session,
    kind: recurringBooking.kind,
    hospitalId: recurringBooking.hospitalId,
    surgeonId: recurringBooking.surgeonId,
    conflicts: [],
    recurringBookingId: clash.recurringBookingId,
    draft: {
      origin: 'recurringClash',
      sinceISO: nowISO,
      by,
      fromAnaesthetistId: clash.anaesthetistId,
      projectedFor: { recurringBookingId: clash.recurringBookingId, dateISO: clash.dateISO, session: clash.session },
    },
  }
  if (recurringBooking.notes !== undefined) list.notes = recurringBooking.notes
  return list
}

/**
 * The Lists that answer for a recurring booking's day (catch-up Phase 31), by
 * `answeredKey`: a recurring-clash Draft List answers for the day in its
 * `draft.projectedFor` even after the office re-dates or removes it (not when
 * the recurring booking's own change removed it), and a List that came from a
 * Draft List (assigned) or went back to the office keeps answering through its
 * `recurringBookingId`. The projection never creates or skips a session that
 * is answered, so no recurring booking makes a second List for that day.
 */
export function answeringLists(lists: Readonly<Record<string, List>>): Map<string, List> {
  const out = new Map<string, List>()
  for (const l of Object.values(lists)) {
    const trail = l.draft
    if (trail === undefined) continue
    if (l.removeCause === 'recurringBookingChanged') continue
    const pf = trail.projectedFor
    if (pf !== undefined) {
      out.set(answeredKey(pf.recurringBookingId, pf.anaesthetistId ?? trail.fromAnaesthetistId ?? '', pf.dateISO, pf.session), l)
    } else if (l.recurringBookingId !== undefined && !isRemoved(l)) {
      out.set(answeredKey(l.recurringBookingId, trail.fromAnaesthetistId ?? '', l.dateISO, l.session), l)
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Assign warnings (US-01.6.3, US-01.5.2): one wording for the sheet and the action
// ---------------------------------------------------------------------------

export const DRAFT_ASSIGN_WARNINGS = {
  /** A closed session (Unavailable, Holiday or any closed status): warn, never refuse. */
  closedSession: (who: string, statusLabel: string) =>
    `${who} is on ${statusLabel} for this session. Assigning flags a conflict on the List. Check with ${who} first.`,
  /** The hospital is closed that day: the List keeps Phase 30's conflict. */
  hospitalHoliday: (hospitalName: string) => `${hospitalName} is closed that day (hospital holiday). The List keeps its conflict.`,
}

/** Why a Draft List cannot be removed yet (US-01.6.4 reading: its active Bookings go first). */
export function removeBlockedReason(activeBookings: number): string {
  return `Move or cancel its ${activeBookings} Booking${activeBookings === 1 ? '' : 's'} first.`
}

/** The next date strictly after `todayISO` that falls on `weekday` (0 Sunday to 6 Saturday): "next Thursday". */
export function nextWeekday(todayISO: string, weekday: number): string {
  let d = addDays(parseISO(todayISO), 1)
  while (d.getDay() !== weekday) d = addDays(d, 1)
  return format(d, 'yyyy-MM-dd')
}
