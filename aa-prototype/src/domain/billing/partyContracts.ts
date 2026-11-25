/**
 * How a Party's and a funding tag's Contracts are spread (build plan Phase 48;
 * US-04.1.5, US-13.4.5): the one place every count on the Parties tab, a
 * Party's page and the Funding tags tab comes from. Pure: no React, store,
 * clock or RNG.
 *
 * Every count is of **Active office Contracts**: the system's Fixed price and
 * RVG backstops (`isOfficeContract`) and Disabled Contracts are never counted.
 * A Party's Disabled Contracts are their own count. The store's remove refusal
 * for a tag ("SXAP is carried by 11 Contracts", `fundingTagUsage`) still counts
 * every Contract; it is the store's rule, not a count shown here.
 *
 * Each count opens the catalogue (Phase 47) through one link that narrows it
 * the same way (`CatalogueNarrowing`: the office's own Contracts, optionally
 * one tag or none), so the figure and the rows the catalogue lists never
 * disagree: `narrowContracts` is the filter both apply.
 */

import type { Contract } from '../types'
import { groupContracts, NO_GROUP_KEY, type ContractGroupWords } from './contractGroups'
import { destinationKey, destinationOf, isOfficeContract, type InvoiceDestination } from './fallbacks'
import { fundingTagsInOrder, type FundingTag, type FundingTagId } from './fundingTags'
import type { Party, PartyId } from './parties'

type Contracts = Readonly<Record<string, Contract>>
type Parties = Readonly<Record<PartyId, Party>>
type Tags = Readonly<Record<FundingTagId, FundingTag>>

/** "No tag" in a narrowing and in a count row (the catalogue's own key for it). */
export const NO_TAG = NO_GROUP_KEY

/**
 * How a count's link narrows the catalogue (the URL's `own` and `tag`):
 * `own` keeps the office's own Contracts (no system backstops); `tag` keeps
 * one funding tag's, or `none` for the untagged.
 */
export interface CatalogueNarrowing {
  own: boolean
  tag?: FundingTagId | typeof NO_TAG
}

/** The catalogue's rows as a count's link narrows them; the input's order is kept. */
export function narrowContracts(list: readonly Contract[], narrowing: CatalogueNarrowing): Contract[] {
  return list.filter(
    (c) =>
      (!narrowing.own || isOfficeContract(c)) &&
      (narrowing.tag === undefined || (narrowing.tag === NO_TAG ? c.fundingTagId === undefined : c.fundingTagId === narrowing.tag)),
  )
}

/** An Active office Contract: what every count here counts. */
function countable(c: Contract): boolean {
  return c.status === 'active' && isOfficeContract(c)
}

/** Each holder's Active office Contracts, and every office Contract it holds in any status (a Party with none at all shows "None"). */
export function contractCountsByHolder(contracts: Contracts): { active: ReadonlyMap<PartyId, number>; held: ReadonlyMap<PartyId, number> } {
  const active = new Map<PartyId, number>()
  const held = new Map<PartyId, number>()
  for (const c of Object.values(contracts)) {
    if (!isOfficeContract(c)) continue
    held.set(c.holderId, (held.get(c.holderId) ?? 0) + 1)
    if (c.status === 'active') active.set(c.holderId, (active.get(c.holderId) ?? 0) + 1)
  }
  return { active, held }
}

export interface PartyTagCount {
  /** A funding tag's id, or `none` (No tag). */
  tagId: FundingTagId | typeof NO_TAG
  count: number
}

export interface PartyContractCounts {
  /** Its Active office Contracts. */
  total: number
  /** One row per tag it holds Active Contracts under, in the step rail's order, No tag last. */
  byTag: PartyTagCount[]
  /** Its Disabled office Contracts. */
  disabled: number
}

/** A Party's Contracts counted by funding tag (its page's "Its Contracts"). A Party holding none returns no rows. */
export function partyContractCounts(contracts: Contracts, tags: Tags, partyId: PartyId): PartyContractCounts {
  const order = new Map(fundingTagsInOrder(tags).map((t, i) => [t.id, i]))
  const rank = (id: string): number => (id === NO_TAG ? Number.MAX_SAFE_INTEGER : (order.get(id) ?? order.size))
  const byTag = new Map<string, number>()
  let total = 0
  let disabled = 0
  for (const c of Object.values(contracts)) {
    if (c.holderId !== partyId || !isOfficeContract(c)) continue
    if (c.status === 'disabled') {
      disabled++
      continue
    }
    total++
    const key = c.fundingTagId ?? NO_TAG
    byTag.set(key, (byTag.get(key) ?? 0) + 1)
  }
  return {
    total,
    byTag: [...byTag.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0])).map(([tagId, count]) => ({ tagId, count })),
    disabled,
  }
}

/** The words `groupContracts` names groups with: only keys and counts are read here, so none is shown. */
const UNSHOWN_WORDS: ContractGroupWords = {
  kindPlural: { aa: '', hospital: '', insurer: '', funder: '', surgeonGroup: '', surgeon: '', anaesthetist: '' },
  pricingKind: { rvgAnaesthetistRate: '', rvgContractRate: '', rvgDiscount: '', fixed: '', open: '' },
  surname: (name) => name,
  noTag: '',
  noSurgeon: '',
  patient: '',
  special: '',
  standard: '',
  prepaid: '',
}

export interface TagHospitalCount {
  /** The hospital Party. */
  partyId: PartyId
  count: number
}

export interface TagContractsByHospital {
  /** Each hospital holding Active office Contracts that carry the tag, in name order. */
  hospitals: TagHospitalCount[]
  /** The tag's Contracts that do not sit under a hospital (held by a surgeon group or another non-hospital holder, or billing the payer). */
  notUnderHospital: number
  total: number
}

/**
 * A funding tag's Active office Contracts grouped by hospital (the Funding tags tab's picked tag),
 * through the catalogue's "Invoice goes to" grouping: a hospital's group holds exactly the
 * Contracts that sit under it on the step rail.
 */
export function tagContractsByHospital(contracts: Contracts, parties: Parties, tags: Tags, tagId: FundingTagId): TagContractsByHospital {
  const carrying = Object.values(contracts).filter((c) => countable(c) && c.fundingTagId === tagId)
  const groups = groupContracts(carrying, 'destination', { parties, fundingTags: tags, surgeons: {} }, UNSHOWN_WORDS)
  const hospitals: TagHospitalCount[] = []
  let under = 0
  for (const g of groups) {
    if (!g.key.startsWith('hospital:')) continue
    hospitals.push({ partyId: g.key.slice('hospital:'.length), count: g.entries.length })
    under += g.entries.length
  }
  hospitals.sort((a, b) => (parties[a.partyId]?.name ?? a.partyId).localeCompare(parties[b.partyId]?.name ?? b.partyId))
  return { hospitals, notUnderHospital: carrying.length - under, total: carrying.length }
}

export interface StepRailPlace {
  /** `destinationKey`'s string. */
  key: string
  destination: InvoiceDestination
  count: number
}

/**
 * Where a Party's Active office Contracts sit on step 1 of the step rail (its page's rail): one
 * place per destination, a hospital's tags first in the step rail's order, then Special, then
 * Patient.
 */
export function partyStepRailPlaces(contracts: Contracts, parties: Parties, tags: Tags, partyId: PartyId): StepRailPlace[] {
  const order = new Map(fundingTagsInOrder(tags).map((t, i) => [t.id, i]))
  const rank = (d: InvoiceDestination): number =>
    d.kind === 'hospital' ? (order.get(d.fundingTagId) ?? order.size) : d.kind === 'special' ? 1_000_000 : d.prepaid ? 2_000_001 : 2_000_000
  const places = new Map<string, StepRailPlace>()
  for (const c of Object.values(contracts)) {
    if (c.holderId !== partyId || !countable(c)) continue
    const destination = destinationOf(c, parties)
    const key = destinationKey(destination)
    const place = places.get(key)
    if (place === undefined) places.set(key, { key, destination, count: 1 })
    else place.count++
  }
  return [...places.values()].sort((a, b) => rank(a.destination) - rank(b.destination) || a.key.localeCompare(b.key))
}
