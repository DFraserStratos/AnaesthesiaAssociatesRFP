/**
 * Prepayment as the apps read it (catch-up Phase 27; US-06.3.1, US-06.3.2,
 * US-06.3.4, US-06.3.5, US-03.1.8). The rules are `domain/billing/prepayment.ts`;
 * this file feeds them from the store and reads money from the billing MIRROR
 * (convention 9), never Xero.
 *
 * The re-check is the derivation (US-06.3.5): nothing is stored, so a change
 * of Procedures, of a Procedure's Contract or of its payer regroups and
 * re-states the prepayment at once. A move changes no Contract, so it
 * changes nothing here.
 */

import type { Booking, CounterpartyRef, InvoiceId, Procedure, ProcedureId } from '../domain/types'
import {
  isPrepaidContract,
  leastSettled,
  prepaymentGroupsFor,
  prepaymentStatusOf,
  type IssuedPrepayment,
  type PrepaidAmount,
  type PrepaymentGroup,
  type PrepaymentGroupLine,
  type PrepaymentStatus,
} from '../domain/billing/prepayment'
import { bookingFeesFor } from '../domain/billing/validateBookingForBilling'
import { roundToCents, toCents } from '../domain/billing/money'
import { heldBookingIds, holdingBalance, holdingEntries, transferOfCase, type HoldingEntry } from '../domain/billing/prepayHolding'
import { daysBetween } from '../domain/dateDays'
import { billingContextForBooking, counterpartyName, patientNameFor, prePaymentInvoicesForBooking, proceduresForBooking } from './selectors'
import { useMemo } from 'react'
import { useAppStore, type AppState } from './appStore'

export type PrepaymentState = Pick<AppState, 'schedule' | 'billing' | 'masters'>

/** One payer group as the screens read it. */
export interface PrepaymentGroupView {
  key: string
  payer: CounterpartyRef
  payerKey: string
  /** The payer by name, as the Procedure's Paid by names them. */
  payerName: string
  procedureIds: ProcedureId[]
  lines: PrepaymentGroupLine[]
  status: PrepaymentStatus
  /** Ex GST; null while a Procedure has no price. */
  amount: number | null
  ready: boolean
  /** Why it is not ready (the strip's disabled reason, the panel's way forward). */
  notReadyReason?: string
  invoiceId?: InvoiceId
  invoiceNumber?: string
  /** The issued invoice's total with GST (0 while pending). */
  invoicedTotal: number
  /** Received on it, from the mirror (0 while pending). */
  receivedTotal: number
  /** Where its money is (catch-up Phase 27a): held in the AA Holding account, transferred, or paid out. */
  holding?: PrepaymentHolding
}

export interface BookingPrepayment {
  groups: PrepaymentGroupView[]
  /** `none`, or the least settled group's status (the triangle and the rail pill). */
  status: PrepaymentStatus | 'none'
}

const NONE: BookingPrepayment = { groups: [], status: 'none' }

/** Whether the Booking could have a prepayment at all: a prepaid Procedure or an issued prepayment invoice. Cheap. */
function mayHavePrepayment(state: PrepaymentState, booking: Booking, procedures: readonly Procedure[]): boolean {
  if (procedures.some((p) => p.governingContractId !== undefined && isPrepaidContract(state.masters.contracts[p.governingContractId]))) return true
  return Object.values(state.billing.invoices).some((i) => i.bookingId === booking.id && i.kind === 'prePayment')
}

function issuedFor(state: PrepaymentState, bookingId: string): IssuedPrepayment[] {
  return prePaymentInvoicesForBooking(state, bookingId).map((inv) => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    payer: inv.counterparty,
    lines: Object.values(state.billing.invoiceLines)
      .filter((l) => l.invoiceId === inv.id && l.procedureId !== undefined)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map((l) => ({ procedureId: l.procedureId!, ...(l.contractId !== undefined ? { contractId: l.contractId } : {}), amount: l.amount })),
  }))
}

/** The raw payer groups for a Booking (the actions build their invoice from these). */
export function prepaymentGroupsForBooking(state: PrepaymentState, bookingId: string): PrepaymentGroup[] {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return []
  const procedures = proceduresForBooking(state, bookingId)
  if (!mayHavePrepayment(state, booking, procedures)) return []
  // 24's price now, the Booking priced once under the multi-procedure rule (23).
  const ctx = billingContextForBooking(state, booking)
  const priced = ctx !== undefined ? bookingFeesFor(procedures, ctx) : undefined
  const priceOf = (p: Procedure): number | null => {
    if (priced === undefined || priced.kind === 'structural') return p.enteredPrice ?? null
    const fee = priced.fees[p.id]
    if (fee === undefined || fee.needsPrice || fee.price.status !== 'priced') return null
    // The Procedure's own price (the range in force, or the amount typed), never its captured add-on lines (US-06.2.2).
    return fee.price.heldBy === null && fee.price.computed !== undefined ? fee.price.computed.total : fee.price.price
  }
  const patient = state.masters.patients[booking.patientId]
  return prepaymentGroupsFor({
    booking,
    procedures,
    contracts: state.masters.contracts,
    issued: issuedFor(state, bookingId),
    priceOf,
    ...(patient !== undefined ? { patient } : {}),
  })
}

/**
 * The ONE derived prepayment status for a Booking, per payer group
 * (US-06.3.2): the warning rule, the panel, the rail card, the strip and the
 * apps read it. Never a completion gate (D5). A receipt re-states it with no
 * hook (US-06.3.4).
 */
export function prepaymentStatusFor(state: PrepaymentState, bookingId: string): BookingPrepayment {
  const groups = prepaymentGroupsForBooking(state, bookingId)
  if (groups.length === 0) return NONE
  const views = groups.map((g): PrepaymentGroupView => {
    const invoice = g.invoice !== undefined ? state.billing.invoices[g.invoice.invoiceId] : undefined
    const invoicedTotal = invoice?.total ?? 0
    const receivedTotal = invoice !== undefined ? roundToCents(Object.values(state.billing.cases).filter((c) => c.invoiceId === invoice.id).reduce((s, c) => s + c.receivedAmount, 0)) : 0
    const holding = invoice !== undefined ? prepaymentHoldingFor(state, invoice.id) : undefined
    return {
      key: g.key,
      payer: g.payer,
      payerKey: g.payerKey,
      payerName: counterpartyName(state, g.payer, bookingId),
      procedureIds: g.procedureIds,
      lines: g.lines,
      status: prepaymentStatusOf(g.state, { total: invoicedTotal, received: receivedTotal }),
      amount: g.amount,
      ready: g.ready,
      ...(g.notReadyReason !== undefined ? { notReadyReason: g.notReadyReason } : {}),
      ...(invoice !== undefined ? { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber } : {}),
      invoicedTotal,
      receivedTotal,
      ...(holding !== undefined ? { holding } : {}),
    }
  })
  return { groups: views, status: leastSettled(views.map((v) => v.status)) }
}

/** Whether the Booking has a prepaid Procedure still owed or awaiting approval (derived; no gate, D5). */
export function bookingRequiresPrepayment(state: PrepaymentState, bookingId: string): boolean {
  return prepaymentStatusFor(state, bookingId).groups.some((g) => g.status !== 'notNeeded')
}

/** What one Procedure's prepayment is (US-03.1.8): its amount, status, invoice and payer. */
export interface ProcedurePrepayment {
  groupKey: string
  status: PrepaymentStatus
  amount: PrepaidAmount
  payerName: string
  invoiceId?: InvoiceId
  invoiceNumber?: string
  /** Where its money is (catch-up Phase 27a), once anything was received or it was transferred. */
  holding?: PrepaymentHolding
}

/**
 * Where a sent prepayment's money is (catch-up Phase 27a; US-06.5.1): held in
 * the AA Holding account until the List is authorised, then transferred to the
 * anaesthetist who did it and paid out by the payables run. Read from the
 * mirror only.
 */
export interface PrepaymentHolding {
  state: 'held' | 'transferred' | 'paidOut'
  /** Transferred and paid out: who did the List. */
  toAnaesthetistId?: string
  released: number
  disbursed: number
}

export function prepaymentHoldingFor(state: Pick<AppState, 'billing'>, invoiceId: InvoiceId): PrepaymentHolding | undefined {
  const collect = Object.values(state.billing.cases).find((c) => c.invoiceId === invoiceId && c.prepayLeg === 'collect')
  if (collect === undefined) return undefined
  const transfer = transferOfCase(state.billing.transfers, collect.id)
  if (transfer === undefined) return toCents(collect.receivedAmount) > 0 ? { state: 'held', released: 0, disbursed: 0 } : undefined
  const paidOut = toCents(transfer.disbursed) >= toCents(transfer.amount)
  return { state: paidOut ? 'paidOut' : 'transferred', toAnaesthetistId: transfer.toAnaesthetistId, released: transfer.released, disbursed: transfer.disbursed }
}

/**
 * The one selector answering "is this Procedure prepaid, at what amount, on
 * which invoice, paid or not" (the panel, the units row, 20a's stack, 24's
 * gate). The amount is the issued invoice's line once generated, else the
 * Procedure's price now. Undefined when the Procedure is in no group.
 */
export function prepaymentForProcedure(state: PrepaymentState, procedureId: string): ProcedurePrepayment | undefined {
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return undefined
  const status = prepaymentStatusFor(state, procedure.bookingId)
  // A later pending group wins over an issued one the Procedure has left (it is then on a new Contract).
  const holding = [...status.groups].reverse().find((g) => g.lines.some((l) => l.procedureId === procedureId && l.stillPrepaid)) ?? status.groups.find((g) => g.procedureIds.includes(procedureId))
  if (holding === undefined) return undefined
  const line = holding.lines.find((l) => l.procedureId === procedureId)!
  const money = holding.holding
  return {
    groupKey: holding.key,
    // A Procedure that has left its sent invoice's prepaid Contract reads "no longer needed" itself.
    status: line.stillPrepaid ? holding.status : 'notNeeded',
    amount: line.amount,
    payerName: holding.payerName,
    ...(holding.invoiceId !== undefined ? { invoiceId: holding.invoiceId, invoiceNumber: holding.invoiceNumber! } : {}),
    ...(money !== undefined ? { holding: money } : {}),
  }
}

/** Whether a Procedure is prepaid now (the units row, the price card, the stack basis, the split refusal): one test. */
export function isStillPrepaid(prepayment: ProcedurePrepayment | undefined): prepayment is ProcedurePrepayment {
  return prepayment !== undefined && prepayment.status !== 'notNeeded'
}

/** A prepayment on a Draft List waits for its anaesthetist (the invoice names them; the pair needs a payee). */
export const ASSIGN_THE_LIST_FIRST = 'Assign the List to an anaesthetist first'

/** One Booking and payer awaiting approval (the Invoices strip). */
export interface PendingPrepaymentRow {
  bookingId: string
  listId: string
  dateISO: string
  anaesthetistId?: string
  patientName: string
  payerKey: string
  payerName: string
  amount: number | null
  procedureIds: ProcedureId[]
  ready: boolean
  notReadyReason?: string
}

function liveBookings(state: PrepaymentState): { booking: Booking; listId: string; dateISO: string; anaesthetistId?: string }[] {
  const out: { booking: Booking; listId: string; dateISO: string; anaesthetistId?: string }[] = []
  for (const booking of Object.values(state.schedule.bookings)) {
    if (booking.cancellation !== undefined) continue
    const list = state.schedule.lists[booking.listId]
    if (list === undefined || list.state === 'AUTHORISED' || list.billedAtISO !== undefined) continue
    out.push({ booking, listId: list.id, dateISO: list.dateISO, ...(list.anaesthetistId !== undefined ? { anaesthetistId: list.anaesthetistId } : {}) })
  }
  return out.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.booking.id.localeCompare(b.booking.id))
}

/** Every payer group awaiting approval on a List not yet AUTHORISED, by date: one row per Booking and payer. */
export function pendingPrepayments(state: PrepaymentState): PendingPrepaymentRow[] {
  const rows: PendingPrepaymentRow[] = []
  for (const { booking, listId, dateISO, anaesthetistId } of liveBookings(state)) {
    for (const g of prepaymentStatusFor(state, booking.id).groups) {
      if (g.status !== 'awaitingApproval') continue
      rows.push({
        bookingId: booking.id,
        listId,
        dateISO,
        ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
        patientName: patientNameFor(state, booking.patientId),
        payerKey: g.payerKey,
        payerName: g.payerName,
        amount: g.amount,
        procedureIds: g.procedureIds,
        // A Draft List has no anaesthetist to name or to pair the payable with: it waits for one.
        ready: g.ready && anaesthetistId !== undefined,
        ...(anaesthetistId === undefined ? { notReadyReason: ASSIGN_THE_LIST_FIRST } : g.notReadyReason !== undefined ? { notReadyReason: g.notReadyReason } : {}),
      })
    }
  }
  return rows
}

/** One upcoming prepaid Booking and payer (the Pre-payments rail card). */
export interface UpcomingPrepaymentRow extends PendingPrepaymentRow {
  status: PrepaymentStatus
  daysToGo: number
  invoiceId?: InvoiceId
  /** The issued invoice's total with GST, and what has been received on it (0 while pending). */
  invoicedTotal: number
  receivedTotal: number
}

/** Every prepaid Booking on a List not yet AUTHORISED, one row per payer group, with days to go from the demo clock. */
export function upcomingPrepayments(state: PrepaymentState & Pick<AppState, 'clock'>): UpcomingPrepaymentRow[] {
  const rows: UpcomingPrepaymentRow[] = []
  for (const { booking, listId, dateISO, anaesthetistId } of liveBookings(state)) {
    for (const g of prepaymentStatusFor(state, booking.id).groups) {
      rows.push({
        bookingId: booking.id,
        listId,
        dateISO,
        ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
        patientName: patientNameFor(state, booking.patientId),
        payerKey: g.payerKey,
        payerName: g.payerName,
        amount: g.amount,
        procedureIds: g.procedureIds,
        ready: g.ready,
        status: g.status,
        daysToGo: daysBetween(state.clock.todayISO, dateISO),
        invoicedTotal: g.invoicedTotal,
        receivedTotal: g.receivedTotal,
        ...(g.invoiceId !== undefined ? { invoiceId: g.invoiceId } : {}),
      })
    }
  }
  return rows
}


// ---------------------------------------------------------------------------
// Hooks for the screens (session 2): the derived views, memoised on the slices
// they read, so a screen never re-derives on an unrelated change and never
// returns a fresh object to the store's equality check.
// ---------------------------------------------------------------------------

/** One Booking's prepayment, per payer group (the panel, the units row). */
export function useBookingPrepayment(bookingId: string): BookingPrepayment {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => prepaymentStatusFor({ schedule, billing, masters }, bookingId), [schedule, billing, masters, bookingId])
}

/** One Procedure's prepayment, or undefined (the units row, the price card). */
export function useProcedurePrepayment(procedureId: string): ProcedurePrepayment | undefined {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => prepaymentForProcedure({ schedule, billing, masters }, procedureId), [schedule, billing, masters, procedureId])
}

/** Every payer group awaiting approval (the Invoices strip). */
export function usePendingPrepayments(): PendingPrepaymentRow[] {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => pendingPrepayments({ schedule, billing, masters }), [schedule, billing, masters])
}

/** Every upcoming prepaid Booking and payer (the rail card). */
export function useUpcomingPrepayments(): UpcomingPrepaymentRow[] {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  return useMemo(() => upcomingPrepayments({ schedule, billing, masters, clock }), [schedule, billing, masters, clock])
}

/** One row of the AA Holding account's entries table, with what the screen names. */
export interface HoldingAccountRow extends HoldingEntry {
  patientName: string
  /** The Booking's List date (its Admin detail route). */
  dateISO: string | undefined
  anaesthetistName?: string
}

export interface HoldingAccountView {
  balance: number
  /** Prepaid Bookings it holds money for now. */
  bookingsCovered: number
  /** Newest first, as the screen lists them. */
  rows: HoldingAccountRow[]
}

/**
 * The AA Holding account as Admin reads it (catch-up Phase 27a; US-06.5.1):
 * its balance, the Bookings it covers and its entries, all derived from the
 * mirror by `prepayHolding.ts`, never stored.
 */
export function holdingAccountView(state: Pick<AppState, 'schedule' | 'billing' | 'masters'>): HoldingAccountView {
  const entries = holdingEntries(state.billing)
  const rows = entries
    .map((e): HoldingAccountRow => {
      const booking = state.schedule.bookings[e.bookingId]
      const name = e.anaesthetistId !== undefined ? state.masters.anaesthetists[e.anaesthetistId]?.name : undefined
      return {
        ...e,
        patientName: booking !== undefined ? patientNameFor(state, booking.patientId) : e.bookingId,
        dateISO: booking !== undefined ? state.schedule.lists[booking.listId]?.dateISO : undefined,
        ...(name !== undefined ? { anaesthetistName: name } : {}),
      }
    })
    .reverse()
  return { balance: holdingBalance(entries), bookingsCovered: heldBookingIds(entries).length, rows }
}

export function useHoldingAccount(): HoldingAccountView {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => holdingAccountView({ schedule, billing, masters }), [schedule, billing, masters])
}

/**
 * The re-check made visible (US-06.3.5): one line for a confirmation when a
 * change of Procedures, a Procedure's Contract or its payer changes the
 * prepayment, else null. Compares the status before and after the action; a
 * move changes no Contract, so it never produces one.
 */
export function prepaymentRecheckLine(before: BookingPrepayment, after: BookingPrepayment): string | null {
  const issuedBefore = new Set(before.groups.flatMap((g) => (g.invoiceId !== undefined ? [g.invoiceId] : [])))
  const statusBefore = new Map(before.groups.map((g) => [g.key, g.status]))
  // A sent invoice whose Procedures have left it (41 settles it): never rewritten.
  if (after.groups.some((g) => (g.status === 'notNeeded' || g.status === 'changedAfterSending') && statusBefore.get(g.key) !== g.status)) {
    return 'Pre-payment invoice sent before this change'
  }
  // Generated at once with approval off.
  if (after.groups.some((g) => g.invoiceId !== undefined && !issuedBefore.has(g.invoiceId))) return 'Pre-payment now needed: sent'
  const pending = (p: BookingPrepayment) => {
    const out = new Map<string, PrepaymentGroupView>()
    for (const g of p.groups) if (g.status === 'awaitingApproval') for (const id of g.procedureIds) out.set(id, g)
    return out
  }
  const was = pending(before)
  const now = pending(after)
  for (const [id, g] of now) {
    const prior = was.get(id)
    if (prior === undefined) return 'Pre-payment now needed: awaiting approval'
    if (prior.payerKey !== g.payerKey) return `Pre-payment now goes to ${g.payerName}`
  }
  if ([...was.keys()].some((id) => !now.has(id))) return 'Pre-payment no longer needed'
  return null
}
