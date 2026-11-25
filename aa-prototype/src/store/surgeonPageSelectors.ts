/**
 * The surgeon page's side panel (build plan Phase 55; US-13.6.2 "Side panel"): the Contracts linked
 * to a surgeon and their next Lists. Pure over state and the demo clock's date; the page only formats
 * what these return. Pairings come from `pairingsOnProfile`, the pairing section's own selector.
 */

import type { Contract } from '../domain/billing/contracts'
import type { List } from '../domain/types'
import { SESSIONS_IN_ORDER } from '../domain/outOfHours'
import type { AppState } from './appStore'

export interface SurgeonContractRow {
  contract: Contract
  /** The holder Party's short name (its id when the Party is missing). */
  holderName: string
}

/**
 * Contracts whose `linkedSurgeonIds` holds the surgeon, whoever holds them (a surgeon group's, a
 * hospital's, the surgeon's own): Active first, then Disabled, each by name.
 */
export function contractsLinkedToSurgeon(state: Pick<AppState, 'masters'>, surgeonId: string): SurgeonContractRow[] {
  const { contracts, parties } = state.masters
  return Object.values(contracts)
    .filter((c) => c.linkedSurgeonIds.includes(surgeonId))
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    .map((contract) => ({ contract, holderName: parties[contract.holderId]?.name ?? contract.holderId }))
}

const SESSION_RANK = new Map(SESSIONS_IN_ORDER.map((s, i) => [s, i]))

/** The surgeon's Lists from `todayISO` on, earliest first (by day, then session), removed (cancelled) Lists left out. */
export function nextListsForSurgeon(state: Pick<AppState, 'schedule'>, surgeonId: string, todayISO: string): List[] {
  return Object.values(state.schedule.lists)
    .filter((l) => l.surgeonId === surgeonId && l.dateISO >= todayISO && l.removedAtISO === undefined)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || (SESSION_RANK.get(a.session) ?? 9) - (SESSION_RANK.get(b.session) ?? 9) || a.id.localeCompare(b.id))
}
