/**
 * Change sets: the pure maths behind the office's explicit save (catch-up
 * Phase 35; US-02.3.2, US-02.5.5, DM-35).
 *
 * - `snapshotBooking` takes the Booking and everything a save can change on
 *   it: its Procedures (each with its payer, procedure text, modifiers, split
 *   and invoice description), their billing lines and the patient. Nothing
 *   from `officePrivate` (17's pairing preferences and tiers).
 * - `diffSnapshots` lists what changed between two snapshots, field by field.
 *   Arrays and objects compare as whole values (a modifier list is one
 *   field), and the Booking stamps are never a change.
 * - `changeSetsFor` groups audit entries by change set for the history.
 *
 * No React, no store imports.
 */

import type {
  AuditEntry,
  BillingLine,
  Booking,
  BookingId,
  ChangeSetId,
  ChangeSetKind,
  Patient,
  Procedure,
} from './types'

/** Everything one save can change on a Booking. */
export interface BookingSnapshot {
  booking: Booking
  procedures: Record<string, Procedure>
  billingLines: Record<string, BillingLine>
  patient?: Patient
}

/** The narrow state the snapshot reads (the schedule and the patient master), so it stays pure. */
export interface SnapshotSource {
  schedule: {
    bookings: Record<string, Booking>
    procedures: Record<string, Procedure>
    billingLines: Record<string, BillingLine>
  }
  masters: { patients: Record<string, Patient> }
}

export type SnapshotEntityType = 'booking' | 'procedure' | 'billingLine' | 'patient'

/**
 * One change between two snapshots. `create` and `remove` carry the whole
 * entity (field `*`). `rewrite` is a change to the procedure text as
 * received, which the office never makes (US-02.5.7): a save refuses it.
 */
export interface FieldChange {
  entityType: SnapshotEntityType
  entityId: string
  field: string
  before: unknown
  after: unknown
  kind: 'update' | 'create' | 'remove' | 'rewrite'
}

/** Never a change: the stamps `mutate` writes on every Booking it touches. */
export const IGNORED_FIELDS: ReadonlySet<string> = new Set(['lastModifiedBy', 'lastModifiedAtISO'])

/** Fields the office never edits: the text as received (20a, US-02.5.7). */
export const RECEIVED_TEXT_FIELDS: ReadonlySet<string> = new Set(['procedureText'])

/** A Booking and what hangs off it, or undefined when the Booking is gone. */
export function snapshotBooking(source: SnapshotSource, bookingId: BookingId): BookingSnapshot | undefined {
  const booking = source.schedule.bookings[bookingId]
  if (booking === undefined) return undefined
  const procedures: Record<string, Procedure> = {}
  for (const p of Object.values(source.schedule.procedures)) if (p.bookingId === bookingId) procedures[p.id] = p
  const billingLines: Record<string, BillingLine> = {}
  for (const l of Object.values(source.schedule.billingLines)) if (procedures[l.procedureId] !== undefined) billingLines[l.id] = l
  const patient = source.masters.patients[booking.patientId]
  return { booking, procedures, billingLines, ...(patient !== undefined ? { patient } : {}) }
}

/** Structural equality with stable key order; `undefined` keys count as absent. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const bb = b as unknown[]
    return a.length === bb.length && a.every((v, i) => sameValue(v, bb[i]))
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)])
  for (const k of keys) if (!sameValue(ao[k], bo[k])) return false
  return true
}

function diffEntity(entityType: SnapshotEntityType, entityId: string, base: object, next: object, out: FieldChange[]): void {
  const b = base as Record<string, unknown>
  const n = next as Record<string, unknown>
  const fields = [...new Set([...Object.keys(b), ...Object.keys(n)])].sort()
  for (const field of fields) {
    if (IGNORED_FIELDS.has(field)) continue
    if (sameValue(b[field], n[field])) continue
    const kind = entityType === 'procedure' && RECEIVED_TEXT_FIELDS.has(field) ? 'rewrite' : 'update'
    out.push({ entityType, entityId, field, before: b[field], after: n[field], kind })
  }
}

function diffRecords<T extends object>(entityType: SnapshotEntityType, base: Record<string, T>, next: Record<string, T>, out: FieldChange[]): void {
  const ids = [...new Set([...Object.keys(base), ...Object.keys(next)])].sort()
  for (const id of ids) {
    const b = base[id]
    const n = next[id]
    if (b === undefined && n !== undefined) out.push({ entityType, entityId: id, field: '*', before: undefined, after: n, kind: 'create' })
    else if (b !== undefined && n === undefined) out.push({ entityType, entityId: id, field: '*', before: b, after: undefined, kind: 'remove' })
    else if (b !== undefined && n !== undefined) diffEntity(entityType, id, b, n, out)
  }
}

/**
 * What changed from `base` to `next`, in a stable order: the Booking, then its
 * Procedures, their billing lines, then the patient.
 */
export function diffSnapshots(base: BookingSnapshot, next: BookingSnapshot): FieldChange[] {
  const out: FieldChange[] = []
  diffEntity('booking', base.booking.id, base.booking, next.booking, out)
  diffRecords('procedure', base.procedures, next.procedures, out)
  diffRecords('billingLine', base.billingLines, next.billingLines, out)
  if (base.patient !== undefined && next.patient !== undefined) diffEntity('patient', base.patient.hiddenInternalId, base.patient, next.patient, out)
  return out
}

/** One row of the history: a change set's entries, or one ungrouped entry. */
export interface ChangeSetGroup {
  /** The change set's id, or null for an entry saved without one. */
  changeSetId: ChangeSetId | null
  kind: ChangeSetKind | null
  /** The first entry (a save's `booking.save` header is its last entry; this is the earliest). */
  header: AuditEntry
  entries: AuditEntry[]
}

/**
 * The given entities' audit entries grouped by change set, newest first (by
 * audit order, never by time: the demo clock has minute resolution).
 * Entries with no change set pass through one per group.
 */
export function changeSetsFor(audit: readonly AuditEntry[], entityIds: ReadonlySet<string>): ChangeSetGroup[] {
  const groups: ChangeSetGroup[] = []
  const byId = new Map<ChangeSetId, ChangeSetGroup>()
  for (const entry of audit) {
    if (!entityIds.has(entry.entityId)) continue
    const id = entry.changeSetId
    if (id === undefined) {
      groups.push({ changeSetId: null, kind: null, header: entry, entries: [entry] })
      continue
    }
    const existing = byId.get(id)
    if (existing !== undefined) {
      existing.entries.push(entry)
      if (existing.kind === null && entry.changeSetKind !== undefined) existing.kind = entry.changeSetKind
      continue
    }
    const group: ChangeSetGroup = { changeSetId: id, kind: entry.changeSetKind ?? null, header: entry, entries: [entry] }
    byId.set(id, group)
    groups.push(group)
  }
  return groups.reverse()
}
