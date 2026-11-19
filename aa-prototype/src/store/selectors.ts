import type { CompletionContext } from '../domain/billing/completion'
/**
 * Read helpers over the app state. Plain functions (guards, tests and the
 * inspector share them) plus a few primitive-returning hooks. Components that
 * need derived arrays select the stable record objects and derive with
 * useMemo — deriving inside a zustand selector would return fresh references
 * every snapshot.
 */

import { byIdOrder, occupiedSlotIdsOf, pairByAccRecIndex, bookingsByList, invoicesByBooking, openExceptionByBooking, pairsByPatient, proceduresByBooking, transfersByBooking } from './indexes'
import { closuresAt, closuresIndex, closureSourcesOf } from '../domain/holidays'
import { rvgCodeToFill } from '../domain/billing/rvgDetail'
import { procedureStackView, type ProcedureStackView, type StackSurface } from '../domain/billing/procedureStack'
import { isOpenPriceFallback } from '../domain/billing/fallbacks'
import {
  contractRailFor,
  railAnswersFor,
  railAnswersText,
  type ContractRailView,
  type RailActor,
  type RailContext,
  type RailMasters,
} from '../domain/billing/contractRail'
import { billablePartyForProcedure, otherPayerHeld, partyForCounterparty, payerCounterparty, payerDetails, type PayerDetails } from '../domain/billing/whoIsBilled'
import { refKey } from '../domain/billing/procedurePayer'
import type {
  AssignedList,
  DraftList,
  AaFeeInvoice,
  BookingLedgerPair,
  PayableLeg,
  Booking,
  RecurringBooking,
  ConflictClear,
  HospitalHoliday,
  PublicHoliday,
  ListConflict,
  CounterpartyRef,
  DayNote,
  IntegrationCorrelationRef,
  IntegrationFeed,
  IntegrationMessage,
  IntegrationMessageStatus,
  Invoice,
  InvoiceId,
  InvoiceLine,
  List,
  Patient,
  Procedure,
  ProcedureId,
  RailAnswers,
  ScheduleSettings,
  Session,
  Slot,
  Anaesthetist,
  DisplayKey,
  SlotStatusKey,
} from '../domain/types'
import { bookingFeesFor, type BookingBillingContext } from '../domain/billing/validateBookingForBilling'
import { feeIn } from '../domain/billing/bookingFee'
import type { HeldPrices } from '../domain/billing/procedurePrice'
import { authorisedPricesFromLock, lockViewFor } from '../domain/billing/lock'
import { deliveryCountsText } from '../domain/billing/invoicePresentation'
import { listHospitalFor } from '../domain/listPairing'
import { ANAESTHETISTS } from '../domain/seed'
import { displayStatusKey, effectiveSlotTimes, slotIdFor, type EffectiveSlotTimes } from '../domain/slots'
import { isOpenSlot, type SlotStatusRecords } from '../domain/slotStatus'
import { compareBySurname } from '../domain/surgeons'
import { activeOnly, isRetired } from '../domain/masterLifecycle'
import type { ListMoveInput } from '../domain/listMoves'
import type { BookingMoveInput } from '../domain/bookingMoves'
import { conflictFromCause, describeConflict, isBackdropList, type ConflictLookups, type ConflictReason } from '../domain/conflicts'
import { projectAllRecurringBookings, projectRecurringBookingChange, type ProjectionInputs, type ProjectionPlan } from '../domain/recurringBookingProjection'
import { conflictLookups } from './conflictReconcile'
import { answeringLists, compareDraftLists, draftListAvailability, isAssignedList, isDraftList, type DraftListAvailability } from '../domain/draftLists'
import { isSeriesActive, seriesLine as describeSeriesLine } from '../domain/availabilitySeries'
import { horizonFor, type Horizon } from '../domain/clock'
import { FEED_META } from '../domain/integrations'
import { roundToCents, toCents } from '../domain/billing/money'
import { maskBankAccount } from '../domain/bankAccount'
import { procedureAccFunded } from '../domain/billing/fundingTags'
import { BCTI_COUNT_RULE, bctiFeeHistory, bctisFor, type BctiFeeHistory, type BctiRecord } from '../domain/billing/bcti'
import { isBookingPair, patientPosition, transferOfPair, type PairStatus } from '../domain/billing/ledger'
import { bctiRecords, handoffQueuedFor, incomeReceiptsFor, journalQueuedFor, openDivergenceFor, pairsForList, pairStatusOf } from './ledgerSelectors'
import { aaFeeFixedTotal, aaFeeFor } from '../domain/billing/aaFee'
import { useMemo } from 'react'
import { addDays, format, getDaysInMonth, parseISO } from 'date-fns'
import { useAppStore, type AppState } from './appStore'
import { isStillPrepaid, prepaymentForProcedure } from './prepaymentSelectors'
import { clockISO } from './mutate'
import { compareSessions } from '../domain/outOfHours'
import { SESSIONS_IN_ORDER } from '../domain/outOfHours'
import { officeAddressFor } from '../domain/surgeonContacts'
import { pickableChanges, type PickableChange, type UpdateEmailRecipient, type UpdateEmailSubject } from '../domain/updateEmail'
import { titledSurname } from '../domain/names'

// ---------------------------------------------------------------------------
// Plain selectors
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Slots and Lists (catch-up Phase 28)
// ---------------------------------------------------------------------------

/**
 * A session as every screen reads it: the Slot, the List in it (if any), the
 * one displayed status (`displayStatusKey`) and the effective times. Mobile,
 * web, admin and every finder read these same views, so a session looks the
 * same everywhere (US-01.2.3, US-01.4.2).
 */
export interface SlotView {
  slot: Slot
  /** The List in the session: always an assigned List (a Draft List has no Slot, so the anaesthetist apps never meet one). */
  list?: AssignedList
  /** What the session shows: the List's kind, or the Slot's status ID (catch-up Phase 29). */
  displayKey: DisplayKey
  times: EffectiveSlotTimes
  /** Open for a List or cover: no List and a status open for bookings (`isOpenSlot`). */
  open: boolean
}

/**
 * The slice the Slot selectors read: the two schedule records and the schedule
 * settings. Narrow on purpose, so a component passes only what it selected.
 */
export interface SlotState {
  schedule: Pick<AppState['schedule'], 'slots' | 'lists'>
  appSettings: Pick<AppState['appSettings'], 'schedule'>
  /** The availability status master: what counts as open reads it (catch-up Phase 29). */
  masters: Pick<AppState['masters'], 'slotStatuses'>
}

const listIndexCache = new WeakMap<object, Map<string, AssignedList>>()

/**
 * The List in each Slot, memoised on the `schedule.lists` record reference (a
 * 20,000-Slot grid never scans Lists per cell). Assigned Lists only: a Draft
 * List, live or removed, sits in no Slot (catch-up Phase 31).
 */
export function listIndexBySlot(lists: Readonly<Record<string, List>>): Map<string, AssignedList> {
  const cached = listIndexCache.get(lists)
  if (cached !== undefined) return cached
  const index = new Map<string, AssignedList>()
  for (const list of Object.values(lists)) if (list.state !== 'DRAFT') index.set(list.slotId, list)
  listIndexCache.set(lists, index)
  return index
}

interface SlotIndex {
  byDate: Map<string, Slot[]>
  byAnaesthetist: Map<string, Slot[]>
}
const slotIndexCache = new WeakMap<object, SlotIndex>()

function slotIndex(slots: Readonly<Record<string, Slot>>): SlotIndex {
  const cached = slotIndexCache.get(slots)
  if (cached !== undefined) return cached
  const byDate = new Map<string, Slot[]>()
  const byAnaesthetist = new Map<string, Slot[]>()
  for (const slot of Object.values(slots)) {
    const d = byDate.get(slot.dateISO)
    if (d === undefined) byDate.set(slot.dateISO, [slot])
    else d.push(slot)
    const a = byAnaesthetist.get(slot.anaesthetistId)
    if (a === undefined) byAnaesthetist.set(slot.anaesthetistId, [slot])
    else a.push(slot)
  }
  const order = (x: Slot, y: Slot) => x.dateISO.localeCompare(y.dateISO) || compareSessions(x, y)
  for (const list of byAnaesthetist.values()) list.sort(order)
  const index = { byDate, byAnaesthetist }
  slotIndexCache.set(slots, index)
  return index
}

/** The Slot for an anaesthetist, day and session, if one exists (before the start date, past the horizon or while inactive there is none). */
export function slotFor(state: Pick<SlotState, 'schedule'>, anaesthetistId: string, dateISO: string, session: Session): Slot | undefined {
  return state.schedule.slots[slotIdFor(anaesthetistId, dateISO, session)]
}

/** The List in a Slot, if any. */
export function listInSlot(state: Pick<SlotState, 'schedule'>, slotId: string): AssignedList | undefined {
  return listIndexBySlot(state.schedule.lists).get(slotId)
}

/**
 * Colleagues' sessions on a day and session that are closed and hold no List
 * (catch-up Phase 32b; US-01.6.3, D59): the office's pickers show them read
 * only, and the colleague stand-in can free them. Active anaesthetists only,
 * by surname; `excludeAnaesthetistId` leaves out the List's own anaesthetist.
 */
export function closedEmptyColleagueSlots(
  state: { schedule: Pick<AppState['schedule'], 'lists' | 'slots'>; masters: Pick<AppState['masters'], 'anaesthetists' | 'slotStatuses'> },
  dateISO: string,
  session: Session,
  excludeAnaesthetistId?: string,
): Slot[] {
  const held = listIndexBySlot(state.schedule.lists)
  const out: { slot: Slot; name: string }[] = []
  for (const a of Object.values(state.masters.anaesthetists)) {
    if (!a.active || a.registrationNumber === excludeAnaesthetistId) continue
    const slot = state.schedule.slots[slotIdFor(a.registrationNumber, dateISO, session)]
    if (slot === undefined || held.has(slot.id) || isOpenSlot(slot, undefined, state.masters.slotStatuses)) continue
    out.push({ slot, name: a.name })
  }
  return out.sort(compareBySurname).map((x) => x.slot)
}

function viewOf(slot: Slot, lists: Map<string, AssignedList>, settings: ScheduleSettings, statuses: SlotStatusRecords): SlotView {
  const list = lists.get(slot.id)
  return {
    slot,
    ...(list !== undefined ? { list } : {}),
    displayKey: displayStatusKey(slot, list),
    times: effectiveSlotTimes(slot, settings),
    open: isOpenSlot(slot, list, statuses),
  }
}

/** `isOpenSlot` over a view: open for bookings and holding no List. */
export function isOpenSlotView(view: Pick<SlotView, 'open'>): boolean {
  return view.open
}

/** One session's view, or undefined when the Slot does not exist. */
export function slotView(state: SlotState, slotId: string): SlotView | undefined {
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return undefined
  return viewOf(slot, listIndexBySlot(state.schedule.lists), state.appSettings.schedule, state.masters.slotStatuses)
}

/** Every session on a day (any order; callers group by anaesthetist). */
export function slotViewsForDate(state: SlotState, dateISO: string): SlotView[] {
  const lists = listIndexBySlot(state.schedule.lists)
  return (slotIndex(state.schedule.slots).byDate.get(dateISO) ?? []).map((slot) => viewOf(slot, lists, state.appSettings.schedule, state.masters.slotStatuses))
}

/** The open sessions (free, holding no List) on a day and session: what every finder offers. */
export function openSlotViews(state: SlotState, dateISO: string, session: Session): SlotView[] {
  return slotViewsForDate(state, dateISO).filter((v) => v.slot.session === session && isOpenSlotView(v))
}

/** An anaesthetist's sessions from `fromISO` to `toISO` inclusive, in date then session order. */
export function slotViewsForAnaesthetist(
  state: SlotState,
  anaesthetistId: string,
  fromISO: string,
  toISO: string,
): SlotView[] {
  const lists = listIndexBySlot(state.schedule.lists)
  return (slotIndex(state.schedule.slots).byAnaesthetist.get(anaesthetistId) ?? [])
    .filter((slot) => slot.dateISO >= fromISO && slot.dateISO <= toISO)
    .map((slot) => viewOf(slot, lists, state.appSettings.schedule, state.masters.slotStatuses))
}

/**
 * A List's session times: its Slot's effective times, or the settings default
 * for its session when the List has no Slot record (the pre-horizon backdrop).
 */
export function timesForList(state: SlotState, list: Pick<List, 'slotId' | 'session'>): EffectiveSlotTimes {
  const slot = list.slotId === undefined ? undefined : state.schedule.slots[list.slotId]
  return effectiveSlotTimes(slot ?? { session: list.session }, state.appSettings.schedule)
}


const SEEDED_ORDER = new Map(ANAESTHETISTS.map((a, i) => [a.registrationNumber, i]))
const surnameKey = (name: string) => (name.trim().split(/\s+/).at(-1) ?? name).toLowerCase()

/**
 * The anaesthetists with a session on a day (US-01.4.2, US-01.1.3): every
 * anaesthetist in the master with a Slot that day, the seeded cast order first
 * and added ones after by surname. Before their start date, or from today once
 * inactive, an anaesthetist has no Slot and so no row; past days keep theirs.
 */
export function rosterForDate(state: { schedule: Pick<AppState['schedule'], 'slots'>; masters: Pick<AppState['masters'], 'anaesthetists'> }, dateISO: string): Anaesthetist[] {
  const ids = new Set((slotIndex(state.schedule.slots).byDate.get(dateISO) ?? []).map((s) => s.anaesthetistId))
  return [...ids]
    .map((id) => state.masters.anaesthetists[id])
    .filter((a): a is Anaesthetist => a !== undefined)
    .sort((a, b) => {
      const sa = SEEDED_ORDER.get(a.registrationNumber)
      const sb = SEEDED_ORDER.get(b.registrationNumber)
      if (sa !== undefined && sb !== undefined) return sa - sb
      if (sa !== undefined) return -1
      if (sb !== undefined) return 1
      return surnameKey(a.name).localeCompare(surnameKey(b.name)) || a.registrationNumber.localeCompare(b.registrationNumber)
    })
}

/** One session as the availability calendars show it (catch-up Phase 29). */
export interface CalendarSession {
  slotId: string
  session: Session
  statusKey: SlotStatusKey
  displayKey: DisplayKey
  note?: string
  open: boolean
  /** The List in the session (it shows in place of the status). */
  list?: { id: string; kind: List['kind']; hospitalName: string; state: List['state'] }
  /** The series that set the status, with its rule in words. */
  series?: { id: string; line: string }
  /** The List carries an availability flag (the office's Day view shows it). */
  conflict: boolean
}

export interface CalendarDay {
  dateISO: string
  AM?: CalendarSession
  PM?: CalendarSession
  /** The out-of-hours session, on a day the office opened one (catch-up Phase 32c). */
  OOH?: CalendarSession
}

/**
 * An anaesthetist's sessions for every date of a month (`yyyy-MM`), for the
 * mobile and web availability calendars (catch-up Phase 29; US-01.5.3). It
 * reads Slots only (the series only for its description), so the calendar
 * shows exactly what every other view shows.
 */
export function availabilityMonthFor(
  state: SlotState & {
    schedule: Pick<AppState['schedule'], 'availabilitySeries'>
    masters: Pick<AppState['masters'], 'slotStatuses' | 'hospitals'>
  },
  anaesthetistId: string,
  monthISO: string,
): CalendarDay[] {
  const first = parseISO(`${monthISO}-01`)
  const days = getDaysInMonth(first)
  const fromISO = `${monthISO}-01`
  const toISO = `${monthISO}-${String(days).padStart(2, '0')}`
  const byKey = new Map(slotViewsForAnaesthetist(state, anaesthetistId, fromISO, toISO).map((v) => [`${v.slot.dateISO}|${v.slot.session}`, v]))
  const lines = new Map<string, string>()
  const seriesLine = (id: string): string | undefined => {
    const cached = lines.get(id)
    if (cached !== undefined) return cached
    const series = state.schedule.availabilitySeries[id]
    if (series === undefined) return undefined
    const line = describeSeriesLine(series, state.masters.slotStatuses)
    lines.set(id, line)
    return line
  }
  const out: CalendarDay[] = []
  for (let d = 1; d <= days; d++) {
    const dateISO = `${monthISO}-${String(d).padStart(2, '0')}`
    const day: CalendarDay = { dateISO }
    for (const session of SESSIONS_IN_ORDER) {
      const v = byKey.get(`${dateISO}|${session}`)
      if (v === undefined) continue
      const line = v.slot.seriesId !== undefined ? seriesLine(v.slot.seriesId) : undefined
      day[session] = {
        slotId: v.slot.id,
        session,
        statusKey: v.slot.status,
        displayKey: v.displayKey,
        ...(v.slot.note !== undefined ? { note: v.slot.note } : {}),
        open: v.open,
        ...(v.list !== undefined
          ? {
              list: {
                id: v.list.id,
                kind: v.list.kind,
                state: v.list.state,
                hospitalName: state.masters.hospitals[v.list.hospitalId]?.name ?? v.list.hospitalId,
              },
            }
          : {}),
        ...(v.slot.seriesId !== undefined && line !== undefined ? { series: { id: v.slot.seriesId, line } } : {}),
        // A closed hospital (D59: an anaesthetist's unavailability is never a conflict).
        conflict: (v.list?.conflicts.length ?? 0) > 0,
      }
    }
    out.push(day)
  }
  return out
}

/** An anaesthetist's active series, with their rules in words (the calendars' "Your series"). */
export function activeSeriesFor(
  state: { schedule: Pick<AppState['schedule'], 'availabilitySeries'>; masters: Pick<AppState['masters'], 'slotStatuses'> },
  anaesthetistId: string,
  todayISO: string,
): { id: string; line: string }[] {
  return Object.values(state.schedule.availabilitySeries)
    .filter((s) => s.anaesthetistId === anaesthetistId && isSeriesActive(s, todayISO))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((s) => ({ id: s.id, line: describeSeriesLine(s, state.masters.slotStatuses) }))
}

/** The live schedule horizon: the clock's today and the horizon setting (FT-01.1). */
export function scheduleHorizon(state: Pick<AppState, 'clock' | 'appSettings'>): Horizon {
  return horizonFor(state.clock.todayISO, state.appSettings.schedule.horizonMonths)
}

/** The assigned Lists on a day (Draft Lists have their own selectors). */
export function listsForDate(state: AppState, dateISO: string): AssignedList[] {
  return Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => l.dateISO === dateISO && isAssignedList(l))
    .sort((a, b) =>
      a.anaesthetistId === b.anaesthetistId
        ? compareSessions(a, b)
        : a.anaesthetistId.localeCompare(b.anaesthetistId),
    )
}

export function bookingsForList(state: Pick<AppState, 'schedule'>, listId: string): Booking[] {
  // Indexed on the Bookings map (catch-up Phase 43): linear at full scale.
  return [...(bookingsByList(state.schedule.bookings).get(listId) ?? [])]
}

/** Procedures in Booking order (creation order). The primary is the `isPrimary` one; lists show `inDisplayOrder` (catch-up Phase 23). */
export function proceduresForBooking(state: { schedule: Pick<AppState['schedule'], 'procedures'> }, bookingId: string): Procedure[] {
  return [...(proceduresByBooking(state.schedule.procedures).get(bookingId) ?? [])]
}

export function auditForEntity(state: AppState, entityId: string) {
  return state.audit.filter((a) => a.entityId === entityId)
}

/** Per-day internal office notes for a date, in insertion order (Phase 06). */
export function dayNotesFor(state: AppState, dateISO: string): DayNote[] {
  return state.dayNotes[dateISO] ?? []
}

/**
 * Every SUBMITTED List awaiting authorisation — the review queue (Phase 07).
 * The admin review-queue badge count derives from this rather than a hardcoded
 * figure, so a live submit grows it. Ordered by date then anaesthetist.
 */
export function submittedLists(state: Pick<AppState, 'schedule'>): AssignedList[] {
  return Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => l.state === 'SUBMITTED')
    .sort((a, b) =>
      a.dateISO === b.dateISO
        ? a.anaesthetistId.localeCompare(b.anaesthetistId)
        : a.dateISO.localeCompare(b.dateISO),
    )
}

export function submittedListCount(state: AppState): number {
  return submittedLists(state).length
}

/**
 * True once the List's billing run has stamped it (Phase 08 drives the stamp).
 * The office reads it (the office stand-in, the Billing monitor, Review's
 * recently billed). It no longer decides the anaesthetist's main view: a List
 * leaves that at AUTHORISED (`hasLeftMainView`, catch-up Phase 38a, D9), and no
 * anaesthetist screen reads this stamp.
 */
export function isListBilled(list: List): boolean {
  return list.billedAtISO !== undefined
}

/**
 * Seeded historical backdrop Lists: the rule lives in the domain (catch-up Phase
 * 30), re-exported here. Since catch-up Phase 38a they are also the
 * anaesthetist's browsable history (search and the date lookup reach them);
 * they stay out of the office surfaces and the main view.
 */
export { isBackdropList }
export function isBackdropInvoice(invoice: Pick<Invoice, 'id'>): boolean {
  // HINV: Dr Souter's seeded history. RBINV: the "Seed a month of BCTIs" demo action (catch-up Phase 16).
  return invoice.id.startsWith('HINV') || invoice.id.startsWith('RBINV')
}

/** Every LIVE billed List, most recently billed first (Phase 08; excludes seed backdrop). */
export function billedLists(state: Pick<AppState, 'schedule'>): List[] {
  return Object.values(state.schedule.lists)
    .filter((l) => l.billedAtISO !== undefined && !isBackdropList(l))
    .sort((a, b) => (b.billedAtISO ?? '').localeCompare(a.billedAtISO ?? ''))
}

/** A List's invoices (via its Bookings), in raise order (Phase 08). */
export function invoicesForList(state: Pick<AppState, 'schedule' | 'billing'>, listId: string): Invoice[] {
  const byBooking = invoicesByBooking(state.billing.invoices)
  return bookingsForList(state, listId)
    .flatMap((b) => byBooking.get(b.id) ?? [])
    .sort(byIdOrder)
}

/** An invoice's lines, in emit order (Phase 08). */
export function invoiceLinesFor(state: Pick<AppState, 'billing'>, invoiceId: string): InvoiceLine[] {
  return Object.values(state.billing.invoiceLines)
    .filter((l) => l.invoiceId === invoiceId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Invoice count per List id — the "recently billed" panels' shared derivation
 * (Phase 08). Counts only STANDARD (billing-run) invoices; a pre-payment
 * invoice is raised separately and is not part of the run's output (Phase 09).
 */
export function invoiceCountsByList(state: Pick<AppState, 'schedule' | 'billing'>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const invoice of Object.values(state.billing.invoices)) {
    if (invoice.kind !== 'standard') continue
    const listId = state.schedule.bookings[invoice.bookingId]?.listId
    if (listId !== undefined) counts[listId] = (counts[listId] ?? 0) + 1
  }
  return counts
}

export interface PaymentCandidate {
  accRecId: string
  invoiceId: string
  invoiceNumber: string
  patientName: string
  counterpartyLabel: string
  amountDue: number
  amountReceived: number
  remaining: number
}

/**
 * ACCRECs still awaiting (full or partial) payment — the demo "Payment received"
 * picker (Phase 10). Legitimately reads `state.xero` because it drives the Xero
 * simulation control, not an anaesthetist money view (convention 9 exempts the
 * demo surfaces).
 */
export function openAccRecs(state: Pick<AppState, 'xero' | 'billing' | 'masters' | 'schedule'>): PaymentCandidate[] {
  // A payment Xero holds that the engine has not recorded yet (an outage's landed payment, catch-up Phase 37) already lowers what Xero shows owing.
  const recordedKeys = new Set(Object.values(state.billing.receipts).map((r) => r.idempotencyKey))
  const pendingCents = new Map<string, number>()
  for (const p of Object.values(state.xero.payments)) {
    if (!recordedKeys.has(p.idempotencyKey)) pendingCents.set(p.accRecId, (pendingCents.get(p.accRecId) ?? 0) + toCents(p.amount))
  }
  const owing = (r: { id: string; amountDue: number; amountReceived: number }) => toCents(r.amountDue) - toCents(r.amountReceived) - (pendingCents.get(r.id) ?? 0)
  return Object.values(state.xero.accRecs)
    // Procedure receivables only: an AA fee invoice is paid by "Record fee
    // payment", never a procedure payment webhook (catch-up Phase 16).
    .filter((r) => r.kind === 'procedure')
    // A void made in Xero takes no payment (catch-up Phase 37).
    .filter((r) => r.status !== 'voided')
    // Only ACCRECs a ledger pair links (catch-up Phase 36): a payment always lands on its pair.
    .filter((r) => pairByAccRecIndex(state.billing.ledger).has(r.id))
    .filter((r) => owing(r) > 0)
    // Exclude the seeded historical backdrop (its aged receivables are the
    // anaesthetist money-view story; the missed webhook is caught by the poll).
    .filter((r) => {
      const invoice = state.billing.invoices[r.invoiceId]
      return invoice === undefined || !isBackdropInvoice(invoice)
    })
    .map((r) => {
      const invoice = state.billing.invoices[r.invoiceId]
      return {
        accRecId: r.id,
        invoiceId: r.invoiceId,
        invoiceNumber: invoice?.invoiceNumber ?? r.invoiceId,
        patientName:
          invoice !== undefined
            ? patientNameFor(state, state.schedule.bookings[invoice.bookingId]?.patientId ?? '')
            : 'Patient unavailable',
        counterpartyLabel: invoice !== undefined ? invoiceAddresseeName(state, invoice) : r.contactId,
        amountDue: r.amountDue,
        amountReceived: r.amountReceived,
        remaining: roundToCents(owing(r) / 100),
      }
    })
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
}

/**
 * WI2a intake check: does this patient have an unpaid PRIOR episode (a
 * different Booking with money still owed on any invoice, whoever pays)? Reads
 * the ledger's patient position (catch-up Phase 36, DM-23) and the schedule
 * only. Excludes cancelled bookings.
 */
export function patientHasOutstandingPriorEpisode(
  state: Pick<AppState, 'billing' | 'schedule'>,
  patientId: string,
  excludeBookingId: string,
): boolean {
  for (const row of patientPosition(pairsByPatient(state.billing.ledger).get(patientId) ?? [], patientId).rows) {
    if (row.bookingId === excludeBookingId || toCents(row.outstanding) <= 0) continue
    const booking = state.schedule.bookings[row.bookingId]
    if (booking === undefined || booking.cancellation !== undefined) continue
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Pre-payment: the issued invoices (catch-up Phase 27). The payer groups,
// statuses and lists are in `prepaymentSelectors.ts`; these low-level reads
// sit here because the price ladder and the billing context read them.
// ---------------------------------------------------------------------------

/** The `prePayment`-kind invoices raised for a Booking, in id order. */
export function prePaymentInvoicesForBooking(state: { billing: Pick<AppState['billing'], 'invoices'> }, bookingId: string): Invoice[] {
  return (invoicesByBooking(state.billing.invoices).get(bookingId) ?? []).filter((i) => i.kind === 'prePayment')
}

/**
 * The Procedures of a Booking covered by a raised prepayment invoice (catch-up
 * Phase 27): each one's amount ex GST and the invoice holding it. The price
 * ladder holds them at that amount (D47, A16) and the run leaves them off the
 * final invoice (D57), whatever Contract the Procedure is on now: no path
 * changes a raised prepayment, so a payer is never billed twice for one
 * Procedure. A Contract changed after sending reads "no longer needed" or
 * "sent before a change" with an office warning; the office settles it by hand
 * until Phase 41's cancellation (US-06.3.7, D67).
 */
export function prepaidHeldFor(
  state: { billing: Pick<AppState['billing'], 'invoices' | 'invoiceLines'>; schedule: Pick<AppState['schedule'], 'procedures'> },
  bookingId: string,
): Record<ProcedureId, { amount: number; prepaymentInvoiceId: InvoiceId }> {
  const out: Record<ProcedureId, { amount: number; prepaymentInvoiceId: InvoiceId }> = {}
  const ids = new Set(prePaymentInvoicesForBooking(state, bookingId).map((i) => i.id))
  if (ids.size === 0) return out
  for (const line of Object.values(state.billing.invoiceLines)) {
    if (!ids.has(line.invoiceId) || line.procedureId === undefined) continue
    const procedure = state.schedule.procedures[line.procedureId]
    if (procedure === undefined) continue
    const existing = out[line.procedureId]
    out[line.procedureId] = { amount: roundToCents((existing?.amount ?? 0) + line.amount), prepaymentInvoiceId: existing?.prepaymentInvoiceId ?? line.invoiceId }
  }
  return out
}

/**
 * The price ladder's held amounts per Procedure (catch-up Phase 24): the
 * AUTHORISED rung reads the Booking's pricing snapshot (catch-up Phase 25,
 * `billing.locks`), the prepaid rung a raised prepayment's line (catch-up
 * Phase 27, `prepaidHeldFor`). A caller without `locks` sees no AUTHORISED rung.
 */
export function heldPricesForBooking(
  state: { billing: Pick<AppState['billing'], 'invoices' | 'invoiceLines'> & Partial<Pick<AppState['billing'], 'locks'>>; schedule: Pick<AppState['schedule'], 'lists' | 'bookings' | 'procedures'> },
  bookingId: string,
): Record<ProcedureId, HeldPrices> {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return {}
  const out: Record<ProcedureId, HeldPrices> = { ...authorisedPricesFromLock(state.billing.locks?.[bookingId]) }
  for (const [procedureId, held] of Object.entries(prepaidHeldFor(state, bookingId))) {
    out[procedureId] = { ...(out[procedureId] ?? {}), prepaid: held.amount }
  }
  return out
}

/** Whether this Procedure's prepaid price is on a raised prepayment invoice: the office's price is then read-only (A16, D30). */
export function prepaymentRaisedFor(
  state: { billing: Pick<AppState['billing'], 'invoices' | 'invoiceLines'>; schedule: Pick<AppState['schedule'], 'procedures'> },
  procedureId: string,
): boolean {
  const procedure = state.schedule.procedures[procedureId]
  return procedure !== undefined && prepaidHeldFor(state, procedure.bookingId)[procedureId] !== undefined
}

// ---------------------------------------------------------------------------
// Billing monitor pipeline (Phase 09; A5) — per authorised/billed List
// ---------------------------------------------------------------------------

export type MonitorStageState = 'done' | 'pending' | 'partial' | 'failed'
export interface MonitorStage {
  key: 'authorised' | 'run' | 'invoices' | 'emailed' | 'xero'
  label: string
  state: MonitorStageState
  detail: string
}
/** What the run left off a Booking's final invoice for its prepayment (catch-up Phase 27; US-08.2.2). */
export interface PrepaidLeftOff {
  /** The prepayment invoices that settled the Procedures left off, by number. */
  invoiceNumbers: string[]
  /** Every Procedure was left off: no final invoice. */
  all: boolean
}

/**
 * The prepaid Procedures the run left off this Booking's final invoice, from
 * the lock's `settledByPrepayment` (catch-up Phase 27; D57): nothing
 * deducted, never an exception. Undefined when none was left off.
 */
export function prepaidLeftOffFor(state: Pick<AppState, 'billing' | 'schedule'>, bookingId: string): PrepaidLeftOff | undefined {
  const lock = state.billing.locks[bookingId]
  const settled = lock?.settledByPrepayment ?? {}
  const ids = Object.keys(settled)
  if (ids.length === 0) return undefined
  const numbers = [...new Set(ids.map((id) => state.billing.invoices[settled[id]!.prepaymentInvoiceId]?.invoiceNumber ?? settled[id]!.prepaymentInvoiceId))].sort()
  const live = proceduresByBooking(state.schedule.procedures).get(bookingId) ?? []
  return { invoiceNumbers: numbers, all: live.length > 0 && live.every((p) => settled[p.id] !== undefined) }
}

/** "Prepaid, left off the final invoice (AA-2026-0001)" or "Prepaid in full, no final invoice (AA-2026-0001)". */
export function prepaidLeftOffText(leftOff: PrepaidLeftOff): string {
  const numbers = leftOff.invoiceNumbers.join(', ')
  return leftOff.all ? `Prepaid in full, no final invoice (${numbers})` : `Prepaid, left off the final invoice (${numbers})`
}

/** The pipeline status a Booking reads on the monitor (Phase 09's labels, derived from its pairs since catch-up Phase 36). */
export type MonitorStatus = 'pending' | 'invoiced' | 'handedOff' | 'partPaid' | 'paid' | 'disbursed' | 'failed'

/** A pair's label on the monitor: one waiting for Xero reads invoiced (its own line says why); part paid out reads by what was received. */
function monitorStatusOf(label: PairStatus, fullyReceived: boolean): MonitorStatus {
  if (label === 'waitingForXero') return 'invoiced'
  if (label === 'partPaidOut') return fullyReceived ? 'paid' : 'partPaid'
  return label
}

/** A Booking's Xero call waiting in the sync queue (catch-up Phase 37): its hand-off, or its transfer's journal. */
export interface MonitorXeroWait {
  itemId: string
  kind: 'handoff' | 'journal'
  attempts: number
  nextAttemptAtISO: string
  lastError?: string
  alerted: boolean
}

/** A void or amendment made in Xero, flagged by the poll on this Booking's pair (catch-up Phase 37). */
export interface MonitorXeroFlag {
  divergenceId: string
  kind: 'voidedInXero' | 'amendedInXero'
  detectedAtISO: string
  xeroTotal: number
}

export interface MonitorBookingRow {
  bookingId: string
  patientName: string
  status: MonitorStatus | 'cancelled'
  /** The Booking's first run pair (or the one waiting for Xero). */
  pairId?: string
  /** The open billing exception (OQ-05), when the Booking failed. */
  exceptionId?: string
  invoiceIds: string[]
  failure?: { code: string; message: string; procedureId?: ProcedureId }
  /** Its hand-off or transfer journal waiting in the Xero sync queue (catch-up Phase 37): the queue retries it. */
  waitingForXero?: MonitorXeroWait
  /** A void or amendment made in Xero on its pair, flagged by the poll (catch-up Phase 37). */
  xeroFlag?: MonitorXeroFlag
  /** WI2a: this booking's patient has an unpaid prior episode (repeat patient). */
  outstandingPriorBalance?: boolean
  /** The ledger's money for the two-state display (paid in / paid out). */
  receivedAmount: number
  /** Released to the anaesthetist (Phase 10's "authorised" on the ACCPAY). */
  authorisedAmount: number
  disbursedAmount: number
  paidInAtISO?: string
  disbursedAtISO?: string
  /** Prepaid Procedures left off the final invoice at the run (catch-up Phase 27; US-08.2.2, D57). */
  prepaidLeftOff?: PrepaidLeftOff
}
export interface MonitorListRow {
  listId: string
  list: AssignedList
  anaesthetistName: string
  hospitalName?: string
  invoiceCount: number
  /** Invoices sent or marked to post (catch-up Phase 22). */
  deliveredCount: number
  /** Invoices raised with no invoice address. */
  noAddressCount: number
  /** The first such invoice, for the monitor's link. */
  firstNoAddressInvoiceId?: string
  failedCount: number
  /** Bookings whose hand-off or journal waits in the Xero sync queue (catch-up Phase 37). */
  waitingForXeroCount: number
  /** Of those, the ones whose queue item has alerted. */
  xeroAlertCount: number
  /** Pairs with an open void or amendment flag (catch-up Phase 37). */
  xeroFlaggedCount: number
  stages: MonitorStage[]
  bookingRows: MonitorBookingRow[]
}

/**
 * Derive the billing-flow monitor: one row per AUTHORISED List (billed first),
 * each with its pipeline stage statuses and per-Booking rows. Reuses the Phase 08
 * selectors so the monitor and the Invoices screen never diverge. The Xero
 * stage reads the ledger's mirror ids, the Xero sync queue and the poll's
 * divergence flags (catch-up Phase 37). Pure over AppState (tested + inspector-shareable).
 */
export function billingMonitor(state: Pick<AppState, 'schedule' | 'billing' | 'masters'>): MonitorListRow[] {
  // Billed lists first (most recently billed first), then any authorised-unbilled
  // list, then by id — a plain comparator (the previous nested ternary read backwards).
  // The seeded historical settled Lists (Phase 10 backdrop for the anaesthetist
  // money views) are NOT live pipeline items — excluded here.
  const lists = Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => l.state === 'AUTHORISED' && !isBackdropList(l))
    .sort((a, b) => {
      const aBilled = a.billedAtISO !== undefined
      const bBilled = b.billedAtISO !== undefined
      if (aBilled && bBilled) return b.billedAtISO!.localeCompare(a.billedAtISO!)
      if (aBilled !== bBilled) return aBilled ? -1 : 1
      return a.id.localeCompare(b.id)
    })

  const exceptionByBooking = openExceptionByBooking(state.billing.exceptions)
  const transfersOf = transfersByBooking(state.billing.transfers)

  return lists.map((list) => {
    const bookings = bookingsForList(state, list.id)
    // The monitor tracks the billing RUN, so it counts only standard (run)
    // invoices and pairs, never the prepayment's (raised separately: else a
    // booking with a paid prepayment would read 'paid' and mask its unpaid run
    // invoice, and its list would overcount).
    const stdInvoices = invoicesForList(state, list.id).filter((i) => i.kind === 'standard')
    // An additional invoice's pair is a procedure pair too, but not the run's (catch-up Phase 38b): the row says "+1 additional invoice".
    const runPairs = pairsForList(state, list.id).filter((p) => p.kind === 'procedure' && state.billing.invoices[p.invoiceId]?.kind !== 'additional')
    const pairsByBooking = new Map<string, BookingLedgerPair[]>()
    for (const p of runPairs) pairsByBooking.set(p.bookingId, [...(pairsByBooking.get(p.bookingId) ?? []), p])

    const bookingRows: MonitorBookingRow[] = bookings.map((booking) => {
      if (booking.cancellation !== undefined) {
        return {
          bookingId: booking.id,
          patientName: patientNameFor(state, booking.patientId),
          status: 'cancelled',
          invoiceIds: [],
          receivedAmount: 0,
          authorisedAmount: 0,
          disbursedAmount: 0,
        }
      }
      const pairs = pairsByBooking.get(booking.id) ?? []
      const exception = exceptionByBooking.get(booking.id)
      // A hand-off waiting in the Xero sync queue (catch-up Phase 37), then the first pair.
      const queuedPair = pairs.find((p) => p.receivable.xeroAccRecId === undefined && handoffQueuedFor(state, p.id) !== undefined)
      const primary = queuedPair ?? pairs[0]
      const fullyReceived = (p: BookingLedgerPair) => toCents(p.receivable.receivedAmount) >= toCents(p.receivable.amount)
      const row: MonitorBookingRow = {
        bookingId: booking.id,
        patientName: patientNameFor(state, booking.patientId),
        status: exception !== undefined ? 'failed' : primary !== undefined ? monitorStatusOf(pairStatusOf(state, primary), fullyReceived(primary)) : 'pending',
        invoiceIds: pairs.map((p) => p.invoiceId),
        receivedAmount: pairs.reduce((n, p) => n + p.receivable.receivedAmount, 0),
        authorisedAmount: pairs.reduce((n, p) => n + (p.payable?.releasedAmount ?? 0), 0),
        disbursedAmount: pairs.reduce((n, p) => n + (p.payable?.disbursedAmount ?? 0), 0),
      }
      if (primary !== undefined) row.pairId = primary.id
      if (exception !== undefined) {
        row.exceptionId = exception.id
        row.failure = { code: exception.code, message: exception.message, ...(exception.procedureId !== undefined ? { procedureId: exception.procedureId } : {}) }
      }
      const queued = queuedPair !== undefined ? handoffQueuedFor(state, queuedPair.id) : undefined
      const journal = queued === undefined ? (transfersOf.get(booking.id) ?? []).map((t) => journalQueuedFor(state, t.id)).find((q) => q !== undefined) : undefined
      const wait = queued ?? journal
      if (wait !== undefined) {
        row.waitingForXero = { itemId: wait.id, kind: wait.kind === 'journal' ? 'journal' : 'handoff', attempts: wait.attempts, nextAttemptAtISO: wait.nextAttemptAtISO, ...(wait.lastError !== undefined ? { lastError: wait.lastError } : {}), alerted: wait.status === 'alerted' }
      }
      const flag = pairs.map((p) => openDivergenceFor(state, p.id)).find((d) => d !== undefined)
      if (flag !== undefined) row.xeroFlag = { divergenceId: flag.id, kind: flag.kind, detectedAtISO: flag.detectedAtISO, xeroTotal: flag.xeroShows.total }
      const paidInAtISO = pairs.find((p) => p.receivable.paidInAtISO !== undefined)?.receivable.paidInAtISO
      if (paidInAtISO !== undefined) row.paidInAtISO = paidInAtISO
      const disbursedAtISO = pairs.find((p) => p.payable?.paidOutAtISO !== undefined)?.payable?.paidOutAtISO
      if (disbursedAtISO !== undefined) row.disbursedAtISO = disbursedAtISO
      if (patientHasOutstandingPriorEpisode(state, booking.patientId, booking.id)) row.outstandingPriorBalance = true
      const leftOff = prepaidLeftOffFor(state, booking.id)
      if (leftOff !== undefined) row.prepaidLeftOff = leftOff
      return row
    })

    // The run's pairs across the list, for the Xero-stage aggregate.
    const handedOff = runPairs.filter((p) => p.receivable.xeroAccRecId !== undefined).length
    // Hand-offs and transfer journals waiting in the Xero sync queue, and the poll's flags (catch-up Phase 37).
    const waiting = bookingRows.flatMap((r) => (r.waitingForXero !== undefined ? [r.waitingForXero] : []))
    const waitingForXeroCount = waiting.length
    const xeroAlertCount = waiting.filter((w) => w.alerted).length
    const nextTry = waiting.map((w) => w.nextAttemptAtISO).sort()[0]
    const flags = bookingRows.flatMap((r) => (r.xeroFlag !== undefined ? [r.xeroFlag] : []))
    const xeroFlaggedCount = flags.length
    const handoffEligible = runPairs.length

    const failedCount = bookingRows.filter((r) => r.status === 'failed').length
    const emailedCount = stdInvoices.filter((i) => i.delivery?.status === 'sent').length
    const toPostCount = stdInvoices.filter((i) => i.delivery?.status === 'toPost').length
    const noAddressInvoices = stdInvoices.filter((i) => i.delivery?.status === 'noAddress')
    const deliveredCount = emailedCount + toPostCount
    const billed = list.billedAtISO !== undefined

    const stages: MonitorStage[] = [
      { key: 'authorised', label: 'List authorised', state: 'done', detail: 'Ready for the billing run.' },
      {
        key: 'run',
        label: 'Billing run',
        state: billed ? (failedCount > 0 ? 'partial' : 'done') : 'pending',
        detail: billed
          ? failedCount > 0
            ? `${failedCount} booking${failedCount === 1 ? '' : 's'} need attention; the rest billed.`
            : 'Completed.'
          : 'Not run yet.',
      },
      {
        key: 'invoices',
        label: 'Invoices generated',
        state: !billed ? 'pending' : failedCount > 0 ? 'partial' : 'done',
        detail: `${stdInvoices.length} invoice${stdInvoices.length === 1 ? '' : 's'}.`,
      },
      {
        key: 'emailed',
        label: 'Sent or to post',
        state:
          stdInvoices.length === 0
            ? 'pending'
            : noAddressInvoices.length > 0
              ? 'partial'
              : deliveredCount === stdInvoices.length
                ? 'done'
                : deliveredCount === 0
                  ? 'pending'
                  : 'partial',
        detail: deliveryCountsText(emailedCount, toPostCount, noAddressInvoices.length),
      },
      {
        key: 'xero',
        label: 'Xero handoff',
        state: !billed
          ? 'pending'
          : xeroAlertCount > 0 || xeroFlaggedCount > 0
            ? 'failed'
            : waitingForXeroCount > 0
              ? 'partial'
              : handoffEligible > 0 && handedOff >= handoffEligible
                ? 'done'
                : handedOff > 0
                  ? 'partial'
                  : 'pending',
        detail: !billed
          ? 'Runs after the billing run.'
          : xeroFlaggedCount > 0
            ? `${xeroFlaggedCount} invoice${xeroFlaggedCount === 1 ? '' : 's'} changed directly in Xero, flagged for the office.`
            : waitingForXeroCount > 0
              ? `${waitingForXeroCount} waiting for Xero · next try ${nextTry !== undefined ? nextTry.slice(11, 16) : ''}${xeroAlertCount > 0 ? ' · alert raised' : ''}.`
              : handedOff > 0
                ? `${handedOff} ACCREC/ACCPAY pair${handedOff === 1 ? '' : 's'} created.`
                : 'No pair created yet.',
      },
    ]

    const monitorRow: MonitorListRow = {
      listId: list.id,
      list,
      anaesthetistName: state.masters.anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId,
      invoiceCount: stdInvoices.length,
      deliveredCount,
      noAddressCount: noAddressInvoices.length,
      ...(noAddressInvoices[0] !== undefined ? { firstNoAddressInvoiceId: noAddressInvoices[0].id } : {}),
      failedCount,
      waitingForXeroCount,
      xeroAlertCount,
      xeroFlaggedCount,
      stages,
      bookingRows,
    }
    const hospitalName = state.masters.hospitals[list.hospitalId]?.name
    if (hospitalName !== undefined) monitorRow.hospitalName = hospitalName
    return monitorRow
  })
}

export function patientNameFor(state: Pick<AppState, 'masters'>, patientId: string): string {
  return state.masters.patients[patientId]?.name ?? patientId
}

// ---------------------------------------------------------------------------
// Anaesthetist money views (Phase 10; WI6, M11, W1/W4), read from the LEDGER
// (catch-up Phase 36; US-08.3.2), the system of record: `billing` + `masters`
// ONLY, NEVER `state.xero` (the source scan in `apps/moneyViewPurity.test.ts`
// enforces it). Each row is a pair's receivable and payable, attributed by the
// payee stamped on the pair, never a List join. Outstanding is a FLAT list of
// unpaid payables, one row per invoice, oldest first, with no ageing, rollup or
// grouping (catch-up Phase 38; US-12.2.1, D8). An invoice shows as soon as it
// is raised, mirrored in Xero or not (catch-up Phases 36 and 38a: no next-day
// rule), so Owed to you always equals the Outstanding total.
// ---------------------------------------------------------------------------

export type { LedgerState } from './ledgerSelectors'
type ViewState = Pick<AppState, 'billing' | 'schedule' | 'masters'>

/** Where an unpaid payable stands (catch-up Phase 38): a word per row, never a subtotal. */
export type OutstandingStage = 'awaitingPayment' | 'partPaidIn' | 'dueToYou'

export const OUTSTANDING_STAGE_LABEL: Record<OutstandingStage, string> = {
  awaitingPayment: 'Awaiting payment',
  partPaidIn: 'Part paid in',
  dueToYou: 'Paid in, due to you',
}

/**
 * The anaesthetist's financial position labels (catch-up Phase 38; US-12.2.3 with US-08.3.5): one set for the web
 * dashboard's Financial position, web Accounts' "Your position" strip and mobile Balances, over
 * `anaesthetistLedgerPosition`'s figures, so no two screens name or define "Owed" differently.
 */
export const POSITION_LABEL = {
  owedToThem: 'Owed to you',
  awaitingCollection: 'Awaiting collection',
  dueNow: 'Due to you now',
  collected: 'Collected',
  paidOut: 'Paid out to you',
  theyOweAa: 'You owe AA',
} as const

export interface PayableRow {
  pairId: string
  invoiceId: string
  invoiceNumber: string
  /** The Booking the invoice bills, from the pair's stored link (US-12.2.1: each line opens it). */
  bookingId: string
  listId: string
  patientId: string
  patientName: string
  counterparty: CounterpartyRef
  /** The invoice's stored billable party (a Procedure's payer or a Party), never re-derived. */
  counterpartyLabel: string
  /** ACC-funded: a Procedure's Contract carries the ACC funding tag (`procedureAccFunded`, catch-up Phase 18a), or an archived account's own marker. */
  accFunded: boolean
  amountTotal: number
  receivedAmount: number
  disbursedAmount: number
  /** A prepayment the AA Holding account holds until the List is authorised (catch-up Phase 27a): nothing released, in no one's position, never Outstanding. */
  held: boolean
  /** The unpaid payable: what AA has still to pay the anaesthetist (payable less paid out), >= 0 (catch-up Phase 38). */
  outstandingToYou: number
  stage: OutstandingStage
  /** The invoice date (Greg, note point 33: "invoice date", not "first notice"). */
  raisedAtISO: string
}

/**
 * Whose views a pair shows in: a procedure pair's stamped payee (catch-up
 * Phase 25's lock); a prepayment's transfer payee once transferred, else the
 * anaesthetist who has the List now (27a: a held prepayment shows to whoever
 * has the List, read-only, never the old anaesthetist). The ledger's position
 * puts a held prepayment in no one's scope; this is display only.
 */
export function viewerOfPair(state: Pick<AppState, 'schedule' | 'billing'>, pair: BookingLedgerPair): string | undefined {
  if (pair.anaesthetistId !== undefined) return pair.anaesthetistId
  if (pair.kind !== 'prePayment') return undefined
  const transfer = transferOfPair(state.billing.transfers, pair.id)
  if (transfer !== undefined) return transfer.in.payee.kind === 'anaesthetist' ? transfer.in.payee.anaesthetistId : undefined
  const booking = state.schedule.bookings[pair.bookingId]
  return booking !== undefined ? state.schedule.lists[booking.listId]?.anaesthetistId : undefined
}

function bookingPairs(state: Pick<AppState, 'billing'>): BookingLedgerPair[] {
  return Object.values(state.billing.ledger).filter((p): p is BookingLedgerPair => isBookingPair(p))
}

/**
 * The payable a pair pays its anaesthetist through (catch-up Phase 27a, read
 * from the ledger since 36): a procedure pair's own payable; a prepayment none
 * while the AA Holding account holds it, then its transfer's `in` leg.
 */
function anaesthetistLegOf(state: { billing: Pick<AppState['billing'], 'transfers'> }, pair: BookingLedgerPair): PayableLeg | undefined {
  if (pair.kind !== 'prePayment') return pair.payable
  return transferOfPair(state.billing.transfers, pair.id)?.in
}

/** What a pair has released to the anaesthetist and paid out (catch-up Phase 27a): nothing while the AA Holding account holds a prepayment. */
export function releasedAndPaidFor(state: { billing: Pick<AppState['billing'], 'transfers'> }, pair: BookingLedgerPair): { held: boolean; released: number; disbursed: number } {
  const leg = anaesthetistLegOf(state, pair)
  if (pair.kind === 'prePayment' && leg === undefined) return { held: true, released: 0, disbursed: 0 }
  return { held: false, released: leg?.releasedAmount ?? 0, disbursed: leg?.disbursedAmount ?? 0 }
}

function stageOf(leg: PayableLeg): OutstandingStage {
  if (toCents(leg.releasedAmount) <= 0) return 'awaitingPayment'
  return toCents(leg.releasedAmount) < toCents(leg.amount) ? 'partPaidIn' : 'dueToYou'
}

function payableRowFor(state: ViewState, pair: BookingLedgerPair): PayableRow | undefined {
  const invoice = state.billing.invoices[pair.invoiceId]
  if (invoice === undefined) return undefined
  const leg = anaesthetistLegOf(state, pair)
  const held = pair.kind === 'prePayment' && leg === undefined
  const outstandingToYou = leg === undefined ? 0 : Math.max(0, roundToCents(leg.amount - leg.disbursedAmount))
  return {
    pairId: pair.id,
    invoiceId: pair.invoiceId,
    invoiceNumber: pair.receivable.number,
    bookingId: pair.bookingId,
    listId: pair.listId,
    patientId: pair.patientId,
    patientName: patientNameFor(state, pair.patientId),
    counterparty: invoice.counterparty,
    counterpartyLabel: invoiceAddresseeName(state, invoice),
    // An archived account keeps the old system's marker; every other reads its Contract's tag.
    accFunded: pair.archivedAccRelated === true || proceduresForBooking(state, pair.bookingId).some((p) => procedureAccFunded(state.masters, p)),
    amountTotal: invoice.total,
    receivedAmount: pair.receivable.receivedAmount,
    disbursedAmount: leg?.disbursedAmount ?? 0,
    held,
    outstandingToYou,
    stage: leg === undefined ? 'awaitingPayment' : stageOf(leg),
    raisedAtISO: invoice.raisedAtISO ?? pair.createdAtISO,
  }
}

function oldestFirst(a: PayableRow, b: PayableRow): number {
  return a.raisedAtISO.slice(0, 10).localeCompare(b.raisedAtISO.slice(0, 10)) || a.invoiceNumber.localeCompare(b.invoiceNumber)
}

/**
 * Every invoice an anaesthetist sees, oldest first, shown the moment it is
 * raised, mirrored in Xero or not (catch-up Phase 36), held prepayments
 * included (read-only, 27a).
 */
export function payableRowsFor(state: ViewState, anaesthetistId: string): PayableRow[] {
  const rows: PayableRow[] = []
  for (const pair of bookingPairs(state)) {
    if (viewerOfPair(state, pair) !== anaesthetistId) continue
    const row = payableRowFor(state, pair)
    if (row !== undefined) rows.push(row)
  }
  return rows.sort(oldestFirst)
}

/**
 * Outstanding (catch-up Phase 38; US-12.2.1, RV-35, D8): one row per UNPAID
 * PAYABLE, oldest first by invoice date, then invoice number. A row stays
 * after the billable party pays ("Paid in, due to you") until AA pays the
 * anaesthetist. Exactly the set `anaesthetistPosition` sums: a held or
 * withdrawn prepayment is never a row, and no AA fee invoice is one, so the
 * total equals Owed to you to the cent.
 */
export function outstandingPayableRowsFor(state: ViewState, anaesthetistId: string): PayableRow[] {
  return payableRowsFor(state, anaesthetistId).filter((r) => !r.held && toCents(r.outstandingToYou) > 0)
}

/** The Outstanding total, summed in cents. */
export function outstandingTotalFor(rows: readonly Pick<PayableRow, 'outstandingToYou'>[]): number {
  return rows.reduce((cents, r) => cents + toCents(r.outstandingToYou), 0) / 100
}

export type PaymentHistoryStatus =
  | 'held'
  | 'partPayment'
  | 'customerPaid'
  | 'partPaidOut'
  | 'paidOut'

export interface PaymentHistoryRow {
  pairId: string
  invoiceNumber: string
  patientName: string
  payerLabel: string
  receivedAtISO: string
  grossReceived: number
  /** What AA has released to the anaesthetist: exactly what it received (US-10.2.1). */
  releasedAmount: number
  disbursedAmount: number
  status: PaymentHistoryStatus
}

/**
 * Payment history for the anaesthetist account: an immediate transaction
 * history read from the ledger (a received payment stays visible here, and
 * shows what was released and paid out, beside its Outstanding row until AA
 * pays it). Never Xero.
 */
export function paymentHistoryFor(
  state: ViewState,
  anaesthetistId: string,
): PaymentHistoryRow[] {
  const latestReceiptByPair = new Map<string, string>()
  for (const receipt of incomeReceiptsFor(state, anaesthetistId)) {
    const prior = latestReceiptByPair.get(receipt.pairId)
    if (prior === undefined || receipt.atISO > prior) latestReceiptByPair.set(receipt.pairId, receipt.atISO)
  }

  const rows: PaymentHistoryRow[] = []
  for (const pair of bookingPairs(state)) {
    if (viewerOfPair(state, pair) !== anaesthetistId) continue
    const received = pair.receivable.receivedAmount
    if (toCents(received) <= 0) continue
    const invoice = state.billing.invoices[pair.invoiceId]
    const booking = state.schedule.bookings[pair.bookingId]
    const receivedAtISO = latestReceiptByPair.get(pair.id) ?? pair.receivable.paidInAtISO
    if (invoice === undefined || booking === undefined || receivedAtISO === undefined) continue

    const fullyReceived = toCents(received) >= toCents(invoice.total)
    const money = releasedAndPaidFor(state, pair)
    const anyDisbursed = toCents(money.disbursed) > 0
    const fullyDisbursed = toCents(money.released) > 0 && toCents(money.disbursed) >= toCents(money.released)
    const status: PaymentHistoryStatus = money.held
      ? 'held'
      : fullyDisbursed && fullyReceived
        ? 'paidOut'
        : anyDisbursed
          ? 'partPaidOut'
          : fullyReceived
            ? 'customerPaid'
            : 'partPayment'

    rows.push({
      pairId: pair.id,
      invoiceNumber: invoice.invoiceNumber,
      patientName: patientNameFor(state, booking.patientId),
      payerLabel: invoiceAddresseeName(state, invoice),
      receivedAtISO,
      grossReceived: received,
      releasedAmount: money.released,
      disbursedAmount: money.disbursed,
      status,
    })
  }

  return rows.sort(
    (a, b) =>
      b.receivedAtISO.localeCompare(a.receivedAtISO) ||
      b.invoiceNumber.localeCompare(a.invoiceNumber),
  )
}

/** The state `counterpartyName` and `payerRecordFor` read: the masters, and the Procedures and invoices where a payer is named. */
export type CounterpartyNameState = Pick<AppState, 'masters'> & {
  schedule?: Pick<AppState['schedule'], 'procedures'>
  billing?: Pick<AppState['billing'], 'invoices'>
}

/**
 * Another payer (catch-up Phase 21; on each Procedure since 22a), by its
 * `BP####` id: the one selector that resolves a `payer` counterparty. It reads
 * the given Booking's Procedures first (their payers, then their split shares'
 * "another person"), then any Procedure holding that id,
 * then an invoice's `billedTo` snapshot (the payer's details stay with the
 * debt). Never a master, never a name match.
 */
export function payerRecordFor(
  state: CounterpartyNameState,
  payerId: string,
  bookingId?: string,
): { name: string; email?: string; relationship?: string } | undefined {
  const procedures = Object.values(state.schedule?.procedures ?? {}).filter((p) => p.payer !== undefined)
  // A Procedure's payer or a split share's "another person" (catch-up Phase 22a), by id: the Booking's own first.
  const own = bookingId !== undefined ? otherPayerHeld(procedures.filter((p) => p.bookingId === bookingId), payerId) : undefined
  const held = own ?? otherPayerHeld(procedures, payerId)
  if (held !== undefined) return held
  for (const inv of Object.values(state.billing?.invoices ?? {})) {
    if (inv.counterparty.kind === 'payer' && inv.counterparty.id === payerId && inv.billedTo !== undefined) return inv.billedTo
  }
  return undefined
}

/** Display name for a billing counterparty (any kind), falling back to its id. */
export function counterpartyName(state: CounterpartyNameState, ref: CounterpartyRef, bookingId?: string): string {
  switch (ref.kind) {
    case 'hospital':
      return state.masters.hospitals[ref.id]?.name ?? ref.id
    case 'insurer':
      return state.masters.insurers[ref.id]?.name ?? ref.id
    case 'surgeon':
      return state.masters.surgeons[ref.id]?.name ?? ref.id
    case 'organisation':
      return state.masters.organisations[ref.id]?.name ?? ref.id
    case 'patient':
      return state.masters.patients[ref.id]?.name ?? ref.id
    case 'payer':
      return payerRecordFor(state, ref.id, bookingId)?.name ?? ref.id
    case 'billableParty':
    case 'party':
      return partyForCounterparty(ref, state.masters.parties)?.name ?? ref.id
  }
}

/**
 * The name an issued invoice is addressed to (catch-up Phase 21): the payer's
 * name as at the run (`billedTo`), else the counterparty's name, resolved on
 * the invoice's own Booking. Every list that names an invoice reads this.
 */
export function invoiceAddresseeName(state: CounterpartyNameState, invoice: Pick<Invoice, 'billedTo' | 'counterparty' | 'bookingId'>): string {
  return invoice.billedTo?.name ?? counterpartyName(state, invoice.counterparty, invoice.bookingId)
}

/** A Procedure's payer's details (catch-up Phases 21, 22a): the patient's record unless another payer is ticked. */
export function payerDetailsForProcedure(state: Pick<AppState, 'masters' | 'schedule'>, procedureId: string): PayerDetails | undefined {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (procedure === undefined || booking === undefined) return undefined
  return payerDetails(procedure.payer, state.masters.patients[booking.patientId])
}

/**
 * True when a Procedure's payer is locked by their own raised prepayment
 * invoice (US-06.3.1 "Payer locked"; catch-up Phase 22a, the one lock, read
 * from the issued invoice's lines since Phase 27): the Procedure is a line on
 * an issued prepayment invoice addressed to its payer. Another payer's
 * Procedures stay changeable, and so does a Procedure added later to the same
 * payer until its own invoice is raised.
 */
export function payerLockedByPrepayment(state: Pick<AppState, 'schedule' | 'billing'>, procedureId: string): boolean {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (procedure === undefined || booking === undefined) return false
  const key = refKey(payerCounterparty(procedure, booking.patientId))
  const addressed = new Set(prePaymentInvoicesForBooking(state, booking.id).filter((inv) => refKey(inv.counterparty) === key).map((inv) => inv.id))
  if (addressed.size === 0) return false
  return Object.values(state.billing.invoiceLines).some((l) => l.procedureId === procedureId && addressed.has(l.invoiceId))
}

/** Assemble the validator context for a Booking from store state. */
/**
 * The completion rule's context (catch-up Phase 21a): the Contracts, the
 * List's date, the RVG groups, the modifier master and the patient's date of
 * birth, built in one place. `completionBlockersFor` and the Booking detail's
 * live validation both call it, so they cannot drift. Undefined for a Booking
 * on a Draft List (no anaesthetist yet) or one whose List is gone.
 */
export function completionContextFor(
  state: { masters: AppState['masters']; schedule: Pick<AppState['schedule'], 'bookings' | 'lists' | 'billingLines'> },
  bookingId: string,
): CompletionContext | undefined {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return undefined
  const list = state.schedule.lists[booking.listId]
  if (list === undefined || list.anaesthetistId === undefined) return undefined
  return {
    contracts: state.masters.contracts,
    parties: state.masters.parties,
    rvgGroups: state.masters.rvgGroups,
    modifiers: state.masters.modifiers,
    billingLines: Object.values(state.schedule.billingLines),
    listDateISO: list.dateISO,
    patientDobISO: state.masters.patients[booking.patientId]?.dobISO,
  }
}

export function billingContextForBooking(
  state: {
    masters: AppState['masters']
    schedule: Pick<AppState['schedule'], 'lists' | 'billingLines'> & Partial<Pick<AppState['schedule'], 'bookings' | 'procedures'>>
    billing?: Pick<AppState['billing'], 'invoices' | 'invoiceLines'>
  },
  booking: Booking,
): BookingBillingContext | undefined {
  const list = state.schedule.lists[booking.listId]
  // A Booking on a Draft List has no anaesthetist yet, so no billing context (catch-up Phase 31).
  if (list === undefined || list.anaesthetistId === undefined) return undefined
  const anaesthetist = state.masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) return undefined
  const ctx: BookingBillingContext = {
    anaesthetist,
    rvgGroups: state.masters.rvgGroups,
    contracts: state.masters.contracts,
    parties: state.masters.parties,
    billingLines: Object.values(state.schedule.billingLines),
    listDateISO: list.dateISO,
    timeRule: state.masters.rvgTimeRule,
    patientDobISO: state.masters.patients[booking.patientId]?.dobISO,
    modifiers: state.masters.modifiers,
  }
  const patient = state.masters.patients[booking.patientId]
  if (patient !== undefined) ctx.patient = patient
  const hospital = listHospitalFor(list, state.masters.hospitals)
  if (hospital.listHospitalId !== undefined) ctx.listHospitalId = hospital.listHospitalId
  // The price ladder's held amounts (catch-up Phase 24), wherever the caller has the billing slice.
  const { bookings, procedures } = state.schedule
  if (state.billing !== undefined && bookings !== undefined && procedures !== undefined) {
    const held = heldPricesForBooking({ billing: state.billing, schedule: { lists: state.schedule.lists, bookings, procedures } }, booking.id)
    if (Object.keys(held).length > 0) ctx.held = held
  }
  return ctx
}

export interface EntityCounts {
  anaesthetists: number
  surgeons: number
  hospitals: number
  parties: number
  /** The office's Contracts; the system's Fixed price fallbacks are counted apart (catch-up Phase 18a). */
  contracts: number
  fixedPriceFallbacks: number
  specialties: number
  fundingTags: number
  rvgGroups: number
  modifiers: number
  recurringBookings: number
  sessions: number
  patients: number
  lists: number
  /** Live Draft Lists (catch-up Phase 31). */
  draftLists: number
  bookings: number
  procedures: number
  billingLines: number
  importBatches: number
  importRows: number
  /** Stubs on Lists, every status (catch-up Phase 33a). */
  stubs: number
  pdfLists: number
  audit: number
  invoices: number
  ledgerPairs: number
  xeroContacts: number
}

export function entityCounts(state: AppState): EntityCounts {
  return {
    anaesthetists: Object.keys(state.masters.anaesthetists).length,
    surgeons: Object.keys(state.masters.surgeons).length,
    hospitals: Object.keys(state.masters.hospitals).length,
    parties: Object.keys(state.masters.parties).length,
    contracts: Object.values(state.masters.contracts).filter((c) => !isOpenPriceFallback(c) && c.systemRole !== 'rvgFallback').length,
    fixedPriceFallbacks: Object.values(state.masters.contracts).filter(isOpenPriceFallback).length,
    specialties: Object.keys(state.masters.specialties).length,
    fundingTags: Object.keys(state.masters.fundingTags).length,
    rvgGroups: Object.keys(state.masters.rvgGroups).length,
    modifiers: Object.keys(state.masters.modifiers).length,
    recurringBookings: Object.keys(state.masters.recurringBookings).length,
    patients: Object.keys(state.masters.patients).length,
    // The app says sessions (OQ-64; catch-up Phase 43): the Data Inspector shows this key.
    sessions: Object.keys(state.schedule.slots).length,
    lists: Object.keys(state.schedule.lists).length,
    draftLists: waitingDraftLists(state).length,
    bookings: Object.keys(state.schedule.bookings).length,
    procedures: Object.keys(state.schedule.procedures).length,
    billingLines: Object.keys(state.schedule.billingLines).length,
    importBatches: Object.keys(state.intake.batches).length,
    importRows: Object.keys(state.intake.rows).length,
    stubs: Object.keys(state.intake.stubs).length,
    pdfLists: Object.keys(state.intake.pdfLists).length,
    audit: state.audit.length,
    // Catch-up Phase 43: the money at scale.
    invoices: Object.keys(state.billing.invoices).length,
    ledgerPairs: Object.keys(state.billing.ledger).length,
    xeroContacts: Object.keys(state.xero.contacts).length,
  }
}

/** The clock's time of day as `h:mm` (the phone status bar format). */
export function clockTimeLabel(state: Pick<AppState, 'clock'>): string {
  const h = Math.floor(state.clock.minutesSinceMidnight / 60)
  const m = state.clock.minutesSinceMidnight % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export { clockISO }

// ---------------------------------------------------------------------------
// Integration selectors (Phase 11)
// ---------------------------------------------------------------------------

/**
 * Locate a Booking by its integration correlation ref (`{sourceFeedId,
 * externalAppointmentId}`) — how S13/S14/S15 messages find the appointment they
 * modify, never by patient guesswork. Returns the first match (any state).
 */
export function findBookingByCorrelation(
  state: Pick<AppState, 'schedule'>,
  ref: IntegrationCorrelationRef,
): Booking | undefined {
  return Object.values(state.schedule.bookings).find(
    (c) =>
      c.correlationRef !== undefined &&
      c.correlationRef.sourceFeedId === ref.sourceFeedId &&
      c.correlationRef.externalAppointmentId === ref.externalAppointmentId,
  )
}

/** Non-cancelled Bookings on a List whose patient carries the given (normalised) NHI (PDF dedupe). */
export function bookingsOnListByNhi(state: Pick<AppState, 'schedule' | 'masters'>, listId: string, normalisedNhi: string): Booking[] {
  return bookingsForList(state, listId).filter(
    (c) => c.cancellation === undefined && state.masters.patients[c.patientId]?.nhi === normalisedNhi,
  )
}

/** The feeds configured for a hospital (Phase 11 feed-config view). */
export function feedsForHospital(state: Pick<AppState, 'integrations'>, hospitalId: string): IntegrationFeed[] {
  return Object.values(state.integrations.feeds).filter((f) => f.hospitalId === hospitalId)
}

export interface IntegrationMonitorRow {
  id: string
  feedId: string
  feedName: string
  eventType: string
  messageControlId: string
  appointmentId?: string
  patientRef?: string
  status: IntegrationMessageStatus
  /** The RFP's "retried" is a DERIVED label (processed with attempts > 1), not a stored status. */
  displayStatus: string
  attempts: number
  failureReason?: string
  /** The matching-screen row the message staged (catch-up Phase 33). */
  resultImportRowId?: string
  atISO: string
}

function displayStatusFor(m: IntegrationMessage): string {
  switch (m.status) {
    case 'processed':
      // A parsed message waits on the matching screen for the office (catch-up Phase 33; RV-13).
      if (m.resultImportRowId !== undefined) return m.attempts > 1 ? 'Retried, sent to matching' : 'Sent to matching'
      return m.attempts > 1 ? 'Retried' : 'Processed'
    case 'duplicate':
      return 'Duplicate'
    case 'deadLetter':
      return 'Dead-letter'
    case 'retrying':
      return 'Retrying'
    case 'pending':
      return 'Pending'
  }
}

/** The message log (Phase 11 monitor), most recent first. */
export function integrationMonitor(state: Pick<AppState, 'integrations'>): IntegrationMonitorRow[] {
  return Object.values(state.integrations.messages)
    .map((m): IntegrationMonitorRow => {
      const row: IntegrationMonitorRow = {
        id: m.id,
        feedId: m.feedId,
        feedName: FEED_META[m.feedId]?.name ?? m.feedId,
        eventType: m.eventType,
        messageControlId: m.messageControlId,
        status: m.status,
        displayStatus: displayStatusFor(m),
        attempts: m.attempts,
        atISO: m.updatedAtISO ?? m.receivedAtISO,
      }
      if (m.correlationRef !== undefined) row.appointmentId = m.correlationRef.externalAppointmentId
      if (m.patientRef !== undefined) row.patientRef = m.patientRef
      if (m.failureReason !== undefined) row.failureReason = m.failureReason
      if (m.resultImportRowId !== undefined) row.resultImportRowId = m.resultImportRowId
      return row
    })
    .sort((a, b) => b.atISO.localeCompare(a.atISO) || b.id.localeCompare(a.id))
}

/** Messages needing attention: dead-letter only (catch-up Phase 33: nothing parks). No nav badge since Phase 34: the message log is Future scope. */
export function integrationAttentionCount(state: Pick<AppState, 'integrations'>): number {
  return Object.values(state.integrations.messages).filter((m) => m.status === 'deadLetter').length
}

export interface DataQualityItem {
  patientId: string
  name: string
  nhi?: string
  receivedCode: string
  reason: string
}

/** Patients with a quarantined ethnicity code (the data-quality tab; I5). */
export function dataQualityItems(state: Pick<AppState, 'masters'>): DataQualityItem[] {
  return Object.values(state.masters.patients)
    .filter((p): p is Patient & { ethnicityPending: NonNullable<Patient['ethnicityPending']> } => p.ethnicityPending !== undefined)
    .map((p) => {
      const item: DataQualityItem = {
        patientId: p.hiddenInternalId,
        name: p.name,
        receivedCode: p.ethnicityPending.receivedCode,
        reason: p.ethnicityPending.reason,
      }
      if (p.nhi !== undefined) item.nhi = p.nhi
      return item
    })
    .sort((a, b) => a.patientId.localeCompare(b.patientId))
}

// ---------------------------------------------------------------------------
// Primitive-returning hooks (safe to use directly in components)
// ---------------------------------------------------------------------------

export function useToday(): string {
  return useAppStore((s) => s.clock.todayISO)
}

export function useClockTimeLabel(): string {
  return useAppStore((s) => clockTimeLabel(s))
}

// ---------------------------------------------------------------------------
// AA's monthly fee (catch-up Phase 16; FT-10.3, US-10.3.1, US-10.3.2)
// ---------------------------------------------------------------------------

/** What an anaesthetist's fee invoices already hold, for `bctisFor` (charged BCTIs, invoiced months). */
export function bctiFeeHistoryFor(state: Pick<AppState, 'billing'>, anaesthetistId: string): BctiFeeHistory {
  return bctiFeeHistory(Object.values(state.billing.aaFeeInvoices), anaesthetistId)
}

/** The BCTIs `anaesthetistId` would be charged for `monthISO` on the next run (the one count, with its fee history). */
export function bctisToChargeFor(state: Pick<AppState, 'billing'>, anaesthetistId: string, monthISO: string): BctiRecord[] {
  return bctisFor(bctiRecords(state), anaesthetistId, monthISO, BCTI_COUNT_RULE, bctiFeeHistoryFor(state, anaesthetistId))
}

export interface AaFeeRunPreviewRow {
  anaesthetistId: string
  anaesthetistName: string
  bctiCount: number
  fixedTotal: number
  perBctiTotal: number
  /** Excluding GST. */
  subtotal: number
  gst: number
  total: number
  /** The fee invoice already raised for this month, if any. */
  invoice?: AaFeeInvoice
}

/**
 * The month's fee for every active anaesthetist: from the current settings and
 * count for one not yet invoiced, or the raised invoice's own snapshot.
 */
export function aaFeeRunPreview(
  state: Pick<AppState, 'billing' | 'masters' | 'appSettings'>,
  monthISO: string,
): AaFeeRunPreviewRow[] {
  const records = bctiRecords(state)
  const settings = state.appSettings.aaFee
  const raised = new Map(
    Object.values(state.billing.aaFeeInvoices)
      .filter((f) => f.monthISO === monthISO)
      .map((f) => [f.anaesthetistId, f]),
  )
  return Object.values(state.masters.anaesthetists)
    .filter((a) => a.active)
    .map((a): AaFeeRunPreviewRow => {
      const invoice = raised.get(a.registrationNumber)
      if (invoice !== undefined) {
        const fixedTotal = aaFeeFixedTotal(invoice.settings)
        return {
          anaesthetistId: a.registrationNumber,
          anaesthetistName: a.name,
          bctiCount: invoice.bctiCount,
          fixedTotal,
          perBctiTotal: roundToCents(invoice.subtotal - fixedTotal),
          subtotal: invoice.subtotal,
          gst: invoice.gst,
          total: invoice.total,
          invoice,
        }
      }
      const bctiCount = bctisFor(records, a.registrationNumber, monthISO, BCTI_COUNT_RULE, bctiFeeHistoryFor(state, a.registrationNumber)).length
      const fee = aaFeeFor(settings, bctiCount)
      return {
        anaesthetistId: a.registrationNumber,
        anaesthetistName: a.name,
        bctiCount,
        fixedTotal: aaFeeFixedTotal(settings),
        perBctiTotal: roundToCents(settings.perBctiCharge * bctiCount),
        subtotal: fee.subtotal,
        gst: fee.gst,
        total: fee.total,
      }
    })
    .sort((a, b) => a.anaesthetistName.localeCompare(b.anaesthetistName))
}

export type AaFeeInvoiceStatus = 'unpaid' | 'paid'

export interface AaFeeInvoiceRow extends AaFeeInvoice {
  status: AaFeeInvoiceStatus
  /** Received on its `aaFee` ledger pair. */
  amountReceived: number
  paidAtISO?: string
}

/** A fee invoice with its status and paid date read from its `aaFee` ledger pair (catch-up Phase 36). */
function aaFeeRow(state: Pick<AppState, 'billing'>): (f: AaFeeInvoice) => AaFeeInvoiceRow {
  return (f) => {
    const r = state.billing.ledger[f.ledgerPairId]?.receivable
    const received = r?.receivedAmount ?? 0
    return { ...f, status: toCents(received) >= toCents(f.total) ? 'paid' : 'unpaid', amountReceived: received, ...(r?.paidInAtISO !== undefined ? { paidAtISO: r.paidInAtISO } : {}) }
  }
}

function newestFirst(a: AaFeeInvoice, b: AaFeeInvoice): number {
  return b.monthISO.localeCompare(a.monthISO) || b.raisedAtISO.localeCompare(a.raisedAtISO) || a.invoiceNumber.localeCompare(b.invoiceNumber)
}

/** One anaesthetist's fee invoices, newest first. Reads the ledger, never Xero. */
export function aaFeeInvoicesFor(state: Pick<AppState, 'billing'>, anaesthetistId: string): AaFeeInvoiceRow[] {
  return Object.values(state.billing.aaFeeInvoices)
    .filter((f) => f.anaesthetistId === anaesthetistId)
    .sort(newestFirst)
    .map(aaFeeRow(state))
}

/** Every fee invoice, newest first. Reads the ledger. */
export function allAaFeeInvoices(state: Pick<AppState, 'billing'>): AaFeeInvoiceRow[] {
  return Object.values(state.billing.aaFeeInvoices).sort(newestFirst).map(aaFeeRow(state))
}

/** A List's session times as a hook (stable: selects the records, derives with useMemo). */
export function useListTimes(list: Pick<List, 'slotId' | 'session'> | undefined): EffectiveSlotTimes | undefined {
  const slot = useAppStore((s) => (list?.slotId !== undefined ? s.schedule.slots[list.slotId] : undefined))
  const settings = useAppStore((s) => s.appSettings.schedule)
  const session = list?.session
  return useMemo(
    () => (session === undefined ? undefined : effectiveSlotTimes(slot ?? { session }, settings)),
    [slot, settings, session],
  )
}

/** A session's view as a hook. */
export function useSlotView(slotId: string | undefined): SlotView | undefined {
  const slot = useAppStore((s) => (slotId !== undefined ? s.schedule.slots[slotId] : undefined))
  const lists = useAppStore((s) => s.schedule.lists)
  const settings = useAppStore((s) => s.appSettings.schedule)
  const statuses = useAppStore((s) => s.masters.slotStatuses)
  return useMemo(
    () => (slot === undefined ? undefined : viewOf(slot, listIndexBySlot(lists), settings, statuses)),
    [slot, lists, settings, statuses],
  )
}

// ---------------------------------------------------------------------------
// Conflicts (catch-up Phase 30; US-01.5.2, US-01.5.4)
// ---------------------------------------------------------------------------

/** The names and records `describeConflict` reads, memoised on the masters and Slot records. */
export function useConflictLookups(): ConflictLookups {
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => conflictLookups({ masters }), [masters])
}

// ---------------------------------------------------------------------------
// Recurring-booking projection inputs (catch-up Phase 30; US-01.3.2)
// ---------------------------------------------------------------------------

const bookedListCache = new WeakMap<object, Set<string>>()

/** Lists holding any Booking, cancelled ones included (memoised on the Bookings record). */
export function bookedListIds(bookings: Readonly<Record<string, Booking>>): Set<string> {
  const cached = bookedListCache.get(bookings)
  if (cached !== undefined) return cached
  const ids = new Set<string>()
  for (const b of Object.values(bookings)) ids.add(b.listId)
  bookedListCache.set(bookings, ids)
  return ids
}

/** The day after the demo clock's today: the first date a recurring-booking change may touch. */
export function tomorrowISO(state: Pick<AppState, 'clock'>): string {
  return format(addDays(parseISO(state.clock.todayISO), 1), 'yyyy-MM-dd')
}

/** What the projection reads, from tomorrow to the far end of the horizon setting. */
export function projectionInputsFrom(state: Pick<AppState, 'clock' | 'appSettings' | 'schedule' | 'masters'>): ProjectionInputs {
  return {
    fromISO: tomorrowISO(state),
    toISO: scheduleHorizon(state).endISO,
    slots: state.schedule.slots,
    lists: state.schedule.lists,
    listBySlot: listIndexBySlot(state.schedule.lists),
    bookedListIds: bookedListIds(state.schedule.bookings),
    movedFrom: movedFromIndex(state.schedule.lists),
    answered: answeredIndex(state.schedule.lists),
    statuses: state.masters.slotStatuses,
  }
}

const answeredCache = new WeakMap<object, Map<string, List>>()

/** Days a Draft List (or a List assigned from one) answers for (catch-up Phase 31), memoised on the Lists record. */
function answeredIndex(lists: Readonly<Record<string, List>>): Map<string, List> {
  const cached = answeredCache.get(lists)
  if (cached !== undefined) return cached
  const index = answeringLists(lists)
  answeredCache.set(lists, index)
  return index
}

const movedFromCache = new WeakMap<object, Map<string, string>>()

/** Projected Lists the office moved: `<recurringBookingId>|<original slotId>` to the List's id (memoised on the Lists record). */
function movedFromIndex(lists: Readonly<Record<string, List>>): Map<string, string> {
  const cached = movedFromCache.get(lists)
  if (cached !== undefined) return cached
  const index = new Map<string, string>()
  for (const l of Object.values(lists)) if (l.recurringOrigin !== undefined) index.set(`${l.recurringOrigin.recurringBookingId}|${l.recurringOrigin.slotId}`, l.id)
  movedFromCache.set(lists, index)
  return index
}

/**
 * The plan a retire applies (catch-up Phase 30): removals only, after the last
 * date the store will use (an earlier end already set wins). The sheet's
 * confirmation reads the same plan.
 */
export function previewRetireRecurringBooking(
  state: Pick<AppState, 'clock' | 'appSettings' | 'schedule' | 'masters'>,
  recurringBooking: RecurringBooking,
  lastDateISO: string,
): ProjectionPlan {
  const end = recurringBooking.effectiveToISO !== undefined && recurringBooking.effectiveToISO < lastDateISO ? recurringBooking.effectiveToISO : lastDateISO
  const plan = projectRecurringBookingChange({ ...projectionInputsFrom(state), before: recurringBooking, after: { ...recurringBooking, effectiveToISO: end } })
  return { ...plan, create: [], update: [], skipped: [], kept: plan.kept.filter((k) => k.dateISO > end) }
}

/**
 * The plan a recurring-booking add (`before` undefined), edit or retire would
 * apply: the sheet's live preview line reads it, and the action applies the
 * same plan, so the two cannot disagree.
 */
export function previewRecurringBookingChange(
  state: Pick<AppState, 'clock' | 'appSettings' | 'schedule' | 'masters'>,
  before: RecurringBooking | undefined,
  after: RecurringBooking | undefined,
): ProjectionPlan {
  return projectRecurringBookingChange({ ...projectionInputsFrom(state), ...(before !== undefined ? { before } : {}), ...(after !== undefined ? { after } : {}) })
}

/** The view-level "Apply to canvas now" plan (never removes). */
export function previewApplyAllRecurringBookings(state: Pick<AppState, 'clock' | 'appSettings' | 'schedule' | 'masters'>): ProjectionPlan {
  return projectAllRecurringBookings({ ...projectionInputsFrom(state), recurringBookings: Object.values(state.masters.recurringBookings) })
}

/** One conflict on the Conflicts screen (catch-up Phase 30; US-01.5.4). Never names a "slot" in copy. */
export interface ConflictRow {
  key: string
  listId: string
  /** Absent for a Draft List, which has no Slot (catch-up Phase 31). */
  slotId?: string
  dateISO: string
  session: Session
  /** Absent for a Draft List (shown as "Unassigned"). */
  anaesthetistId?: string
  hospitalId: string
  surgeonId: string
  listState: List['state']
  /** Bookings not cancelled. */
  bookingCount: number
  kind: ListConflict['kind']
  cause: string
  reason: ConflictReason
  detail: string
  raisedAtISO?: string
  /** The office's clear, when the row is a cleared conflict. */
  clear?: ConflictClear
}

export interface ConflictRowFilter {
  fromISO?: string
  toISO?: string
  hospitalId?: string
  anaesthetistId?: string
  includeCleared?: boolean
}

const rosterRank = (id: string): number => SEEDED_ORDER.get(id) ?? Number.MAX_SAFE_INTEGER

/** Every anaesthetist in roster order (the seeded order, then by id). */
export function anaesthetistsInRosterOrder(state: { masters: Pick<AppState['masters'], 'anaesthetists'> }): Anaesthetist[] {
  return Object.values(state.masters.anaesthetists).sort((a, b) => rosterRank(a.registrationNumber) - rosterRank(b.registrationNumber) || a.registrationNumber.localeCompare(b.registrationNumber))
}

let conflictRowCache: { lists: object; masters: object; bookings: object; rows: ConflictRow[] } | null = null

/** Every live and cleared conflict, sorted by date, session, then roster order (memoised on the records). */
function allConflictRows(state: Pick<AppState, 'schedule' | 'masters'>): ConflictRow[] {
  const { lists, bookings } = state.schedule
  const c = conflictRowCache
  if (c !== null && c.lists === lists && c.masters === state.masters && c.bookings === bookings) return c.rows
  const lookups = conflictLookups(state)
  const active = new Map<string, number>()
  for (const b of Object.values(bookings)) if (b.cancellation === undefined) active.set(b.listId, (active.get(b.listId) ?? 0) + 1)
  const rows: ConflictRow[] = []
  for (const list of Object.values(lists)) {
    if (list.conflicts.length === 0 && (list.conflictClears ?? []).length === 0) continue
    // A removed Draft List leaves every view but History.
    if (list.removedAtISO !== undefined) continue
    const base = {
      listId: list.id,
      ...(list.slotId !== undefined ? { slotId: list.slotId } : {}),
      dateISO: list.dateISO,
      session: list.session,
      ...(list.anaesthetistId !== undefined ? { anaesthetistId: list.anaesthetistId } : {}),
      hospitalId: list.hospitalId,
      surgeonId: list.surgeonId,
      listState: list.state,
      bookingCount: active.get(list.id) ?? 0,
    }
    for (const conflict of list.conflicts) {
      const { reason, detail } = describeConflict(conflict, list, lookups)
      rows.push({ ...base, key: `${list.id}|${conflict.cause}`, kind: conflict.kind, cause: conflict.cause, reason, detail, raisedAtISO: conflict.raisedAtISO })
    }
    for (const clear of list.conflictClears ?? []) {
      const conflict = conflictFromCause(clear.cause)
      if (conflict === null) continue
      const { reason, detail } = describeConflict(conflict, list, lookups)
      rows.push({ ...base, key: `${list.id}|${clear.cause}`, kind: conflict.kind, cause: clear.cause, reason, detail, clear })
    }
  }
  rows.sort(
    (a, b) =>
      a.dateISO.localeCompare(b.dateISO) ||
      compareSessions(a, b) ||
      rosterRank(a.anaesthetistId ?? '') - rosterRank(b.anaesthetistId ?? '') ||
      (a.anaesthetistId ?? '').localeCompare(b.anaesthetistId ?? '') ||
      a.cause.localeCompare(b.cause),
  )
  conflictRowCache = { lists, masters: state.masters, bookings, rows }
  return rows
}

/** The Conflicts screen's rows: hospital closures only (US-01.5.4; D59, catch-up Phase 32b), filtered. */
export function conflictRows(state: Pick<AppState, 'schedule' | 'masters'>, filter: ConflictRowFilter = {}): ConflictRow[] {
  return allConflictRows(state).filter(
    (r) =>
      (filter.includeCleared === true || r.clear === undefined) &&
      (filter.fromISO === undefined || r.dateISO >= filter.fromISO) &&
      (filter.toISO === undefined || r.dateISO <= filter.toISO) &&
      (filter.hospitalId === undefined || r.hospitalId === filter.hospitalId) &&
      (filter.anaesthetistId === undefined || r.anaesthetistId === filter.anaesthetistId),
  )
}

/** Live conflicts from a date to the far end of the horizon: the side-nav badge and the To-do line. */
export function openConflictCount(state: Pick<AppState, 'schedule' | 'masters' | 'clock' | 'appSettings'>, fromISO: string = state.clock.todayISO): number {
  return conflictRows(state, { fromISO, toISO: scheduleHorizon(state).endISO }).length
}

export interface HospitalDay {
  dateISO: string
  closures: HospitalHoliday[]
  /**
   * The master public holidays closing the hospital that day (catch-up Phase
   * 42), read through `closuresFor`: read-only on the hospital's calendar.
   */
  publicClosures: PublicHoliday[]
  /** Lists at the hospital that day (backdrop history excluded). */
  listCount: number
  /** How many of them carry a live closure conflict (hospital closed). */
  conflictedCount: number
}

/** One hospital's month (`YYYY-MM`): closures, Lists and conflicts per day, for the holiday calendar. */
export function hospitalMonth(state: Pick<AppState, 'schedule' | 'masters'>, hospitalId: string, monthISO: string): HospitalDay[] {
  const first = parseISO(`${monthISO}-01`)
  const days = getDaysInMonth(first)
  const out: HospitalDay[] = []
  const byDate = new Map<string, { lists: number; conflicted: number }>()
  for (const l of Object.values(state.schedule.lists)) {
    if (l.hospitalId !== hospitalId || !l.dateISO.startsWith(monthISO) || isBackdropList(l) || l.removedAtISO !== undefined) continue
    const e = byDate.get(l.dateISO) ?? { lists: 0, conflicted: 0 }
    e.lists += 1
    if (l.conflicts.some((c) => c.kind === 'holiday')) e.conflicted += 1
    byDate.set(l.dateISO, e)
  }
  const holidays = Object.values(state.masters.holidays).filter((h) => h.hospitalId === hospitalId)
  const index = closuresIndex(closureSourcesOf(state.masters))
  for (let d = 1; d <= days; d++) {
    const dateISO = `${monthISO}-${String(d).padStart(2, '0')}`
    const e = byDate.get(dateISO)
    const publicClosures = closuresAt(index, dateISO, hospitalId).flatMap((c) =>
      c.source === 'public' && state.masters.publicHolidays[c.publicHolidayId] !== undefined ? [state.masters.publicHolidays[c.publicHolidayId]!] : [],
    )
    out.push({
      dateISO,
      closures: holidays.filter((h) => h.dateISO === dateISO).sort((a, b) => a.id.localeCompare(b.id)),
      publicClosures,
      listCount: e?.lists ?? 0,
      conflictedCount: e?.conflicted ?? 0,
    })
  }
  return out
}


// ---------------------------------------------------------------------------
// Draft Lists (catch-up Phase 31; FT-01.6, US-01.6.2, US-13.1.1)
// ---------------------------------------------------------------------------

const waitingCache = new WeakMap<object, DraftList[]>()

/**
 * Every live Draft List (not removed), in the one order (`compareDraftLists`,
 * soonest first; US-01.6.2 "Sorting": nothing waits unnoticed). Memoised on
 * the `schedule.lists` record. Office surfaces only: no anaesthetist-scoped
 * selector returns a Draft List (OQ-86 answered no, D46).
 */
export function waitingDraftLists(state: { schedule: Pick<AppState['schedule'], 'lists'> }): DraftList[] {
  const lists = state.schedule.lists
  const cached = waitingCache.get(lists)
  if (cached !== undefined) return cached
  const out = Object.values(lists).filter(isDraftList).sort(compareDraftLists)
  waitingCache.set(lists, out)
  return out
}

/** The live Draft Lists for one day (the Day dashboard's band, US-13.1.1), in the same order. */
export function draftListsForDate(state: { schedule: Pick<AppState['schedule'], 'lists'> }, dateISO: string): DraftList[] {
  return waitingDraftLists(state).filter((l) => l.dateISO === dateISO)
}

/** How many Draft Lists are waiting (the nav badge and the rail card heading). */
export function waitingDraftListCount(state: { schedule: Pick<AppState['schedule'], 'lists'> }): number {
  return waitingDraftLists(state).length
}

/**
 * The Draft Lists that stopped waiting, newest first, for the page's History:
 * Lists assigned from a Draft List (they keep their trail) and removed Draft
 * Lists.
 */
export function finishedDraftLists(state: { schedule: Pick<AppState['schedule'], 'lists'> }): List[] {
  const doneAt = (l: List) => l.draft?.assignedAtISO ?? l.removedAtISO ?? ''
  return Object.values(state.schedule.lists)
    .filter((l) => l.draft !== undefined && (l.state !== 'DRAFT' ? l.draft.assignedAtISO !== undefined : l.removedAtISO !== undefined))
    .sort((a, b) => doneAt(b).localeCompare(doneAt(a)) || a.id.localeCompare(b.id))
}

/**
 * Who could take a Draft List, by availability alone (US-01.6.3's note, the
 * availability finder's reading): the active anaesthetists in roster order,
 * split into free, not available and occupied. No preference or tier
 * knowledge: Phase 17's helper ranks it in the Admin sheet.
 */
export function draftListAvailabilityFor(
  state: { schedule: Pick<AppState['schedule'], 'lists' | 'slots'>; masters: Pick<AppState['masters'], 'anaesthetists' | 'slotStatuses'> },
  listId: string,
): DraftListAvailability | undefined {
  const list = state.schedule.lists[listId]
  if (!isDraftList(list)) return undefined
  const roster = Object.values(state.masters.anaesthetists).sort((a, b) => rosterRank(a.registrationNumber) - rosterRank(b.registrationNumber) || a.registrationNumber.localeCompare(b.registrationNumber))
  const listIdBySlot = new Map<string, string>()
  for (const [slotId, l] of listIndexBySlot(state.schedule.lists)) listIdBySlot.set(slotId, l.id)
  return draftListAvailability({ list, anaesthetists: roster, slots: state.schedule.slots, listIdBySlot, statuses: state.masters.slotStatuses })
}

const bookingCountCache = new WeakMap<object, Map<string, number>>()

/** Active (not cancelled) Bookings per List id: the grid's block counts, the band and the rail card (US-13.1.1). */
export function bookingCountsByList(bookings: Readonly<Record<string, Booking>>): Map<string, number> {
  const cached = bookingCountCache.get(bookings)
  if (cached !== undefined) return cached
  const counts = new Map<string, number>()
  for (const b of Object.values(bookings)) if (b.cancellation === undefined) counts.set(b.listId, (counts.get(b.listId) ?? 0) + 1)
  bookingCountCache.set(bookings, counts)
  return counts
}

/** The slices a List move reads (catch-up Phase 32; `domain/listMoves.ts`): the one builder. */
export function moveInputOf(state: Pick<AppState, 'schedule' | 'masters'>): ListMoveInput {
  return { lists: state.schedule.lists, slots: state.schedule.slots, anaesthetists: state.masters.anaesthetists, slotStatuses: state.masters.slotStatuses, occupied: occupiedSlotIdsOf(state.schedule.lists) }
}

/** The slices a single-Booking move reads (catch-up Phase 32a): Phase 32's, plus the Bookings. No preference or tier. */
export function bookingMoveInputOf(state: Pick<AppState, 'schedule' | 'masters'>): BookingMoveInput {
  return { ...moveInputOf(state), bookings: state.schedule.bookings }
}

// ---------------------------------------------------------------------------
// The step rail (catch-up Phase 20; US-04.3.8, US-04.3.2, US-04.3.4)
// ---------------------------------------------------------------------------

/** The masters the step rail reads. */
export function railMastersOf(state: Pick<AppState, 'masters'>): RailMasters {
  const m = state.masters
  return { contracts: m.contracts, parties: m.parties, fundingTags: m.fundingTags, rvgGroups: m.rvgGroups, surgeons: m.surgeons }
}

/** A List as the step rail sees it: its date, billing hospital (never AA rooms), surgeon and anaesthetist. */
export function railContextForList(state: Pick<AppState, 'masters'>, list: List, booking?: Pick<Booking, 'funderPartyId'>): RailContext {
  const ctx: RailContext = { listDateISO: list.dateISO }
  // The Booking's funder only marks a path "Suggested" (catch-up Phase 21, US-04.3.10).
  if (booking?.funderPartyId !== undefined) ctx.funderPartyId = booking.funderPartyId
  const hospitalId = listHospitalFor(list, state.masters.hospitals).listHospitalId
  if (hospitalId !== undefined) ctx.hospitalId = hospitalId
  if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId
  if (list.anaesthetistId !== undefined) ctx.anaesthetistId = list.anaesthetistId
  return ctx
}

/** The rail context of the List a Procedure sits on. */
export function railContextForProcedure(state: Pick<AppState, 'masters' | 'schedule'>, procedureId: string): RailContext | undefined {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  return list !== undefined ? railContextForList(state, list, booking) : undefined
}

/** The rail for a Procedure at the given answers (default: its answers so far, or its Contract's). */
export function contractRailForProcedure(
  state: Pick<AppState, 'masters' | 'schedule'>,
  procedureId: string,
  answers: RailAnswers | undefined,
  opts: { query?: string; actor: RailActor },
): ContractRailView | undefined {
  const ctx = railContextForProcedure(state, procedureId)
  if (ctx === undefined) return undefined
  return contractRailFor(railMastersOf(state), ctx, answers, opts)
}

/** The rail for a Booking being created on a List (the creation forms' twin). */
export function contractRailForNewBooking(
  state: Pick<AppState, 'masters' | 'schedule'>,
  listId: string,
  answers: RailAnswers | undefined,
  opts: { query?: string; actor: RailActor },
): ContractRailView | undefined {
  const list = state.schedule.lists[listId]
  if (list === undefined) return undefined
  return contractRailFor(railMastersOf(state), railContextForList(state, list), answers, opts)
}

/** Where the rail opens for a Procedure: its answers so far, else the answers its Contract implies. */
export function railStartFor(state: Pick<AppState, 'masters' | 'schedule'>, procedureId: string): RailAnswers | undefined {
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return undefined
  if (procedure.governingContractId !== undefined) return railAnswersFor(state.masters, procedure.governingContractId)
  return procedure.railAnswers
}

/** Derived, never stored (US-03.3.1, US-04.3.4): the RVG code is the anaesthetist's to fill in. */
export function rvgCodeToFillFor(state: Pick<AppState, 'masters' | 'schedule'>, procedureId: string): boolean {
  const procedure = state.schedule.procedures[procedureId]
  return procedure !== undefined && rvgCodeToFill(state.masters, procedure)
}

/** Who a Procedure bills, by id: the store's wrapper of the one rule, `billablePartyForProcedure` (catch-up Phase 21). */
export function billablePartyForProcedureId(state: Pick<AppState, 'masters' | 'schedule'>, procedureId: string): CounterpartyRef | undefined {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (procedure === undefined || booking === undefined) return undefined
  const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  return billablePartyForProcedure(contract, procedure, booking.patientId, state.masters.parties)
}

export interface NeedsInvoiceDestinationRow {
  bookingId: string
  procedureId: string
  listId: string
  dateISO: string
  session: List['session']
  hospitalId?: string
  patientName: string
  /** "Patient › Standard", or "Not started". */
  answersText: string
}

/**
 * The office's "Needs an invoice destination" list (US-04.3.4): every
 * non-cancelled Booking with a Procedure that has no Contract, on any date, in
 * date and session order, one row per Booking (its first such Procedure), with
 * the answers so far. Draft Lists (no anaesthetist yet) are the office's own
 * queue and are left off.
 */
export function needsInvoiceDestinationBookings(state: Pick<AppState, 'masters' | 'schedule'>): NeedsInvoiceDestinationRow[] {
  const rows: NeedsInvoiceDestinationRow[] = []
  const seen = new Set<string>()
  const procedures = Object.values(state.schedule.procedures).sort((a, b) => a.id.localeCompare(b.id))
  for (const procedure of procedures) {
    if (procedure.governingContractId !== undefined || seen.has(procedure.bookingId)) continue
    const booking = state.schedule.bookings[procedure.bookingId]
    if (booking === undefined || booking.cancellation !== undefined) continue
    const list = state.schedule.lists[booking.listId]
    if (list === undefined || list.anaesthetistId === undefined || list.removedAtISO !== undefined) continue
    seen.add(booking.id)
    const ctx = railContextForList(state, list)
    const row: NeedsInvoiceDestinationRow = {
      bookingId: booking.id,
      procedureId: procedure.id,
      listId: list.id,
      dateISO: list.dateISO,
      session: list.session,
      patientName: state.masters.patients[booking.patientId]?.name ?? booking.patientId,
      answersText: railAnswersText(state.masters, ctx, procedure.railAnswers),
    }
    if (list.hospitalId !== undefined) row.hospitalId = list.hospitalId
    rows.push(row)
  }
  return rows.sort(
    (a, b) =>
      a.dateISO.localeCompare(b.dateISO) ||
      compareSessions(a.session, b.session) ||
      a.bookingId.localeCompare(b.bookingId) ||
      a.procedureId.localeCompare(b.procedureId),
  )
}

/** The quiet cue on a List row (catch-up Phase 20): a Procedure needs an invoice destination, or its RVG code. */
export function bookingContractCue(state: Pick<AppState, 'masters' | 'schedule'>, bookingId: string): string | undefined {
  const procs = proceduresForBooking(state, bookingId)
  if (procs.some((p) => p.governingContractId === undefined)) return 'Needs an invoice destination'
  if (procs.some((p) => rvgCodeToFillFor(state, p.id))) return 'RVG code to fill in'
  return undefined
}

/**
 * One Procedure's procedure stack view (catch-up Phase 20a; US-03.1.9): the
 * store's masters, Booking and List handed to the one pure module. The
 * `ProcedureStack` component renders what this returns and derives nothing.
 */
export function procedureStackViewFor(
  state: Pick<AppState, 'masters'> & {
    schedule: Pick<AppState['schedule'], 'procedures' | 'bookings' | 'lists'> & Partial<Pick<AppState['schedule'], 'billingLines'>>
    billing?: Pick<AppState['billing'], 'invoices' | 'invoiceLines'> & Partial<Pick<AppState['billing'], 'locks' | 'ledger' | 'transfers'>>
  },
  procedureId: string,
  surface: StackSurface,
): ProcedureStackView | undefined {
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return undefined
  const booking = state.schedule.bookings[procedure.bookingId]
  if (booking === undefined) return undefined
  const list = state.schedule.lists[booking.listId]
  // A locked Booking's Contract part reads its snapshot (catch-up Phase 25, `lockViewFor`): never the masters.
  const lock = state.billing?.locks?.[booking.id]
  const snapshot = lock?.state === 'locked' ? lock.procedures.find((p) => p.procedureId === procedureId) : undefined
  if (lock !== undefined && snapshot?.contract !== undefined) {
    const locked = lockViewFor(lock, procedureId).procedure!
    const view = procedureStackView(procedure, {
      ...(procedure.split !== undefined ? { splitFeeExGst: snapshot.price } : {}),
      contracts: { ...state.masters.contracts, [snapshot.contract.id]: snapshot.contract },
      parties: state.masters.parties,
      rvgGroups: snapshot.rvgGroup !== undefined ? { ...state.masters.rvgGroups, [snapshot.rvgGroup.id]: snapshot.rvgGroup } : state.masters.rvgGroups,
      booking,
      dateISO: lock.pricingDateISO,
      surface,
      nameOf: (ref) => lock.parties.find((p) => p.ref.kind === ref.kind && p.ref.id === ref.id)?.name ?? counterpartyName(state, ref, booking.id),
    })
    if (view?.contract == null) return view
    return {
      ...view,
      contract: {
        ...view.contract,
        holderName: locked.holderName ?? view.contract.holderName,
        ...(view.contract.invoiced !== null && locked.billedName !== undefined ? { invoiced: { ...view.contract.invoiced, name: locked.billedName } } : {}),
        locked: true,
      },
    }
  }
  // A split's summary needs the fee as the run computes it (catch-up Phase 22).
  let splitFeeExGst: number | null | undefined
  if (procedure.split !== undefined) {
    // The held amounts too, where the caller has the billing slice (catch-up Phase 24), as the run reads them.
    const schedule = { lists: state.schedule.lists, billingLines: state.schedule.billingLines ?? {}, bookings: state.schedule.bookings, procedures: state.schedule.procedures }
    const ctx = billingContextForBooking({ masters: state.masters, schedule, ...(state.billing !== undefined ? { billing: state.billing } : {}) }, booking)
    const fee = ctx !== undefined && procedure.governingContractId !== undefined ? feeIn(bookingFeesFor(proceduresForBooking(state, booking.id), ctx), procedure.id) : undefined
    splitFeeExGst = fee === undefined || fee.needsPrice ? null : fee.total
  }
  // A prepaid Procedure's basis reads its prepaid amount (catch-up Phase 27, US-03.1.8): needs the billing slice.
  const prepay =
    state.billing?.ledger !== undefined && state.schedule.billingLines !== undefined
      ? prepaymentForProcedure(
          // The transfers only say where the money is (catch-up Phase 27a), which the stack never reads.
          { ...state, billing: { ...state.billing, transfers: state.billing.transfers ?? {} } } as Parameters<typeof prepaymentForProcedure>[0],
          procedureId,
        )
      : undefined
  const prepaid = isStillPrepaid(prepay) ? { amount: prepay.amount.kind === 'priced' ? prepay.amount.amount : null, status: prepay.status } : undefined
  return procedureStackView(procedure, {
    ...(splitFeeExGst !== undefined ? { splitFeeExGst } : {}),
    ...(prepaid !== undefined ? { prepaid } : {}),
    contracts: state.masters.contracts,
    parties: state.masters.parties,
    rvgGroups: state.masters.rvgGroups,
    booking,
    dateISO: list?.dateISO ?? '',
    surface,
    nameOf: (ref) => counterpartyName(state, ref, booking.id),
  })
}

/**
 * The anaesthetist's own profile (catch-up Phase 26; US-12.1.4, US-12.1.1):
 * what the mobile More tab and the web Profile page show. The rate per unit
 * (the one field the anaesthetist edits), contact, registration, the HPI CPN
 * as stored and the bank account masked. Reads `masters` only, never the
 * office-only slice (no tier, no pairing preference). It builds a new object:
 * screens select the raw record and derive this with `useMemo`.
 */
export interface AnaesthetistProfile {
  registrationNumber: string
  name: string
  unitValue: number
  phone: string
  email: string
  hpiId: string
  bankAccountName: string
  /** Masked, e.g. `99-0101-•••••21-00`; the full number is the office's alone. */
  bankAccountMasked: string
}

export function profileFor(state: { masters: Pick<AppState['masters'], 'anaesthetists'> }, registrationNumber: string): AnaesthetistProfile | null {
  const a = state.masters.anaesthetists[registrationNumber]
  if (a === undefined) return null
  return {
    registrationNumber: a.registrationNumber,
    name: a.name,
    unitValue: a.unitValue,
    phone: a.phone,
    email: a.email,
    hpiId: a.hpiId,
    bankAccountName: a.bankAccount.accountName,
    bankAccountMasked: maskBankAccount(a.bankAccount.accountNumber),
  }
}

// ---------------------------------------------------------------------------
// The update email (catch-up Phase 35; US-02.3.3, OQ-127, D74)
// ---------------------------------------------------------------------------

/** Who the composer sends to, and the office address the admin switched to (one of the alternatives). */
export interface UpdateEmailRecipientChoice {
  sendTo: UpdateEmailRecipient
  officeEmail?: string
}

/**
 * The update email's To: one surgeon-side address (the List's sender, else
 * the surgeon's first office contact), the hospital's contact email, or both.
 * `alternatives` are the surgeon's other office addresses the composer offers
 * to switch to (never filled in together). `reason` says why an address is
 * missing; an empty To is valid (the admin types it in the mail client).
 * Built on `officeAddressFor` only: no lookup of its own.
 */
export function updateEmailRecipients(
  state: { schedule: Pick<AppState['schedule'], 'bookings' | 'lists'>; masters: Pick<AppState['masters'], 'surgeons' | 'hospitals'> },
  subject: UpdateEmailSubject,
  choice: UpdateEmailRecipientChoice,
): { to: string; alternatives: { email: string; label: string }[]; reason?: string } {
  const listId = subject.kind === 'list' ? subject.listId : state.schedule.bookings[subject.bookingId]?.listId
  const list = listId !== undefined ? state.schedule.lists[listId] : undefined
  const reasons: string[] = []
  const wantsOffice = choice.sendTo === 'office' || choice.sendTo === 'both'
  const wantsHospital = choice.sendTo === 'hospital' || choice.sendTo === 'both'

  let office = ''
  let alternatives: { email: string; label: string }[] = []
  if (wantsOffice) {
    const surgeonId = list?.surgeonId
    const surgeon = surgeonId !== undefined && surgeonId !== '' ? state.masters.surgeons[surgeonId] : undefined
    if (list === undefined) {
      reasons.push('No surgeon on this List.')
    } else {
      // The List's PDF sender counts even with no surgeon on the List (it is the office that sent it).
      const found = officeAddressFor(state.masters, surgeon?.id ?? '', list)
      const all = found.to !== null ? [found.to, ...found.others] : []
      const picked = all.find((a) => choice.officeEmail !== undefined && a.email.toLowerCase() === choice.officeEmail.trim().toLowerCase()) ?? all[0]
      if (picked === undefined) {
        reasons.push(surgeon === undefined ? 'No surgeon on this List.' : `No contact email held for ${titledSurname(surgeon.name)}'s office.`)
      } else {
        office = picked.email
        alternatives = all
          .filter((a) => a !== picked)
          .map((a) => ({ email: a.email, label: a.source === 'listSender' ? 'Sent the List' : (a.name ?? 'Office contact') }))
      }
    }
  }

  let hospital = ''
  if (wantsHospital) {
    const h = list !== undefined ? state.masters.hospitals[list.hospitalId] : undefined
    const email = h?.contactEmail?.trim() ?? ''
    if (email === '') reasons.push(`No contact email held for ${h?.name ?? 'the hospital'}.`)
    else hospital = email
  }

  const to = [office, hospital].filter((a) => a !== '').join(', ')
  const reason = reasons.length > 0 ? `${reasons.join(' ')}${to === '' ? ' To will be left empty.' : ''}` : undefined
  return { to, alternatives, ...(reason !== undefined ? { reason } : {}) }
}

/** The picker's rows for a Booking or a List, read from the whole audit (`pickableChanges`). */
export function pickableChangesFor(state: Pick<AppState, 'audit' | 'schedule' | 'masters'>, subject: UpdateEmailSubject): PickableChange[] {
  return pickableChanges(state.audit, subject, { ...state.schedule, ...state.masters })
}

// ── Pickers offer active masters only (catch-up Phase 42, US-13.4.1) ────────
// A picker offers the active records, plus the current value when it is
// retired (shown "(retired)" via `retiredLabel`), so an edit never silently
// drops a stored reference. Display paths keep reading `state.masters`.
// Plain functions: components select the stable record objects and derive
// inside a useMemo.

type MastersOf<K extends keyof AppState['masters']> = { masters: Pick<AppState['masters'], K> }
type MasterRow<K extends 'hospitals' | 'surgeons' | 'surgeonGroups' | 'modifiers'> = AppState['masters'][K][string]

/** Hospitals a picker offers (retirement only; AA rooms filters stay on top). */
export function activeHospitals(state: MastersOf<'hospitals'>, keepId?: string | null): MasterRow<'hospitals'>[] {
  return activeOnly(state.masters.hospitals, keepId)
}

/** Surgeons a picker offers. */
export function activeSurgeons(state: MastersOf<'surgeons'>, keepId?: string | null): MasterRow<'surgeons'>[] {
  return activeOnly(state.masters.surgeons, keepId)
}

/** Surgeon groups a picker offers. */
export function activeGroups(state: MastersOf<'surgeonGroups'>, keepId?: string | null): MasterRow<'surgeonGroups'>[] {
  return activeOnly(state.masters.surgeonGroups, keepId)
}

/**
 * The modifiers a picker offers: every RVG modifier, and AA's own modifiers
 * unless retired. `keepId` (one id or several) keeps a retired AA modifier a
 * Procedure already claims, so its claim still shows and resolves.
 */
export function activeAaModifiers(state: MastersOf<'modifiers'>, keepId?: string | null | readonly string[]): MasterRow<'modifiers'>[] {
  const keep = new Set<string>(keepId === undefined || keepId === null ? [] : typeof keepId === 'string' ? [keepId] : keepId)
  return Object.values(state.masters.modifiers).filter((m) => m.source !== 'aa' || !isRetired(m) || keep.has(m.id))
}
