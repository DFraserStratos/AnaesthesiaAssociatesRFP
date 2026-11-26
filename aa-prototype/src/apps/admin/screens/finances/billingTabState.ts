/**
 * The Billing tab's pure view (US-13.3.1): from the URL params and 59's
 * billing status, the page of anaesthetist groups the table shows. Problems
 * keeps only a List's problem Bookings and only Lists with one; In progress,
 * Done and All keep their Lists; a List's Show all adds the rest of its
 * Bookings. Search narrows Lists and Bookings by anaesthetist, hospital,
 * patient, Booking id, invoice number and payer. Paging is by List.
 *
 * One pass over the Lists and their Bookings, run once per render by the
 * caller (`useMemo`); it holds at practice scale (about 18,000 Lists).
 */

import {
  billingGroups,
  problemCountLine,
  type BillingFilterBucket,
  type BookingBillingStatus,
  type ListBillingStatus,
} from '../../../../domain/billing/billingStatus'

/** Lists per page (Before you start 4). */
export const BILLING_PAGE_SIZE = 20

/** The URL value of `?show=`. */
export type BillingShow = 'problems' | 'in-progress' | 'done' | 'all'

/** The Billing tab's URL state. */
export interface BillingTabParams {
  show: BillingShow
  /** Trimmed search text. */
  q: string
  anaesthetistId?: string
  /** 1-based; clamped by the view. */
  page: number
  /** A List opened from elsewhere (the invoice page's `billingListPath`): shown in full, on its page. */
  listId?: string
}

const SHOWS: readonly BillingShow[] = ['problems', 'in-progress', 'done', 'all']

const isShow = (v: string | null): v is BillingShow => v !== null && (SHOWS as readonly string[]).includes(v)

function positiveInt(v: string | null): number | undefined {
  if (v === null || !/^\d+$/.test(v.trim())) return undefined
  const n = Number(v.trim())
  return Number.isSafeInteger(n) && n >= 1 ? n : undefined
}

/** The tab's params from the URL: Problems by default (and for the legacy `?problems=1` or an unknown value); `list` forces All. */
export function billingParamsFrom(search: URLSearchParams): BillingTabParams {
  const rawShow = search.get('show')
  const listId = (search.get('list') ?? '').trim()
  const anaesthetistId = (search.get('anaesthetist') ?? '').trim()
  const show: BillingShow = listId !== '' ? 'all' : isShow(rawShow) ? rawShow : 'problems'
  return {
    show,
    q: (search.get('q') ?? '').trim(),
    ...(anaesthetistId !== '' ? { anaesthetistId } : {}),
    page: positiveInt(search.get('page')) ?? 1,
    ...(listId !== '' ? { listId } : {}),
  }
}

/** 59's filter bucket for a `show` value. */
export function bucketOf(show: BillingShow): BillingFilterBucket {
  return show === 'in-progress' ? 'inProgress' : show
}

/** A List as the tab shows it. */
export interface BillingTabList {
  list: ListBillingStatus
  bookings: BookingBillingStatus[]
  /** Bookings of the List not in view ("Show all N"); 0 when showing all. */
  hiddenCount: number
  /** Every Booking of the List. */
  bookingCount: number
  showingAll: boolean
}

/** One anaesthetist's Lists on this page; the counts are over the whole filtered result. */
export interface BillingTabGroup {
  anaesthetistId: string
  anaesthetistName: string
  listCount: number
  problemListCount: number
  /** Only this page's Lists. */
  lists: BillingTabList[]
}

/** The page the table shows. */
export interface BillingTabView {
  groups: BillingTabGroup[]
  /** Lists across every page. */
  totalLists: number
  /** Clamped to [1, pages]. */
  page: number
  /** At least 1. */
  pages: number
  /** Lists with a problem and their anaesthetists, under the anaesthetist filter and search, whatever `show`. */
  summary: { problems: number; problemAnaesthetists: number }
}

export interface BillingTabOptions {
  /** Lists whose Show all is on. */
  showAll?: ReadonlySet<string>
  pageSize?: number
  /** Who is billed for a Booking, for search. Called only while searching. */
  payerNames?: (bookingId: string) => readonly string[]
}

/** The tab's page of groups (US-13.3.1). */
export function billingTabView(lists: readonly ListBillingStatus[], params: BillingTabParams, opts: BillingTabOptions = {}): BillingTabView {
  const q = params.q.trim().toLowerCase()
  const pageSize = Math.max(1, Math.floor(opts.pageSize ?? BILLING_PAGE_SIZE))
  const showAll = opts.showAll

  // Booking matches, cached: the summary and the table may ask about the same Booking.
  const matchCache = new Map<string, boolean>()
  const bookingMatches = (b: BookingBillingStatus): boolean => {
    const hit = matchCache.get(b.bookingId)
    if (hit !== undefined) return hit
    const found =
      b.patientName.toLowerCase().includes(q) ||
      b.bookingId.toLowerCase().includes(q) ||
      b.invoiceNumbers.some((n) => n.toLowerCase().includes(q)) ||
      (opts.payerNames?.(b.bookingId) ?? []).some((n) => n.toLowerCase().includes(q))
    matchCache.set(b.bookingId, found)
    return found
  }
  const headingMatches = (list: ListBillingStatus): boolean =>
    list.anaesthetistName.toLowerCase().includes(q) || (list.hospitalName ?? '').toLowerCase().includes(q)

  // Bucket and anaesthetist from 59 (surname order, date descending); search here.
  const base = billingGroups(lists, { bucket: bucketOf(params.show), ...(params.anaesthetistId !== undefined ? { anaesthetistId: params.anaesthetistId } : {}) })

  interface Filtered {
    anaesthetistId: string
    anaesthetistName: string
    lists: BillingTabList[]
    problemListCount: number
  }
  const filtered: Filtered[] = []
  let totalLists = 0
  let landingIndex = -1
  for (const group of base) {
    const kept: BillingTabList[] = []
    let problemLists = 0
    for (const view of group.lists) {
      const list = view.list
      const all = (showAll?.has(list.listId) ?? false) || params.listId === list.listId
      const candidates = all ? list.bookings : view.bookings
      let shown = candidates
      if (q !== '' && !headingMatches(list)) {
        shown = candidates.filter(bookingMatches)
        if (shown.length === 0) continue
      }
      if (all) shown = list.bookings
      if (list.listId === params.listId) landingIndex = totalLists
      kept.push({
        list,
        bookings: shown,
        hiddenCount: list.bookings.length - shown.length,
        bookingCount: list.bookings.length,
        showingAll: all,
      })
      if (list.hasProblem) problemLists += 1
      totalLists += 1
    }
    if (kept.length > 0) filtered.push({ anaesthetistId: group.anaesthetistId, anaesthetistName: group.anaesthetistName, lists: kept, problemListCount: problemLists })
  }

  // Paging by List across groups; a group may run onto the next page.
  const pages = Math.max(1, Math.ceil(totalLists / pageSize))
  const wanted = landingIndex >= 0 ? Math.floor(landingIndex / pageSize) + 1 : params.page
  const page = Math.min(Math.max(1, Math.floor(wanted)), pages)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const groups: BillingTabGroup[] = []
  let offset = 0
  for (const g of filtered) {
    const from = offset
    offset += g.lists.length
    if (offset <= start) continue
    if (from >= end) break
    groups.push({
      anaesthetistId: g.anaesthetistId,
      anaesthetistName: g.anaesthetistName,
      listCount: g.lists.length,
      problemListCount: g.problemListCount,
      lists: g.lists.slice(Math.max(0, start - from), end - from),
    })
  }

  // The summary: Lists with a problem under the anaesthetist filter and search, whatever the bucket.
  let problems = 0
  const problemAnaesthetists = new Set<string>()
  for (const list of lists) {
    if (!list.hasProblem) continue
    if (params.anaesthetistId !== undefined && list.anaesthetistId !== params.anaesthetistId) continue
    if (q !== '' && !headingMatches(list) && !list.bookings.some((b) => b.bucket === 'problems' && bookingMatches(b))) continue
    problems += 1
    problemAnaesthetists.add(list.anaesthetistId)
  }

  return { groups, totalLists, page, pages, summary: { problems, problemAnaesthetists: problemAnaesthetists.size } }
}

/** "3 Lists with a problem, 2 anaesthetists" for the toolbar (59's `problemCountLine`). */
export function summaryLine(view: Pick<BillingTabView, 'summary'>): string {
  return problemCountLine({ problems: view.summary.problems, problemAnaesthetists: view.summary.problemAnaesthetists, inProgress: 0, done: 0, all: 0 })
}
