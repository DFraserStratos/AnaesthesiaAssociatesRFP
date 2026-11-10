/**
 * Invoice destinations and the open-price fallbacks (catch-up Phase 18a;
 * US-04.2.17, DM-49; AR-58 1.1, 5.2, 5.5 and 5.10 validations 6, 7 and 14).
 *
 * The one place for where a Contract sits on the step rail and for the
 * system-made fallbacks:
 * - `destinationOf`: worked out from the Contract alone, never stored. It
 *   bills the payer: **Patient** (Standard, or Prepaid). It bills a hospital
 *   holder and carries a funding tag: **that hospital and tag**. Anything
 *   else: **Special**, under its holder (D4, D7).
 * - `ensureFallbacks`: exactly one system Contract of pricing kind `open` per
 *   invoice destination, made only here. "No contract · Fixed price" and
 *   "Prepaid · Fixed price" always (held by AA), "<Hospital> · <TAG> · Fixed
 *   price" per hospital and tag, "<Holder> · Fixed price" per Special holder,
 *   for every destination an Active, non-fallback Contract implies. Idempotent;
 *   never removes, disables or renames one.
 *
 * A fallback is named "Fixed price" because a person types a fixed amount on
 * the Procedure (D8), but its kind is `open`, never `fixed`: in code it is
 * `openPriceFallback`, never a "fixed fallback" (AR-58 1.1). Phase 20's "Other
 * price" toggle picks one through `findFallback`; until then none is chosen.
 */

import type { Contract, ContractId } from '../types'
import type { FundingTag, FundingTagId } from './fundingTags'
import { normaliseAaCode } from './contracts'
import type { Party, PartyId } from './parties'

export type InvoiceDestination =
  | { kind: 'patient'; prepaid: boolean }
  | { kind: 'hospital'; holderPartyId: PartyId; fundingTagId: FundingTagId }
  | { kind: 'special'; holderPartyId: PartyId }

type Parties = Readonly<Record<PartyId, Party>>
type Tags = Readonly<Record<FundingTagId, FundingTag>>
type Contracts = Readonly<Record<ContractId, Contract>>

/** Where a Contract sits on step 1 of the step rail (AR-58 5.2), from its own settings. */
export function destinationOf(
  contract: Pick<Contract, 'billsTo' | 'prepaid' | 'holderId' | 'fundingTagId'>,
  parties: Parties,
): InvoiceDestination {
  if (contract.billsTo === 'payer') return { kind: 'patient', prepaid: contract.prepaid }
  if (parties[contract.holderId]?.kind === 'hospital' && contract.fundingTagId !== undefined) {
    return { kind: 'hospital', holderPartyId: contract.holderId, fundingTagId: contract.fundingTagId }
  }
  return { kind: 'special', holderPartyId: contract.holderId }
}

/** A destination as one stable string: `patient:standard`, `patient:prepaid`, `hospital:<party>:<tag>`, `special:<party>`. */
export function destinationKey(d: InvoiceDestination): string {
  switch (d.kind) {
    case 'patient':
      return d.prepaid ? 'patient:prepaid' : 'patient:standard'
    case 'hospital':
      return `hospital:${d.holderPartyId}:${d.fundingTagId}`
    case 'special':
      return `special:${d.holderPartyId}`
  }
}

/** "Offered under Patient", "Offered under St George's › ACC", "Offered under Special": the editor's live hint. */
export function destinationHint(d: InvoiceDestination, parties: Parties, tags: Tags): string {
  switch (d.kind) {
    case 'patient':
      return d.prepaid ? 'Offered under Patient › Prepaid' : 'Offered under Patient'
    case 'hospital':
      return `Offered under ${parties[d.holderPartyId]?.name ?? 'its hospital'} › ${tags[d.fundingTagId]?.code ?? 'its tag'}`
    case 'special':
      return 'Offered under Special'
  }
}

/** Whether a Contract is one of the system-made open-price fallbacks. */
export function isOpenPriceFallback(contract: Pick<Contract, 'systemRole'>): boolean {
  return contract.systemRole === 'openPriceFallback'
}

/** The office's own Contracts: every Contract but the open-price fallbacks. Counts and "this holder's Contracts" read it. */
export function isOfficeContract(contract: Pick<Contract, 'systemRole'>): boolean {
  return !isOpenPriceFallback(contract)
}

/**
 * Whether a Procedure may be put on this Contract today: never an open-price
 * Contract (it has no price of its own; Phase 20's "Other price" picks one
 * with the amount typed). The store applies it on every path that sets a
 * Procedure's Contract.
 */
export function contractChoosableForProcedure(contract: Pick<Contract, 'pricing'>): boolean {
  return contract.pricing.kind !== 'open'
}

export const OPEN_PRICE_NOT_CHOSEN_MESSAGE = 'That Contract has no price of its own. Choose a priced Contract.'

/** The one AA Party (exactly one exists; Phase 18's Party guard). */
function aaPartyId(parties: Parties): PartyId {
  const aa = Object.values(parties).find((p) => p.kind === 'aa')
  if (aa === undefined) throw new Error('No AA Party: the Patient fallbacks have no holder')
  return aa.id
}

/** The fallback's name (AR-58 5.5, D8), from the Party's short name and the tag's code. */
export function fallbackNameFor(d: InvoiceDestination, parties: Parties, tags: Tags): string {
  switch (d.kind) {
    case 'patient':
      return d.prepaid ? 'Prepaid · Fixed price' : 'No contract · Fixed price'
    case 'hospital':
      return `${parties[d.holderPartyId]?.name ?? d.holderPartyId} · ${tags[d.fundingTagId]?.code ?? d.fundingTagId} · Fixed price`
    case 'special':
      return `${parties[d.holderPartyId]?.name ?? d.holderPartyId} · Fixed price`
  }
}

/** The fallback's AA code stem: `AA-FIX`, `AA-PRE`, `STG-ACC-FIX`, `NIB-FIX`. */
function fallbackCodeStem(d: InvoiceDestination, parties: Parties, tags: Tags): string {
  switch (d.kind) {
    case 'patient':
      return d.prepaid ? 'AA-PRE' : 'AA-FIX'
    case 'hospital': {
      const tag = (tags[d.fundingTagId]?.code ?? 'TAG').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      return `${parties[d.holderPartyId]?.codePrefix ?? 'HOSP'}-${tag}-FIX`
    }
    case 'special':
      return `${parties[d.holderPartyId]?.codePrefix ?? 'HOLD'}-FIX`
  }
}

/** The stem when free, else `<stem>-2`, `<stem>-3`: unique across every Contract (validation 1). */
function uniqueCode(stem: string, taken: Set<string>): string {
  if (!taken.has(normaliseAaCode(stem))) return stem
  for (let n = 2; ; n++) {
    const code = `${stem}-${n}`
    if (!taken.has(normaliseAaCode(code))) return code
  }
}

/**
 * The open-price fallback for a destination: held by its holder (AA for both
 * Patient ones), billing the payer (Patient) or the holder, prepaid only on
 * Prepaid, the tag only on a hospital one (a Special one carries none even
 * when its holder's Contracts do), no specialties, no links, Active.
 */
export function openPriceFallback(
  d: InvoiceDestination,
  fields: { id: ContractId; aaCode: string; parties: Parties; tags: Tags },
): Contract {
  return {
    id: fields.id,
    aaCode: fields.aaCode,
    name: fallbackNameFor(d, fields.parties, fields.tags),
    holderId: d.kind === 'patient' ? aaPartyId(fields.parties) : d.holderPartyId,
    billsTo: d.kind === 'patient' ? 'payer' : 'holder',
    linkedSurgeonIds: [],
    prepaid: d.kind === 'patient' && d.prepaid,
    anaesthetistMayOverridePrice: false,
    pricing: { kind: 'open' },
    status: 'active',
    systemRole: 'openPriceFallback',
    permitsRateTime: false,
    specialtyIds: [],
    ...(d.kind === 'hospital' ? { fundingTagId: d.fundingTagId } : {}),
  }
}

/** The two Patient destinations, which always have their fallback. */
export const PATIENT_DESTINATIONS: readonly InvoiceDestination[] = [
  { kind: 'patient', prepaid: false },
  { kind: 'patient', prepaid: true },
]

/**
 * Every destination that needs a fallback, in key order: the two Patient ones,
 * then each implied by an Active, non-fallback Contract.
 */
export function impliedDestinations(contracts: Contracts, parties: Parties): InvoiceDestination[] {
  const byKey = new Map<string, InvoiceDestination>()
  for (const d of PATIENT_DESTINATIONS) byKey.set(destinationKey(d), d)
  for (const c of Object.values(contracts)) {
    if (c.status !== 'active' || isOpenPriceFallback(c)) continue
    const d = destinationOf(c, parties)
    byKey.set(destinationKey(d), d)
  }
  return [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, d]) => d)
}

/** The fallback for a destination, if it exists. Phase 20's "Other price" toggle reads it. */
export function findFallback(contracts: Contracts, d: InvoiceDestination, parties: Parties): Contract | undefined {
  const key = destinationKey(d)
  return Object.values(contracts).find((c) => isOpenPriceFallback(c) && destinationKey(destinationOf(c, parties)) === key)
}

/**
 * Keep the fallbacks in step (AR-58 5.5): add the missing one for every
 * destination `impliedDestinations` names, never removing, disabling or
 * renaming one. Idempotent: a second run creates none. `newId` gives each new
 * fallback its id (the seed derives it from the destination key; the store
 * allocates `CTN###`), called once per fallback in key order.
 */
export function ensureFallbacks(
  contracts: Contracts,
  parties: Parties,
  tags: Tags,
  newId: (d: InvoiceDestination, key: string) => ContractId,
): { contracts: Record<ContractId, Contract>; created: Contract[] } {
  const have = new Set<string>()
  for (const c of Object.values(contracts)) {
    if (isOpenPriceFallback(c)) have.add(destinationKey(destinationOf(c, parties)))
  }
  const taken = new Set(Object.values(contracts).map((c) => normaliseAaCode(c.aaCode)))
  const next: Record<ContractId, Contract> = { ...contracts }
  const created: Contract[] = []
  for (const d of impliedDestinations(contracts, parties)) {
    const key = destinationKey(d)
    if (have.has(key)) continue
    const aaCode = uniqueCode(fallbackCodeStem(d, parties, tags), taken)
    taken.add(normaliseAaCode(aaCode))
    const fallback = openPriceFallback(d, { id: newId(d, key), aaCode, parties, tags })
    next[fallback.id] = fallback
    created.push(fallback)
    have.add(key)
  }
  return { contracts: next, created }
}

/** The seed's fallback id for a destination: `CT-FIX-<key>`, deterministic. */
export function seedFallbackId(key: string): ContractId {
  return `CT-FIX-${key.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase()}`
}
