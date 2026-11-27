/**
 * The Contracts section's tabs in one registry (build plan Phase 48; D92,
 * US-13.4.1): each tab's label, path, the rows of US-13.4.1's list it
 * maintains (in the catalogue's words) and the seed-load sheets that load it
 * once at go-live. Master data's own registry is `masters/masterViews.ts`; the
 * two together map every row of US-13.4.1's list, and the sample-sheet trigger
 * reads `seeded` for the tab published under `adminContracts.tab`.
 */

import type { LoadEntity } from '../../../../domain/masterLoad/types'
import { contractsPath, fundingTagsPath, partiesPath } from '../../contractsPaths'

export type ContractsTab = 'contracts' | 'parties' | 'fundingTags'

export interface ContractsTabEntry {
  tab: ContractsTab
  label: string
  path: string
  catalogueRows: readonly string[]
  /** The one-line sub under the Contracts title, the same height on every tab (`AdminPage` keeps a tabbed page's sub to one line). */
  sub: string
  /** Like Master data's views, every tab adds and edits its records. */
  add: true
  edit: true
  seeded: readonly LoadEntity[]
}

export const CONTRACTS_TABS: readonly ContractsTabEntry[] = [
  { tab: 'contracts', label: 'Contracts', path: contractsPath(), sub: 'What each Procedure can be priced at, and who it bills.', catalogueRows: ['Contracts, with their price ranges'], add: true, edit: true, seeded: ['contracts', 'priceRanges'] },
  { tab: 'parties', label: 'Parties', path: partiesPath(), sub: 'Everyone who can hold a Contract, and how their invoices are addressed and sent.', catalogueRows: ['Parties, insurers and funders among them'], add: true, edit: true, seeded: ['parties'] },
  { tab: 'fundingTags', label: 'Funding tags', path: fundingTagsPath(), sub: "Who funds a hospital's work. A Contract carries one tag at most.", catalogueRows: ['funding tags'], add: true, edit: true, seeded: ['fundingTags'] },
]

/** A tab's one-line sub. */
export function contractsTabSub(tab: ContractsTab): string {
  return CONTRACTS_TABS.find((t) => t.tab === tab)?.sub ?? ''
}

/** Each tab's seeded sheets, for its subtitle line and waiting-load banner. */
export const CONTRACTS_TAB_SEEDED = Object.fromEntries(CONTRACTS_TABS.map((t) => [t.tab, t.seeded])) as Readonly<Record<ContractsTab, readonly LoadEntity[]>>
