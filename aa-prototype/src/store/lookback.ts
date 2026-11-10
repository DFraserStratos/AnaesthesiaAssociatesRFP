/**
 * The anaesthetist's main view, the "Changed since submitted" cue, and the
 * look-back and search selectors (catch-up Phase 38a). Pure reads over the
 * store: no new stored entity, no mutation. PWA-safe (no app imports).
 *
 * Own work only: every selector here that serves an anaesthetist returns Lists
 * whose `anaesthetistId` is theirs. A Draft List has none; a List or Booking
 * moved to a colleague is the colleague's.
 */

import { isAssignedList } from '../domain/draftLists'
import { hasLeftMainView, listProgress, type ListProgress } from '../domain/listProgress'
import { parseBookingQuery, patientMatches, type BookingQuery } from '../domain/bookingSearch'
import type { AssignedList, AuditEntry, Booking, Procedure } from '../domain/types'
import type { AppState } from './appStore'
import {
  bookingCountsByList,
  counterpartyName,
  isBackdropList,
  scheduleHorizon,
  slotViewsForAnaesthetist,
  timesForList,
  type SlotState,
  type SlotView,
} from './selectors'

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
  const counts = bookingCountsByList(state.schedule.bookings)
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
 * Procedure, billing line or patient of one of them. A patient edit counts only
 * when the List's own anaesthetist made it (a patient's details are shared by
 * all their Bookings, so her edit changes what the office sees here; a
 * colleague's never counts). The conflict entries `mutate()` writes on the
 * actor's behalf are not changes. An office correction never counts. Null when the List is not SUBMITTED (the cue ends at authorise) or
 * nothing has changed.
 */
export function changedSinceSubmitted(
  state: Pick<AppState, 'schedule' | 'audit' | 'masters'>,
  listId: string,
): ChangedSinceSubmitted | null {
  const list = state.schedule.lists[listId]
  if (list === undefined || list.state !== 'SUBMITTED') return null
  const ownerName = state.masters.anaesthetists[list.anaesthetistId]?.name
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
        if (e.entityId === listId && !e.action.startsWith('list.conflict')) hit = true
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
        if (e.who !== ownerName) break
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

// ---------------------------------------------------------------------------
// Look-back: the date lookup and search (US-03.1.6, US-03.1.7)
// ---------------------------------------------------------------------------

type LookbackState = Pick<AppState, 'schedule' | 'masters' | 'appSettings'>

/** The anaesthetist's own assigned Lists (backdrop and authorised included; never a Draft List). */
function ownLists(state: Pick<AppState, 'schedule'>, anaesthetistId: string): AssignedList[] {
  return Object.values(state.schedule.lists).filter(
    (l): l is AssignedList => isAssignedList(l) && l.anaesthetistId === anaesthetistId && l.removedAtISO === undefined,
  )
}

function activeBookingsOn(state: Pick<AppState, 'schedule'>, listId: string): Booking[] {
  return Object.values(state.schedule.bookings).filter((b) => b.listId === listId && b.cancellation === undefined)
}

/** A Booking's Procedure names, the primary first (an added Procedure after). */
function procedureNames(procedures: readonly Procedure[]): string[] {
  return [...procedures]
    .sort((a, b) => Number(a.isAdditional) - Number(b.isAdditional) || a.id.localeCompare(b.id))
    .map((p) => p.description)
    .filter((d) => d !== '')
}

function proceduresByBooking(state: Pick<AppState, 'schedule'>): Map<string, Procedure[]> {
  const out = new Map<string, Procedure[]>()
  for (const p of Object.values(state.schedule.procedures)) {
    const arr = out.get(p.bookingId)
    if (arr === undefined) out.set(p.bookingId, [p])
    else arr.push(p)
  }
  return out
}

const sessionRank = (session: string): number => (session === 'AM' ? 0 : 1)

/**
 * The date lookup's bounds: the anaesthetist's earliest List (the seeded
 * history reaches back to January 2026) to the schedule horizon's end. The
 * lookup never rolls the horizon or reaches past it.
 */
export function lookbackBoundsFor(
  state: Pick<AppState, 'schedule' | 'clock' | 'appSettings'>,
  anaesthetistId: string,
): { firstISO: string; lastISO: string } {
  const horizon = scheduleHorizon(state)
  let firstISO = horizon.startISO
  for (const l of ownLists(state, anaesthetistId)) if (l.dateISO < firstISO) firstISO = l.dateISO
  return { firstISO, lastISO: horizon.endISO }
}

/** One Booking as the day view and search rows show it. */
export interface LookbackBooking {
  bookingId: string
  listId: string
  patientName: string
  /** Undefined when the patient has no NHI yet (the UI shows its NHI-missing label). */
  nhi?: string
  scheduledTime?: string
  /** The Procedures' names, the primary first. */
  procedureNames: string[]
}

export interface LookbackList {
  list: AssignedList
  progress: ListProgress
  startTime: string
  bookings: LookbackBooking[]
}

function lookbackBooking(state: Pick<AppState, 'masters'>, b: Booking, procs: readonly Procedure[]): LookbackBooking {
  const patient = state.masters.patients[b.patientId]
  return {
    bookingId: b.id,
    listId: b.listId,
    patientName: patient?.name ?? 'Unknown patient',
    ...(patient?.nhi !== undefined && patient.nhi !== '' ? { nhi: patient.nhi } : {}),
    ...(b.scheduledTime !== undefined ? { scheduledTime: b.scheduledTime } : {}),
    procedureNames: procedureNames(procs),
  }
}

/**
 * The anaesthetist's Lists on one date, AM before PM, every state included
 * (backdrop, authorised and invoiced too), each with its non-cancelled
 * Bookings. It reads Lists, not Slots: backdrop Lists have no Slot record.
 */
export function listsOnDayFor(state: LookbackState, anaesthetistId: string, dateISO: string, todayISO: string): LookbackList[] {
  const procs = proceduresByBooking(state)
  return ownLists(state, anaesthetistId)
    .filter((l) => l.dateISO === dateISO)
    .sort((a, b) => sessionRank(a.session) - sessionRank(b.session) || a.id.localeCompare(b.id))
    .map((list) => {
      const active = activeBookingsOn(state, list.id).sort(
        (a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id),
      )
      return {
        list,
        progress: listProgress(list, active, todayISO),
        startTime: timesForList(state, list).startTime,
        bookings: active.map((b) => lookbackBooking(state, b, procs.get(b.id) ?? [])),
      }
    })
}

/** The dates in a month (`yyyy-MM`) that hold one of the anaesthetist's Lists: the date sheet's dots. */
export function listDaysFor(
  state: Pick<AppState, 'schedule'>,
  anaesthetistId: string,
  monthISO: string,
): { dateISO: string; lists: number }[] {
  const byDate = new Map<string, number>()
  for (const l of ownLists(state, anaesthetistId)) {
    if (!l.dateISO.startsWith(`${monthISO}-`)) continue
    byDate.set(l.dateISO, (byDate.get(l.dateISO) ?? 0) + 1)
  }
  return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dateISO, lists]) => ({ dateISO, lists }))
}

/** One search result: a Booking with where and when it was. */
export interface BookingSearchRow extends LookbackBooking {
  dateISO: string
  session: string
  hospitalName: string
  progress: ListProgress
}

export interface BookingSearchResult {
  query: BookingQuery
  /** Today and later, soonest first. */
  upcoming: BookingSearchRow[]
  /** Before today, most recent first. */
  past: BookingSearchRow[]
  /** Every match, before the cap. */
  total: number
}

/** At most this many rows come back; `total` says how many matched. */
export const BOOKING_SEARCH_CAP = 50

/**
 * Search the anaesthetist's own non-cancelled Bookings by patient name or NHI
 * (`parseBookingQuery`, `patientMatches`), authorised and invoiced work
 * included. A Booking whose List is a colleague's (moved to them) or a Draft
 * List is never returned. Upcoming rows (today and later) come first, soonest
 * first, then past rows, most recent first; at most `BOOKING_SEARCH_CAP` rows in
 * all, with `total` the full count.
 */
export function searchBookingsFor(
  state: Pick<AppState, 'schedule' | 'masters'>,
  anaesthetistId: string,
  rawQuery: string,
  todayISO: string,
): BookingSearchResult {
  const query = parseBookingQuery(rawQuery)
  if (query.kind !== 'nhi' && query.kind !== 'name') return { query, upcoming: [], past: [], total: 0 }
  const procs = proceduresByBooking(state)
  const progressByList = new Map<string, ListProgress>()
  const rows: BookingSearchRow[] = []
  for (const b of Object.values(state.schedule.bookings)) {
    if (b.cancellation !== undefined) continue
    const list = state.schedule.lists[b.listId]
    if (list === undefined || !isAssignedList(list) || list.anaesthetistId !== anaesthetistId || list.removedAtISO !== undefined) continue
    const patient = state.masters.patients[b.patientId]
    if (patient === undefined || !patientMatches(query, patient)) continue
    let progress = progressByList.get(list.id)
    if (progress === undefined) {
      progress = listProgress(list, activeBookingsOn(state, list.id), todayISO)
      progressByList.set(list.id, progress)
    }
    rows.push({
      ...lookbackBooking(state, b, procs.get(b.id) ?? []),
      dateISO: list.dateISO,
      session: list.session,
      hospitalName: state.masters.hospitals[list.hospitalId]?.name ?? list.hospitalId,
      progress,
    })
  }
  const when = (r: BookingSearchRow) => `${r.dateISO}|${sessionRank(r.session)}|${r.scheduledTime ?? '99:99'}|${r.bookingId}`
  const upcoming = rows.filter((r) => r.dateISO >= todayISO).sort((a, b) => when(a).localeCompare(when(b)))
  const past = rows.filter((r) => r.dateISO < todayISO).sort((a, b) => when(b).localeCompare(when(a)))
  const capped = [...upcoming, ...past].slice(0, BOOKING_SEARCH_CAP)
  const kept = new Set(capped.map((r) => r.bookingId))
  return {
    query,
    upcoming: upcoming.filter((r) => kept.has(r.bookingId)),
    past: past.filter((r) => kept.has(r.bookingId)),
    total: rows.length,
  }
}

/** One invoice on a List's detail (read only). */
export interface ListInvoiceRow {
  invoiceId: string
  /** The Booking the invoice was raised for. */
  bookingId: string
  invoiceNumber: string
  party: string
  issuedISO?: string
  total: number
  paid: 'paid' | 'partPaid' | 'outstanding'
}

/**
 * The invoices raised for a List (number, party, issue date, total, paid
 * state), backdrop invoices included for a backdrop List: the anaesthetist's
 * "what was invoiced". The office surfaces keep excluding backdrop invoices.
 */
export function invoicesForListView(state: Pick<AppState, 'schedule' | 'billing' | 'masters'>, listId: string): ListInvoiceRow[] {
  const bookingIds = new Set(Object.values(state.schedule.bookings).filter((b) => b.listId === listId).map((b) => b.id))
  const caseByInvoice = new Map<string, AppState['billing']['cases'][string]>()
  for (const c of Object.values(state.billing.cases)) if (c.invoiceId !== undefined) caseByInvoice.set(c.invoiceId, c)
  return Object.values(state.billing.invoices)
    .filter((i) => bookingIds.has(i.bookingId))
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
    .map((i) => {
      const c = caseByInvoice.get(i.id)
      const paid: ListInvoiceRow['paid'] =
        c?.paidInAtISO !== undefined ? 'paid' : (c?.receivedAmount ?? 0) > 0 ? 'partPaid' : 'outstanding'
      return {
        invoiceId: i.id,
        bookingId: i.bookingId,
        invoiceNumber: i.invoiceNumber,
        party: counterpartyName(state, i.counterparty),
        ...(i.raisedAtISO !== undefined ? { issuedISO: i.raisedAtISO } : {}),
        total: i.total,
        paid,
      }
    })
}
