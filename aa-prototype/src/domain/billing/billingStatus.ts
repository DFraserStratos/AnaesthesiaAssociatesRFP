/**
 * The Finances section's billing status (US-13.3.1, US-13.3.2; D109, D116): a
 * pure read model over the billing run, the ledger, the Xero sync queue and
 * the poll's divergence flags. Each authorised List reads one status, each of
 * its Bookings a stage, four steps (sent, in Xero, paid in, disbursed), a
 * bucket (Problems, In progress, Done) and the problems the office can fix
 * beside it. It restates the Billing monitor's rules (`billingMonitor`,
 * `billingMonitorView`) over plain slices and Maps the caller passes in, so it
 * imports nothing from the store or the apps.
 *
 * One pass over the Lists, their Bookings and their pairs; the queue items,
 * divergences, transfers and exceptions are indexed once each, so the model
 * stays fast at practice scale.
 */

import type { AssignedList, BillingException, Booking, BookingLedgerPair, Invoice, LedgerPair, LedgerTransfer, List, Session, XeroDivergence, XeroQueueItem } from '../types'
import { isBookingPair, isCreditedPair, isInXero, pairStatusLabel, settledOn, type PairStatus } from './ledger'
import { formatMoney, toCents } from './money'
import { nameWithoutTitle } from '../names'
import { isBackdropList } from '../conflicts'

// ---------------------------------------------------------------------------
// Problems and their fixes
// ---------------------------------------------------------------------------

/** The billing run's code for a payer with no billing email or postal address (D116; US-13.3.2). */
export const PAYER_NO_ADDRESS_CODE = 'payerNoAddress'

/** What the office reads under the patient's name for a payer with no address (D116; US-13.3.2). */
export const PAYER_NO_ADDRESS_REASON = 'Not invoiced: the payer has no billing email or postal address'

/** The fix offered beside a Booking with a problem (US-13.3.2). */
export type BillingFix = 'retry' | 'fixPayer' | 'markResolved' | 'retryNow' | 'resolve'

/** The reason and fix for a billing-run failure's code (US-13.3.2; D116 the no-address code). */
export function problemAdvice(code: string, message: string): { reason: string; fix: BillingFix } {
  if (code === PAYER_NO_ADDRESS_CODE) return { reason: PAYER_NO_ADDRESS_REASON, fix: 'fixPayer' }
  if (code === 'noCounterparty') return { reason: message, fix: 'fixPayer' }
  return { reason: message, fix: 'retry' }
}

/** What kind of problem a Booking has (US-13.3.2). */
export type BillingProblemKind = 'billingException' | 'xeroAlert' | 'waitingForXero' | 'voidedInXero' | 'amendedInXero' | 'paidAfterCredit'

/** One problem on a Booking, with its reason and the fix beside it (US-13.3.2). */
export interface BillingProblem {
  kind: BillingProblemKind
  /** The billing exception's code. */
  code?: string
  /** Shown under the patient's name. */
  reason: string
  fix: BillingFix
  /** True for any open billing exception, false otherwise. */
  canMarkResolved: boolean
  exceptionId?: string
  queueItemId?: string
  divergenceId?: string
}

const PROBLEM_RANK: Record<BillingProblemKind, number> = {
  billingException: 0,
  xeroAlert: 1,
  waitingForXero: 2,
  voidedInXero: 3,
  amendedInXero: 4,
  paidAfterCredit: 5,
}

const byIdNumeric = (a: string, b: string): number => a.localeCompare(b, undefined, { numeric: true })

function problemId(p: BillingProblem): string {
  return p.exceptionId ?? p.queueItemId ?? p.divergenceId ?? ''
}

function exceptionProblem(x: BillingException): BillingProblem {
  return { kind: 'billingException', code: x.code, ...problemAdvice(x.code, x.message), canMarkResolved: true, exceptionId: x.id }
}

function queueProblem(item: XeroQueueItem): BillingProblem {
  const alerted = item.status === 'alerted'
  return {
    kind: alerted ? 'xeroAlert' : 'waitingForXero',
    reason: `Attempt ${item.attempts} · the Xero sync queue tries again at ${item.nextAttemptAtISO.slice(11, 16)}${alerted ? ' · alert raised' : ''}`,
    fix: 'retryNow',
    canMarkResolved: false,
    queueItemId: item.id,
  }
}

function divergenceReason(d: XeroDivergence): string {
  switch (d.kind) {
    case 'amendedInXero':
      return `Changed directly in Xero: Xero shows ${formatMoney(d.xeroShows.total)}, the engine holds ${formatMoney(d.engineHolds.amount)}`
    case 'voidedInXero':
      return `Voided directly in Xero: the engine holds ${formatMoney(d.engineHolds.amount)}`
    case 'paidAfterCredit':
      return `Paid in Xero after it was credited: Xero shows ${formatMoney(d.xeroShows.total)}`
  }
}

function divergenceProblem(d: XeroDivergence): BillingProblem {
  return { kind: d.kind, reason: divergenceReason(d), fix: 'resolve', canMarkResolved: false, divergenceId: d.id }
}

// ---------------------------------------------------------------------------
// Status types
// ---------------------------------------------------------------------------

/** A Booking's billing stage: the ledger's pair label kept raw, or pending, failed or cancelled (US-13.3.1). */
export type BillingStage = PairStatus | 'pending' | 'failed' | 'cancelled'

/** One of a Booking's four steps (US-13.3.1). */
export type BillingStepState = 'done' | 'waiting' | 'flagged' | 'notYet'

/** The Billing tab's three buckets (US-13.3.1). */
export type BillingBucket = 'problems' | 'inProgress' | 'done'

/** A Booking's billing status on its List (US-13.3.1; US-13.3.2 the fix beside it). */
export interface BookingBillingStatus {
  bookingId: string
  listId: string
  patientId: string
  patientName: string
  stage: BillingStage
  steps: { sent: BillingStepState; inXero: BillingStepState; paidIn: BillingStepState; disbursed: BillingStepState }
  /** How its invoices went: 'post' if any is to post, else 'email' when sent. */
  sentBy?: 'email' | 'post'
  /** Its run invoices (or, when prepayment settled it in full, its prepayment invoices). */
  invoiceIds: string[]
  invoiceNumbers: string[]
  bucket: BillingBucket
  problems: BillingProblem[]
  /** The first of `problems`. */
  problem?: BillingProblem
  /** A billing failure the office marked resolved by hand (US-13.3.2). */
  resolvedByHand?: { exceptionId: string; by?: string; note?: string; atISO: string }
}

/** An authorised List's overall status pill (US-13.3.1). */
export type ListBillingStatusLabel = 'Voided in Xero' | 'Needs attention' | 'Billing' | 'Complete'

/** An authorised List's billing status and its Bookings' (US-13.3.1). */
export interface ListBillingStatus {
  listId: string
  dateISO: string
  session: Session
  hospitalId: string
  hospitalName?: string
  anaesthetistId: string
  anaesthetistName: string
  status: ListBillingStatusLabel
  /** Non-cancelled Bookings with each step done; `problems` = Bookings in Problems; `of` = non-cancelled Bookings. */
  counts: { sent: number; inXero: number; paidIn: number; disbursed: number; problems: number; of: number }
  /** The billing run. */
  billedAtISO?: string
  hasProblem: boolean
  bucket: BillingBucket
  /** In id order, cancelled included. */
  bookings: BookingBillingStatus[]
}

/** The slices and indexes the billing status reads (US-13.3.1). */
export interface BillingStatusInput {
  lists: Readonly<Record<string, List>>
  /** `store/indexes` `bookingsByList(schedule.bookings)`. */
  bookingsByList: ReadonlyMap<string, readonly Booking[]>
  invoices: Readonly<Record<string, Invoice>>
  ledger: Readonly<Record<string, LedgerPair>>
  /** `store/indexes` `pairsByBooking(billing.ledger)`. */
  pairsByBooking: ReadonlyMap<string, readonly BookingLedgerPair[]>
  transfers: Readonly<Record<string, LedgerTransfer>>
  exceptions: Readonly<Record<string, BillingException>>
  xeroQueue: Readonly<Record<string, XeroQueueItem>>
  xeroDivergences: Readonly<Record<string, XeroDivergence>>
  patients: Readonly<Record<string, { name: string }>>
  anaesthetists: Readonly<Record<string, { name: string }>>
  hospitals: Readonly<Record<string, { name: string }>>
}

// ---------------------------------------------------------------------------
// Lookups, built once
// ---------------------------------------------------------------------------

/** The pair a queue item concerns (its own, or its transfer's prepayment pair), then a correction's new pairs. */
function queueItemPairIds(item: XeroQueueItem, transfers: Readonly<Record<string, LedgerTransfer>>): string[] {
  const first = item.target.pairId ?? (item.target.transferId !== undefined ? transfers[item.target.transferId]?.collectPairId : undefined)
  const ids = first !== undefined ? [first] : []
  if (item.kind === 'correction') for (const id of item.target.pairIds ?? []) if (!ids.includes(id)) ids.push(id)
  return ids
}

function openQueueItems(queue: Readonly<Record<string, XeroQueueItem>>): XeroQueueItem[] {
  return Object.values(queue)
    .filter((q) => q.status !== 'sent')
    .sort((a, b) => byIdNumeric(a.id, b.id))
}

function openDivergences(divergences: Readonly<Record<string, XeroDivergence>>): XeroDivergence[] {
  return Object.values(divergences)
    .filter((d) => d.status === 'open')
    .sort((a, b) => byIdNumeric(a.id, b.id))
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const bucket = map.get(key)
  if (bucket === undefined) map.set(key, [value])
  else bucket.push(value)
}

interface ExceptionsOf {
  /** The first unresolved, in id order. */
  open?: BillingException
  /** The last resolved, in id order. */
  lastResolved?: BillingException
}

interface Lookups {
  queueByPair: Map<string, XeroQueueItem[]>
  divergencesByPair: Map<string, XeroDivergence[]>
  transferByCollectPair: Map<string, LedgerTransfer>
  exceptionsByBooking: Map<string, ExceptionsOf>
}

function buildLookups(input: BillingStatusInput): Lookups {
  const queueByPair = new Map<string, XeroQueueItem[]>()
  for (const item of openQueueItems(input.xeroQueue)) for (const pairId of queueItemPairIds(item, input.transfers)) push(queueByPair, pairId, item)

  const divergencesByPair = new Map<string, XeroDivergence[]>()
  for (const d of openDivergences(input.xeroDivergences)) push(divergencesByPair, d.pairId, d)

  const transferByCollectPair = new Map<string, LedgerTransfer>()
  for (const t of Object.values(input.transfers)) if (!transferByCollectPair.has(t.collectPairId)) transferByCollectPair.set(t.collectPairId, t)

  const exceptionsByBooking = new Map<string, ExceptionsOf>()
  for (const x of Object.values(input.exceptions)) {
    const mine = exceptionsByBooking.get(x.bookingId) ?? {}
    if (x.resolvedAtISO === undefined) {
      if (mine.open === undefined || byIdNumeric(x.id, mine.open.id) < 0) mine.open = x
    } else if (mine.lastResolved === undefined || byIdNumeric(x.id, mine.lastResolved.id) > 0) {
      mine.lastResolved = x
    }
    exceptionsByBooking.set(x.bookingId, mine)
  }

  return { queueByPair, divergencesByPair, transferByCollectPair, exceptionsByBooking }
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

const NOT_YET_STEPS: BookingBillingStatus['steps'] = { sent: 'notYet', inXero: 'notYet', paidIn: 'notYet', disbursed: 'notYet' }

const paidInFull = (p: BookingLedgerPair): boolean => toCents(p.receivable.receivedAmount) >= toCents(p.receivable.amount)

function bookingStatus(booking: Booking, input: BillingStatusInput, look: Lookups): BookingBillingStatus {
  const base = {
    bookingId: booking.id,
    listId: booking.listId,
    patientId: booking.patientId,
    patientName: input.patients[booking.patientId]?.name ?? booking.patientId,
  }
  if (booking.cancellation !== undefined) {
    return { ...base, stage: 'cancelled', steps: { ...NOT_YET_STEPS }, invoiceIds: [], invoiceNumbers: [], bucket: 'done', problems: [] }
  }

  const allPairs = input.pairsByBooking.get(booking.id) ?? []
  // The run's pairs: never the prepayment's, nor an additional invoice's. A Booking prepaid in full has none; its prepayment pairs stand in.
  const runPairs = allPairs.filter((p) => p.kind === 'procedure' && input.invoices[p.invoiceId]?.kind !== 'additional')
  const stepPairs = runPairs.length > 0 ? runPairs : allPairs.filter((p) => p.kind === 'prePayment')

  // Problems: the open exception, then open queue items and divergences on any of its pairs.
  const exceptions = look.exceptionsByBooking.get(booking.id)
  const open = exceptions?.open
  const problems: BillingProblem[] = open !== undefined ? [exceptionProblem(open)] : []
  const seenQueue = new Set<string>()
  const seenDivergence = new Set<string>()
  for (const p of allPairs) {
    for (const item of look.queueByPair.get(p.id) ?? []) {
      if (seenQueue.has(item.id)) continue
      seenQueue.add(item.id)
      problems.push(queueProblem(item))
    }
    for (const d of look.divergencesByPair.get(p.id) ?? []) {
      if (seenDivergence.has(d.id)) continue
      seenDivergence.add(d.id)
      problems.push(divergenceProblem(d))
    }
  }
  problems.sort((a, b) => PROBLEM_RANK[a.kind] - PROBLEM_RANK[b.kind] || byIdNumeric(problemId(a), problemId(b)))

  const queued = (p: BookingLedgerPair) => (look.queueByPair.get(p.id)?.length ?? 0) > 0
  const alerted = (p: BookingLedgerPair) => (look.queueByPair.get(p.id) ?? []).some((q) => q.status === 'alerted')
  const diverged = (p: BookingLedgerPair) => (look.divergencesByPair.get(p.id)?.length ?? 0) > 0

  // Stage: failed, else the primary pair's label (the one waiting for Xero, else the first), else pending.
  const primary = stepPairs.find((p) => queued(p) && p.receivable.xeroAccRecId === undefined) ?? stepPairs[0]
  const stage: BillingStage =
    open !== undefined ? 'failed' : primary !== undefined ? pairStatusLabel(primary, look.transferByCollectPair.get(primary.id), queued(primary)) : 'pending'

  const invoices = stepPairs.map((p) => input.invoices[p.invoiceId]).filter((i): i is Invoice => i !== undefined)
  const any = stepPairs.length > 0
  const disbursedPair = (p: BookingLedgerPair): boolean => {
    if (isCreditedPair(p)) return true
    const out = look.transferByCollectPair.get(p.id)?.in ?? p.payable
    // A $0 no-charge invoice has no payable: nothing to disburse once it is paid in.
    if (out === undefined) return paidInFull(p)
    return toCents(settledOn(out)) >= toCents(out.amount)
  }
  const steps: BookingBillingStatus['steps'] = {
    sent: invoices.some((i) => i.delivery?.status === 'noAddress')
      ? 'flagged'
      : invoices.length > 0 && invoices.every((i) => i.delivery?.status === 'sent' || i.delivery?.status === 'toPost')
        ? 'done'
        : 'notYet',
    inXero: stepPairs.some((p) => alerted(p) || diverged(p)) ? 'flagged' : stepPairs.some(queued) ? 'waiting' : any && stepPairs.every((p) => isInXero(p)) ? 'done' : 'notYet',
    paidIn: any && stepPairs.every((p) => isCreditedPair(p) || paidInFull(p)) ? 'done' : 'notYet',
    disbursed: any && stepPairs.every(disbursedPair) ? 'done' : 'notYet',
  }

  const sentBy: 'email' | 'post' | undefined = invoices.some((i) => i.delivery?.status === 'toPost')
    ? 'post'
    : invoices.some((i) => i.delivery?.status === 'sent')
      ? 'email'
      : undefined

  // Resolved by hand: the last resolved failure had no pairs to show for it (a retry that billed sets `resolvedPairIds`).
  const last = exceptions?.lastResolved
  const resolvedByHand =
    open === undefined && problems.length === 0 && last !== undefined && last.resolvedAtISO !== undefined && (last.resolvedPairIds ?? []).length === 0
      ? {
          exceptionId: last.id,
          ...(last.resolvedBy !== undefined ? { by: last.resolvedBy } : {}),
          ...(last.resolvedNote !== undefined ? { note: last.resolvedNote } : {}),
          atISO: last.resolvedAtISO,
        }
      : undefined

  const allDone = steps.sent === 'done' && steps.inXero === 'done' && steps.paidIn === 'done' && steps.disbursed === 'done'
  const bucket: BillingBucket = problems.length > 0 ? 'problems' : resolvedByHand !== undefined || allDone ? 'done' : 'inProgress'

  return {
    ...base,
    stage,
    steps,
    ...(sentBy !== undefined ? { sentBy } : {}),
    invoiceIds: invoices.map((i) => i.id),
    invoiceNumbers: invoices.map((i) => i.invoiceNumber),
    bucket,
    problems,
    ...(problems[0] !== undefined ? { problem: problems[0] } : {}),
    ...(resolvedByHand !== undefined ? { resolvedByHand } : {}),
  }
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

const isLiveAuthorised = (l: List): l is AssignedList => l.state === 'AUTHORISED' && !isBackdropList(l)

function compareLists(a: AssignedList, b: AssignedList): number {
  const aBilled = a.billedAtISO !== undefined
  const bBilled = b.billedAtISO !== undefined
  if (aBilled && bBilled) return b.billedAtISO!.localeCompare(a.billedAtISO!) || byIdNumeric(a.id, b.id)
  if (aBilled !== bBilled) return aBilled ? -1 : 1
  return byIdNumeric(a.id, b.id)
}

function listStatus(list: AssignedList, input: BillingStatusInput, look: Lookups): ListBillingStatus {
  const bookings = (input.bookingsByList.get(list.id) ?? []).map((b) => bookingStatus(b, input, look))
  const live = bookings.filter((b) => b.stage !== 'cancelled')
  const count = (key: keyof BookingBillingStatus['steps']) => live.filter((b) => b.steps[key] === 'done').length
  const hasProblem = bookings.some((b) => b.bucket === 'problems')
  const billed = list.billedAtISO !== undefined
  // A failure resolved by hand leaves nothing to send or hand off, so it never holds the List short of Complete.
  const complete = billed && live.length > 0 && live.every((b) => b.resolvedByHand !== undefined || (b.steps.sent === 'done' && b.steps.inXero === 'done'))
  const status: ListBillingStatusLabel = bookings.some((b) => b.problems.some((p) => p.kind === 'voidedInXero'))
    ? 'Voided in Xero'
    : hasProblem
      ? 'Needs attention'
      : complete
        ? 'Complete'
        : 'Billing'
  const bucket: BillingBucket = hasProblem ? 'problems' : live.length > 0 && live.every((b) => b.bucket === 'done') ? 'done' : 'inProgress'
  const hospitalName = input.hospitals[list.hospitalId]?.name
  return {
    listId: list.id,
    dateISO: list.dateISO,
    session: list.session,
    hospitalId: list.hospitalId,
    ...(hospitalName !== undefined ? { hospitalName } : {}),
    anaesthetistId: list.anaesthetistId,
    anaesthetistName: input.anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId,
    status,
    counts: {
      sent: count('sent'),
      inXero: count('inXero'),
      paidIn: count('paidIn'),
      disbursed: count('disbursed'),
      problems: bookings.filter((b) => b.bucket === 'problems').length,
      of: live.length,
    },
    ...(list.billedAtISO !== undefined ? { billedAtISO: list.billedAtISO } : {}),
    hasProblem,
    bucket,
    bookings,
  }
}

/** All authorised, non-backdrop Lists' billing status (US-13.3.1). */
export function listBillingStatuses(input: BillingStatusInput): ListBillingStatus[] {
  const look = buildLookups(input)
  return Object.values(input.lists)
    .filter(isLiveAuthorised)
    .sort(compareLists)
    .map((list) => listStatus(list, input, look))
}

// ---------------------------------------------------------------------------
// Xero items by List (D109: a stuck List counts once)
// ---------------------------------------------------------------------------

/** An open Xero sync queue item or divergence, tied to its List where it has one (D109). */
export interface XeroListItem {
  kind: 'queue' | 'divergence'
  id: string
  itemKind: XeroQueueItem['kind'] | XeroDivergence['kind']
  alerted: boolean
  pairId?: string
  bookingId?: string
  listId?: string
}

/** Open Xero hand-offs, journals and divergences tied to the authorised List of their Booking, or left unattached (D109: a stuck List counts once). */
export function xeroItemsOnLists(input: Pick<BillingStatusInput, 'lists' | 'ledger' | 'transfers' | 'xeroQueue' | 'xeroDivergences'>): {
  byList: Map<string, XeroListItem[]>
  unattached: XeroListItem[]
} {
  const byList = new Map<string, XeroListItem[]>()
  const unattached: XeroListItem[] = []
  const place = (base: Pick<XeroListItem, 'kind' | 'id' | 'itemKind' | 'alerted'>, pairId: string | undefined) => {
    const pair = pairId !== undefined ? input.ledger[pairId] : undefined
    if (pair === undefined || !isBookingPair(pair)) {
      unattached.push({ ...base, ...(pairId !== undefined ? { pairId } : {}) })
      return
    }
    const item: XeroListItem = { ...base, pairId: pair.id, bookingId: pair.bookingId }
    const list = input.lists[pair.listId]
    if (list === undefined || !isLiveAuthorised(list)) {
      unattached.push(item)
      return
    }
    push(byList, list.id, { ...item, listId: list.id })
  }
  for (const q of openQueueItems(input.xeroQueue)) place({ kind: 'queue', id: q.id, itemKind: q.kind, alerted: q.status === 'alerted' }, queueItemPairIds(q, input.transfers)[0])
  for (const d of openDivergences(input.xeroDivergences)) place({ kind: 'divergence', id: d.id, itemKind: d.kind, alerted: false }, d.pairId)
  for (const items of byList.values()) items.sort((a, b) => byIdNumeric(a.id, b.id))
  unattached.sort((a, b) => byIdNumeric(a.id, b.id))
  return { byList, unattached }
}

// ---------------------------------------------------------------------------
// Grouping, filtering and counts
// ---------------------------------------------------------------------------

/** The Billing tab's filter buckets: the three, or all (US-13.3.1). */
export type BillingFilterBucket = BillingBucket | 'all'

/** The Billing tab's filter: bucket, anaesthetist and search (US-13.3.1). */
export interface BillingFilter {
  bucket: BillingFilterBucket
  anaesthetistId?: string
  q?: string
}

/** A List as the Billing tab shows it: the Bookings in view and how many are hidden (US-13.3.1). */
export interface BillingListView {
  list: ListBillingStatus
  bookings: BookingBillingStatus[]
  hiddenCount: number
  /** Every Booking of the List, for "Show all N". */
  bookingCount: number
}

/** One anaesthetist's Lists on the Billing tab (US-13.3.1). */
export interface BillingGroup {
  anaesthetistId: string
  anaesthetistName: string
  lists: BillingListView[]
  listCount: number
  problemListCount: number
}

const normalisedQuery = (q: string | undefined): string => (q ?? '').trim().toLowerCase()

function bookingMatches(b: BookingBillingStatus, q: string): boolean {
  return b.patientName.toLowerCase().includes(q) || b.invoiceNumbers.some((n) => n.toLowerCase().includes(q))
}

function listBucket(list: ListBillingStatus): BillingBucket {
  return list.hasProblem ? 'problems' : list.bucket
}

/** The List's view under a bucket and a normalised search, or undefined when it drops out. */
function listView(list: ListBillingStatus, bucket: BillingFilterBucket, q: string): BillingListView | undefined {
  if (bucket !== 'all' && listBucket(list) !== bucket) return undefined
  let shown = bucket === 'problems' ? list.bookings.filter((b) => b.bucket === 'problems') : list.bookings
  if (q !== '') {
    const headingMatches = (list.hospitalName ?? '').toLowerCase().includes(q) || list.anaesthetistName.toLowerCase().includes(q)
    if (!headingMatches) {
      shown = shown.filter((b) => bookingMatches(b, q))
      if (shown.length === 0) return undefined
    }
  }
  return { list, bookings: shown, hiddenCount: list.bookings.length - shown.length, bookingCount: list.bookings.length }
}

function surnameKey(name: string): string {
  const words = nameWithoutTitle(name).split(/\s+/).filter((w) => w !== '')
  return (words[words.length - 1] ?? name).toLowerCase()
}

/** Lists grouped by anaesthetist, surname order, narrowed by bucket, anaesthetist and search (US-13.3.1). */
export function billingGroups(lists: readonly ListBillingStatus[], filter: BillingFilter): BillingGroup[] {
  const q = normalisedQuery(filter.q)
  const byAnaesthetist = new Map<string, BillingListView[]>()
  const names = new Map<string, string>()
  for (const list of lists) {
    if (filter.anaesthetistId !== undefined && list.anaesthetistId !== filter.anaesthetistId) continue
    const view = listView(list, filter.bucket, q)
    if (view === undefined) continue
    push(byAnaesthetist, list.anaesthetistId, view)
    if (!names.has(list.anaesthetistId)) names.set(list.anaesthetistId, list.anaesthetistName)
  }
  const groups: BillingGroup[] = []
  for (const [anaesthetistId, views] of byAnaesthetist) {
    views.sort((a, b) => b.list.dateISO.localeCompare(a.list.dateISO) || byIdNumeric(a.list.listId, b.list.listId))
    groups.push({
      anaesthetistId,
      anaesthetistName: names.get(anaesthetistId) ?? anaesthetistId,
      lists: views,
      listCount: views.length,
      problemListCount: views.filter((v) => v.list.hasProblem).length,
    })
  }
  return groups.sort((a, b) => surnameKey(a.anaesthetistName).localeCompare(surnameKey(b.anaesthetistName)) || byIdNumeric(a.anaesthetistId, b.anaesthetistId))
}

/** The Billing tab's filter counts, by List (US-13.3.1). */
export interface BillingCounts {
  problems: number
  inProgress: number
  done: number
  all: number
  problemAnaesthetists: number
}

/** The four filter counts, by List, after anaesthetist and search (US-13.3.1). */
export function billingCounts(lists: readonly ListBillingStatus[], filter: Omit<BillingFilter, 'bucket'> = {}): BillingCounts {
  const q = normalisedQuery(filter.q)
  const counts: BillingCounts = { problems: 0, inProgress: 0, done: 0, all: 0, problemAnaesthetists: 0 }
  const problemAnaesthetists = new Set<string>()
  for (const list of lists) {
    if (filter.anaesthetistId !== undefined && list.anaesthetistId !== filter.anaesthetistId) continue
    if (listView(list, 'all', q) !== undefined) counts.all += 1
    const bucket = listBucket(list)
    if (listView(list, bucket, q) === undefined) continue
    counts[bucket] += 1
    if (bucket === 'problems') problemAnaesthetists.add(list.anaesthetistId)
  }
  counts.problemAnaesthetists = problemAnaesthetists.size
  return counts
}

/** Lists with a billing problem: the Billing tab's number and the badge's billing part (D109). */
export function problemListCount(lists: readonly ListBillingStatus[]): number {
  let n = 0
  for (const l of lists) if (l.hasProblem) n += 1
  return n
}

/** "3 Lists with a problem, 2 anaesthetists" / "1 List with a problem, 1 anaesthetist" (US-13.3.1). */
export function problemCountLine(counts: BillingCounts): string {
  const lists = `${counts.problems} ${counts.problems === 1 ? 'List' : 'Lists'} with a problem`
  const people = `${counts.problemAnaesthetists} ${counts.problemAnaesthetists === 1 ? 'anaesthetist' : 'anaesthetists'}`
  return `${lists}, ${people}`
}
