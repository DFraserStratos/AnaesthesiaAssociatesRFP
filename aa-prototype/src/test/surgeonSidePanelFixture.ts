/**
 * US-13.6.2's Side panel example as a fixture (build plan Phase 55): a surgeon with four pairings,
 * two linked Contracts (one a hospital's) and six upcoming Lists, plus a past List and a removed one
 * that must not show. Built on a fresh state for Dr P. Whaanga, whom the seed names on nothing.
 */

import type { AppState } from '../store/appStore'
import type { AssignedList, List, PairingPreference } from '../domain/types'
import { addDaysISO } from '../domain/clock'

export const FIXTURE_SURGEON = 'S-WHAANGA'

export function withSurgeonSidePanel(state: AppState): AppState {
  const today = state.clock.todayISO
  const anaesthetistIds = Object.keys(state.masters.anaesthetists).sort().slice(0, 4)
  const pairings: Record<string, PairingPreference> = {}
  anaesthetistIds.forEach((anaesthetistId, i) => {
    const id = `PP-FX${i + 1}`
    pairings[id] = {
      id,
      kind: i % 2 === 0 ? 'NOT_PREFERRED' : 'PREFERRED',
      raisedBy: i < 2 ? 'SURGEON' : 'ANAESTHETIST',
      anaesthetistId,
      surgeonId: FIXTURE_SURGEON,
      addedAtISO: `${today}T09:00:00`,
      addedBy: 'Kirsty W.',
    }
  })

  const contracts = Object.values(state.masters.contracts)
  const groupHeld = contracts.find((c) => c.id === 'CT-COS-FIXED')!
  const hospitalHeld = contracts.find((c) => state.masters.parties[c.holderId]?.kind === 'hospital' && c.status === 'active')!
  const linked = {
    'CT-FX-GROUP': { ...groupHeld, id: 'CT-FX-GROUP', name: 'Fixture group Contract', linkedSurgeonIds: [FIXTURE_SURGEON] },
    'CT-FX-HOSP': { ...hospitalHeld, id: 'CT-FX-HOSP', name: 'Fixture hospital Contract', status: 'disabled' as const, linkedSurgeonIds: [FIXTURE_SURGEON] },
  }

  const template = Object.values(state.schedule.lists).find((l): l is AssignedList => l.state === 'ACTIVE' && l.dateISO > today)!
  const lists: Record<string, List> = {}
  const add = (id: string, dateISO: string, extra: Partial<List> = {}) => {
    lists[id] = { ...template, id, dateISO, surgeonId: FIXTURE_SURGEON, recurringBookingId: undefined, ...extra } as List
  }
  for (let i = 1; i <= 6; i += 1) add(`L-FX-${i}`, addDaysISO(today, 7 - i))
  add('L-FX-PAST', addDaysISO(today, -3))
  add('L-FX-GONE', addDaysISO(today, 2), { removedAtISO: `${today}T08:00:00` })

  return {
    ...state,
    masters: { ...state.masters, contracts: { ...state.masters.contracts, ...linked } },
    schedule: { ...state.schedule, lists: { ...state.schedule.lists, ...lists } },
    officePrivate: { ...state.officePrivate, pairingPreferences: { ...state.officePrivate.pairingPreferences, ...pairings } },
  }
}
