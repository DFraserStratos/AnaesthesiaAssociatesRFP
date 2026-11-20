/**
 * Indexes that keep the selectors linear at full scale (catch-up Phase 43;
 * US-15.0.4): 85 anaesthetists, about 30,000 Bookings, invoices and ledger
 * pairs, and over 100,000 audit entries.
 *
 * Each index is memoised on the IDENTITY of the record map it is built from
 * (a `WeakMap` per map): every write goes through `mutate()`, which replaces a
 * map it changes, so an index is rebuilt exactly when its map changes and can
 * never serve a stale row. The arrays they hold are shared: callers copy before
 * sorting or editing. Every index returns what the plain scan it replaces
 * returned, in the same order (`indexes.test.ts`).
 */

import { sortAuditNewestFirst } from '../shared/audit/auditNarrative'
import type { LedgerDisbursement, InvoiceLine, PaymentIn, AuditEntry, BillingException, Booking, BookingLedgerPair, Invoice, LedgerPair, LedgerTransfer, List, Procedure, XeroDivergence, XeroQueueItem } from '../domain/types'
import { isBookingPair } from '../domain/billing/ledger'

/** Memoise `build` on the identity of `source`. */
function memoOn<K extends object, V>(build: (source: K) => V): (source: K) => V {
  const cache = new WeakMap<K, V>()
  return (source) => {
    const hit = cache.get(source)
    if (hit !== undefined) return hit
    const value = build(source)
    cache.set(source, value)
    return value
  }
}

function groupBy<T>(items: Iterable<T>, keyOf: (item: T) => string | undefined): Map<string, T[]> {
  const out = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    if (key === undefined) continue
    const bucket = out.get(key)
    if (bucket === undefined) out.set(key, [item])
    else bucket.push(item)
  }
  return out
}

/** Creation order: numeric-aware, so BK10000 follows BK9999 at full scale (review fix). */
export const byIdOrder = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id, undefined, { numeric: true })
const byId = byIdOrder

function sortedGroups<T extends { id: string }>(groups: Map<string, T[]>): Map<string, T[]> {
  for (const bucket of groups.values()) bucket.sort(byId)
  return groups
}

/** Bookings by List, each in id order. */
export const bookingsByList = memoOn((bookings: Readonly<Record<string, Booking>>) => sortedGroups(groupBy(Object.values(bookings), (b) => b.listId)))

/** Procedures by Booking, each in id order (creation order). */
export const proceduresByBooking = memoOn((procedures: Readonly<Record<string, Procedure>>) => sortedGroups(groupBy(Object.values(procedures), (p) => p.bookingId)))

/** Invoices by Booking, each in id order. */
export const invoicesByBooking = memoOn((invoices: Readonly<Record<string, Invoice>>) => sortedGroups(groupBy(Object.values(invoices), (i) => i.bookingId)))

/** Invoice lines by invoice, each in id order. */
export const linesByInvoice = memoOn((lines: Readonly<Record<string, InvoiceLine>>) => sortedGroups(groupBy(Object.values(lines), (l) => l.invoiceId)))

/** Booking ledger pairs by Booking, each in id order. */
export const pairsByBooking = memoOn((ledger: Readonly<Record<string, LedgerPair>>) =>
  sortedGroups(groupBy(Object.values(ledger).filter((p): p is BookingLedgerPair => isBookingPair(p)), (p) => p.bookingId)),
)

/** Booking ledger pairs by patient (the patient position reads only these). */
export const pairsByPatient = memoOn((ledger: Readonly<Record<string, LedgerPair>>) =>
  groupBy(Object.values(ledger).filter((p): p is BookingLedgerPair => isBookingPair(p)), (p) => p.patientId),
)

/** The ledger pair of each invoice (Booking and AA fee pairs). */
export const pairByInvoice = memoOn((ledger: Readonly<Record<string, LedgerPair>>) => {
  const out = new Map<string, LedgerPair>()
  for (const p of Object.values(ledger)) if ('invoiceId' in p && !out.has(p.invoiceId)) out.set(p.invoiceId, p)
  return out
})

/** The ledger pair mirrored by each ACCREC. */
export const pairByAccRecIndex = memoOn((ledger: Readonly<Record<string, LedgerPair>>) => {
  const out = new Map<string, LedgerPair>()
  for (const p of Object.values(ledger)) if (p.receivable.xeroAccRecId !== undefined && !out.has(p.receivable.xeroAccRecId)) out.set(p.receivable.xeroAccRecId, p)
  return out
})

/** The pairs whose payable carries each ACCPAY id. */
export const pairsByAccPayIndex = memoOn((ledger: Readonly<Record<string, LedgerPair>>) => groupBy(Object.values(ledger), (p) => ('payable' in p ? p.payable?.xeroAccPayId : undefined)))

/** Transfers by Booking. */
export const transfersByBooking = memoOn((transfers: Readonly<Record<string, LedgerTransfer>>) => groupBy(Object.values(transfers), (t) => t.bookingId))

/**
 * The open (not sent) queue items, first in map order as `find` returned: hand-offs by pair (a hand-off of the
 * pair itself, or a credit's correction that creates or reverses it), journals by transfer, corrections by credit note.
 */
export const openQueueIndex = memoOn((queue: Readonly<Record<string, XeroQueueItem>>) => {
  const handoffByPair = new Map<string, XeroQueueItem>()
  const journalByTransfer = new Map<string, XeroQueueItem>()
  const correctionByCreditNote = new Map<string, XeroQueueItem>()
  for (const q of Object.values(queue)) {
    if (q.status === 'sent') continue
    if (q.kind === 'handoff' && q.target.pairId !== undefined && !handoffByPair.has(q.target.pairId)) handoffByPair.set(q.target.pairId, q)
    if (q.kind === 'correction') {
      for (const pairId of q.target.pairIds ?? []) if (!handoffByPair.has(pairId)) handoffByPair.set(pairId, q)
      if (q.target.creditNoteId !== undefined && !correctionByCreditNote.has(q.target.creditNoteId)) correctionByCreditNote.set(q.target.creditNoteId, q)
    }
    if (q.kind === 'journal' && q.target.transferId !== undefined && !journalByTransfer.has(q.target.transferId)) journalByTransfer.set(q.target.transferId, q)
  }
  return { handoffByPair, journalByTransfer, correctionByCreditNote }
})

/** The first open billing exception per Booking, in id order. */
export const openExceptionByBooking = memoOn((exceptions: Readonly<Record<string, BillingException>>) => {
  const out = new Map<string, BillingException>()
  for (const x of Object.values(exceptions).filter((e) => e.resolvedAtISO === undefined).sort(byId)) if (!out.has(x.bookingId)) out.set(x.bookingId, x)
  return out
})

/** Xero payments by ACCREC. */
export const paymentsByAccRec = memoOn((payments: Readonly<Record<string, PaymentIn>>) => groupBy(Object.values(payments), (p) => p.accRecId))

/** The sessions holding a List (a Draft List holds none). */
export const occupiedSlotIdsOf = memoOn((lists: Readonly<Record<string, List>>) => {
  const out = new Set<string>()
  for (const l of Object.values(lists)) if (l.slotId !== undefined) out.add(l.slotId)
  return out as ReadonlySet<string>
})

/** The idempotency keys a record map holds (receipts, unmatched receipts, ledger disbursements, Xero payments). */
export const idempotencyKeysOf = memoOn((records: Readonly<Record<string, { idempotencyKey: string }>>) => new Set(Object.values(records).map((r) => r.idempotencyKey)) as ReadonlySet<string>)

/** Lists by date. */
export const listsByDate = memoOn((lists: Readonly<Record<string, List>>) => groupBy(Object.values(lists), (l) => l.dateISO))

/** Lists by anaesthetist. */
export const listsByAnaesthetist = memoOn((lists: Readonly<Record<string, List>>) => groupBy(Object.values(lists), (l) => l.anaesthetistId))

/** The audit trail newest first, and its entity types (the Audit viewer's sort and filter). */
export const auditNewestFirst = memoOn((audit: readonly AuditEntry[]) => {
  // The shared sort the Booking history sheet uses (`sortAuditNewestFirst`), so the two agree.
  const sorted = sortAuditNewestFirst(audit)
  const entityTypes = [...new Set(audit.map((a) => a.entityType))].sort()
  return { sorted, entityTypes }
})

/** The open divergence of each pair, first in id order. */
export const openDivergenceByPair = memoOn((divergences: Readonly<Record<string, XeroDivergence>>) => {
  const out = new Map<string, XeroDivergence>()
  for (const d of Object.values(divergences).filter((x) => x.status === 'open').sort(byId)) if (!out.has(d.pairId)) out.set(d.pairId, d)
  return out
})


// ---------------------------------------------------------------------------
// Payment runs (catch-up Phase 39a): what each run settled and sent, per line,
// so the cycle panel, run completion and the web Accounts rows stay linear.
// ---------------------------------------------------------------------------

/** What one run settled (or sent) on one payable: cents and the latest date. Keyed `${runId}|${pairId}` (or bill id on the Xero side). */
export interface RunAmount {
  cents: number
  latestISO: string
}

function addRunAmount(out: Map<string, RunAmount>, key: string, amount: number, atISO: string): void {
  const cents = Math.round(amount * 100)
  const had = out.get(key)
  if (had === undefined) out.set(key, { cents, latestISO: atISO })
  else {
    had.cents += cents
    if (atISO > had.latestISO) had.latestISO = atISO
  }
}

/** The ledger's disbursements by `${runId}|${pairId}`. */
export const disbursedByRunPair = memoOn((disbursements: Readonly<Record<string, { payablesRunId: string; pairId: string; amount: number; atISO: string }>>) => {
  const out = new Map<string, RunAmount>()
  for (const d of Object.values(disbursements)) addRunAmount(out, `${d.payablesRunId}|${d.pairId}`, d.amount, d.atISO)
  return out
})

/** The negative invoices' nettings by `${runId}|${pairId}`. */
export const nettedByRunPair = memoOn((negatives: Readonly<Record<string, { nettings?: readonly { runId: string; pairId: string; amount: number; atISO: string }[] }>>) => {
  const out = new Map<string, RunAmount>()
  for (const n of Object.values(negatives)) for (const x of n.nettings ?? []) addRunAmount(out, `${x.runId}|${x.pairId}`, x.amount, x.atISO)
  return out
})

/** The negative invoices' recorded netting keys (`CNALLOC-`): the engine records each once. */
export const nettingKeys = memoOn((negatives: Readonly<Record<string, { nettings?: readonly { idempotencyKey: string }[] }>>) => {
  const out = new Set<string>()
  for (const n of Object.values(negatives)) for (const x of n.nettings ?? []) out.add(x.idempotencyKey)
  return out as ReadonlySet<string>
})

/** The latest receipt per pair (a run line's released date). */
export const latestReceiptByPair = memoOn((receipts: Readonly<Record<string, { pairId: string; atISO: string }>>) => {
  const out = new Map<string, string>()
  for (const r of Object.values(receipts)) {
    const had = out.get(r.pairId)
    if (had === undefined || r.atISO > had) out.set(r.pairId, r.atISO)
  }
  return out
})

/** The ledger's disbursements per pair (the week of every payment on one payable). */
export const disbursementsByPair = memoOn((disbursements: Readonly<Record<string, LedgerDisbursement>>) => groupBy(Object.values(disbursements), (d) => d.pairId))

/** Xero's bill payments by `${runId}|${accPayId or transferId}`. */
export const xeroPaidByRunBill = memoOn((disbursements: Readonly<Record<string, { payablesRunId: string; accPayId?: string; transferId?: string; amount: number; atISO: string }>>) => {
  const out = new Map<string, RunAmount>()
  for (const d of Object.values(disbursements)) {
    const bill = d.accPayId ?? d.transferId
    if (bill !== undefined) addRunAmount(out, `${d.payablesRunId}|${bill}`, d.amount, d.atISO)
  }
  return out
})

/** Xero's credit allocations by `${runId}|${accPayId}`. */
export const xeroAllocatedByRunBill = memoOn((allocations: Readonly<Record<string, { payablesRunId: string; accPayId: string; amount: number; atISO: string }>>) => {
  const out = new Map<string, RunAmount>()
  for (const a of Object.values(allocations)) addRunAmount(out, `${a.payablesRunId}|${a.accPayId}`, a.amount, a.atISO)
  return out
})

/** Per pair, the latest week run that held it out (the web Payments note). */
export const heldRunByPair = memoOn((runs: Readonly<Record<string, { id: string; status: string; cycleId: string; lines: readonly { pairId: string; heldOut?: unknown }[] }>>) => {
  const out = new Map<string, { id: string; cycleId: string }>()
  for (const r of Object.values(runs)) {
    if (r.status === 'superseded') continue
    for (const l of r.lines) {
      if (l.heldOut === undefined) continue
      const had = out.get(l.pairId)
      if (had === undefined || r.cycleId > had.cycleId) out.set(l.pairId, { id: r.id, cycleId: r.cycleId })
    }
  }
  return out
})

/** The runs each pair is a line of (unheld), for the in-flight and completion checks. */
export const runIdsByLinePair = memoOn((runs: Readonly<Record<string, { id: string; lines: readonly { pairId: string; heldOut?: unknown }[] }>>) => {
  const out = new Map<string, string[]>()
  for (const r of Object.values(runs)) for (const l of r.lines) if (l.heldOut === undefined) out.set(l.pairId, [...(out.get(l.pairId) ?? []), r.id])
  return out
})

/** Catch-up Phase 41: the credit note on each credited invoice, by the original's id (`livePrePaymentInvoicesForBooking`). */
export const creditNoteByOriginal = memoOn((notes: Readonly<Record<string, { id: string; originalInvoiceId: string }>>) => {
  const out = new Map<string, string>()
  for (const n of Object.values(notes)) out.set(n.originalInvoiceId, n.id)
  return out
})
