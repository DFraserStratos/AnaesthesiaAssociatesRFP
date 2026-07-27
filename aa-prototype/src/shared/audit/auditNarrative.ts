/**
 * The audit trail as plain English (A7 presentation layer).
 *
 * The stored trail is append-only and untouched by anything here: this module
 * only READS an `AuditEntry` and answers three questions the two audit surfaces
 * ask of it.
 *
 *   1. Which fields changed, and what did they change from and to?
 *      (`auditFieldChanges` -> the change ledger)
 *   2. In what order should entries read? (`sortAuditNewestFirst`)
 *   3. Which consecutive entries are really one gesture? (`coalesceAudit`)
 *
 * Two rules earn their own note:
 *
 * DIFF OVER THE UNION OF KEYS. `editCard` / `editProcedure` build `before` as
 * `Object.fromEntries(Object.keys(patch).map(k => [k, entity[k]]))`, so a field
 * that was never set arrives as a PRESENT key holding `undefined`. Iterating
 * one side's keys (or stringifying) loses it, which is how "not previously set"
 * and "cleared" both used to render as `{}`. The union keeps the key and the
 * value renders as "not set".
 *
 * COALESCING IS A VIEW, NEVER A WRITE. BTM capture writes through on every
 * stepper tap (a deliberate decision — it is what makes the trail
 * reconstructable), so four taps are four real entries. The reading surfaces
 * group them into one net statement with the individual steps one tap away. The
 * log still holds all four.
 */

import { format, parseISO } from 'date-fns'
import type { AuditEntry } from '../../domain/types'
import { formatCurrency } from '../format'
import { fieldLabel } from './fieldLabels'

/** A key present in the patch but holding no value. */
export const NOT_SET = 'not set'

/**
 * Clearing a captured B/T/M value hands the figure back to the seeded
 * computation, which is not the same as emptying a field. The words match the
 * button that does it (the interface-vocabulary rule).
 */
export const CLEARED_TO_SEED = 'back to the seeded value'

/** The capture keys whose cleared state means "recompute", not "empty". */
const SEEDED_FALLBACK_KEYS = new Set([
  'baseUnitsCaptured',
  'timeUnitsCaptured',
  'modifierUnitsCaptured',
  'baseUnitsSelected',
])

/** Keys whose numeric values are money. */
const MONEY_KEYS = new Set([
  'amount',
  'amountDue',
  'authorisedCumulative',
  'cumulative',
  'depositAmount',
  'gst',
  'increment',
  'price',
  'rate',
  'subtotal',
  'total',
  'unitValue',
])

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

const COUNTERPARTY_KINDS: Record<string, string> = {
  hospital: 'Hospital',
  insurer: 'Insurer',
  surgeon: 'Surgeon',
  organisation: 'Organisation',
  patient: 'Patient',
  billableParty: 'Billable party',
}

/** One field's movement inside a single audit entry. */
export interface AuditFieldChange {
  key: string
  label: string
  /** Absent when the entry records no `before` side at all (a creation). */
  before?: string
  /** Absent when the entry records no `after` side at all (a removal snapshot). */
  after?: string
}

/**
 * One row of a reading surface: an entry, the entries it stands for (itself
 * alone when nothing coalesced, newest first), and the NET change to show.
 */
export interface AuditGroup {
  /** The newest member: its time, actor and action lead the row. */
  entry: AuditEntry
  /** Every member, newest first. Length 1 when nothing coalesced. */
  steps: readonly AuditEntry[]
  /** The net field movement (first `before` to last `after` across the steps). */
  changes: readonly AuditFieldChange[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Structural equality, so an unchanged nested value never reads as a change. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => sameValue(item, b[i]))
  }
  if (isRecord(a) && isRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) if (!sameValue(a[key], b[key])) return false
    return true
  }
  return false
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** The nested value shapes the store stores: rendered, never stringified. */
function formatShape(value: Record<string, unknown>): string | null {
  // CapturedUnits — the figure is the point; its provenance is implied by the
  // fact that a change was audited at all.
  if (typeof value.units === 'number' && typeof value.source === 'string' && Object.keys(value).length === 2) {
    return String(value.units)
  }
  // PriceOverride
  if (value.kind === 'fixedFee' && typeof value.amount === 'number') {
    return withReason(`Fixed fee ${formatCurrency(value.amount)}`, value.reason)
  }
  if (value.kind === 'dollarAdjustment' && typeof value.amount === 'number') {
    return withReason(`Adjusted by ${formatCurrency(value.amount)}`, value.reason)
  }
  if (value.kind === 'percentAdjustment' && typeof value.percent === 'number') {
    return withReason(`Adjusted by ${value.percent}%`, value.reason)
  }
  // PrepaymentDetail
  if (value.type === 'full') return 'Full amount up front'
  if (value.type === 'split') {
    const deposit = typeof value.depositAmount === 'number' ? ` · deposit ${formatCurrency(value.depositAmount)}` : ''
    return `Split${deposit}`
  }
  // CounterpartyRef
  if (typeof value.kind === 'string' && typeof value.id === 'string' && Object.keys(value).length === 2) {
    return `${COUNTERPARTY_KINDS[value.kind] ?? titleCase(value.kind)} ${value.id}`
  }
  // ContractScope
  if (value.kind === 'organisation') return 'Organisation wide'
  if (value.kind === 'individualAnaesthetist' && typeof value.anaesthetistId === 'string') {
    return `Individual anaesthetist ${value.anaesthetistId}`
  }
  // ContractType2Detail
  if (value.basis === 'agreedUnitRate' && typeof value.unitRate === 'number') {
    return `Agreed unit rate ${formatCurrency(value.unitRate)}`
  }
  if (value.basis === 'percentDiscount' && typeof value.percent === 'number') {
    return `${value.percent}% discount`
  }
  // IntegrationCorrelationRef
  if (typeof value.sourceFeedId === 'string' && typeof value.externalAppointmentId === 'string') {
    return `${value.sourceFeedId} · ${value.externalAppointmentId}`
  }
  // Quarantined inbound ethnicity code
  if (typeof value.receivedCode === 'string') return `${value.receivedCode} · held for correction`
  // CardCancellation / PrepaymentOverride / ListPhoneNote — the words are the value.
  if (typeof value.reason === 'string') return value.reason
  if (typeof value.text === 'string') return value.text
  return null
}

function withReason(head: string, reason: unknown): string {
  return typeof reason === 'string' && reason.trim() !== '' ? `${head} · ${reason}` : head
}

/**
 * One audited value as a reader-facing string. Never JSON: an unrecognised
 * object degrades to its labelled leading fields, so a shape added later reads
 * as English instead of a brace dump.
 */
export function formatAuditValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return NOT_SET
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'number') {
    return MONEY_KEYS.has(key) ? formatCurrency(value) : String(value)
  }
  if (typeof value === 'string') {
    if (value.trim() === '') return 'empty'
    if (DATE_TIME.test(value)) return format(parseISO(value), 'd MMM HH:mm')
    if (DATE_ONLY.test(value)) return format(parseISO(value), 'd MMM yyyy')
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'none'
    if (value.every((item) => typeof item === 'string')) return value.join(', ')
    return value.length === 1 ? '1 item' : `${value.length} items`
  }
  if (isRecord(value)) {
    const shape = formatShape(value)
    if (shape !== null) return shape
    const parts = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .slice(0, 3)
      .map(([k, v]) => `${fieldLabel(k).toLowerCase()} ${formatAuditValue(k, v)}`)
    return parts.length === 0 ? NOT_SET : parts.join(' · ')
  }
  return String(value)
}

/** The union of both sides' keys, `before` order first (patch order reads best). */
function unionKeys(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
  const keys: string[] = []
  for (const key of Object.keys(before ?? {})) keys.push(key)
  for (const key of Object.keys(after ?? {})) if (!keys.includes(key)) keys.push(key)
  return keys
}

/**
 * The field-level ledger for one entry: what changed, from what, to what.
 *
 * Fields whose value did not move are dropped, so a patch that re-saved four
 * fields and moved one shows the one. A key present but `undefined` renders as
 * "not set" (or, for a cleared B/T/M capture, "back to the seeded value").
 */
export function auditFieldChanges(entry: AuditEntry): AuditFieldChange[] {
  const before = isRecord(entry.before) ? entry.before : null
  const after = isRecord(entry.after) ? entry.after : null

  // Primitive payloads: no entry emits these today, but the type permits them.
  if (before === null && after === null) {
    if (entry.before === undefined && entry.after === undefined) return []
    const change: AuditFieldChange = { key: 'value', label: 'Value' }
    if (entry.before !== undefined) change.before = formatAuditValue('value', entry.before)
    if (entry.after !== undefined) change.after = formatAuditValue('value', entry.after)
    return [change]
  }

  const changes: AuditFieldChange[] = []
  for (const key of unionKeys(before, after)) {
    const beforeValue = before?.[key]
    const afterValue = after?.[key]
    if (before !== null && after !== null && sameValue(beforeValue, afterValue)) continue
    if (beforeValue === undefined && afterValue === undefined) continue

    const change: AuditFieldChange = { key, label: fieldLabel(key) }
    if (before !== null) {
      change.before = formatAuditValue(key, beforeValue)
    }
    if (after !== null) {
      change.after =
        afterValue === undefined && beforeValue !== undefined && SEEDED_FALLBACK_KEYS.has(key)
          ? CLEARED_TO_SEED
          : formatAuditValue(key, afterValue)
    }
    changes.push(change)
  }
  return changes
}

/** The trailing sequence number of an id (`A0037` -> 37); 0 when absent. */
function idSequence(id: string): number {
  const match = /(\d+)$/.exec(id)
  return match === null ? 0 : Number(match[1])
}

/**
 * Newest first, on `atISO`, with the sequential audit id as the tiebreak.
 *
 * The tiebreak is not a nicety: the demo clock is pinned, so every entry a
 * presenter creates live shares one timestamp, and the id is the only thing
 * that preserves the order the taps happened in. Both surfaces sort through
 * here so they can never disagree on direction again (review finding 01.3).
 */
export function sortAuditNewestFirst<T extends AuditEntry>(entries: readonly T[]): T[] {
  return entries.slice().sort((a, b) => {
    if (a.atISO !== b.atISO) return a.atISO < b.atISO ? 1 : -1
    return idSequence(b.id) - idSequence(a.id)
  })
}

/** Two entries are the same gesture when everything but the value matches. */
function sameGesture(a: AuditEntry, b: AuditEntry): boolean {
  return (
    a.action === b.action &&
    a.entityId === b.entityId &&
    a.entityType === b.entityType &&
    a.who === b.who &&
    a.role === b.role &&
    a.source === b.source &&
    a.atISO === b.atISO
  )
}

/**
 * Collapse a run of consecutive single-field edits by one actor, at one
 * timestamp, on one entity, into one row carrying the NET movement plus its
 * steps. Four stepper taps down the B row become "Base units 4 to 1, 4 changes"
 * with the four taps still there behind the toggle.
 *
 * Sorts newest first on the way in, so callers cannot feed it insertion order
 * by accident. The steps inside a group read newest first too, matching the
 * feed around them.
 */
export function coalesceAudit(entries: readonly AuditEntry[]): AuditGroup[] {
  const sorted = sortAuditNewestFirst(entries)
  const groups: AuditGroup[] = []

  let i = 0
  while (i < sorted.length) {
    const entry = sorted[i]!
    const changes = auditFieldChanges(entry)

    // Only a single-field edit can coalesce: a multi-field patch has no one
    // value to state a net movement for.
    if (changes.length !== 1) {
      groups.push({ entry, steps: [entry], changes })
      i += 1
      continue
    }

    const key = changes[0]!.key
    const steps: AuditEntry[] = [entry]
    let lastChanges = changes
    let j = i + 1
    while (j < sorted.length) {
      const next = sorted[j]!
      if (!sameGesture(entry, next)) break
      const nextChanges = auditFieldChanges(next)
      if (nextChanges.length !== 1 || nextChanges[0]!.key !== key) break
      steps.push(next)
      lastChanges = nextChanges
      j += 1
    }

    if (steps.length === 1) {
      groups.push({ entry, steps, changes })
    } else {
      // Net: the OLDEST member's before (last in a newest-first run) to the
      // NEWEST member's after.
      const net: AuditFieldChange = { key, label: changes[0]!.label }
      const oldestBefore = lastChanges[0]!.before
      const newestAfter = changes[0]!.after
      if (oldestBefore !== undefined) net.before = oldestBefore
      if (newestAfter !== undefined) net.after = newestAfter
      groups.push({ entry, steps, changes: [net] })
    }
    i = j
  }

  return groups
}

/** "21 Jul 08:00" — the audit feed's timestamp column (no seconds; no dashes). */
export function formatAuditStamp(atISO: string): string {
  if (!DATE_TIME.test(atISO)) return atISO
  return format(parseISO(atISO), 'd MMM HH:mm')
}

/**
 * The one-line change summary for a dense feed (the admin Audit viewer): the
 * leading field's movement, with the rest counted. The full ledger belongs on
 * the Card history sheet, where someone is reading one record.
 */
export function summariseAuditChanges(changes: readonly AuditFieldChange[]): string {
  const first = changes[0]
  if (first === undefined) return ''
  const value =
    first.before !== undefined && first.after !== undefined
      ? `${first.before} → ${first.after}`
      : (first.after ?? first.before ?? '')
  const rest = changes.length - 1
  const more = rest > 0 ? ` · +${rest} more` : ''
  return `${first.label} ${value}${more}`
}
