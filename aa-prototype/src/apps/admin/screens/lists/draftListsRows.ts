/**
 * Lists › Draft Lists, its view model (US-01.6.2 "Search and filters", "Sorting", "Paging";
 * US-13.1.3): the waiting Draft Lists or their History filtered by a search (surgeon, hospital, note),
 * When (from today, the next two weeks, or past ones included), hospital and why the List has no
 * anaesthetist; the waiting ones grouped under one row per day, soonest first; and the "why" text
 * each row prints. Pure: the tab only renders what this returns.
 */

import { addDaysISO } from '../../../../domain/clock'
import type { Anaesthetist, DraftOrigin, Hospital, List, Surgeon } from '../../../../domain/types'
import { drSurname, locationName, shortDay } from '../../../../shared/format'
import { ORIGIN_LABELS, ORIGIN_SHORT_LABELS, SOURCE_LABELS, unavailableDetail } from '../../../../shared/scheduleTerms'

/** The tab's page size: People's and Xero's 50. */
export const DRAFT_LISTS_PAGE_SIZE = 50

export type DraftListsView = 'waiting' | 'history'
export type DraftListsWhen = 'upcoming' | 'fortnight' | 'all'
export type DraftListsWhy = DraftOrigin | 'all'

/** The tab's URL state and its defaults (a default leaves the URL). `view=history` is the History. */
export const DRAFT_LISTS_DEFAULTS = { view: 'waiting', q: '', when: 'upcoming', hospital: 'all', why: 'all' } as const

export const WHEN_OPTIONS: readonly { value: DraftListsWhen; label: string }[] = [
  { value: 'upcoming', label: 'From today' },
  { value: 'fortnight', label: 'Next 2 weeks' },
  { value: 'all', label: 'Include past' },
]

const ORIGINS: readonly DraftOrigin[] = ['request', 'recurringClash', 'movedToOffice', 'unavailableReturn', 'hospitalRow']

/** The Why filter's choices, each origin by its full label. */
export const WHY_OPTIONS: readonly { value: DraftOrigin; label: string }[] = ORIGINS.map((o) => ({ value: o, label: ORIGIN_LABELS[o] }))

export function parseView(value: string): DraftListsView {
  return value === 'history' ? 'history' : 'waiting'
}

export function parseWhen(value: string): DraftListsWhen {
  return value === 'fortnight' || value === 'all' ? value : 'upcoming'
}

export function parseWhy(value: string): DraftListsWhy {
  return (ORIGINS as readonly string[]).includes(value) ? (value as DraftOrigin) : 'all'
}

/** The last day "Next 2 weeks" takes in: today and the 13 days after it. */
export function fortnightEndISO(todayISO: string): string {
  return addDaysISO(todayISO, 13)
}

export interface DraftListsMasters {
  hospitals: Readonly<Record<string, Pick<Hospital, 'name'>>>
  surgeons: Readonly<Record<string, Pick<Surgeon, 'name'>>>
  anaesthetists: Readonly<Record<string, Pick<Anaesthetist, 'name'>>>
}

/**
 * Why a Draft List has no anaesthetist, with its detail: "Request · Phone", "Recurring booking ·
 * Dr Beaumont unavailable", "Moved to the office · Dr Strand", "Returned: anaesthetist unavailable ·
 * Dr Hughes", "Hospital row". Empty for a List with no Draft trail.
 */
export function draftOriginText(list: Pick<List, 'draft'>, anaesthetists: DraftListsMasters['anaesthetists']): string {
  const t = list.draft
  if (t === undefined) return ''
  const short = ORIGIN_SHORT_LABELS[t.origin]
  if (t.origin === 'request') return t.source !== undefined ? `${short} · ${SOURCE_LABELS[t.source]}` : short
  if (t.origin === 'hospitalRow') return short
  const fromId = t.fromAnaesthetistId ?? t.projectedFor?.anaesthetistId
  const from = fromId !== undefined ? anaesthetists[fromId] : undefined
  if (from === undefined) return short
  const who = drSurname(from.name)
  return t.origin === 'recurringClash' ? `${short} · ${unavailableDetail(who)}` : `${short} · ${who}`
}

export interface DraftListsFilter {
  q: string
  hospitalId: string
  why: DraftListsWhy
}

/** Does the List match the search (surgeon, hospital, note), the hospital and the why filters. */
function matches(list: List, filter: DraftListsFilter, masters: DraftListsMasters): boolean {
  if (filter.hospitalId !== 'all' && list.hospitalId !== filter.hospitalId) return false
  if (filter.why !== 'all' && list.draft?.origin !== filter.why) return false
  const q = filter.q.trim().toLowerCase()
  if (q === '') return true
  const surgeon = masters.surgeons[list.surgeonId]?.name ?? list.surgeonId
  const hay = [surgeon, locationName(list.hospitalId, masters.hospitals), list.notes ?? ''].join('\n').toLowerCase()
  return hay.includes(q)
}

/** Is the List's day inside the When window (past days only with Include past). */
export function inWhen(dateISO: string, when: DraftListsWhen, todayISO: string): boolean {
  if (when === 'all') return true
  if (dateISO < todayISO) return false
  return when === 'upcoming' || dateISO <= fortnightEndISO(todayISO)
}

export interface WaitingRowsResult<L extends List> {
  /** The waiting Draft Lists that pass every filter, in the order given (soonest first). */
  rows: L[]
  /** Past Draft Lists that pass every other filter but are hidden by When ("Include past" shows them). */
  pastHidden: number
}

/** The waiting Draft Lists that show, keeping their order (`waitingDraftLists`, soonest first). */
export function waitingDraftRows<L extends List>(
  waiting: readonly L[],
  filter: DraftListsFilter & { when: DraftListsWhen },
  todayISO: string,
  masters: DraftListsMasters,
): WaitingRowsResult<L> {
  const rows: L[] = []
  let pastHidden = 0
  for (const l of waiting) {
    if (!matches(l, filter, masters)) continue
    if (inWhen(l.dateISO, filter.when, todayISO)) rows.push(l)
    else if (l.dateISO < todayISO) pastHidden++
  }
  return { rows, pastHidden }
}

/** The History rows (assigned or removed Draft Lists, newest first) that pass the search, hospital and why filters. When does not apply. */
export function historyDraftRows(finished: readonly List[], filter: DraftListsFilter, masters: DraftListsMasters): List[] {
  return finished.filter((l) => matches(l, filter, masters))
}

export interface DraftDayGroup<L extends List> {
  dateISO: string
  /** "Today, Tue 24 Nov" or "Wed 25 Nov". */
  label: string
  past: boolean
  lists: L[]
}

/** A day's group-row label: today's says so. */
export function dayGroupLabel(dateISO: string, todayISO: string): string {
  return dateISO === todayISO ? `Today, ${shortDay(dateISO)}` : shortDay(dateISO)
}

/** One group per day, in the rows' order (a page's rows: a day split across pages heads both). */
export function groupByDay<L extends List>(rows: readonly L[], todayISO: string): DraftDayGroup<L>[] {
  const out: DraftDayGroup<L>[] = []
  for (const l of rows) {
    const last = out[out.length - 1]
    if (last !== undefined && last.dateISO === l.dateISO) last.lists.push(l)
    else out.push({ dateISO: l.dateISO, label: dayGroupLabel(l.dateISO, todayISO), past: l.dateISO < todayISO, lists: [l] })
  }
  return out
}

/** The Hospital filter's choices: every hospital the view's Lists sit at (and the chosen one, when it is a known hospital), by name. */
export function hospitalOptions(lists: readonly List[], hospitals: DraftListsMasters['hospitals'], selected: string): { value: string; label: string }[] {
  const ids = new Set(lists.map((l) => l.hospitalId))
  if (selected !== 'all' && hospitals[selected] !== undefined) ids.add(selected)
  return [...ids].map((id) => ({ value: id, label: locationName(id, hospitals) })).sort((a, b) => a.label.localeCompare(b.label) || a.value.localeCompare(b.value))
}
