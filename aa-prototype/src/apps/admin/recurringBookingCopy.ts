/**
 * The words for a recurring-booking projection (catch-up Phase 30; US-01.3.2):
 * the sheet's live preview line, the result lines after "Apply to canvas now",
 * and the kept and skipped detail. Pure, so the preview and the result read
 * the same plan the same way. A recurring booking is never called a
 * "booking" alone. A session already closed goes to a Draft List for the
 * office (catch-up Phase 31; OQ-81 part 2); "slot" is never said.
 */

import { KEPT_REASON_LABELS, type KeptReason, type PlanKept } from '../../domain/recurringBookingProjection'
import { DRAFT_LIST, DRAFT_LISTS, draftListCount } from '../../shared/scheduleTerms'

const DAY_PLURAL: Record<number, string> = {
  0: 'Sundays',
  1: 'Mondays',
  2: 'Tuesdays',
  3: 'Wednesdays',
  4: 'Thursdays',
  5: 'Fridays',
  6: 'Saturdays',
}

interface Counts {
  created: number
  updated: number
  removed: number
  kept: readonly Pick<PlanKept, 'reason'>[]
  skipped: readonly unknown[]
  /** Empty Draft Lists of this recurring booking it updated or removed (catch-up Phase 31). */
  draftListsUpdated?: number
  draftListsRemoved?: number
}

const lists = (n: number) => `${n} List${n === 1 ? '' : 's'}`
const sessions = (n: number) => `${n} session${n === 1 ? '' : 's'}`
/** "1 session to a Draft List" / "2 sessions to Draft Lists". */
const toDraftLists = (n: number) => `${sessions(n)} to ${n === 1 ? `a ${DRAFT_LIST}` : DRAFT_LISTS} (anaesthetist unavailable)`

/** "2 (with Bookings)" or "3 (2 with Bookings, 1 edited by the office)". */
function keptCount(kept: Counts['kept']): string | null {
  if (kept.length === 0) return null
  const byReason = new Map<KeptReason, number>()
  for (const k of kept) byReason.set(k.reason, (byReason.get(k.reason) ?? 0) + 1)
  const why = [...byReason.entries()].map(([r, n]) => (byReason.size === 1 ? KEPT_REASON_LABELS[r] : `${n} ${KEPT_REASON_LABELS[r]}`))
  return `${kept.length} (${why.join(', ')})`
}

/** "Applying adds 14 Lists on future Mondays, updates 1, keeps 2 (with Bookings) and sends 1 session to a Draft List (anaesthetist unavailable)." */
export function previewLine(c: Counts, dayOfWeek: number | undefined): string {
  const parts: string[] = []
  if (c.created > 0) parts.push(`adds ${lists(c.created)}${dayOfWeek !== undefined ? ` on future ${DAY_PLURAL[dayOfWeek]}` : ''}`)
  if (c.updated > 0) parts.push(`updates ${c.updated}`)
  if (c.removed > 0) parts.push(`removes ${c.removed}`)
  const kept = keptCount(c.kept)
  if (kept !== null) parts.push(`keeps ${kept}`)
  if (c.skipped.length > 0) parts.push(`sends ${toDraftLists(c.skipped.length)}`)
  if (parts.length === 0) return 'Applying changes no List on the schedule ahead.'
  const last = parts.pop()!
  return `Applying ${parts.length > 0 ? `${parts.join(', ')} and ${last}` : last}.`
}

/** "Applied to 17 future Mondays: 14 Lists added, 1 updated, 2 kept (with Bookings)." */
export function resultLine(c: Counts, coveredDays: number | undefined, dayOfWeek: number | undefined): string {
  const parts = [`${lists(c.created)} added`, `${c.updated} updated`]
  if (c.removed > 0) parts.push(`${c.removed} removed`)
  const kept = keptCount(c.kept)
  if (kept !== null) parts.push(kept.replace(/^(\d+)/, '$1 kept'))
  if (c.skipped.length > 0) parts.push(toDraftLists(c.skipped.length))
  if ((c.draftListsUpdated ?? 0) > 0) parts.push(`${draftListCount(c.draftListsUpdated!)} updated`)
  if ((c.draftListsRemoved ?? 0) > 0) parts.push(`${draftListCount(c.draftListsRemoved!)} removed`)
  const head = coveredDays !== undefined && dayOfWeek !== undefined ? `Applied to ${coveredDays} future ${DAY_PLURAL[dayOfWeek]}` : 'Applied to the canvas'
  return `${head}: ${parts.join(', ')}.`
}

/** The view-level apply: "Applied to the canvas: 3 Lists added on sessions that had come free, ..." */
export function applyAllLine(c: Counts): string {
  if (c.created === 0 && c.updated === 0 && c.skipped.length === 0 && (c.draftListsUpdated ?? 0) === 0) return 'The canvas already matches every recurring booking.'
  const parts = [`${lists(c.created)} added on sessions that had come free`, `${c.updated} updated`]
  const kept = keptCount(c.kept)
  if (kept !== null) parts.push(kept.replace(/^(\d+)/, '$1 kept'))
  if (c.skipped.length > 0) parts.push(toDraftLists(c.skipped.length))
  if ((c.draftListsUpdated ?? 0) > 0) parts.push(`${draftListCount(c.draftListsUpdated!)} updated`)
  return `Applied to the canvas: ${parts.join(', ')}.`
}

/** Before retiring: what goes and what stays, from the same plan the retire applies. */
export function retirePreviewLine(c: Pick<Counts, 'removed' | 'kept'>): string {
  const kept = keptCount(c.kept)
  return `Retiring removes ${lists(c.removed)} after that date${kept !== null ? ` and keeps ${kept}` : ''}. It stays in the master, retired, with its history.`
}

/** After retiring. */
export function retireResultLine(c: Pick<Counts, 'removed' | 'kept'>, lastDateLabel: string): string {
  const kept = keptCount(c.kept)
  return `Retired after ${lastDateLabel}: ${lists(c.removed)} removed${kept !== null ? `, ${kept.replace(/^(\d+)/, '$1 kept')}` : ''}.`
}

/** One line in the kept or not-painted detail. */
export function keptDetail(k: PlanKept): string {
  return KEPT_REASON_LABELS[k.reason]
}

export const SKIPPED_DETAIL = `goes to a ${DRAFT_LIST}: the anaesthetist is unavailable`

/** The heading over the skipped sessions in the result. */
export const SKIPPED_HEADING = DRAFT_LISTS
