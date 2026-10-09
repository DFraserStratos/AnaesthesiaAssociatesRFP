/**
 * The one result line an availability action shows (catch-up Phase 29;
 * US-01.2.1, US-01.5.3). Pure. It says only what happened: sessions set, left
 * as they were, and Lists flagged on (or cleared from) the office's Day view.
 * Nothing claims the office was notified or told. No dashes, no "slot".
 */

import { format, parseISO } from 'date-fns'
import type { AvailabilityOutcome } from '../../store'

export type AvailabilityOutcomeKind = 'range' | 'series' | 'cleared' | 'seriesDeleted'

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const sessions = (n: number) => `${n} ${plural(n, 'session', 'sessions')}`

function when(fromISO?: string, toISO?: string): string {
  if (fromISO === undefined) return ''
  if (toISO === undefined || toISO === fromISO) return ` on ${format(parseISO(fromISO), 'EEE d MMM')}`
  return `, ${format(parseISO(fromISO), 'd MMM')} to ${format(parseISO(toISO), 'd MMM')}`
}

function listLines(outcome: Pick<AvailabilityOutcome, 'flagged' | 'cleared' | 'holdingLists'>): string[] {
  const lines: string[] = []
  const f = outcome.flagged.length
  if (f > 0) lines.push(`${f} ${plural(f, 'List is', 'Lists are')} flagged on the office's Day view.`)
  const c = outcome.cleared.length
  if (c > 0) lines.push(`${c} ${plural(c, "List's flag was", "Lists' flags were")} cleared.`)
  if (f === 0 && c === 0 && outcome.holdingLists > 0) {
    lines.push(`${plural(outcome.holdingLists, 'The List stays', 'The Lists stay')} in place, with nothing flagged.`)
  }
  return lines
}

export function describeAvailabilityOutcome(
  outcome: AvailabilityOutcome,
  ctx: { kind: AvailabilityOutcomeKind; statusLabel: string; seriesLine?: string; fromISO?: string; toISO?: string },
): string {
  const parts: string[] = []
  if (ctx.kind === 'range') {
    if (outcome.set === 0) parts.push(`Already ${ctx.statusLabel}. Nothing changed.`)
    else parts.push(`${sessions(outcome.set)} set to ${ctx.statusLabel}${when(ctx.fromISO, ctx.toISO)}.`)
    if (outcome.seriesEdited > 0) {
      parts.push(`${outcome.seriesEdited} repeating ${plural(outcome.seriesEdited, 'day', 'days')} changed on ${plural(outcome.seriesEdited, 'its', 'their')} own.`)
    }
  } else if (ctx.kind === 'series') {
    const left = outcome.leftAsIs
    const leftText = left > 0 ? `, ${left} already set left as ${plural(left, 'it is', 'they are')}` : ''
    parts.push(`Series saved: ${ctx.seriesLine ?? ctx.statusLabel}. ${sessions(outcome.set)} set${leftText}.`)
  } else if (ctx.kind === 'cleared') {
    parts.push(outcome.set === 0 ? `Already ${ctx.statusLabel}. Nothing changed.` : `Back to ${ctx.statusLabel}${when(ctx.fromISO)}.`)
    if (outcome.seriesEdited > 0) parts.push('It is no longer part of the series.')
  } else {
    const kept = outcome.unchanged
    const keptText = kept > 0 ? `, ${kept} changed ${plural(kept, 'day', 'days')} kept` : ''
    parts.push(`Series deleted. ${sessions(outcome.set)} back to ${ctx.statusLabel}${keptText}.`)
  }
  return [...parts, ...listLines(outcome)].join(' ')
}
