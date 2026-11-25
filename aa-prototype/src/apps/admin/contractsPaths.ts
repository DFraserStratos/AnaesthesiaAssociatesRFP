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
export function contractsPath(opts: { group?: string; in?: string; holder?: string; status?: 'all' } = {}): string {
  if (opts.holder !== undefined && opts.holder !== '') return `/admin/contracts${query({ group: 'holder', in: opts.holder, status: opts.status })}`
  return `/admin/contracts${query({ group: opts.group, in: opts.in, status: opts.status })}`
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
 * The catalogue at a count's Contracts (build plan Phase 48): the one link every Party, tag and
 * hospital count opens, so the figure and the rows listed agree (`partyContracts.ts`). It keeps
 * the office's own Contracts (`own=1`: no system backstops), on the holder grouping at that holder
 * narrowed by a tag (`tag=<id>`, `tag=none` for No tag), or on the tag grouping at that tag when no
 * holder is named; `status=disabled` opens it on the Disabled ones.
 */
export function contractsCatalogueLink(opts: { holderId?: string; tagId?: string; status?: 'disabled'; underHospitalId?: string }): string {
  // A tag's hospital row (the Funding tags tab) counts by where the invoice goes, so its link opens the
  // "Invoice goes to" grouping at that hospital, narrowed by the tag: a hospital-held Contract that bills
  // the payer is neither counted nor listed there (the wave 1 join's review).
  if (opts.underHospitalId !== undefined && opts.underHospitalId !== '') {
    return `/admin/contracts${query({ group: 'destination', in: `hospital:${opts.underHospitalId}`, tag: opts.tagId, own: '1' })}`
  }
  const holder = opts.holderId !== undefined && opts.holderId !== ''
  return `/admin/contracts${query({
    group: holder ? 'holder' : opts.tagId !== undefined ? 'tag' : undefined,
    in: holder ? opts.holderId : opts.tagId,
    tag: holder ? opts.tagId : undefined,
    own: '1',
    status: opts.status,
  })}`
}

/** The Parties tab (Phase 48). */
export function partiesPath(): string {
  return '/admin/contracts/parties'
}

/** A Party's page (Phase 48), where its details are changed and its Contracts counted by tag. */
export function partyPath(partyId: string): string {
  return `/admin/contracts/parties/${encodeURIComponent(partyId)}`
}

/** The Funding tags tab (Phase 48), optionally with a tag picked. */
export function fundingTagsPath(tagId?: string): string {
  return `/admin/contracts/tags${query({ tag: tagId })}`
}
