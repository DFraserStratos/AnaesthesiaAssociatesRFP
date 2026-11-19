/**
 * Reconciliation status at a glance (catch-up Phase 37; US-13.2.4, DM-67).
 *
 * One status says whether every account that should balance does. It is a
 * pure derivation and is never stored: the store builds the checks it can
 * compute (`store/reconciliationSelectors.ts`, one data table), and this
 * module turns them into "square" or "out of balance" with the unresolved
 * items, each aged in whole days on the demo clock. Pure, deterministic.
 */

import { toCents } from './money'

/** Where an unresolved item comes from, so the screen can link to where it is handled. */
export type UnresolvedItemSource = 'unmatchedReceipt' | 'xeroQueue' | 'xeroDivergence' | 'bankLine'

/** The one record type for anything left to resolve (DM-67). */
export interface UnresolvedItem {
  id: string
  label: string
  amount: number
  /** When it began: a receipt's arrival, a queue item's first try, a flag's detection, a remittance's arrival. */
  sinceISO: string
  source: UnresolvedItemSource
}

/** One check: what should balance, by how much it does not, and the items behind it. */
export interface ReconciliationCheck {
  id: string
  label: string
  /** Signed; zero to the cent when the accounts agree. */
  difference: number
  items: readonly UnresolvedItem[]
}

export type AgedItem = UnresolvedItem & { ageDays: number; checkId: string }

export interface ReconciliationStatus {
  status: 'square' | 'outOfBalance'
  /** The checks with a difference or an open item, in table order. */
  failing: ReconciliationCheck[]
  /** Every open item across the checks, oldest first (ties by id). */
  items: AgedItem[]
}

/** Whole days from `sinceISO` to `nowISO` on the calendar (never negative). */
export function ageDays(sinceISO: string, nowISO: string): number {
  if (sinceISO === '' || nowISO === '') return 0
  return Math.max(0, dayNumber(nowISO) - dayNumber(sinceISO))
}

/** Days since the epoch for an ISO date or date-time's date part (calendar arithmetic, no clock read). */
function dayNumber(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Math.round(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000)
}

/** Square when every check's difference is zero to the cent and no item is open; otherwise out of balance with the failing checks. */
export function reconciliationStatus(checks: readonly ReconciliationCheck[], nowISO: string): ReconciliationStatus {
  const failing = checks.filter((c) => toCents(c.difference) !== 0 || c.items.length > 0)
  const items = checks
    .flatMap((c) => c.items.map((i) => ({ ...i, checkId: c.id, ageDays: ageDays(i.sinceISO, nowISO) })))
    .sort((a, b) => a.sinceISO.localeCompare(b.sinceISO) || a.id.localeCompare(b.id))
  return { status: failing.length === 0 ? 'square' : 'outOfBalance', failing, items }
}
