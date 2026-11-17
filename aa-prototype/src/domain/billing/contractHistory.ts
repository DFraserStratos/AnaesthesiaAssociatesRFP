/**
 * A Contract's history (catch-up Phase 25; US-04.1.3): every audited change to
 * it, newest first, read from the append-only audit. Create, edit (the
 * specialties and funding tag included: they are Contract fields), disable and
 * enable, each price range added, corrected or deleted (a corrected range
 * keeps its earlier value in its entry), and a system Contract the system made.
 * Each row carries who, when and the values before and after as written. The
 * audit is append-only, so nothing is ever removed; a Disabled Contract keeps
 * every row. The Procedures locked against it are the store's
 * (`lockedAgainstContract`, read from `billing.locks`).
 */

import type { AuditEntry } from '../types'

/** The audit codes that change a Contract (18, 18a, 19a). */
export const CONTRACT_HISTORY_ACTIONS: ReadonlySet<string> = new Set([
  'contract.create',
  'contract.update',
  'contract.disable',
  'contract.enable',
  'contract.fallbackCreate',
  'contract.priceRange.add',
  'contract.priceRange.update',
  'contract.priceRange.delete',
])

export interface ContractFieldChange {
  field: string
  before: unknown
  after: unknown
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** One entry's fields with their values before and after (a field on one side only shows on that side). */
export function contractFieldChanges(entry: Pick<AuditEntry, 'before' | 'after'>): ContractFieldChange[] {
  const before = isRecord(entry.before) ? entry.before : {}
  const after = isRecord(entry.after) ? entry.after : {}
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
  return keys
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map((field) => ({ field, before: before[field], after: after[field] }))
}

/** The trailing number of an audit id (`A0037` -> 37), the tiebreak under the pinned demo clock. */
function sequenceOf(id: string): number {
  const m = /(\d+)$/.exec(id)
  return m === null ? 0 : Number(m[1])
}

/** A Contract's audited changes, newest first (the History tab's rows). */
export function contractHistoryFor(audit: readonly AuditEntry[], contractId: string): AuditEntry[] {
  return audit
    .filter((a) => a.entityType === 'contract' && a.entityId === contractId && CONTRACT_HISTORY_ACTIONS.has(a.action))
    .sort((a, b) => b.atISO.localeCompare(a.atISO) || sequenceOf(b.id) - sequenceOf(a.id))
}
