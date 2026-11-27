/**
 * Lists › To authorise, as rows (US-07.2.4): every submitted List waiting for the office, oldest
 * submitted first, with what the office should look at before authorising it. Pure over state
 * slices; the List's review page reads the same order for its Previous and Next.
 *
 * "Needs a look" reads only what Review already computes: the review flags of each Booking
 * (`reviewFlagsForBooking`, the Review page's Flags tile), split into the Procedures that need a
 * price, the anaesthetist's Contract changes waiting for approval and the other flags, plus the
 * anaesthetist's changes since the List was submitted (`changedSinceSubmitted`).
 */

import type { AssignedList, AuditEntry, List } from '../../../../domain/types'
import { sessionRank } from '../../../../domain/outOfHours'
import type { AppState } from '../../../../store/appStore'
import { changedSinceSubmitted, reviewFlagsFor, type ChangedSinceSubmitted } from '../../../../store'
import { bookingsByList } from '../../../../store/indexes'
import { disabledDaysByContract } from '../../../../domain/billing/contractHistory'
import { daysBetween } from '../../../../domain/dateDays'
import { listsToAuthorise } from './listsCounts'

/** What a List needs a look at; every count zero and `changed` null when nothing does. */
export interface ToAuthoriseNeeds {
  /** Procedures that still need a price (they hold up authorising). */
  needsPrice: number
  /** The anaesthetist's Contract changes waiting for the office's approval. */
  contractChanges: number
  /** Every other review flag on the List's Bookings. */
  flags: number
  /** The anaesthetist's changes since the List was submitted. */
  changed: ChangedSinceSubmitted | null
}

export interface ToAuthoriseRow {
  list: AssignedList
  /** When the List was last submitted (its last `list.submit`), when the audit holds one. */
  submittedAtISO?: string
  /** Whole days since it was submitted (0 on the day). */
  waitingDays?: number
  /** Its Bookings, cancelled ones left out. */
  bookings: number
  needs: ToAuthoriseNeeds
  /** Anything under `needs`. */
  needsALook: boolean
}

/** Review's flag selectors read the whole state. */
export type ToAuthoriseState = AppState

/** When each List was last submitted, from one pass over the audit. */
export function submittedAtByList(audit: readonly AuditEntry[]): Map<string, string> {
  const at = new Map<string, string>()
  for (const e of audit) if (e.entityType === 'list' && e.action === 'list.submit') at.set(e.entityId, e.atISO)
  return at
}

/**
 * The tab's order: oldest submitted first. A List with no submit in the audit (none in the seed)
 * sorts by its date, as if submitted that day; ties by List date, anaesthetist, then id.
 */
export function orderToAuthorise<T extends { list: AssignedList; submittedAtISO?: string }>(rows: readonly T[]): T[] {
  const key = (r: T) => r.submittedAtISO ?? r.list.dateISO
  return [...rows].sort(
    (a, b) =>
      key(a).localeCompare(key(b)) ||
      a.list.dateISO.localeCompare(b.list.dateISO) ||
      a.list.anaesthetistId.localeCompare(b.list.anaesthetistId) ||
      a.list.id.localeCompare(b.list.id),
  )
}

/**
 * The submitted List ids in the tab's order (Review's Previous and Next, Billing's awaiting rail).
 * `keep` holds one List in its place after it leaves the tab (the open review page's List, once
 * authorised), so Previous and Next stay put while its state changes.
 */
export function toAuthoriseOrder(state: { schedule: Pick<AppState['schedule'], 'lists'>; audit: AppState['audit'] }, keep?: string): string[] {
  const at = submittedAtByList(state.audit)
  const lists = listsToAuthorise(state)
  const kept = keep !== undefined ? state.schedule.lists[keep] : undefined
  if (kept !== undefined && kept.state !== 'DRAFT' && !lists.some((l) => l.id === keep)) lists.push(kept)
  return orderToAuthorise(
    lists.map((list) => {
      const submittedAtISO = at.get(list.id)
      return { list, ...(submittedAtISO !== undefined ? { submittedAtISO } : {}) }
    }),
  ).map((r) => r.list.id)
}

/**
 * Review's Previous and Next order: the To authorise order with each anaesthetist's Lists kept together,
 * so finishing Dr Souter's AM List leads to her PM List, not to whoever submitted next. Anaesthetists
 * follow the order their first List holds in `ids`; within one, by date, then AM before PM.
 */
export function reviewQueueOrder(ids: readonly string[], lists: Readonly<Record<string, Pick<List, 'anaesthetistId' | 'dateISO' | 'session'>>>): string[] {
  const groups = new Map<string, string[]>()
  for (const id of ids) {
    const who = lists[id]?.anaesthetistId ?? id
    const group = groups.get(who)
    if (group === undefined) groups.set(who, [id])
    else group.push(id)
  }
  const rank = (id: string) => { const session = lists[id]?.session; return session === undefined ? 9 : sessionRank(session) }
  const byWhen = (a: string, b: string) => (lists[a]?.dateISO ?? '').localeCompare(lists[b]?.dateISO ?? '') || rank(a) - rank(b)
  return [...groups.values()].flatMap((group) => [...group].sort(byWhen))
}

/** What one submitted List needs a look at. `disabledDays` is read once for many Lists. */
export function toAuthoriseNeeds(
  state: ToAuthoriseState,
  listId: string,
  bookingIds: readonly string[],
  disabledDays: Readonly<Record<string, string>> = disabledDaysByContract(state.audit),
): ToAuthoriseNeeds {
  const needs: ToAuthoriseNeeds = { needsPrice: 0, contractChanges: 0, flags: 0, changed: changedSinceSubmitted(state, listId) }
  for (const id of bookingIds) {
    if (state.schedule.bookings[id]?.cancellation !== undefined) continue
    for (const flag of reviewFlagsFor(state, id, disabledDays)) {
      if (flag.rule === 'needsPrice') needs.needsPrice++
      else if (flag.rule === 'contractChanged') needs.contractChanges++
      else needs.flags++
    }
  }
  return needs
}

export function needsALook(needs: ToAuthoriseNeeds): boolean {
  return needs.needsPrice > 0 || needs.contractChanges > 0 || needs.flags > 0 || needs.changed !== null
}

/** Every row of the tab, oldest submitted first. */
export function toAuthoriseRows(state: ToAuthoriseState): ToAuthoriseRow[] {
  const at = submittedAtByList(state.audit)
  const byList = bookingsByList(state.schedule.bookings)
  const disabledDays = disabledDaysByContract(state.audit)
  const rows = listsToAuthorise(state).map((list): ToAuthoriseRow => {
    const bookingIds = (byList.get(list.id) ?? []).filter((b) => b.cancellation === undefined).map((b) => b.id)
    const needs = toAuthoriseNeeds(state, list.id, bookingIds, disabledDays)
    const submittedAtISO = at.get(list.id)
    return {
      list,
      ...(submittedAtISO !== undefined ? { submittedAtISO, waitingDays: Math.max(0, daysBetween(submittedAtISO.slice(0, 10), state.clock.todayISO)) } : {}),
      bookings: bookingIds.length,
      needs,
      needsALook: needsALook(needs),
    }
  })
  return orderToAuthorise(rows)
}

/** The tab's filters (URL state): a search, one List date, and Needs a look only. */
export interface ToAuthoriseFilter {
  q: string
  dateISO: string
  look: boolean
}

/** The rows a search (anaesthetist, surgeon or hospital), a List date and Needs a look leave. */
export function filterToAuthorise(rows: readonly ToAuthoriseRow[], filter: ToAuthoriseFilter, masters: Pick<AppState['masters'], 'anaesthetists' | 'surgeons' | 'hospitals'>): ToAuthoriseRow[] {
  const q = filter.q.trim().toLowerCase()
  return rows.filter((r) => {
    if (filter.look && !r.needsALook) return false
    if (filter.dateISO !== '' && r.list.dateISO !== filter.dateISO) return false
    if (q === '') return true
    const names = [masters.anaesthetists[r.list.anaesthetistId]?.name, masters.surgeons[r.list.surgeonId]?.name, masters.hospitals[r.list.hospitalId]?.name]
    return names.some((n) => n !== undefined && n.toLowerCase().includes(q))
  })
}
