/**
 * The Arrivals inbox (27 Nov 2026 rebuild; docs/explorations/intake-inbox-iterations.html, inbox B): every arrival as one
 * row of a full-width table, narrowed by four drop-downs and a "Needs a look" checkbox, ordered by any column, and by
 * default grouped by date of surgery, soonest first. Pure functions over the feed items (`arrivals.ts`); the query
 * lives in the URL (`intakePaths.ts`), so the opened arrival's Previous, Next and Back keep the same order.
 */

import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { addDaysISO } from '../clock'
import { hhmm, longDayNoYear, shortDay } from '../dateText'
import type { Session } from '../types'
import { facsimileLetterhead } from './pdfLists'
import { ARRIVAL_KIND_LABELS, matchesFeedFilter, matchesFeedSearch, type ArrivalIntake, type ArrivalItem, type ArrivalKind } from './arrivals'

/** Which arrivals: those still to decide, the rows waiting for an NHI, or those decided. */
export type InboxShow = 'toDecide' | 'needsNhi' | 'decided'
/** The date-of-surgery window, from today. */
export type InboxSurgery = 'any' | 'tomorrow' | '2d' | '7d' | '30d'
export type InboxSortKey = 'surgery' | 'list' | 'kind' | 'patients' | 'needs' | 'from' | 'received'
export type InboxSortDir = 'asc' | 'desc'

export interface InboxQuery {
  show: InboxShow
  /** One kind, or every kind. */
  kind: ArrivalKind | 'all'
  /** `rooms` for the rooms' PDFs, a hospital id for that hospital's feed, or every source. */
  source: string
  surgery: InboxSurgery
  /** Only arrivals that need a look (`needsText`). */
  look: boolean
  sort: { key: InboxSortKey; dir: InboxSortDir }
  q: string
}

export const DEFAULT_INBOX_QUERY: InboxQuery = {
  show: 'toDecide',
  kind: 'all',
  source: 'all',
  surgery: 'any',
  look: false,
  sort: { key: 'surgery', dir: 'asc' },
  q: '',
}

export const INBOX_SHOW_LABELS: Record<InboxShow, string> = { toDecide: 'To decide', needsNhi: 'Waiting for an NHI', decided: 'Decided' }
export const INBOX_SURGERY_LABELS: Record<InboxSurgery, string> = { any: 'Any date', tomorrow: 'Tomorrow', '2d': 'Next 2 days', '7d': 'Next 7 days', '30d': 'Next 30 days' }
export const INBOX_SORT_LABELS: Record<InboxSortKey, string> = {
  surgery: 'Surgery',
  list: 'List',
  kind: 'Kind',
  patients: 'Patients',
  needs: 'Needs',
  from: 'From',
  received: 'Received',
}

/** The next order when a header is clicked: the same column flips; a new one starts ascending (Received, newest first). */
export function nextInboxSort(sort: InboxQuery['sort'], key: InboxSortKey): InboxQuery['sort'] {
  if (sort.key === key) return { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
  return { key, dir: key === 'received' ? 'desc' : 'asc' }
}

const SHOW_FILTER = { toDecide: { kind: 'toDecide' }, needsNhi: { kind: 'needsNhi' }, decided: { kind: 'decided' } } as const

/** What an arrival needs from the office, in a few words, or undefined when it can simply be decided. */
export function needsText(item: ArrivalItem): string | undefined {
  if (item.decided) return undefined
  if (item.kind === 'unreadable') return 'Read it by hand'
  if (item.kind === 'held') return item.reason ?? 'Message held'
  const parts: string[] = []
  const nhi = item.flags.needsNhi ?? 0
  if (nhi > 0) parts.push(nhi === 1 ? 'NHI for 1 patient' : `NHI for ${nhi} patients`)
  const check = item.flags.toCheck ?? 0
  if (check > 0) parts.push(check === 1 ? '1 value to check' : `${check} values to check`)
  const removals = item.flags.removals ?? 0
  if (removals > 0) parts.push(removals === 1 ? '1 removal to confirm' : `${removals} removals to confirm`)
  const quality = item.flags.dataQuality ?? 0
  if (quality > 0) parts.push(quality === 1 ? '1 data quality flag' : `${quality} data quality flags`)
  return parts.length > 0 ? parts.join(', ') : undefined
}

/** Who sent it: the hospital, the rooms' practice as printed on the PDF, or the mailbox when there is no name. */
export function arrivalFromText(item: ArrivalItem, intake: Pick<ArrivalIntake, 'batches' | 'pdfLists'>): string {
  if (item.source.kind === 'hospital') return item.source.label
  const batch = intake.batches[item.batchId]
  const practice = batch?.pdfListId !== undefined ? intake.pdfLists[batch.pdfListId]?.practice : undefined
  if (practice !== undefined && practice !== '') return practice
  // No practice read: the one the PDF's letterhead prints, from the address it came from or the surgeon's rooms.
  const senderEmail = item.source.senderEmail ?? (batch?.pdfListId !== undefined ? intake.pdfLists[batch.pdfListId]?.senderEmail : undefined)
  if (senderEmail !== undefined || item.surgeonName !== undefined) {
    return facsimileLetterhead({ ...(senderEmail !== undefined ? { senderEmail } : {}), surgeonName: item.surgeonName ?? '', hospitalName: '', subject: '', rows: [] }).practice
  }
  return item.source.byHand === true ? 'Added by hand' : 'Rooms mailbox'
}

const SESSION_WORDS: Record<Session, string> = { AM: 'AM', PM: 'PM', OOH: 'Out-of-hours' }

/**
 * The Surgery cell: "Wed 25 Nov AM", or just "AM" under its day's heading; "Not read" when the date could not be read.
 */
export function inboxSurgeryText(item: Pick<ArrivalItem, 'dateISO' | 'session'>, underDay = false): string {
  if (item.dateISO === undefined) return 'Not read'
  const session = item.session !== undefined ? SESSION_WORDS[item.session] : ''
  if (underDay) return session === '' ? 'All day' : session
  return session === '' ? shortDay(item.dateISO) : `${shortDay(item.dateISO)} ${session}`
}

/**
 * The List cell: the title without its date ("Mr Okafor · St George's"), since the date has its own column. An
 * unreadable PDF or a held message keeps its file or message name.
 */
export function inboxListText(item: Pick<ArrivalItem, 'kind' | 'title' | 'dateISO'>): string {
  if (item.kind === 'unreadable' || item.kind === 'held' || item.dateISO === undefined) return item.title
  const parts = item.title.split(' · ')
  return parts.length >= 3 ? parts.slice(0, -1).join(' · ') : item.title
}

/** When it arrived: "Today 05:40", "Mon 08:50" within the last week, else "16 Nov 08:50". */
export function inboxReceivedText(iso: string, todayISO: string): string {
  const time = hhmm(iso)
  const days = differenceInCalendarDays(parseISO(todayISO.slice(0, 10)), parseISO(iso.slice(0, 10)))
  const day = days === 0 ? 'Today' : days > 0 && days < 7 ? format(parseISO(iso.slice(0, 10)), 'EEE') : format(parseISO(iso.slice(0, 10)), 'd MMM')
  return time === '' ? day : `${day} ${time}`
}

/** The empty inbox's words: a search that found nothing, else what the Show choice has none of. */
export function emptyInboxText(query: InboxQuery): string {
  if (query.q.trim() !== '') return `No arrivals match "${query.q.trim()}".`
  const narrowed = query.kind !== 'all' || query.source !== 'all' || query.surgery !== 'any' || query.look
  if (narrowed) return 'No arrivals match these filters.'
  switch (query.show) {
    case 'toDecide':
      return 'Nothing to decide.'
    case 'needsNhi':
      return 'No rows are waiting for an NHI.'
    case 'decided':
      return 'Nothing decided yet.'
  }
}

/** The toolbar's count: "18 to decide", "2 waiting for an NHI", "6 decided". */
export function inboxCountText(count: number, show: InboxShow): string {
  return show === 'toDecide' ? `${count} to decide` : show === 'needsNhi' ? `${count} waiting for an NHI` : `${count} decided`
}

/** Whole days from today to the date of surgery (negative once it has passed); undefined with no date. */
export function daysToSurgery(item: Pick<ArrivalItem, 'dateISO'>, todayISO: string): number | undefined {
  if (item.dateISO === undefined) return undefined
  return differenceInCalendarDays(parseISO(item.dateISO), parseISO(todayISO.slice(0, 10)))
}

function inSurgeryWindow(item: ArrivalItem, surgery: InboxSurgery, todayISO: string): boolean {
  if (surgery === 'any') return true
  if (item.dateISO === undefined) return false
  if (surgery === 'tomorrow') return item.dateISO === addDaysISO(todayISO, 1)
  const span = surgery === '2d' ? 2 : surgery === '7d' ? 7 : 30
  return item.dateISO >= todayISO && item.dateISO <= addDaysISO(todayISO, span)
}

function matchesSource(item: ArrivalItem, source: string): boolean {
  if (source === 'all') return true
  if (source === 'rooms') return item.source.kind === 'rooms'
  return item.source.kind === 'hospital' && item.source.hospitalId === source
}

/** Whether the query shows the item. */
export function matchesInbox(item: ArrivalItem, query: InboxQuery, todayISO: string, intake: Pick<ArrivalIntake, 'batches' | 'rows'>): boolean {
  return (
    matchesFeedFilter(item, SHOW_FILTER[query.show]) &&
    (query.kind === 'all' || item.kind === query.kind) &&
    matchesSource(item, query.source) &&
    inSurgeryWindow(item, query.surgery, todayISO) &&
    (!query.look || needsText(item) !== undefined) &&
    matchesFeedSearch(item, query.q, intake)
  )
}

const SESSION_RANK: Record<Session, number> = { AM: 0, PM: 1, OOH: 2 }

/** Earlier surgery first; an arrival with no date (unreadable, held) after every dated one, whichever way. */
function bySurgery(a: ArrivalItem, b: ArrivalItem): number {
  return (a.dateISO ?? '9999').localeCompare(b.dateISO ?? '9999') || (a.session !== undefined && b.session !== undefined ? SESSION_RANK[a.session] - SESSION_RANK[b.session] : 0)
}

/** The inbox's rows: the items the query shows, in the query's order (ties by received time, then key). */
export function inboxItems(items: readonly ArrivalItem[], query: InboxQuery, todayISO: string, intake: Pick<ArrivalIntake, 'batches' | 'rows' | 'pdfLists'>): ArrivalItem[] {
  const shown = items.filter((i) => matchesInbox(i, query, todayISO, intake))
  const sign = query.sort.dir === 'asc' ? 1 : -1
  const from = new Map(shown.map((i) => [i.key, arrivalFromText(i, intake)]))
  const compare = (a: ArrivalItem, b: ArrivalItem): number => {
    switch (query.sort.key) {
      case 'surgery': {
        const undatedA = a.dateISO === undefined
        const undatedB = b.dateISO === undefined
        if (undatedA !== undatedB) return undatedA ? 1 : -1
        return sign * bySurgery(a, b)
      }
      case 'list':
        return sign * inboxListText(a).localeCompare(inboxListText(b))
      case 'kind':
        return sign * ARRIVAL_KIND_LABELS[a.kind].localeCompare(ARRIVAL_KIND_LABELS[b.kind])
      case 'patients':
        return sign * (a.counts.rows - b.counts.rows)
      case 'needs':
        return sign * (needsText(a) ?? '~').localeCompare(needsText(b) ?? '~')
      case 'from':
        return sign * (from.get(a.key) ?? '').localeCompare(from.get(b.key) ?? '')
      case 'received':
        return sign * a.receivedAtISO.localeCompare(b.receivedAtISO)
    }
  }
  return shown.sort((a, b) => compare(a, b) || bySurgery(a, b) || b.receivedAtISO.localeCompare(a.receivedAtISO) || a.key.localeCompare(b.key))
}

export interface InboxDayGroup {
  key: string
  /** Absent for the arrivals with no date of surgery. */
  dateISO?: string
  label: string
  items: ArrivalItem[]
}

/** A day heading: "Tomorrow, Wednesday 25 November", "Today, Tuesday 24 November", "Thursday 26 November", "Date not read". */
export function surgeryDayLabel(dateISO: string | undefined, todayISO: string): string {
  if (dateISO === undefined) return 'Date not read'
  const day = longDayNoYear(dateISO)
  if (dateISO === todayISO) return `Today, ${day}`
  if (dateISO === addDaysISO(todayISO, 1)) return `Tomorrow, ${day}`
  return day
}

/** Consecutive items of one date of surgery under one heading, in the order given (meant for the surgery sort). */
export function groupBySurgeryDay(items: readonly ArrivalItem[], todayISO: string): InboxDayGroup[] {
  const groups: InboxDayGroup[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last !== undefined && last.dateISO === item.dateISO) {
      last.items.push(item)
      continue
    }
    groups.push({ key: item.dateISO ?? 'undated', ...(item.dateISO !== undefined ? { dateISO: item.dateISO } : {}), label: surgeryDayLabel(item.dateISO, todayISO), items: [item] })
  }
  return groups
}

/** An item's place in the inbox's order, with its neighbours: what the opened arrival's Previous and Next step to. */
export function inboxPosition(keys: readonly string[], key: string): { index: number; previous?: string; next?: string } {
  const index = keys.indexOf(key)
  if (index < 0) return { index: -1, ...(keys[0] !== undefined ? { next: keys[0] } : {}) }
  return {
    index,
    ...(index > 0 ? { previous: keys[index - 1]! } : {}),
    ...(index < keys.length - 1 ? { next: keys[index + 1]! } : {}),
  }
}
