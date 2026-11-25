/**
 * Old Master data links that moved out of Master data, all kept (D93, D100):
 *
 * - To the Contracts section (build plan Phases 45 and 48): `?view=contracts`
 *   goes to the Contract list, with `&contract=<id>` to that Contract's page and
 *   `&holder=<PartyId>` to the holder grouping while it names a Party.
 *   `?view=parties` (and the older `insurers` and `organisations`) goes to the
 *   Parties tab, with `&party=<id>` to that Party's page; `?view=fundingTags`
 *   goes to the Funding tags tab.
 * - To the People section (build plan Phase 53): `?view=anaesthetists`,
 *   `surgeons` and `specialties` go to their tabs; `?view=surgeonGroups` (the
 *   list that went, D98) and the older `surgeonRooms` go to Surgeons.
 *
 * The redirects stay after the sweep, so bookmarks, the capture recipes and the
 * demo guide keep loading.
 */

import type { AppState } from '../../store'
import { contractPath, contractsPath, fundingTagsPath, partiesPath, partyPath } from './contractsPaths'
import { peoplePath } from './peoplePaths'

/** Where an old Master data URL now lives, or null when it stays on Master data. */
export function mastersRedirect(params: URLSearchParams, masters: Pick<AppState['masters'], 'contracts' | 'parties'>): string | null {
  const view = params.get('view')
  if (view === 'contracts') {
    const contractId = params.get('contract')
    if (contractId !== null && masters.contracts[contractId] !== undefined) return contractPath(contractId)
    const holder = params.get('holder')
    return contractsPath(holder !== null && masters.parties[holder] !== undefined ? { holder } : {})
  }
  if (view === 'parties' || view === 'insurers' || view === 'organisations') {
    const party = params.get('party')
    return party !== null && masters.parties[party] !== undefined ? partyPath(party) : partiesPath()
  }
  if (view === 'fundingTags') return fundingTagsPath()
  if (view === 'anaesthetists' || view === 'specialties') return peoplePath(view)
  if (view === 'surgeons' || view === 'surgeonGroups' || view === 'surgeonRooms') return peoplePath('surgeons')
  return null
}
