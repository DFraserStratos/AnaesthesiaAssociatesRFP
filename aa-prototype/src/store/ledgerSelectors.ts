/**
 * Reads of the internal ledger (catch-up Phase 36; US-08.3.2, US-08.3.4,
 * US-08.3.5, US-13.2.1, DM-22, DM-23). The ledger is AA's system of record:
 * every app money view reads it, never `state.xero` (the Xero simulation and
 * the demo payment picker are the only Xero readers). The maths is pure, in
 * `domain/billing/ledger.ts`; these feed it from the store.
 */

import { byIdOrder, openDivergenceByPair, pairByAccRecIndex, pairByInvoice, openQueueIndex, pairsByBooking } from './indexes'
import type { AnaesthetistId, BillingException, BookingLedgerPair, LedgerPair, LedgerReceipt, LedgerTransfer, UnmatchedReceipt, XeroDivergence, XeroQueueItem } from '../domain/types'
import { BCTI_COUNT_RULE, type BctiRecord } from '../domain/billing/bcti'
import {
  anaesthetistPosition,
  anaesthetistsOutOfBalance,
  bctiRecordsOf,
  isAaFeePair,
  isBookingPair,
  isInXero,
  ledgerPosition,
  pairStatusLabel,
  patientPosition,
  payeeAnaesthetistOf,
  transferOfPair,
  type AnaesthetistPosition,
  type LedgerCheck,
  type LedgerPosition,
  type PairStatus,
  type PatientPosition,
} from '../domain/billing/ledger'
import { roundToCents, toCents } from '../domain/billing/money'
import { drSurname } from '../shared/format'
import type { AppState } from './appStore'
import { anaesthetistsInRosterOrder, bookingsForList, counterpartyName, invoiceAddresseeName, patientNameFor } from './selectors'
import { gstReportFrom, gstReportMonths, type GstReportRow, type GstReportTotals } from '../domain/billing/gstReport'

type BillingState = Pick<AppState, 'billing'>

/** The kinds of state the ledger reads. */
export type LedgerState = Pick<AppState, 'billing' | 'schedule' | 'masters'>

function allPairs(state: BillingState): LedgerPair[] {
  return Object.values(state.billing.ledger)
}

function unmatchedList(state: BillingState): UnmatchedReceipt[] {
  return Object.values(state.billing.unmatchedReceipts)
}

/** Every Booking pair of a Booking (procedure and prepayment), in id order. */
export function pairsForBooking(state: BillingState, bookingId: string): BookingLedgerPair[] {
  // Indexed on the ledger map (catch-up Phase 43).
  return [...(pairsByBooking(state.billing.ledger).get(bookingId) ?? [])]
}

/** Every Booking pair for the Bookings on a List, in id order. */
export function pairsForList(state: Pick<AppState, 'schedule' | 'billing'>, listId: string): BookingLedgerPair[] {
  const byBooking = pairsByBooking(state.billing.ledger)
  return bookingsForList(state, listId)
    .flatMap((b) => byBooking.get(b.id) ?? [])
    .sort(byIdOrder)
}

/** The pair an invoice made. */
export function pairForInvoice(state: BillingState, invoiceId: string): BookingLedgerPair | undefined {
  const pair = pairByInvoice(state.billing.ledger).get(invoiceId)
  return pair !== undefined && isBookingPair(pair) ? pair : undefined
}

/** The pair a Xero ACCREC mirrors (the webhook's lookup). */
export function pairByAccRec(state: BillingState, accRecId: string): LedgerPair | undefined {
  return pairByAccRecIndex(state.billing.ledger).get(accRecId)
}

/** The transfer of a `prePayment` pair, once its List is authorised. */
export function transferForPair(state: BillingState, pairId: string): LedgerTransfer | undefined {
  return transferOfPair(state.billing.transfers, pairId)
}

/** A pair's derived status label (the monitor and the Ledger): "waiting for Xero" while its hand-off is queued (catch-up Phase 37). */
export function pairStatusOf(state: BillingState, pair: LedgerPair): PairStatus {
  return pairStatusLabel(pair, isBookingPair(pair) && pair.kind === 'prePayment' ? transferForPair(state, pair.id) : undefined, handoffQueuedFor(state, pair.id) !== undefined)
}

/** Billing-run failures not yet resolved, in id order (the monitor's exceptions). */
export function openBillingExceptions(state: BillingState): BillingException[] {
  return Object.values(state.billing.exceptions)
    .filter((x) => x.resolvedAtISO === undefined)
    .sort((a, b) => a.id.localeCompare(b.id))
}

// ---------------------------------------------------------------------------
// The Xero sync queue and divergence flags (catch-up Phase 37; EP-09)
// ---------------------------------------------------------------------------

/** Queue items not yet sent (waiting or alerted), in id order (the order the queue drains). */
export function openXeroQueueItems(state: BillingState): XeroQueueItem[] {
  return Object.values(state.billing.xeroQueue)
    .filter((q) => q.status !== 'sent')
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** The open hand-off queue item for a pair, if its mirror is waiting for Xero: its own hand-off, or a credit's correction that creates or reverses it (catch-up Phase 39). */
export function handoffQueuedFor(state: BillingState, pairId: string): XeroQueueItem | undefined {
  return openQueueIndex(state.billing.xeroQueue).handoffByPair.get(pairId)
}

/** The open correction queue item for a credit note, if its Xero reversal and new pairs wait for Xero (catch-up Phase 39). */
export function correctionQueuedFor(state: BillingState, creditNoteId: string): XeroQueueItem | undefined {
  return openQueueIndex(state.billing.xeroQueue).correctionByCreditNote.get(creditNoteId)
}

/** The open journal queue item for a transfer (27a's journal waiting for Xero). */
export function journalQueuedFor(state: BillingState, transferId: string): XeroQueueItem | undefined {
  return openQueueIndex(state.billing.xeroQueue).journalByTransfer.get(transferId)
}

/** Divergences the poll flagged and the office has not resolved, in id order. */
export function openXeroDivergences(state: BillingState): XeroDivergence[] {
  return Object.values(state.billing.xeroDivergences)
    .filter((d) => d.status === 'open')
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** The open divergence on a pair, if the poll flagged one. */
export function openDivergenceFor(state: BillingState, pairId: string): XeroDivergence | undefined {
  return openDivergenceByPair(state.billing.xeroDivergences).get(pairId)
}

export type XeroQueueStatusLabel = 'Waiting' | 'Retrying' | 'Alert raised' | 'Sent'

/** One queue item as the monitor shows it, labelled from the ledger alone. */
export interface XeroQueueRow {
  item: XeroQueueItem
  /** "Hand off AA-2026-0012", "Sync payment on AA-2026-0006", "Record disbursement on AA-2026-0005-P", "Reconciliation poll". */
  what: string
  status: XeroQueueStatusLabel
  /** The pair (or the transfer's prepayment pair) it concerns, for the monitor's List mapping. */
  pairId?: string
  /** The anaesthetist the pair pays, for the monitor's anaesthetist filter. */
  anaesthetistId?: AnaesthetistId
}

export interface XeroQueueView {
  /** Waiting and alerted items, in the order they drain. */
  open: XeroQueueRow[]
  /** Items already sent, the most recent first. */
  sent: XeroQueueRow[]
}

function queueWhat(state: BillingState, q: XeroQueueItem): { what: string; pairId?: string; anaesthetistId?: AnaesthetistId } {
  const transfer = q.target.transferId !== undefined ? state.billing.transfers[q.target.transferId] : undefined
  const pairId = q.target.pairId ?? transfer?.collectPairId
  const pair = pairId !== undefined ? state.billing.ledger[pairId] : undefined
  const anaesthetistId = transfer !== undefined ? payeeAnaesthetistOf(transfer.in) : pair !== undefined ? (isBookingPair(pair) ? (pair.anaesthetistId ?? (pair.payable !== undefined ? payeeAnaesthetistOf(pair.payable) : undefined)) : pair.anaesthetistId) : undefined
  const number = pair?.receivable.number ?? q.target.accRecId ?? ''
  const who = { ...(pairId !== undefined ? { pairId } : {}), ...(anaesthetistId !== undefined ? { anaesthetistId } : {}) }
  switch (q.kind) {
    case 'handoff':
      return { what: `Hand off ${number}`, ...who }
    case 'journal':
      return { what: `Post the transfer journal for ${number}`, ...who }
    case 'paymentSync':
      return { what: `Sync payment on ${number}`, ...who }
    case 'disbursementSync': {
      const payNumber = transfer !== undefined ? transfer.in.number : pair !== undefined && isBookingPair(pair) && pair.payable !== undefined ? pair.payable.number : number
      return { what: `Record disbursement on ${payNumber}`, ...who }
    }
    case 'poll':
      return { what: 'Reconciliation poll' }
    case 'correction': {
      const note = q.target.creditNoteId !== undefined ? state.billing.creditNotes[q.target.creditNoteId] : undefined
      return { what: `Credit ${number}${note !== undefined ? ` (${note.creditNoteNumber})` : ''} and its new invoices`, ...who }
    }
    case 'offsetSync': {
      const payNumber = pair !== undefined && isBookingPair(pair) && pair.payable !== undefined ? pair.payable.number : number
      return { what: `Record netting on ${payNumber}`, ...who }
    }
  }
}

function queueStatus(q: XeroQueueItem): XeroQueueStatusLabel {
  if (q.status === 'sent') return 'Sent'
  if (q.status === 'alerted') return 'Alert raised'
  return q.attempts > 1 ? 'Retrying' : 'Waiting'
}

/** The Billing monitor's Xero sync queue: open items first (drain order), then what was sent, newest first. */
export function xeroQueueView(state: BillingState): XeroQueueView {
  const rows = Object.values(state.billing.xeroQueue).map((item) => ({ item, status: queueStatus(item), ...queueWhat(state, item) }))
  return {
    open: rows.filter((r) => r.item.status !== 'sent').sort((a, b) => a.item.id.localeCompare(b.item.id)),
    sent: rows.filter((r) => r.item.status === 'sent').sort((a, b) => (b.item.sentAtISO ?? '').localeCompare(a.item.sentAtISO ?? '') || b.item.id.localeCompare(a.item.id)),
  }
}

/**
 * The Billing monitor's nav badge: open billing exceptions, alerted queue
 * items and open divergences (catch-up Phase 37). A pair merely waiting in the
 * queue does not raise it until the item alerts.
 */
export function billingAttentionCount(state: BillingState): number {
  return openBillingExceptions(state).length + openXeroQueueItems(state).filter((q) => q.status === 'alerted').length + openXeroDivergences(state).length
}

/** What is still owed on a pair's receivable (>= 0). */
export function receivableOutstanding(pair: Pick<LedgerPair, 'receivable'>): number {
  const remaining = roundToCents(pair.receivable.amount - pair.receivable.receivedAmount)
  return toCents(remaining) > 0 ? remaining : 0
}

/** Money in that is the anaesthetist's income: never an AA fee payment (it is AA's), never a held prepayment with no anaesthetist. The Payments tab and Collected read it; GST does not (catch-up Phase 38: the GST report is on payments made). */
export function incomeReceiptsFor(state: BillingState, anaesthetistId: AnaesthetistId): LedgerReceipt[] {
  return Object.values(state.billing.receipts).filter((r) => r.pairKind !== 'aaFee' && r.anaesthetistId === anaesthetistId)
}

/**
 * 16's BCTI record list, from the ledger's payable legs: the only list `bctisFor` reads.
 * OQ-60, provisional: an additional invoice is one BCTI (catch-up Phase 38b): its pair is an issued
 * Booking pair, so it yields one record here, with no new rule; an event not yet invoiced yields none.
 * OQ-60, provisional (catch-up Phase 39): a credited original keeps its record (it was issued); a credit
 * note and a negative invoice add none (not pairs; "not called a BCTI credit"); each replacement issued
 * with a credit is one record, through 38b's rule.
 */
export function bctiRecords(state: BillingState): BctiRecord[] {
  return bctiRecordsOf(allPairs(state), state.billing.transfers, BCTI_COUNT_RULE)
}

// ---------------------------------------------------------------------------
// Positions (US-13.2.1's two scopes) and the patient (DM-23)
// ---------------------------------------------------------------------------

export function ledgerPositionOf(state: BillingState): LedgerPosition {
  return ledgerPosition(allPairs(state), state.billing.transfers, unmatchedList(state))
}

export function anaesthetistLedgerPosition(state: BillingState, anaesthetistId: AnaesthetistId): AnaesthetistPosition {
  return anaesthetistPosition(allPairs(state), state.billing.transfers, unmatchedList(state), anaesthetistId)
}

export function patientLedgerPosition(state: BillingState, patientId: string): PatientPosition {
  return patientPosition(allPairs(state), patientId)
}

// ---------------------------------------------------------------------------
// The monthly GST report (catch-up Phase 38; US-12.2.2, DM-29, RV-33)
// ---------------------------------------------------------------------------

export interface GstReportViewRow extends GstReportRow {
  /** The invoice's stored billable party (a Procedure's payer or a Party), never re-derived. */
  partyLabel: string
  patientName: string
}

export interface GstReportView {
  monthISO: string
  rows: GstReportViewRow[]
  totals: GstReportTotals
  /** The current month only: collected by AA, not yet paid out (`dueNow`), so it falls into a later month. */
  notYetPaid?: number
}

/**
 * One calendar month's payments AA passed to the anaesthetist, each with its
 * GST component (`gstReportFrom`, pure), with the billable party and patient
 * for the screen; on the demo clock's month, what AA holds for them not yet
 * paid (`dueNow` from the one position). Reads the ledger only.
 */
export function gstReportFor(
  state: Pick<AppState, 'billing' | 'masters'>,
  anaesthetistId: AnaesthetistId,
  monthISO: string,
  todayISO: string,
): GstReportView {
  const b = state.billing
  const report = gstReportFrom({ pairs: b.ledger, transfers: b.transfers, invoices: b.invoices, disbursements: b.disbursements, anaesthetistId, monthISO })
  const rows = report.rows.map((r) => {
    const invoice = b.invoices[r.invoiceId]
    const pair = b.ledger[r.pairId]
    return {
      ...r,
      partyLabel: invoice !== undefined ? invoiceAddresseeName(state, invoice) : '',
      patientName: pair !== undefined && isBookingPair(pair) ? patientNameFor(state, pair.patientId) : '',
    }
  })
  const current = monthISO === todayISO.slice(0, 7)
  return { monthISO, rows, totals: report.totals, ...(current ? { notYetPaid: anaesthetistLedgerPosition(state, anaesthetistId).dueNow } : {}) }
}

/** The months the GST report's picker offers, newest first, to the demo clock's month. */
export function gstReportMonthsFor(state: BillingState, anaesthetistId: AnaesthetistId, todayISO: string): string[] {
  return gstReportMonths(state.billing.disbursements, anaesthetistId, todayISO)
}

export interface OutOfBalanceView {
  anaesthetistId: AnaesthetistId
  name: string
  imbalance: number
  checks: LedgerCheck[]
}

/** Greg's list (US-13.2.1's note): the anaesthetists whose ledger is out of balance, largest first, ties in roster order. */
export function anaesthetistsOutOfBalanceOf(state: Pick<AppState, 'billing' | 'masters'>): OutOfBalanceView[] {
  const roster = anaesthetistsInRosterOrder(state)
  const ids = roster.map((a) => a.registrationNumber)
  return anaesthetistsOutOfBalance(allPairs(state), state.billing.transfers, unmatchedList(state), ids).map((row) => ({
    ...row,
    name: drSurname(state.masters.anaesthetists[row.anaesthetistId]?.name ?? row.anaesthetistId),
  }))
}

/** Receipts that matched no invoice and are still held, oldest first. */
export function heldUnmatchedReceipts(state: BillingState): UnmatchedReceipt[] {
  return unmatchedList(state)
    .filter((u) => u.status === 'held')
    .sort((a, b) => a.atISO.localeCompare(b.atISO) || a.id.localeCompare(b.id))
}

/** Every unmatched receipt, newest first (the Ledger's card). */
export function unmatchedReceiptRows(state: BillingState): UnmatchedReceipt[] {
  return unmatchedList(state).sort((a, b) => b.atISO.localeCompare(a.atISO) || b.id.localeCompare(a.id))
}

/** The Ledger's nav badge: held receipts plus the other checks. */
export function ledgerAttentionCount(state: BillingState): number {
  return ledgerPositionOf(state).checks.length
}

// ---------------------------------------------------------------------------
// The Ledger's table
// ---------------------------------------------------------------------------

export type LedgerRowKind = 'procedure' | 'prePayment' | 'transfer' | 'aaFee'

export interface LedgerRow {
  id: string
  kind: LedgerRowKind
  /** The receivable's number; absent on a transfer. */
  receivableNumber?: string
  /** The payable's number; absent on an AA fee pair and a no-charge invoice. */
  payableNumber?: string
  patientName?: string
  payerName?: string
  /** The payee anaesthetist; absent when the payee is the AA Holding account (or none). */
  payeeAnaesthetistId?: AnaesthetistId
  payeeIsHolding: boolean
  amount: number
  received: number
  released: number
  paidOut: number
  inXero: boolean
  /** The payer's Xero contact is archived (the pair does not depend on it; FT-08.3, US-08.3.3). */
  contactArchived: boolean
  /** Where a row opens: the invoice, or the AA fee invoices. */
  invoiceId?: string
  /** A transfer's: the pair it transfers from (its receivable's number). */
  fromNumber?: string
  open: boolean
  createdAtISO: string
}

/** The Ledger table's footer: the pairs' totals, exact to the cent; a transfer moves money already on its prepayment pair, so it is left out. */
export function ledgerRowTotals(rows: readonly LedgerRow[]): { amount: number; received: number; released: number; paidOut: number } {
  let amount = 0
  let received = 0
  let released = 0
  let paidOut = 0
  for (const r of rows) {
    if (r.kind === 'transfer') continue
    amount += toCents(r.amount)
    received += toCents(r.received)
    released += toCents(r.released)
    paidOut += toCents(r.paidOut)
  }
  return { amount: amount / 100, received: received / 100, released: released / 100, paidOut: paidOut / 100 }
}

/** The Ledger's rows: every pair and transfer, in scope, newest first. Excludes nothing: the seeded history is ledger data. */
export function ledgerRows(state: Pick<AppState, 'billing' | 'masters' | 'schedule' | 'xero'>, opts: { anaesthetistId?: AnaesthetistId; openOnly: boolean }): LedgerRow[] {
  const rows: LedgerRow[] = []
  const archivedFor = (pair: LedgerPair): boolean => {
    // The one Xero read here: whether the mirror's contact is archived, shown as a note beside ledger data.
    const recId = pair.receivable.xeroAccRecId
    const contactId = recId !== undefined ? state.xero.accRecs[recId]?.contactId : undefined
    return contactId !== undefined && state.xero.contacts[contactId]?.archived === true
  }
  for (const pair of allPairs(state)) {
    const r = pair.receivable
    if (isAaFeePair(pair)) {
      if (opts.anaesthetistId !== undefined && pair.anaesthetistId !== opts.anaesthetistId) continue
      rows.push({
        id: pair.id,
        kind: 'aaFee',
        receivableNumber: r.number,
        payerName: drSurname(state.masters.anaesthetists[pair.anaesthetistId]?.name ?? pair.anaesthetistId),
        payeeIsHolding: false,
        amount: r.amount,
        received: r.receivedAmount,
        released: 0,
        paidOut: 0,
        inXero: isInXero(pair),
        contactArchived: false,
        open: toCents(r.receivedAmount) < toCents(r.amount),
        createdAtISO: pair.createdAtISO,
      })
      continue
    }
    const p = pair.payable
    const payeeId = p !== undefined ? payeeAnaesthetistOf(p) : undefined
    if (opts.anaesthetistId !== undefined && payeeId !== opts.anaesthetistId) continue
    const transfer = pair.kind === 'prePayment' ? transferForPair(state, pair.id) : undefined
    const invoice = state.billing.invoices[pair.invoiceId]
    rows.push({
      id: pair.id,
      kind: pair.kind,
      receivableNumber: r.number,
      ...(p !== undefined ? { payableNumber: p.number } : {}),
      patientName: patientNameFor(state, pair.patientId),
      payerName: invoice?.billedTo?.name ?? (r.counterparty.kind === 'anaesthetist' ? r.counterparty.id : counterpartyName(state, r.counterparty, pair.bookingId)),
      ...(payeeId !== undefined ? { payeeAnaesthetistId: payeeId } : {}),
      payeeIsHolding: p !== undefined && payeeId === undefined,
      amount: r.amount,
      received: r.receivedAmount,
      released: p?.releasedAmount ?? 0,
      paidOut: p?.disbursedAmount ?? 0,
      inXero: isInXero(pair),
      contactArchived: archivedFor(pair),
      invoiceId: pair.invoiceId,
      // Open: anything outstanding, or not fully paid out (a prepayment held in the account until transferred).
      open: toCents(r.receivedAmount) < toCents(r.amount) || (p !== undefined && payeeId !== undefined && toCents(p.disbursedAmount) < toCents(p.amount)) || (p !== undefined && payeeId === undefined && transfer === undefined),
      createdAtISO: pair.createdAtISO,
    })
  }
  for (const t of Object.values(state.billing.transfers)) {
    const to = payeeAnaesthetistOf(t.in)
    if (opts.anaesthetistId !== undefined && to !== opts.anaesthetistId) continue
    const from = state.billing.ledger[t.collectPairId]
    rows.push({
      id: t.id,
      kind: 'transfer',
      payableNumber: t.in.number,
      patientName: patientNameFor(state, t.patientId),
      ...(to !== undefined ? { payeeAnaesthetistId: to } : {}),
      payeeIsHolding: false,
      amount: t.in.amount,
      received: 0,
      released: t.in.releasedAmount,
      paidOut: t.in.disbursedAmount,
      inXero: t.xeroJournalId !== undefined,
      contactArchived: false,
      invoiceId: t.invoiceId,
      ...(from !== undefined ? { fromNumber: from.receivable.number } : {}),
      open: toCents(t.in.disbursedAmount) < toCents(t.in.amount),
      createdAtISO: t.createdAtISO,
    })
  }
  return rows
    .filter((row) => !opts.openOnly || row.open)
    .sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO) || b.id.localeCompare(a.id))
}
