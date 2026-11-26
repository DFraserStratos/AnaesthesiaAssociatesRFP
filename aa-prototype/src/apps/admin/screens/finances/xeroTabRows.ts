/**
 * The Xero tab's pure view (US-13.3.2, US-13.3.3): from the URL params, the
 * Xero sync queue (`xeroQueueView`) and the open divergences
 * (`openXeroDivergences`), the groups the table shows, the folded Sent after
 * waiting rows and the toolbar's count line.
 *
 * Groups, in order: Hand-offs failing (an alert raised), Hand-offs waiting
 * (waiting or retrying), Changed directly in Xero. Every queue kind lists
 * (hand-off, transfer journal, payment sync, disbursement, correction,
 * netting, the poll). Needs action (the default) shows the three groups that
 * hold rows, so a waiting Booking shows the moment the tab opens; Waiting
 * narrows to the waiting group; Sent after waiting shows only the sent rows;
 * All shows the three groups, empty ones included. Search matches an invoice
 * or payable number, the payer and the anaesthetist; the anaesthetist filter
 * applies to both kinds. Paging is by row across the shown groups.
 *
 * One pass over the queue and the divergences, run once per render by the
 * caller (`useMemo`); it holds at practice scale.
 */

import { openXeroDivergences, xeroQueueView, type XeroQueueRow } from '../../../../store/ledgerSelectors'
import { invoiceAddresseeName } from '../../../../store/selectors'
import type { AppState } from '../../../../store/appStore'
import { isBookingPair, payeeAnaesthetistOf } from '../../../../domain/billing/ledger'
import type { XeroDivergence } from '../../../../domain/types'

/** Rows per page (Before you start 4). */
export const XERO_PAGE_SIZE = 50

/** The URL value of `?show=`. */
export type XeroShow = 'needs-action' | 'waiting' | 'sent' | 'all'

/** The Xero tab's URL state (`q`, `show`, `anaesthetist`, `page`). */
export interface XeroTabParams {
  /** Trimmed search text. */
  q: string
  show: XeroShow
  anaesthetistId?: string
  /** 1-based; clamped by the view. */
  page: number
}

const SHOWS: readonly XeroShow[] = ['needs-action', 'waiting', 'sent', 'all']

const isShow = (v: string | null): v is XeroShow => v !== null && (SHOWS as readonly string[]).includes(v)

function positiveInt(v: string | null): number | undefined {
  if (v === null || !/^\d+$/.test(v.trim())) return undefined
  const n = Number(v.trim())
  return Number.isSafeInteger(n) && n >= 1 ? n : undefined
}

/** The tab's params from the URL: Needs action by default (and for an unknown value); page 1 unless a positive integer. */
export function xeroParamsFrom(search: URLSearchParams): XeroTabParams {
  const rawShow = search.get('show')
  const anaesthetistId = (search.get('anaesthetist') ?? '').trim()
  return {
    q: (search.get('q') ?? '').trim(),
    show: isShow(rawShow) ? rawShow : 'needs-action',
    ...(anaesthetistId !== '' ? { anaesthetistId } : {}),
    page: positiveInt(search.get('page')) ?? 1,
  }
}

export type XeroGroupKey = 'failing' | 'waiting' | 'changed'

export const GROUP_TITLES: Record<XeroGroupKey, string> = {
  failing: 'Hand-offs failing',
  waiting: 'Hand-offs waiting',
  changed: 'Changed directly in Xero',
}

/** One group on this page. `count` is over every page; `queue` and `divergences` are this page's rows. */
export interface XeroTabGroup {
  key: XeroGroupKey
  title: string
  count: number
  /** The failing and waiting groups' rows (empty on Changed directly in Xero). */
  queue: XeroQueueRow[]
  /** The Changed directly in Xero group's rows (empty on the hand-off groups). */
  divergences: XeroDivergence[]
}

/** What the table needs beside a row, worked out once: its anaesthetist (from the pair, transfer or the Booking's List) and its payer. */
export interface XeroRowFacts {
  anaesthetistId?: string
  /** The payer's name (`invoiceAddresseeName`, as the divergence panel names it); '' when the row has no invoice (the poll, an AA fee). */
  payer: string
}

/** The page the tab shows. */
export interface XeroTabView {
  /**
   * The groups with rows on this page, in order. Under All an empty group
   * (count 0) is kept too, on page 1 only, so the table can show it; under
   * Sent after waiting there are none.
   */
  groups: XeroTabGroup[]
  /**
   * The Sent after waiting rows, newest first, under the search and the
   * anaesthetist filter. Every sent row (what the queue panel's toggle shows);
   * under `show=sent` the table pages them, so this is only this page's.
   */
  sent: XeroQueueRow[]
  /** Over every page, under the search and the anaesthetist filter, whatever `show`. `sentToday`: sent on `todayISO`. */
  counts: { failing: number; waiting: number; changed: number; sent: number; sentToday: number }
  /** "3 need action: 2 hand-offs failing, 1 changed in Xero", or "Nothing needs action". */
  countLine: string
  /** Rows the table pages over (the shown groups' rows, or the sent rows under `show=sent`). */
  total: number
  /** Clamped to [1, pages]. */
  page: number
  /** At least 1. */
  pages: number
  /** Each listed row's facts, by queue item id (`XQ…`) or divergence id (`XD…`). */
  facts: ReadonlyMap<string, XeroRowFacts>
}

/** The slices the view reads. */
export type XeroTabState = Pick<AppState, 'billing' | 'masters' | 'schedule'>

export interface XeroTabOptions {
  pageSize?: number
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

/** The toolbar's count line: failing and waiting hand-offs and changes in Xero all need action; parts with none are left out. */
export function xeroCountLine(counts: Pick<XeroTabView['counts'], 'failing' | 'waiting' | 'changed'>): string {
  const n = counts.failing + counts.waiting + counts.changed
  if (n === 0) return 'Nothing needs action'
  const parts: string[] = []
  if (counts.failing > 0) parts.push(`${plural(counts.failing, 'hand-off', 'hand-offs')} failing`)
  if (counts.waiting > 0) parts.push(`${plural(counts.waiting, 'hand-off', 'hand-offs')} waiting`)
  if (counts.changed > 0) parts.push(`${counts.changed} changed in Xero`)
  return `${n} ${n === 1 ? 'needs' : 'need'} action: ${parts.join(', ')}`
}

/** The Xero tab's page (US-13.3.2). `todayISO` dates the rail's Sent after waiting today. */
export function xeroTabRows(state: XeroTabState, params: XeroTabParams, todayISO: string, opts: XeroTabOptions = {}): XeroTabView {
  const pageSize = Math.max(1, Math.floor(opts.pageSize ?? XERO_PAGE_SIZE))
  const q = params.q.trim().toLowerCase()
  const { ledger, transfers, invoices, creditNotes } = state.billing
  const masters = { masters: state.masters }

  const anaesthetistName = (id: string | undefined): string => (id !== undefined ? (state.masters.anaesthetists[id]?.name ?? '') : '')
  const listAnaesthetist = (listId: string): string | undefined => (state.schedule.lists[listId] as { anaesthetistId?: string } | undefined)?.anaesthetistId
  const payerOfInvoice = (invoiceId: string | undefined): string => {
    const invoice = invoiceId !== undefined ? invoices[invoiceId] : undefined
    return invoice !== undefined ? invoiceAddresseeName(masters, invoice) : ''
  }

  const facts = new Map<string, XeroRowFacts>()
  const keep = (id: string, f: XeroRowFacts, numbers: readonly (string | undefined)[]): boolean => {
    if (params.anaesthetistId !== undefined && f.anaesthetistId !== params.anaesthetistId) return false
    if (q !== '') {
      const hit =
        numbers.some((n) => n !== undefined && n.toLowerCase().includes(q)) ||
        f.payer.toLowerCase().includes(q) ||
        anaesthetistName(f.anaesthetistId).toLowerCase().includes(q)
      if (!hit) return false
    }
    facts.set(id, f)
    return true
  }

  // A queue row: its pair (or the transfer's prepayment pair), the invoice behind it and every number it carries.
  const keepQueueRow = (r: XeroQueueRow): boolean => {
    const target = r.item.target
    const transfer = target.transferId !== undefined ? transfers[target.transferId] : undefined
    const pairId = r.pairId ?? target.pairId ?? transfer?.collectPairId
    const pair = pairId !== undefined ? ledger[pairId] : undefined
    const bookingPair = pair !== undefined && isBookingPair(pair) ? pair : undefined
    const anaesthetistId =
      r.anaesthetistId ??
      (transfer !== undefined ? (payeeAnaesthetistOf(transfer.in) ?? listAnaesthetist(transfer.listId)) : undefined) ??
      (bookingPair !== undefined ? listAnaesthetist(bookingPair.listId) : undefined)
    const invoiceId = transfer?.invoiceId ?? bookingPair?.invoiceId
    const f: XeroRowFacts = { ...(anaesthetistId !== undefined ? { anaesthetistId } : {}), payer: payerOfInvoice(invoiceId) }
    const note = target.creditNoteId !== undefined ? creditNotes[target.creditNoteId] : undefined
    return keep(r.item.id, f, [
      pair?.receivable.number,
      bookingPair?.payable?.number,
      transfer?.in.number,
      invoiceId !== undefined ? invoices[invoiceId]?.invoiceNumber : undefined,
      note?.creditNoteNumber,
    ])
  }

  const keepDivergence = (d: XeroDivergence): boolean => {
    const pair = ledger[d.pairId]
    const bookingPair = pair !== undefined && isBookingPair(pair) ? pair : undefined
    const anaesthetistId =
      pair?.anaesthetistId ??
      (bookingPair?.payable !== undefined ? payeeAnaesthetistOf(bookingPair.payable) : undefined) ??
      (bookingPair !== undefined ? listAnaesthetist(bookingPair.listId) : undefined)
    const f: XeroRowFacts = { ...(anaesthetistId !== undefined ? { anaesthetistId } : {}), payer: payerOfInvoice(d.invoiceId) }
    return keep(d.id, f, [invoices[d.invoiceId]?.invoiceNumber, pair?.receivable.number, bookingPair?.payable?.number])
  }

  // One pass each: the queue (open in drain order, sent newest first) and the open divergences.
  const queue = xeroQueueView(state)
  const failing: XeroQueueRow[] = []
  const waiting: XeroQueueRow[] = []
  for (const r of queue.open) {
    if (!keepQueueRow(r)) continue
    if (r.item.status === 'alerted') failing.push(r)
    else waiting.push(r)
  }
  const sentAll = queue.sent.filter(keepQueueRow)
  const changed = openXeroDivergences(state).filter(keepDivergence)
  const sentToday = sentAll.filter((r) => r.item.sentAtISO?.slice(0, 10) === todayISO).length

  const counts = { failing: failing.length, waiting: waiting.length, changed: changed.length, sent: sentAll.length, sentToday }
  const countLine = xeroCountLine(counts)

  if (params.show === 'sent') {
    const total = sentAll.length
    const pages = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(Math.max(1, params.page), pages)
    return { groups: [], sent: sentAll.slice((page - 1) * pageSize, page * pageSize), counts, countLine, total, page, pages, facts }
  }

  const keys: XeroGroupKey[] = params.show === 'waiting' ? ['waiting'] : ['failing', 'waiting', 'changed']
  const rowsOf = { failing, waiting, changed }
  const total = keys.reduce((n, k) => n + rowsOf[k].length, 0)
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, params.page), pages)
  const from = (page - 1) * pageSize
  const to = from + pageSize

  const groups: XeroTabGroup[] = []
  let offset = 0
  for (const key of keys) {
    const rows = rowsOf[key]
    const start = Math.max(from - offset, 0)
    const end = Math.min(to - offset, rows.length)
    offset += rows.length
    const slice = start < end ? rows.slice(start, end) : []
    const keepEmpty = params.show === 'all' && rows.length === 0 && page === 1
    if (slice.length === 0 && !keepEmpty) continue
    groups.push({
      key,
      title: GROUP_TITLES[key],
      count: rows.length,
      queue: key === 'changed' ? [] : (slice as XeroQueueRow[]),
      divergences: key === 'changed' ? (slice as XeroDivergence[]) : [],
    })
  }

  return { groups, sent: sentAll, counts, countLine, total, page, pages, facts }
}
