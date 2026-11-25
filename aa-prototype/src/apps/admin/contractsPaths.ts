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

/**
 * The Contract catalogue (Phase 47), optionally grouped (`?group=`) and on one group (`?in=`, an id
 * of that grouping). `holder` is one Party's Contracts: the holder grouping on that Party.
 */
export function contractsPath(opts: { group?: string; in?: string; holder?: string } = {}): string {
  if (opts.holder !== undefined && opts.holder !== '') return `/admin/contracts${query({ group: 'holder', in: opts.holder })}`
  return `/admin/contracts${query({ group: opts.group, in: opts.in })}`
}

/**
 * Where a Contract page's back link goes (Phase 47): the catalogue as the row was opened from it
 * (its grouping, group, search and page, passed as router state `{ from }`), else the bare list.
 */
export function catalogueReturnPath(state: unknown): string {
  const from = typeof state === 'object' && state !== null ? (state as { from?: unknown }).from : undefined
  return typeof from === 'string' && from.startsWith('/admin/contracts') ? from : contractsPath()
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
