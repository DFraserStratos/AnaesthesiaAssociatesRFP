/**
 * A Contract's history (catch-up Phase 25; US-04.1.3): every audited change to
 * it, newest first, read from the append-only audit. Create, edit (the
 * specialties and funding tag included: they are Contract fields), disable and
 * enable, each price range added, corrected or deleted (a corrected range
 * keeps its earlier value in its entry), and a system Contract the system made.
 * Each row carries who, when and the values before and after as written. The
 * audit is append-only, so nothing is ever removed; a Disabled Contract keeps
 * every row. The Procedures locked against it are the store's
 * (`lockedAgainstContract`, read from `billing.locks`). A replacement from a
 * date (build plan Phase 49) shows both ways: on the new Contract its create
 * entry names the Contract it replaces, and the old one's history carries that
 * entry too.
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

/**
 * A Contract's audited changes, newest first (the History tab's rows), with the
 * create entry of any Contract that replaces it (build plan Phase 49; US-04.1.3
 * "a Contract's history shows every change made to it"), cut to that
 * Contract's code, name and `replaces` (`replacedByEntries`). That row keeps
 * the new Contract's `entityId`, so a reader can tell it apart.
 */
export function contractHistoryFor(audit: readonly AuditEntry[], contractId: string): AuditEntry[] {
  return [
    ...audit.filter((a) => a.entityType === 'contract' && a.entityId === contractId && CONTRACT_HISTORY_ACTIONS.has(a.action)),
    ...replacedByEntries(audit, contractId),
  ].sort((a, b) => b.atISO.localeCompare(a.atISO) || sequenceOf(b.id) - sequenceOf(a.id))
}

// ---------------------------------------------------------------------------
// Replacements (build plan Phase 49; US-04.1.8, DM-01, D94)
// ---------------------------------------------------------------------------

/**
 * One Contract replacing another from a date. The link and the date live only
 * in the new Contract's `contract.create` audit entry (`after.replaces:
 * { contractId, fromISO }`), never on the Contract (US-04.1.2 "No dates"), so
 * they are read back from the audit both ways. `fromISO` is the change date the
 * office chose, never the entry's timestamp: a replacement saved on 20 Dec from
 * 1 Jan is dated 1 Jan.
 */
export interface ContractReplacement {
  /** The new Contract. */
  contractId: string
  /** The Contract it replaces. */
  replacesId: string
  /** The change date (`YYYY-MM-DD`). */
  fromISO: string
  /** When the replacement was saved. */
  atISO: string
  /** The create entry's id (the tiebreak under the pinned demo clock). */
  entryId: string
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** The `replaces` a `contract.create` entry's `after` carries, when it is a well-formed one. */
export function replacesOfEntry(entry: Pick<AuditEntry, 'action' | 'after'>): { contractId: string; fromISO: string } | null {
  if (entry.action !== 'contract.create' || !isRecord(entry.after)) return null
  const r = entry.after.replaces
  if (!isRecord(r) || typeof r.contractId !== 'string' || typeof r.fromISO !== 'string' || !DAY.test(r.fromISO)) return null
  return { contractId: r.contractId, fromISO: r.fromISO }
}

/** Every replacement in the audit, oldest saved first. */
export function contractReplacements(audit: readonly AuditEntry[]): ContractReplacement[] {
  const out: ContractReplacement[] = []
  for (const a of audit) {
    if (a.entityType !== 'contract') continue
    const r = replacesOfEntry(a)
    if (r === null) continue
    out.push({ contractId: a.entityId, replacesId: r.contractId, fromISO: r.fromISO, atISO: a.atISO, entryId: a.id })
  }
  return out.sort((a, b) => a.atISO.localeCompare(b.atISO) || sequenceOf(a.entryId) - sequenceOf(b.entryId))
}

/** The newest replacement of a Contract (the one saved last), or null. */
export function replacementOf(audit: readonly AuditEntry[], oldId: string): ContractReplacement | null {
  const mine = contractReplacements(audit).filter((r) => r.replacesId === oldId)
  return mine[mine.length - 1] ?? null
}

/** The Contract and date a Contract replaces, or null when it replaces none. */
export function replacesFor(audit: readonly AuditEntry[], newId: string): ContractReplacement | null {
  return contractReplacements(audit).find((r) => r.contractId === newId) ?? null
}

/** The fields an old Contract's history shows of the create entry that replaced it. */
const REPLACED_BY_FIELDS = ['aaCode', 'name', 'replaces'] as const

/** The create entries of the Contracts that replace `oldId`, cut to the new Contract's code, name and `replaces`. */
export function replacedByEntries(audit: readonly AuditEntry[], oldId: string): AuditEntry[] {
  const out: AuditEntry[] = []
  for (const a of audit) {
    if (a.entityType !== 'contract' || a.entityId === oldId) continue
    const r = replacesOfEntry(a)
    if (r === null || r.contractId !== oldId || !isRecord(a.after)) continue
    const source = a.after
    const after: Record<string, unknown> = {}
    for (const k of REPLACED_BY_FIELDS) if (k in source) after[k] = source[k]
    out.push({ ...a, after })
  }
  return out
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
