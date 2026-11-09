/**
 * The anaesthetist's main view, the "Changed since submitted" cue, and (later in
 * catch-up Phase 38a) the look-back and search selectors. Pure reads over the
 * store: no new stored entity, no mutation. PWA-safe (no app imports).
 *
 * Own work only: every selector here that serves an anaesthetist returns Lists
 * whose `anaesthetistId` is theirs. A Draft List has none; a List or Booking
 * moved to a colleague is the colleague's.
 */

import { isAssignedList } from '../domain/draftLists'
import { hasLeftMainView } from '../domain/listProgress'
import type { AssignedList, AuditEntry, Booking } from '../domain/types'
import type { AppState } from './appStore'
import { isBackdropList, slotViewsForAnaesthetist, type SlotState, type SlotView } from './selectors'

// ---------------------------------------------------------------------------
// The main view (US-07.4.2)
// ---------------------------------------------------------------------------

export interface MainView {
  /**
   * Every earlier List of the anaesthetist not yet authorised that holds at
   * least one active Booking, at any distance back (not bounded by the canvas
   * start), oldest first, AM before PM.
   */
  earlier: AssignedList[]
  /** The forward sessions from today to the bound, less any List that has left. */
  upcoming: SlotView[]
}

type MainViewState = SlotState & { schedule: Pick<AppState['schedule'], 'slots' | 'lists' | 'bookings'> }

/** Non-cancelled Bookings per List id, one pass. */
function activeBookingCounts(bookings: Record<string, Booking>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const b of Object.values(bookings)) {
    if (b.cancellation !== undefined) continue
    counts.set(b.listId, (counts.get(b.listId) ?? 0) + 1)
  }
  return counts
}

/**
 * The main view: upcoming work from today, plus earlier Lists not yet
 * authorised reached by scrolling back. A List with no Booking is left off the
 * earlier group (a plan reading: the seed's empty recurring Lists of 7 to 16
 * July would otherwise wait there forever, since nothing will authorise them).
 * Backdrop Lists are AUTHORISED and never appear.
 */
export function mainViewFor(
  state: MainViewState,
  anaesthetistId: string,
  todayISO: string,
  forwardToISO: string,
): MainView {
  const counts = activeBookingCounts(state.schedule.bookings)
  const earlier = Object.values(state.schedule.lists)
    .filter(
      (l): l is AssignedList =>
        isAssignedList(l) &&
        l.anaesthetistId === anaesthetistId &&
        l.dateISO < todayISO &&
        !hasLeftMainView(l) &&
        !isBackdropList(l) &&
        (counts.get(l.id) ?? 0) > 0,
    )
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session))
  const upcoming = slotViewsForAnaesthetist(state, anaesthetistId, todayISO, forwardToISO).filter(
    (v) => v.list === undefined || !hasLeftMainView(v.list),
  )
  return { earlier, upcoming }
}

// ---------------------------------------------------------------------------
// "Changed since submitted" (US-07.2.1, US-07.2.3)
// ---------------------------------------------------------------------------

export interface ChangedSinceSubmitted {
  /** How many anaesthetist changes since the List was submitted. */
  count: number
  /** The Bookings those changes touched (a List-level change touches none). */
  bookingIds: string[]
  /** When the last one was made. */
  lastAtISO: string
}

function field(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const v = (value as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : undefined
}

/**
 * The anaesthetist's own changes to a SUBMITTED List since it was submitted,
 * read from the audit log: entries after the List's last `list.submit`, by
 * position (so two writes in the same demo minute still order), whose role is
 * the anaesthetist's and whose entity is the List, one of its Bookings, or a
 * Procedure, billing line or patient of one of them. An office correction never
 * counts. Null when the List is not SUBMITTED (the cue ends at authorise) or
 * nothing has changed.
 */
export function changedSinceSubmitted(
  state: Pick<AppState, 'schedule' | 'audit'>,
  listId: string,
): ChangedSinceSubmitted | null {
  const list = state.schedule.lists[listId]
  if (list === undefined || list.state !== 'SUBMITTED') return null
  const audit: readonly AuditEntry[] = state.audit
  let start = -1
  for (let i = audit.length - 1; i >= 0; i--) {
    const e = audit[i]!
    if (e.entityType === 'list' && e.entityId === listId && e.action === 'list.submit') {
      start = i
      break
    }
  }
  if (start < 0) return null

  const { bookings, procedures, billingLines } = state.schedule
  const onList = (bookingId: string | undefined): bookingId is string =>
    bookingId !== undefined && bookings[bookingId]?.listId === listId
  const bookingOfProcedure = (procedureId: string | undefined): string | undefined =>
    procedureId === undefined ? undefined : procedures[procedureId]?.bookingId

  let count = 0
  let lastAtISO = ''
  const touched = new Set<string>()
  for (let i = start + 1; i < audit.length; i++) {
    const e = audit[i]!
    if (e.role !== 'anaesthetist') continue
    let hit = false
    const mark = (bookingId: string | undefined): void => {
      if (onList(bookingId)) {
        touched.add(bookingId)
        hit = true
      }
    }
    switch (e.entityType) {
      case 'list':
        if (e.entityId === listId) hit = true
        break
      case 'booking':
        mark(e.entityId)
        // A Booking moved off this List still changed it.
        if (!hit && e.action === 'booking.reassign' && field(e.before, 'listId') === listId) hit = true
        break
      case 'procedure':
        mark(bookingOfProcedure(e.entityId) ?? field(e.before, 'bookingId') ?? field(e.after, 'bookingId'))
        break
      case 'billingLine': {
        const procedureId =
          billingLines[e.entityId]?.procedureId ?? field(e.before, 'procedureId') ?? field(e.after, 'procedureId')
        mark(bookingOfProcedure(procedureId))
        break
      }
      case 'patient':
        for (const b of Object.values(bookings)) if (b.patientId === e.entityId) mark(b.id)
        break
      default:
        break
    }
    if (hit) {
      count++
      lastAtISO = e.atISO
    }
  }
  if (count === 0) return null
  return { count, bookingIds: [...touched].sort(), lastAtISO }
}
