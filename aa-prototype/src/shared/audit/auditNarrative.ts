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
 * DIFF OVER THE UNION OF KEYS. `editBooking` / `editProcedure` build `before` as
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

import type { ContractPricing, ContractStatus, DeliveryMethod, PartyKind } from '../../domain/types'
import { DELIVERY_LABEL, PARTY_KIND_LABEL, PRICING_KIND_LABEL, STATUS_LABEL, pricingLabel } from '../contracts/labels'
import { format, parseISO } from 'date-fns'
import type { AuditEntry, BookingSource, DraftOrigin, ListState, ProcedureTextSource, RequestSource } from '../../domain/types'
import { BOOKING_SOURCE_LABELS, LIST_STATE_LABELS, PROCEDURE_TEXT_SOURCE_LABELS, formatCurrency } from '../format'
import { ORIGIN_LABELS, SOURCE_LABELS, UNASSIGNED } from '../scheduleTerms'
import { fieldLabel } from './fieldLabels'
import { PAIRING_LABELS, isPriorityTier, tierLabel } from '../../domain/pairingPreferences'
import { sessionText } from '../../domain/outOfHours'
import { maskBankAccount } from '../../domain/bankAccount'
import type { ChangeType, ImportChannel, ImportDecision, IncomingFieldKey } from '../../domain/types'
import { CHANGE_TYPE_LABELS, DECISION_KIND_LABELS, IMPORT_CHANNEL_LABELS, INCOMING_FIELD_LABELS } from '../../domain/intake/matching'

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

/** A typed price cleared (catch-up Phase 24): the price is worked out from the Contract again. */
export const PRICE_CLEARED = 'cleared, computed again'

/** Keys whose numeric values are money. */
const MONEY_KEYS = new Set([
  'amount',
  'enteredPrice',
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
  // InvoiceApproval (catch-up Phase 27)
  if ((value.mode === 'approved' || value.mode === 'automatic') && typeof value.by === 'string') {
    return value.mode === 'approved' ? `Approved by ${value.by}` : 'Sent with approval off'
  }
  // CounterpartyRef
  if (typeof value.kind === 'string' && typeof value.id === 'string' && Object.keys(value).length === 2) {
    return `${COUNTERPARTY_KINDS[value.kind] ?? titleCase(value.kind)} ${value.id}`
  }
  // IntegrationCorrelationRef
  if (typeof value.sourceFeedId === 'string' && typeof value.externalAppointmentId === 'string') {
    return `${value.sourceFeedId} · ${value.externalAppointmentId}`
  }
  // Quarantined inbound ethnicity code
  if (typeof value.receivedCode === 'string') return `${value.receivedCode} · held for correction`
  // BookingCancellation / ListPhoneNote — the words are the value.
  if (typeof value.reason === 'string') return value.reason
  if (typeof value.text === 'string') return value.text
  return null
}


/** `list.ownerMove`'s route and cause values (catch-up Phase 32). A conflict's `cause` is a fact key, never one of these. */
const OWN_MOVE_WAY_LABELS = { office: 'The office', colleague: 'A colleague' } as const
const OWN_MOVE_CAUSE_LABELS = { move: 'Moved by its anaesthetist', unavailable: 'Marked not available' } as const

/**
 * Names for ids an audit value may carry, from the reader's masters (catch-up
 * Phase 19): an RVG group's hidden id is never shown, so it reads as its code
 * and description.
 */
export interface AuditNames {
  rvgGroup?: (id: string) => string | undefined
  /** A Contract by its name, never its id (catch-up Phase 35 test pass). */
  contract?: (id: string) => string | undefined
}

/** The names a reader passes from its masters: an RVG group as "H4 · Complex procedures…". */
export function auditNamesFor(masters: {
  rvgGroups: Readonly<Record<string, { code: string; description: string }>>
  contracts?: Readonly<Record<string, { name: string }>>
}): AuditNames {
  return {
    rvgGroup: (id) => {
      const g = masters.rvgGroups[id]
      return g !== undefined ? `${g.code} · ${g.description}` : undefined
    },
    ...(masters.contracts !== undefined ? { contract: (id: string) => masters.contracts?.[id]?.name } : {}),
  }
}

/**
 * One audited value as a reader-facing string. Never JSON: an unrecognised
 * object degrades to its labelled leading fields, so a shape added later reads
 * as English instead of a brace dump.
 */
export function formatAuditValue(key: string, value: unknown, names?: AuditNames): string {
  // A List with no anaesthetist is a Draft List: its flag, not "not set" (catch-up Phase 31).
  if ((value === undefined || value === null) && key === 'anaesthetistId') return UNASSIGNED
  if (value === undefined || value === null) return NOT_SET
  // The Prepayment approval switch reads on or off (catch-up Phase 27).
  if (typeof value === 'boolean' && key === 'approvalRequired') return value ? 'on' : 'off'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'number') {
    if (key === 'tier' && isPriorityTier(value)) return tierLabel(value)
    return MONEY_KEYS.has(key) ? formatCurrency(value) : String(value)
  }
  if (typeof value === 'string') {
    if (value.trim() === '') return 'empty'
    // An RVG group by its code and description, never its hidden id (catch-up Phase 19).
    if (key === 'rvgGroupId') {
      if (names?.rvgGroup === undefined) return 'an RVG code'
      return names.rvgGroup(value) ?? 'an RVG code no longer listed'
    }
    // A Contract by its name, never its id (names over ids).
    if (key === 'governingContractId' && names?.contract !== undefined) return names.contract(value) ?? value
    if (DATE_TIME.test(value)) return format(parseISO(value), 'd MMM HH:mm')
    if (DATE_ONLY.test(value)) return format(parseISO(value), 'd MMM yyyy')
    // A session reads AM, PM or Out-of-hours (catch-up Phase 32c).
    if (key === 'session' || key === 'sessions') return sessionText(value)
    // The matching screen's words (catch-up Phase 33).
    if (key === 'changeType' && Object.hasOwn(CHANGE_TYPE_LABELS, value)) return CHANGE_TYPE_LABELS[value as ChangeType]
    if (key === 'channel' && Object.hasOwn(IMPORT_CHANNEL_LABELS, value)) return IMPORT_CHANNEL_LABELS[value as ImportChannel]
    if (key === 'source' && Object.hasOwn(BOOKING_SOURCE_LABELS, value)) return BOOKING_SOURCE_LABELS[value as BookingSource]
    if (key === 'source' && Object.hasOwn(SOURCE_LABELS, value)) return SOURCE_LABELS[value as RequestSource]
    if (key === 'origin' && Object.hasOwn(ORIGIN_LABELS, value)) return ORIGIN_LABELS[value as DraftOrigin]
    if (key === 'state' && Object.hasOwn(LIST_STATE_LABELS, value)) return LIST_STATE_LABELS[value as ListState]
    // An anaesthetist's own move (catch-up Phase 32).
    if (key === 'route' && Object.hasOwn(OWN_MOVE_WAY_LABELS, value)) return OWN_MOVE_WAY_LABELS[value as keyof typeof OWN_MOVE_WAY_LABELS]
    if (key === 'cause' && Object.hasOwn(OWN_MOVE_CAUSE_LABELS, value)) return OWN_MOVE_CAUSE_LABELS[value as keyof typeof OWN_MOVE_CAUSE_LABELS]
    // Pairing words from the one label set (catch-up Phase 17).
    if (key === 'kind' && Object.hasOwn(PAIRING_LABELS.kind, value)) return PAIRING_LABELS.kind[value as keyof typeof PAIRING_LABELS.kind]
    if (key === 'raisedBy' && Object.hasOwn(PAIRING_LABELS.side, value)) return PAIRING_LABELS.side[value as keyof typeof PAIRING_LABELS.side]
    // Party and Contract words from their one label set (catch-up Phase 18).
    if (key === 'kind' && Object.hasOwn(PARTY_KIND_LABEL, value)) return PARTY_KIND_LABEL[value as PartyKind]
    if (key === 'deliveryMethod' && Object.hasOwn(DELIVERY_LABEL, value)) return DELIVERY_LABEL[value as DeliveryMethod]
    if (key === 'billsTo' && value === 'holder') return 'The holder'
    if (key === 'billsTo' && value === 'payer') return 'The payer'
    if (key === 'status' && Object.hasOwn(STATUS_LABEL, value)) return STATUS_LABEL[value as ContractStatus]
    if (key === 'systemRole' && value === 'noContractRvg') return 'No contract · RVG'
    // How the office approved a Contract change (catch-up Phase 21a).
    if (key === 'how' && value === 'explicit') return 'Approve on Review'
    if (key === 'how' && value === 'authorise') return 'At authorise'
    if (key === 'systemRole' && value === 'openPriceFallback') return 'Fixed price'
    if (key === 'systemRole' && value === 'rvgFallback') return 'No contract · RVG'
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'none'
    // A hospital row's fields by name (catch-up Phase 33): "time, procedure as received, note".
    if ((key === 'fields' || key === 'fieldsApplied') && value.every((item) => typeof item === 'string' && Object.hasOwn(INCOMING_FIELD_LABELS, item))) {
      return value.map((item) => INCOMING_FIELD_LABELS[item as IncomingFieldKey].toLowerCase()).join(', ')
    }
    if (value.every((item) => typeof item === 'string')) return value.join(', ')
    return value.length === 1 ? '1 item' : `${value.length} items`
  }
  if (isRecord(value)) {
    // A hospital row's decision (catch-up Phase 33): "Match and apply", "Create a Booking", "Reject: Not an AA booking".
    if (key === 'decision' && typeof value.kind === 'string' && Object.hasOwn(DECISION_KIND_LABELS, value.kind)) {
      const label = DECISION_KIND_LABELS[value.kind as ImportDecision['kind']]
      return value.kind === 'reject' && typeof value.reason === 'string' ? `${label}: ${value.reason}` : label
    }
    // A fee split (catch-up Phase 22; US-08.2.3): "I-NIB $132.50, Patient PT0004 the rest".
    if (key === 'split' && Array.isArray(value.shares)) {
      return value.shares
        .map((share: unknown) => {
          if (!isRecord(share) || !isRecord(share.party) || !isRecord(share.basis)) return '?'
          const party = formatShape(share.party) ?? '?'
          const basis = share.basis
          const label =
            basis.kind === 'amount' && typeof basis.amountExGst === 'number'
              ? formatCurrency(basis.amountExGst)
              : basis.kind === 'percent' && typeof basis.percent === 'number'
                ? `${basis.percent}%`
                : 'the rest'
          return `${party} ${label}`
        })
        .join(', ')
    }
    // A procedure text with its source and time (catch-up Phase 20a): "'RTK' (Surgeon's rooms PDF, 14 Jul 09:00)".
    if (key === 'procedureText' && typeof value.text === 'string') {
      const source = typeof value.source === 'string' && Object.hasOwn(PROCEDURE_TEXT_SOURCE_LABELS, value.source)
        ? PROCEDURE_TEXT_SOURCE_LABELS[value.source as ProcedureTextSource]
        : undefined
      const at = typeof value.receivedAtISO === 'string' && DATE_TIME.test(value.receivedAtISO) ? format(parseISO(value.receivedAtISO), 'd MMM HH:mm') : undefined
      const meta = [source, at].filter((p): p is string => p !== undefined).join(', ')
      return meta === '' ? `'${value.text}'` : `'${value.text}' (${meta})`
    }
    // An RVG group's published range (catch-up Phase 19): "10 to 12".
    if (key === 'baseUnitsRange' && typeof value.min === 'number' && typeof value.max === 'number') return `${value.min} to ${value.max}`
    // An anaesthetist's bank details (catch-up Phase 26): the name and the number, always masked
    // (the store writes it masked; a full number reaching here is masked again, never shown).
    if (key === 'bankAccount' && typeof value.accountName === 'string' && typeof value.accountNumber === 'string') {
      const number = value.accountNumber.includes('•') ? value.accountNumber : maskBankAccount(value.accountNumber)
      return `${value.accountName} · ${number}`
    }
    // A Contract's pricing (catch-up Phase 18): "RVG at $95.00 per unit".
    if (key === 'pricing' && typeof value.kind === 'string' && Object.hasOwn(PRICING_KIND_LABEL, value.kind)) {
      return pricingLabel(value as unknown as ContractPricing)
    }
    const shape = formatShape(value)
    if (shape !== null) return shape
    const parts = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .slice(0, 3)
      .map(([k, v]) => `${fieldLabel(k).toLowerCase()} ${formatAuditValue(k, v, names)}`)
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
export function auditFieldChanges(entry: AuditEntry, names?: AuditNames): AuditFieldChange[] {
  const before = isRecord(entry.before) ? entry.before : null
  const after = isRecord(entry.after) ? entry.after : null

  // Primitive payloads: no entry emits these today, but the type permits them.
  if (before === null && after === null) {
    if (entry.before === undefined && entry.after === undefined) return []
    const change: AuditFieldChange = { key: 'value', label: 'Value' }
    if (entry.before !== undefined) change.before = formatAuditValue('value', entry.before, names)
    if (entry.after !== undefined) change.after = formatAuditValue('value', entry.after, names)
    return [change]
  }

  const changes: AuditFieldChange[] = []
  // A record the seed load made (catch-up Phase 42) carries where it came from: one line, not two raw fields.
  const loaded = after !== null && typeof after['loadId'] === 'string' && typeof after['rowNumber'] === 'number'
  if (loaded) changes.push({ key: 'loadedFrom', label: 'Source', after: `Loaded from spreadsheet, row ${after['rowNumber'] as number}` })
  for (const key of unionKeys(before, after)) {
    if (loaded && (key === 'loadId' || key === 'rowNumber')) continue
    const beforeValue = before?.[key]
    const afterValue = after?.[key]
    if (before !== null && after !== null && sameValue(beforeValue, afterValue)) continue
    if (beforeValue === undefined && afterValue === undefined) continue

    const change: AuditFieldChange = { key, label: fieldLabel(key) }
    if (before !== null) {
      change.before = formatAuditValue(key, beforeValue, names)
    }
    if (after !== null) {
      change.after =
        afterValue === undefined && beforeValue !== undefined && SEEDED_FALLBACK_KEYS.has(key)
          ? CLEARED_TO_SEED
          : (afterValue === undefined || afterValue === null) && beforeValue !== undefined && beforeValue !== null && key === 'enteredPrice'
            ? PRICE_CLEARED
            : formatAuditValue(key, afterValue, names)
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
  // A change set is its own row (catch-up Phase 35): coalescing never merges into or across one.
  if (a.changeSetId !== undefined || b.changeSetId !== undefined) return false
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
export function coalesceAudit(entries: readonly AuditEntry[], names?: AuditNames): AuditGroup[] {
  const sorted = sortAuditNewestFirst(entries)
  const groups: AuditGroup[] = []

  let i = 0
  while (i < sorted.length) {
    const entry = sorted[i]!
    const changes = auditFieldChanges(entry, names)

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
      const nextChanges = auditFieldChanges(next, names)
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
 * the Booking history sheet, where someone is reading one record.
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
