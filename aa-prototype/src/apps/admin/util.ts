/**
 * Small pure helpers for the admin day view (Phase 06). Time parsing for the
 * proportional grid, name reshaping ("Dr Melanie Souter" -> "Souter, Melanie"),
 * and the day-grid block geometry (the mockup's left=(start-7)/11 formula).
 */

import type { Anaesthetist, Hospital, List, Surgeon } from '../../domain/types'
import type { SlotView } from '../../store'
import { locationName, nameWithoutTitle, surnameOf } from '../../shared/format'
import { UNASSIGNED } from '../../shared/scheduleTerms'
import { CONFLICT_REASONS, describeConflict, type ConflictLookups } from '../../domain/conflicts'

/** Grid ruler bounds (07:00 to 18:00 = 11 hours), matching Admin Day.dc.html. */
export const RULER_START = 7
export const RULER_HOURS = 11

/** Decimal hours for a `HH:mm` wall time. */
export function hoursOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) + (m ?? 0) / 60
}

/**
 * A session's [start,end] in decimal hours, from its effective times (its own
 * where the office set them, else the schedule settings' default; catch-up
 * Phase 28). A session keeps its default shape on the grid even when its List
 * holds a single Booking (US-01.1.4's note).
 */
export function slotSpan(view: Pick<SlotView, 'times'>): { start: number; end: number } {
  const start = hoursOf(view.times.startTime)
  const end = hoursOf(view.times.endTime)
  return { start, end: end > start ? end : start + 0.5 }
}

/** Proportional left/width percentages for a [start,end] hour span. */
export function blockGeometry(start: number, end: number): { left: string; width: string } {
  const clampedStart = Math.max(RULER_START, Math.min(RULER_START + RULER_HOURS, start))
  const clampedEnd = Math.max(clampedStart, Math.min(RULER_START + RULER_HOURS, end))
  return {
    left: `${(((clampedStart - RULER_START) / RULER_HOURS) * 100).toFixed(2)}%`,
    width: `${(((clampedEnd - clampedStart) / RULER_HOURS) * 100).toFixed(2)}%`,
  }
}

/** "Dr Melanie Souter" -> "Souter, Melanie" (grid row label). */
export function surnameFirst(name: string): string {
  const parts = nameWithoutTitle(name).split(/\s+/).filter((p) => p !== '')
  if (parts.length < 2) return parts[0] ?? name
  const surname = parts[parts.length - 1]
  const rest = parts.slice(0, -1).join(' ')
  return `${surname}, ${rest}`
}

/** Just the surname (A-Z sort key) — the shared helper, re-exported for admin callers. */
export { surnameOf }

/**
 * "Souter · Forte Health AM" — the admin row label for a List, single-sourced
 * so the review queue and the invoices screen name lists identically.
 */
export function listShortLabel(
  list: List,
  masters: { anaesthetists: Record<string, Anaesthetist>; hospitals: Record<string, Hospital> },
): string {
  const anae = list.anaesthetistId !== undefined ? masters.anaesthetists[list.anaesthetistId] : undefined
  // A Draft List has no anaesthetist: its flag stands in (catch-up Phase 31).
  const who = anae !== undefined ? surnameOf(anae.name) : (list.anaesthetistId ?? UNASSIGNED)
  return `${who} · ${locationName(list.hospitalId, masters.hospitals)} ${list.session}`
}

/**
 * The List provenance shown in full-width office tables. The anaesthetist and
 * date have their own columns there, so this label stays focused on the
 * hospital/session identity and carries the surgeon as optional supporting
 * context.
 */
export function listSourceLabels(
  list: List,
  masters: { hospitals: Record<string, Hospital>; surgeons: Record<string, Surgeon> },
): { primary: string; secondary?: string } {
  const surgeon = masters.surgeons[list.surgeonId]?.name
  return {
    primary: `${locationName(list.hospitalId, masters.hospitals)} · ${list.session}`,
    ...(surgeon !== undefined ? { secondary: surgeon } : {}),
  }
}

/**
 * Why a List block needs the amber attention flag: any live conflict (a
 * cleared one is never stored, catch-up Phase 30). Every List names its
 * surgeon since catch-up Phase 31 (US-01.3.1), so there is no "surgeon not yet
 * assigned" flag any more. An empty array means no flag. With `lookups` a
 * conflict reads as its detail line; without, as its short reason.
 */
export function attentionReasons(list: List, lookups?: ConflictLookups): string[] {
  return list.conflicts.map((c) => (lookups !== undefined ? describeConflict(c, list, lookups).detail : CONFLICT_REASONS[c.kind]))
}
