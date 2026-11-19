/**
 * The processing monitor's view (catch-up Phase 37; US-13.3.1, FT-13.3): the
 * Billing monitor grouped by anaesthetist, with each anaesthetist's Lists
 * awaiting approval and their authorised Lists, filtered and sorted. Pure over
 * state and the screen's options, which live in the URL, never in the store:
 * the grouping and filters are Greg's suggestions, not settled, so a different
 * answer changes one screen.
 *
 * `billingMonitor` stays the one source of an authorised List's stages and
 * Booking rows (so the Invoices screen and the monitor never diverge), and
 * `submittedLists` the one source of what awaits approval (so the monitor and
 * the Review queue never disagree). Nothing here authorises a List: approval
 * stays on Review.
 */

import type { AppState } from './appStore'
import type { AssignedList } from '../domain/types'
import { billingMonitor, bookingsForList, submittedLists, type MonitorListRow } from './selectors'
import { openXeroDivergences, xeroQueueView } from './ledgerSelectors'
import { surnameOf } from '../shared/format'

/** Below this many authorised Lists in view the monitor opens every List, as at seed scale; above it only Lists with a problem open. */
export const MONITOR_EXPAND_ALL_UP_TO = 12

/** What makes an authorised List a problem. Not yet emailed, or not yet paid, is not a problem. */
export type MonitorProblem = 'billingException' | 'waitingForXero' | 'xeroAlert' | 'voidedInXero' | 'amendedInXero'

export type MonitorSortKey = 'date' | 'hospital' | 'status' | 'invoices' | 'run'
export type SortDir = 'asc' | 'desc'
export interface MonitorSort {
  key: MonitorSortKey
  dir: SortDir
}
export const DEFAULT_MONITOR_SORT: MonitorSort = { key: 'run', dir: 'desc' }
export const MONITOR_SORT_KEYS: readonly MonitorSortKey[] = ['date', 'hospital', 'status', 'invoices', 'run']

export interface BillingMonitorOptions {
  anaesthetistId?: string
  hospitalId?: string
  /** The List's date, inclusive. */
  fromISO?: string
  toISO?: string
  problemsOnly?: boolean
  sort?: MonitorSort
}

/** An authorised List's overall status, for its pill and the Status sort. */
export type MonitorListStatus = 'Voided in Xero' | 'Needs attention' | 'Billing' | 'Complete'
const STATUS_RANK: Record<MonitorListStatus, number> = { 'Voided in Xero': 0, 'Needs attention': 1, Billing: 2, Complete: 3 }

export interface MonitorAuthorisedRow extends MonitorListRow {
  problems: MonitorProblem[]
  status: MonitorListStatus
  /** "n of m" of the List's invoices mirrored in Xero. */
  inXeroCount: number
}

export interface MonitorAwaitingRow {
  list: AssignedList
  hospitalName?: string
  bookingCount: number
  /** When it was last submitted (its latest `list.submit` audit row), when the audit is passed. */
  submittedAtISO?: string
}

export interface MonitorGroup {
  anaesthetistId: string
  name: string
  counts: { awaiting: number; authorised: number; withProblems: number }
  /** By date, then session, then id. */
  awaiting: MonitorAwaitingRow[]
  authorised: MonitorAuthorisedRow[]
}

export interface BillingMonitorView {
  totals: { awaiting: number; authorised: number; withProblems: number }
  groups: MonitorGroup[]
  anaesthetistOptions: { id: string; name: string }[]
  hospitalOptions: { id: string; name: string }[]
  /** The options actually applied (an unknown id falls back to all). */
  applied: { anaesthetistId?: string; hospitalId?: string; fromISO?: string; toISO?: string; problemsOnly: boolean; sort: MonitorSort }
  /** Authorised Lists in view: the expand-all threshold reads it. */
  authorisedInView: number
  /** Lists in view (awaiting and authorised). */
  listsInView: number
}

type ViewState = Pick<AppState, 'schedule' | 'billing' | 'masters'> & Partial<Pick<AppState, 'audit'>>

/** The List each open queue item and divergence concerns, through its ledger pair's Booking. */
function listOfPair(state: ViewState, pairId: string | undefined): string | undefined {
  if (pairId === undefined) return undefined
  const pair = state.billing.ledger[pairId]
  if (pair === undefined || !('bookingId' in pair)) return undefined
  return state.schedule.bookings[pair.bookingId]?.listId
}

/** The problem kinds on each List with any, from the billing run, the Xero sync queue and the poll's flags. */
function problemsByList(state: ViewState, rows: readonly MonitorListRow[]): Map<string, Set<MonitorProblem>> {
  const out = new Map<string, Set<MonitorProblem>>()
  const add = (listId: string | undefined, p: MonitorProblem) => {
    if (listId === undefined) return
    const set = out.get(listId) ?? new Set<MonitorProblem>()
    set.add(p)
    out.set(listId, set)
  }
  for (const r of rows) if (r.failedCount > 0) add(r.listId, 'billingException')
  for (const q of xeroQueueView(state).open) add(listOfPair(state, q.pairId), q.item.status === 'alerted' ? 'xeroAlert' : 'waitingForXero')
  for (const d of openXeroDivergences(state)) add(listOfPair(state, d.pairId), d.kind)
  return out
}

const PROBLEM_ORDER: readonly MonitorProblem[] = ['billingException', 'waitingForXero', 'xeroAlert', 'voidedInXero', 'amendedInXero']

function statusOf(row: MonitorListRow, problems: readonly MonitorProblem[]): MonitorListStatus {
  if (problems.includes('voidedInXero')) return 'Voided in Xero'
  if (problems.length > 0) return 'Needs attention'
  return row.stages.every((s) => s.state === 'done') ? 'Complete' : 'Billing'
}

function inXeroCount(state: ViewState, row: MonitorListRow): number {
  const ids = new Set(row.bookingRows.flatMap((b) => b.invoiceIds))
  let n = 0
  for (const id of ids) {
    const pair = Object.values(state.billing.ledger).find((p) => 'invoiceId' in p && p.invoiceId === id)
    if (pair?.receivable.xeroAccRecId !== undefined) n += 1
  }
  return n
}

const sessionRank = (s: string) => (s === 'AM' ? 0 : s === 'PM' ? 1 : 2)

function compareRows(a: MonitorAuthorisedRow, b: MonitorAuthorisedRow, sort: MonitorSort): number {
  const sign = sort.dir === 'asc' ? 1 : -1
  let c = 0
  switch (sort.key) {
    case 'date':
      c = a.list.dateISO.localeCompare(b.list.dateISO) || sessionRank(a.list.session) - sessionRank(b.list.session)
      break
    case 'hospital':
      c = (a.hospitalName ?? a.list.hospitalId).localeCompare(b.hospitalName ?? b.list.hospitalId)
      break
    case 'status':
      c = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      break
    case 'invoices':
      c = a.invoiceCount - b.invoiceCount
      break
    case 'run':
      // An authorised List not yet billed sorts as the oldest run.
      c = (a.list.billedAtISO ?? '').localeCompare(b.list.billedAtISO ?? '')
      break
  }
  return c !== 0 ? sign * c : a.listId.localeCompare(b.listId)
}

function inDateRange(dateISO: string, fromISO: string | undefined, toISO: string | undefined): boolean {
  return (fromISO === undefined || dateISO >= fromISO) && (toISO === undefined || dateISO <= toISO)
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function billingMonitorView(state: ViewState, options: BillingMonitorOptions = {}): BillingMonitorView {
  const rows = billingMonitor(state)
  const awaitingLists = submittedLists(state).filter((l) => !l.id.startsWith('L-HIST'))
  const problems = problemsByList(state, rows)
  const nameOf = (id: string) => state.masters.anaesthetists[id]?.name ?? id
  const hospitalNameOf = (id: string) => state.masters.hospitals[id]?.name ?? id

  // Options for the filter bar, from every List the monitor can show.
  const anaesthetistIds = new Set([...rows.map((r) => r.list.anaesthetistId), ...awaitingLists.map((l) => l.anaesthetistId)])
  const hospitalIds = new Set([...rows.map((r) => r.list.hospitalId), ...awaitingLists.map((l) => l.hospitalId)])
  const bySurname = (a: { id: string; name: string }, b: { id: string; name: string }) => surnameOf(a.name).localeCompare(surnameOf(b.name)) || a.id.localeCompare(b.id)
  const anaesthetistOptions = [...anaesthetistIds].map((id) => ({ id, name: nameOf(id) })).sort(bySurname)
  const hospitalOptions = [...hospitalIds].map((id) => ({ id, name: hospitalNameOf(id) })).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))

  // Applied options: an unknown id or a malformed date falls back to all.
  const anaesthetistId = options.anaesthetistId !== undefined && state.masters.anaesthetists[options.anaesthetistId] !== undefined ? options.anaesthetistId : undefined
  const hospitalId = options.hospitalId !== undefined && state.masters.hospitals[options.hospitalId] !== undefined ? options.hospitalId : undefined
  const fromISO = options.fromISO !== undefined && ISO_DATE.test(options.fromISO) ? options.fromISO : undefined
  const toISO = options.toISO !== undefined && ISO_DATE.test(options.toISO) ? options.toISO : undefined
  const problemsOnly = options.problemsOnly === true
  const sort = options.sort !== undefined && MONITOR_SORT_KEYS.includes(options.sort.key) && (options.sort.dir === 'asc' || options.sort.dir === 'desc') ? options.sort : DEFAULT_MONITOR_SORT

  const keep = (l: AssignedList) =>
    (anaesthetistId === undefined || l.anaesthetistId === anaesthetistId) &&
    (hospitalId === undefined || l.hospitalId === hospitalId) &&
    inDateRange(l.dateISO, fromISO, toISO)

  const authorised: MonitorAuthorisedRow[] = rows
    .filter((r) => keep(r.list))
    .map((r) => {
      const set = problems.get(r.listId)
      const list = PROBLEM_ORDER.filter((p) => set?.has(p) === true)
      return { ...r, problems: list, status: statusOf(r, list), inXeroCount: inXeroCount(state, r) }
    })
  const submittedAt = new Map<string, string>()
  for (const e of state.audit ?? []) if (e.entityType === 'list' && e.action === 'list.submit') submittedAt.set(e.entityId, e.atISO)
  const awaiting: MonitorAwaitingRow[] = awaitingLists.filter(keep).map((l) => {
    const at = submittedAt.get(l.id)
    return {
      list: l,
      hospitalName: hospitalNameOf(l.hospitalId),
      bookingCount: bookingsForList(state, l.id).filter((b) => b.cancellation === undefined).length,
      ...(at !== undefined ? { submittedAtISO: at } : {}),
    }
  })

  const totals = { awaiting: awaiting.length, authorised: authorised.length, withProblems: authorised.filter((r) => r.problems.length > 0).length }

  const shownAuthorised = problemsOnly ? authorised.filter((r) => r.problems.length > 0) : authorised
  const shownAwaiting = problemsOnly ? [] : awaiting

  const groups: MonitorGroup[] = anaesthetistOptions
    .map(({ id, name }) => {
      const mine = shownAuthorised.filter((r) => r.list.anaesthetistId === id).sort((a, b) => compareRows(a, b, sort))
      const waiting = shownAwaiting
        .filter((a) => a.list.anaesthetistId === id)
        .sort((a, b) => a.list.dateISO.localeCompare(b.list.dateISO) || sessionRank(a.list.session) - sessionRank(b.list.session) || a.list.id.localeCompare(b.list.id))
      return {
        anaesthetistId: id,
        name,
        counts: { awaiting: waiting.length, authorised: mine.length, withProblems: mine.filter((r) => r.problems.length > 0).length },
        awaiting: waiting,
        authorised: mine,
      }
    })
    .filter((g) => g.awaiting.length + g.authorised.length > 0)

  return {
    totals,
    groups,
    anaesthetistOptions,
    hospitalOptions,
    applied: {
      ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
      ...(hospitalId !== undefined ? { hospitalId } : {}),
      ...(fromISO !== undefined ? { fromISO } : {}),
      ...(toISO !== undefined ? { toISO } : {}),
      problemsOnly,
      sort,
    },
    authorisedInView: shownAuthorised.length,
    listsInView: shownAuthorised.length + shownAwaiting.length,
  }
}

/** Whether an authorised List starts open: every List at seed scale, else only those with a problem. */
export function startsExpanded(row: Pick<MonitorAuthorisedRow, 'problems'>, authorisedInView: number, threshold: number = MONITOR_EXPAND_ALL_UP_TO): boolean {
  return row.problems.length > 0 || authorisedInView <= threshold
}

/** The URL search params the screen reads and writes (`?anaesthetist=&hospital=&from=&to=&problems=1&sort=run-desc&list=`). */
export function monitorOptionsFromSearch(params: URLSearchParams): BillingMonitorOptions & { listId?: string } {
  const get = (k: string) => {
    const v = params.get(k)
    return v === null || v === '' ? undefined : v
  }
  const sortRaw = get('sort')
  const [key, dir] = sortRaw !== undefined ? sortRaw.split('-') : []
  const anaesthetistId = get('anaesthetist')
  const hospitalId = get('hospital')
  const fromISO = get('from')
  const toISO = get('to')
  const listId = get('list')
  return {
    ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
    ...(hospitalId !== undefined ? { hospitalId } : {}),
    ...(fromISO !== undefined ? { fromISO } : {}),
    ...(toISO !== undefined ? { toISO } : {}),
    problemsOnly: get('problems') === '1',
    ...(key !== undefined && dir !== undefined ? { sort: { key: key as MonitorSortKey, dir: dir as SortDir } } : {}),
    ...(listId !== undefined ? { listId } : {}),
  }
}
