/**
 * The Contracts section's URLs (build plan Phase 45; D92): the list, a
 * Contract's page and New contract. One home so every in-app link agrees; a
 * Contract's page is keyed by its id, never its AA code, because the AA code
 * is editable. Phases 46 to 49 reuse these.
 */

/** A Contract page's tabs (`?tab=`); Overview is the default and carries no param. */
export type ContractTab = 'overview' | 'bookings' | 'eventFees' | 'history'

export const CONTRACT_TABS: readonly ContractTab[] = ['overview', 'bookings', 'eventFees', 'history']

/** The tab a `?tab=` value names, or Overview. */
export function parseContractTab(value: string | null): ContractTab {
  return CONTRACT_TABS.find((t) => t === value) ?? 'overview'
}

function query(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, v)
  const s = q.toString()
  return s === '' ? '' : `?${s}`
}

/** The Contract list, optionally filtered to one holder Party (47 maps it to the holder grouping). */
export function contractsPath(opts: { holder?: string } = {}): string {
  return `/admin/contracts${query({ holder: opts.holder })}`
}

/** A Contract's page, on a tab. */
export function contractPath(contractId: string, tab: ContractTab = 'overview'): string {
  return `/admin/contracts/${encodeURIComponent(contractId)}${query({ tab: tab === 'overview' ? undefined : tab })}`
}

/** New contract, optionally for a holder (the create panel until 46). */
export function newContractPath(opts: { holder?: string } = {}): string {
  return `/admin/contracts/new${query({ holder: opts.holder })}`
}

/**
 * A Party's details, where its billing name and delivery are changed: Master
 * data's Parties view with that Party open, until 48 gives it a page.
 */
export function partyPath(partyId: string): string {
  return `/admin/masters?view=parties&party=${encodeURIComponent(partyId)}`
}
