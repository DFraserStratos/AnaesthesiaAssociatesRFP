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

/**
 * The day each Disabled Contract was disabled (catch-up Phase 25a; US-07.2.2,
 * US-04.1.2, D81): for every Contract whose latest disable or enable entry in
 * the audit is a `contract.disable`, that entry's day. A Contract re-enabled
 * since, or never disabled, has none. The day is read only from the audit: a
 * Contract carries no date field (US-04.1.2 "No dates"). One pass over the
 * audit, so Review builds it once per screen, not once per Procedure.
 */
export function disabledDaysByContract(audit: readonly AuditEntry[]): Record<string, string> {
  const latest = new Map<string, AuditEntry>()
  for (const a of audit) {
    if (a.entityType !== 'contract' || (a.action !== 'contract.disable' && a.action !== 'contract.enable')) continue
    const seen = latest.get(a.entityId)
    if (seen === undefined || a.atISO.localeCompare(seen.atISO) > 0 || (a.atISO === seen.atISO && sequenceOf(a.id) > sequenceOf(seen.id))) latest.set(a.entityId, a)
  }
  const out: Record<string, string> = {}
  for (const [id, a] of latest) if (a.action === 'contract.disable') out[id] = a.atISO.slice(0, 10)
  return out
}

/** One Contract's disable day (`YYYY-MM-DD`), or null when it is Active or was re-enabled since. */
export function contractDisabledOn(audit: readonly AuditEntry[], contractId: string): string | null {
  return disabledDaysByContract(audit.filter((a) => a.entityId === contractId))[contractId] ?? null
}
