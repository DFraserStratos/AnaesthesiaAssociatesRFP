/**
 * Change-set reads (catch-up Phase 35; US-02.3.2 "Changes known", DM-35).
 * A change set is a group of audit entries, so these read the audit.
 */

import type { AuditEntry, ChangeSetId, ChangeSetKind } from '../domain/types'
import type { AppState } from './appStore'

export interface ChangeSetSummary {
  changeSetId: ChangeSetId
  kind: ChangeSetKind | null
  who: string
  atISO: string
  /** The fields the save changed (a save's header lists them); the entry count otherwise. */
  count: number
  /** The header's field list (`booking.save`'s `after.fields`): the screens count it by label (`changeCount`). */
  fields: { entityType: 'booking' | 'procedure' | 'billingLine' | 'patient'; entityId: string; field: string }[]
  /** The audit index of the change set's first entry (for "newer than" checks). */
  index: number
}

/** The newest change set that touched this Booking with a `booking.save` header (an office save), or undefined. */
export function lastChangeSetFor(state: Pick<AppState, 'audit'>, bookingId: string): ChangeSetSummary | undefined {
  const audit = state.audit
  for (let i = audit.length - 1; i >= 0; i--) {
    const e = audit[i]!
    if (e.action !== 'booking.save' || e.entityId !== bookingId || e.changeSetId === undefined) continue
    const fields = (e.after as { fields?: unknown[] } | undefined)?.fields
    return {
      changeSetId: e.changeSetId,
      kind: e.changeSetKind ?? 'save',
      who: e.who,
      atISO: e.atISO,
      count: Array.isArray(fields) ? fields.length : 0,
      fields: Array.isArray(fields) ? (fields as ChangeSetSummary['fields']) : [],
      index: i,
    }
  }
  return undefined
}

/** Every entry of one change set, in audit order. */
export function changeSetEntries(audit: readonly AuditEntry[], changeSetId: ChangeSetId): AuditEntry[] {
  return audit.filter((e) => e.changeSetId === changeSetId)
}
