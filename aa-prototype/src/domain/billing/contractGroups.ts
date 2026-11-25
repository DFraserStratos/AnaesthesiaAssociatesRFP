/**
 * The grouped Contract catalogue (build plan Phase 47; US-04.1.2, D96): the
 * one place that says which group, and which sub-heading, a Contract sits
 * under for each of the six groupings. Pure: no React, store, clock or RNG.
 *
 * It takes the list already searched and status-filtered (`contractSearch`),
 * so the index counts follow the search, and keeps that list's order within a
 * sub-heading. Group keys are ids, never names, because they go in the URL
 * (`?in=`). A Contract linked to two surgeons is under both; `groupCount`
 * counts distinct Contracts, never the sum of the groups.
 *
 * Where a Contract sits for "Invoice goes to" comes only from `destinationOf`
 * (D91): a hospital's untagged Contract is Special until OQ-145 says otherwise.
 * System Contracts group by their own settings like any other: AA's head the
 * Holder and Kind groupings, and a holder's fallbacks follow its own Contracts.
 */

import type { Contract, Surgeon, SurgeonId } from '../types'
import { destinationOf } from './fallbacks'
import { fundingTagsInOrder, type FundingTag, type FundingTagId } from './fundingTags'
import type { Party, PartyId, PartyKind } from './parties'
import type { PricingKind } from './contracts'

export type ContractGrouping = 'kind' | 'holder' | 'tag' | 'surgeon' | 'destination' | 'pricing'

/** The six groupings, in the toolbar's order, with their labels; `kind` is the default (contracts-section.html #map). */
export const CONTRACT_GROUPINGS: { readonly options: readonly { value: ContractGrouping; label: string }[]; readonly defaultValue: ContractGrouping } = {
  options: [
    { value: 'kind', label: 'Kind' },
    { value: 'holder', label: 'Holder' },
    { value: 'tag', label: 'Funding tag' },
    { value: 'surgeon', label: 'Surgeon' },
    { value: 'destination', label: 'Invoice goes to' },
    { value: 'pricing', label: 'Pricing' },
  ],
  defaultValue: 'kind',
}

/** A `?group=` value as a grouping, or undefined when it names none. */
export function parseContractGrouping(value: string | null | undefined): ContractGrouping | undefined {
  return CONTRACT_GROUPINGS.options.find((o) => o.value === value)?.value
}

/** The group key for "No tag" and for "Not linked to a surgeon". */
export const NO_GROUP_KEY = 'none'

/** Party kinds in the step rail's order, AA first. */
export const PARTY_KIND_ORDER: readonly PartyKind[] = ['aa', 'hospital', 'insurer', 'funder', 'surgeonGroup', 'surgeon', 'anaesthetist']

/** Pricing kinds in the catalogue's order. */
export const PRICING_KIND_ORDER: readonly PricingKind[] = ['rvgAnaesthetistRate', 'rvgContractRate', 'rvgDiscount', 'fixed', 'open']

export interface ContractGroupEntry {
  contract: Contract
  subKey: string
  subLabel: string
}

export interface ContractGroup {
  /** An id (a Party, tag or surgeon id, a kind, `none`, `patient`, `hospital:<PartyId>`, `special`): it goes in `?in=`. */
  key: string
  label: string
  /** The index's section caption (the Holder grouping's kind heading); absent for AA. */
  section?: string
  entries: ContractGroupEntry[]
}

export interface ContractGroupMasters {
  parties: Readonly<Record<PartyId, Party>>
  fundingTags: Readonly<Record<FundingTagId, FundingTag>>
  surgeons: Readonly<Record<SurgeonId, Surgeon>>
}

/** The words the groups are named with, passed in so the domain holds no copy (`shared/contracts` `CONTRACT_GROUP_WORDS`). */
export interface ContractGroupWords {
  kindPlural: Record<PartyKind, string>
  pricingKind: Record<PricingKind, string>
  /** A person's sort key ("Dr Melanie Souter" sorts as "Souter"). */
  surname: (name: string) => string
  noTag: string
  noSurgeon: string
  patient: string
  special: string
  standard: string
  prepaid: string
}

interface Placement {
  key: string
  label: string
  /** Group order: a number, then the label. */
  rank: number
  section?: string
  subKey: string
  subLabel: string
  /** Sub-heading order within the group: a number; ties keep the input's order. */
  subRank: number
}

/**
 * The Contracts grouped `by` one of the six groupings: groups in order, each
 * with its entries ordered by sub-heading and, within one, in the input's
 * order. The input is not changed.
 */
export function groupContracts(
  contracts: readonly Contract[],
  by: ContractGrouping,
  masters: ContractGroupMasters,
  words: ContractGroupWords,
): ContractGroup[] {
  const { parties, fundingTags, surgeons } = masters
  const tagOrder = new Map(fundingTagsInOrder(fundingTags).map((t, i) => [t.id, i]))
  const tagRank = (id: FundingTagId | undefined): number => (id === undefined ? Number.MAX_SAFE_INTEGER : (tagOrder.get(id) ?? tagOrder.size))
  const tagLabel = (id: FundingTagId | undefined): string => (id === undefined ? words.noTag : (fundingTags[id]?.code ?? id))
  const kindOf = (c: Contract): PartyKind => parties[c.holderId]?.kind ?? 'aa'
  const holderName = (c: Contract): string => parties[c.holderId]?.name ?? c.holderId
  // Holders as sub-headings keep the input's order (contractSearch: AA first, then by name).
  const holderSeen = new Map<PartyId, number>()
  for (const c of contracts) if (!holderSeen.has(c.holderId)) holderSeen.set(c.holderId, holderSeen.size)
  const holderSub = (c: Contract) => ({ subKey: c.holderId, subLabel: holderName(c), subRank: holderSeen.get(c.holderId) ?? 0 })

  function place(c: Contract): Placement[] {
    switch (by) {
      case 'kind': {
        const kind = kindOf(c)
        return [{ key: kind, label: words.kindPlural[kind], rank: PARTY_KIND_ORDER.indexOf(kind), ...holderSub(c) }]
      }
      case 'holder': {
        const kind = kindOf(c)
        return [
          {
            key: c.holderId,
            label: holderName(c),
            rank: PARTY_KIND_ORDER.indexOf(kind),
            ...(kind !== 'aa' ? { section: words.kindPlural[kind] } : {}),
            subKey: c.fundingTagId ?? NO_GROUP_KEY,
            subLabel: tagLabel(c.fundingTagId),
            subRank: tagRank(c.fundingTagId),
          },
        ]
      }
      case 'tag':
        return [{ key: c.fundingTagId ?? NO_GROUP_KEY, label: tagLabel(c.fundingTagId), rank: tagRank(c.fundingTagId), ...holderSub(c) }]
      case 'surgeon': {
        const linked = c.linkedSurgeonIds.filter((id, i, all) => all.indexOf(id) === i)
        if (linked.length === 0) return [{ key: NO_GROUP_KEY, label: words.noSurgeon, rank: 1, ...holderSub(c) }]
        return linked.map((id) => ({ key: id, label: surgeons[id]?.name ?? id, rank: 0, ...holderSub(c) }))
      }
      case 'destination': {
        const d = destinationOf(c, parties)
        if (d.kind === 'patient') {
          return [{ key: 'patient', label: words.patient, rank: 0, subKey: d.prepaid ? 'prepaid' : 'standard', subLabel: d.prepaid ? words.prepaid : words.standard, subRank: d.prepaid ? 1 : 0 }]
        }
        if (d.kind === 'hospital') {
          return [{ key: `hospital:${d.holderPartyId}`, label: parties[d.holderPartyId]?.name ?? d.holderPartyId, rank: 1, subKey: d.fundingTagId, subLabel: tagLabel(d.fundingTagId), subRank: tagRank(d.fundingTagId) }]
        }
        return [{ key: 'special', label: words.special, rank: 2, ...holderSub(c) }]
      }
      case 'pricing': {
        const kind = c.pricing.kind
        return [{ key: kind, label: words.pricingKind[kind], rank: PRICING_KIND_ORDER.indexOf(kind), ...holderSub(c) }]
      }
    }
  }

  type Item = ContractGroupEntry & { subRank: number; at: number }
  const groups = new Map<string, { group: ContractGroup; rank: number; sortName: string; items: Item[] }>()
  let at = 0
  for (const c of contracts) {
    for (const p of place(c)) {
      let g = groups.get(p.key)
      if (g === undefined) {
        const sortName = by === 'surgeon' && p.key !== NO_GROUP_KEY ? `${words.surname(p.label)} ${p.label}` : p.label
        g = { group: { key: p.key, label: p.label, ...(p.section !== undefined ? { section: p.section } : {}), entries: [] }, rank: p.rank, sortName, items: [] }
        groups.set(p.key, g)
      }
      g.items.push({ contract: c, subKey: p.subKey, subLabel: p.subLabel, subRank: p.subRank, at: at++ })
    }
  }
  return [...groups.values()]
    .sort((a, b) => a.rank - b.rank || a.sortName.localeCompare(b.sortName) || a.group.key.localeCompare(b.group.key))
    .map(({ group, items }) => ({
      ...group,
      entries: items
        .sort((a, b) => a.subRank - b.subRank || a.at - b.at)
        .map(({ contract, subKey, subLabel }) => ({ contract, subKey, subLabel })),
    }))
}

/** How many distinct Contracts the groups hold: the "All Contracts" count, never the sum of the groups. */
export function groupCount(groups: readonly ContractGroup[]): number {
  const ids = new Set<string>()
  for (const g of groups) for (const e of g.entries) ids.add(e.contract.id)
  return ids.size
}
