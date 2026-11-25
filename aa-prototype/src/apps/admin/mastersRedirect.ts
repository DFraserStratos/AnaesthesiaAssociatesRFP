/**
 * Old Master data links that moved to the Contracts section (build plan Phase
 * 45; D93). `/admin/masters?view=contracts` goes to the Contract list, with
 * `&contract=<id>` to that Contract's page and `&holder=<PartyId>` carried to
 * the list while it names a Party. The redirect stays after 49, so bookmarks,
 * the capture recipes and the demo guide keep loading. Phase 48 adds the
 * Parties and Funding tags cases here.
 */

import type { AppState } from '../../store'
import { contractPath, contractsPath } from './contractsPaths'

/** Where an old Master data URL now lives, or null when it stays on Master data. */
export function mastersRedirect(params: URLSearchParams, masters: Pick<AppState['masters'], 'contracts' | 'parties'>): string | null {
  if (params.get('view') !== 'contracts') return null
  const contractId = params.get('contract')
  if (contractId !== null && masters.contracts[contractId] !== undefined) return contractPath(contractId)
  const holder = params.get('holder')
  return contractsPath(holder !== null && masters.parties[holder] !== undefined ? { holder } : {})
}
