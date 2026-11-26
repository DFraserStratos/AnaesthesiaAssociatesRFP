/**
 * The Arrivals feed's words (build plan Phase 68; D117, D125): an item's counts, the received time, a
 * source's state and the empty feed per filter. Plain functions over the read model, so the feed's
 * components only lay them out.
 */

import type { ArrivalItem, FeedFilter } from '../../../../../domain/intake/arrivals'
import type { IntakeSourceState } from '../../../../../domain/types'
import { hhmm, plural, receivedDay } from '../../../../../shared/format'

/** When an item or file arrived: the time today ("06:10"), else the day ("Mon 23 Nov"). */
export function receivedText(iso: string, todayISO: string): string {
  return iso.slice(0, 10) === todayISO ? hhmm(iso) : receivedDay(iso)
}

/**
 * What an item holds, in words: "4 patients" for a List that arrives whole, else what it would do
 * ("1 added · 1 changed · 1 removal"). A PDF that cannot be read or a held message shows its reason; a
 * row waiting for an NHI says so.
 */
export function itemCountsText(item: ArrivalItem): string {
  if (item.kind === 'unreadable' || item.kind === 'held') return item.reason ?? ''
  if (item.kind === 'needsNhi') return 'Waiting for an NHI'
  const c = item.counts
  const patients = plural(c.rows, 'patient')
  if (item.kind === 'newList' || item.kind === 'matchesExactly') return patients
  const parts: string[] = []
  if (c.added > 0) parts.push(`${c.added} added`)
  if (c.changed > 0) parts.push(`${c.changed} changed`)
  if (c.cancelled > 0) parts.push(`${c.cancelled} cancelled`)
  if (c.removed > 0) parts.push(plural(c.removed, 'removal'))
  if (parts.length === 0) return patients
  if (c.unchanged > 0) parts.push(`${c.unchanged} the same`)
  return parts.join(' · ')
}

/** A source's state in words, as the sources strip and Sources show it. */
export const SOURCE_STATE_WORDS: Record<IntakeSourceState, string> = {
  receiving: 'receiving',
  reading: 'reading',
  notConnected: 'not connected',
}

/** The empty feed's words for a filter (and a search that found nothing). */
export function emptyFeedText(filter: FeedFilter, q: string, hospitalName?: string): string {
  if (q.trim() !== '') return `No arrivals match "${q.trim()}".`
  switch (filter.kind) {
    case 'toDecide':
      return 'Nothing to decide.'
    case 'needsNhi':
      return 'No rows are waiting for an NHI.'
    case 'roomsPdfs':
      return 'No PDFs from the rooms.'
    case 'hospital':
      return `Nothing from ${hospitalName ?? 'this hospital'}.`
    case 'decided':
      return 'Nothing decided yet.'
  }
}
