/**
 * An anaesthetist's activity as a function of a date (build plan Phase 52;
 * US-12.1.6, US-01.1.1, US-13.5.3, DM-05 to DM-07, D103). Pure: no React, no
 * store. The one place the rule lives: every reader of "is this anaesthetist
 * active" asks `isActiveOn` for the date the work is for.
 *
 * An anaesthetist is active from their start date, inactive after their last
 * day (`lastDayISO`) and active again from `activeAgainISO`. Nothing keeps a
 * flag in step with the clock.
 */
import { addDays, endOfMonth, format, parseISO } from 'date-fns'
import type { Contract } from './billing/contracts'
import type { Party } from './billing/parties'
import type { Anaesthetist, AnaesthetistId, AuditEntry, InactiveReason, IsoDate, List } from './types'

/** The fields activity is derived from. */
export type ActivitySpan = Pick<Anaesthetist, 'startDateISO' | 'lastDayISO' | 'activeAgainISO'>

/** The reasons the office gives, as the record and the audit show them. */
export const INACTIVE_REASON_LABELS: Record<InactiveReason, string> = {
  leftPractice: 'Left the practice',
  longLeave: 'Long leave',
  other: 'Other',
}

export const INACTIVE_REASONS = Object.keys(INACTIVE_REASON_LABELS) as InactiveReason[]

/**
 * Who the system disables an inactive anaesthetist's own Contracts as. Only
 * Contracts whose latest disable is by this name are offered back.
 */
export const INACTIVE_CONTRACTS_RULE_WHO = 'Inactive anaesthetist rule'

/** True when the anaesthetist works on `dateISO`: from the start date, not after the last day unless made active again. */
export function isActiveOn(a: ActivitySpan, dateISO: IsoDate): boolean {
  if (dateISO < a.startDateISO) return false
  if (a.lastDayISO === null || dateISO <= a.lastDayISO) return true
  return a.activeAgainISO !== null && dateISO >= a.activeAgainISO
}

/** True when the anaesthetist is active on any day from `fromISO` to `toISO` inclusive (the AA fee month). */
export function isActiveDuring(a: ActivitySpan, fromISO: IsoDate, toISO: IsoDate): boolean {
  if (toISO < fromISO || toISO < a.startDateISO) return false
  const first = fromISO < a.startDateISO ? a.startDateISO : fromISO
  if (isActiveOn(a, first)) return true
  // Inactive on the first day means after the last day: active again only if that comes by `toISO`.
  return a.activeAgainISO !== null && a.activeAgainISO <= toISO && isActiveOn(a, a.activeAgainISO)
}

/**
 * True when the anaesthetist is active on any day of the month `YYYY-MM`: the
 * AA fee run's rule, so the month someone leaves is still billed.
 */
export function isActiveInMonth(a: ActivitySpan, monthISO: string): boolean {
  const first = `${monthISO}-01`
  return isActiveDuring(a, first, format(endOfMonth(parseISO(first)), 'yyyy-MM-dd'))
}

/** The day after an ISO date. */
export function dayAfterISO(dateISO: IsoDate): IsoDate {
  return format(addDays(parseISO(dateISO), 1), 'yyyy-MM-dd')
}

export type AnaesthetistStatus =
  | { kind: 'active'; sinceISO: IsoDate }
  | { kind: 'leaving'; lastDayISO: IsoDate; reason: InactiveReason | null }
  | { kind: 'inactive'; sinceISO: IsoDate; lastDayISO: IsoDate; reason: InactiveReason | null }

/**
 * The status the record, its header and the Anaesthetists list show on
 * `todayISO`: active (since the start date, or the day made active again),
 * leaving (a last day today or ahead) or inactive (since the day after it).
 */
export function statusOn(a: ActivitySpan & Pick<Anaesthetist, 'inactiveReason'>, todayISO: IsoDate): AnaesthetistStatus {
  const reason = a.inactiveReason
  if (a.lastDayISO !== null && a.activeAgainISO === null && todayISO <= a.lastDayISO) {
    return { kind: 'leaving', lastDayISO: a.lastDayISO, reason }
  }
  if (a.lastDayISO !== null && todayISO > a.lastDayISO && !isActiveOn(a, todayISO)) {
    return { kind: 'inactive', sinceISO: dayAfterISO(a.lastDayISO), lastDayISO: a.lastDayISO, reason }
  }
  return { kind: 'active', sinceISO: a.activeAgainISO !== null && a.activeAgainISO <= todayISO ? a.activeAgainISO : a.startDateISO }
}

/**
 * On AA's books on `todayISO`: not inactive by `statusOn`, so working, leaving (a last day today or
 * ahead) or joining (a start date ahead). The People list's Active filter and the practice's count.
 */
export function isInPracticeOn(a: ActivitySpan & Pick<Anaesthetist, 'inactiveReason'>, todayISO: IsoDate): boolean {
  return statusOn(a, todayISO).kind !== 'inactive'
}

/**
 * The practice's count of anaesthetists on `todayISO`: everyone on AA's books (`isInPracticeOn`).
 * The one figure the app states as "N anaesthetists": the Day view header, the People tab's badge and
 * the Anaesthetists list's Active line. Who works a given day is the roster, a different count.
 */
export function practiceAnaesthetistCount(all: Iterable<ActivitySpan & Pick<Anaesthetist, 'inactiveReason'>>, todayISO: IsoDate): number {
  let n = 0
  for (const a of all) if (isInPracticeOn(a, todayISO)) n++
  return n
}

/**
 * The Lists that refuse a last day: every List assigned to the anaesthetist
 * dated after it, not removed, in date order. (A Draft List has no
 * anaesthetist, so it never holds one.)
 */
export function listsAfterLastDay(lists: Iterable<List>, anaesthetistId: AnaesthetistId, lastDayISO: IsoDate): List[] {
  const out: List[] = []
  for (const l of lists) {
    if (l.anaesthetistId === anaesthetistId && l.dateISO > lastDayISO && l.removedAtISO === undefined) out.push(l)
  }
  return out.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session))
}

/**
 * The anaesthetist's own Contracts (D103: derived, no stored link): held by an
 * anaesthetist-kind Party and linked to them.
 */
export function ownContracts(
  contracts: Iterable<Contract>,
  parties: Readonly<Record<string, Party>>,
  anaesthetistId: AnaesthetistId,
): Contract[] {
  const out: Contract[] = []
  for (const c of contracts) {
    if (c.linkedAnaesthetistId === anaesthetistId && parties[c.holderId]?.kind === 'anaesthetist') out.push(c)
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * The Contracts to offer back when the anaesthetist is made active again:
 * linked to them, still Disabled, and whose latest `contract.disable` was the
 * rule's (by `INACTIVE_CONTRACTS_RULE_WHO`) after their last day. A Contract
 * the office disabled by hand is never offered.
 */
export function contractsToOfferBack(
  contracts: Iterable<Contract>,
  audit: readonly AuditEntry[],
  anaesthetistId: AnaesthetistId,
  lastDayISO: IsoDate,
): Contract[] {
  const latestDisable = new Map<string, AuditEntry>()
  for (const e of audit) {
    if (e.entityType === 'contract' && e.action === 'contract.disable') latestDisable.set(e.entityId, e)
  }
  const out: Contract[] = []
  for (const c of contracts) {
    if (c.linkedAnaesthetistId !== anaesthetistId || c.status !== 'disabled') continue
    const last = latestDisable.get(c.id)
    if (last !== undefined && last.who === INACTIVE_CONTRACTS_RULE_WHO && last.atISO.slice(0, 10) > lastDayISO) out.push(c)
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}
