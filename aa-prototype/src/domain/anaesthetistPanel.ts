/**
 * The rows of the anaesthetist page's side panel (build plan Phase 54; US-12.1.4 "Side panel", D99,
 * D104). Pure: no React, no store. The page shows a few of each with See all.
 *
 * - `linkedContractsOf`: every Contract linked to the anaesthetist (`linkedAnaesthetistId`), whoever
 *   holds it (their own Party, a hospital, an insurer), Active first then Disabled, by name.
 * - `nextListsOf`: the Lists assigned to them from today on, any state, soonest first, AM before PM.
 *   A Draft List has no anaesthetist, so none is theirs; a past List never shows.
 */

import type { Contract } from './billing/contracts'
import type { AnaesthetistId, AssignedList, IsoDate, List, Session } from './types'

const SESSION_ORDER: Record<Session, number> = { AM: 0, PM: 1, OOH: 2 }

/** Every Contract linked to the anaesthetist: Active first, then Disabled, each by name. */
export function linkedContractsOf(contracts: Readonly<Record<string, Contract>>, anaesthetistId: AnaesthetistId): Contract[] {
  return Object.values(contracts)
    .filter((c) => c.linkedAnaesthetistId === anaesthetistId)
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
}

/** The anaesthetist's assigned Lists from `todayISO` on: soonest first, AM before PM. */
export function nextListsOf(lists: Readonly<Record<string, List>>, anaesthetistId: AnaesthetistId, todayISO: IsoDate): AssignedList[] {
  return Object.values(lists)
    .filter((l): l is AssignedList => l.state !== 'DRAFT' && l.anaesthetistId === anaesthetistId && l.dateISO >= todayISO)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || SESSION_ORDER[a.session] - SESSION_ORDER[b.session] || a.id.localeCompare(b.id))
}

