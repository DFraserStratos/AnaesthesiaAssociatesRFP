/**
 * The flat Contract (catch-up Phase 18; US-04.1.1, US-04.1.2, US-04.1.4,
 * US-04.2.1, DM-07; AR-58 sections 2.2, 2.3, 5.5 and 5.10, AR-61 `#contract`,
 * `#pricing-kind`, `#linked-practitioners`, `#who-is-billed`).
 *
 * A Contract is one priced item: no type, no parent schedule, no lines, no
 * versions and no dates (D77). It is edited in place with an audit, never
 * deleted, and Active or Disabled. The model and every rule about it live
 * here, behind the types the UI reads: the save guards (`contractRefusal`),
 * the AA code generator (`nextAaCode`), the search matcher (`contractSearch`),
 * where a Contract is offered (`linkFits`), the No contract · RVG lookup
 * (`noContractRvg`), the pricing-kind reads (`isRvgKind`) and the interim
 * bridges to today's billing route (`interimRouteContract`, with the Party
 * module's `routeCounterpartyForParty`).
 *
 * Our readings, built and logged (AR-58 11.1):
 * - A36: the pricing kind is set at creation; a kind change is a new Contract.
 * - A40: a Contract held by AA or an anaesthetist always bills the payer.
 * - A38, A39: a hospital-held Contract carries no links and is offered on its
 *   hospital's Lists; a surgeon-, surgeon-group- or anaesthetist-held one
 *   needs a link; an unlinked AA, insurer or funder Contract is offered on
 *   every List.
 * - A18: the override setting is seeded on No contract · RVG only.
 */

import type { AnaesthetistId, ContractId, ContractPrice, HospitalId, Procedure, SurgeonId } from '../types'
import type { Party, PartyId, PartyKind } from './parties'
import { billingDetailsRefusal } from './parties'
import type { SpecialtyId } from '../specialties'
import type { FundingTagId } from './fundingTags'

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

/** AR-58 2.3: the five pricing kinds. */
export type PricingKind = 'rvgAnaesthetistRate' | 'rvgContractRate' | 'rvgDiscount' | 'fixed' | 'open'

/**
 * AR-58 2.3 `pricing`. The rate and the discount are undated settings: a
 * change is an audited edit in place, and a change that must start on a date
 * is a new Contract. `fixed` prices through the interim `ContractPrice` rows
 * until Phase 19a gives it price ranges. `open` has no price of its own; only
 * the system fallbacks (Phase 18a) use it, and the office never chooses it (A3).
 */
export type ContractPricing =
  | { kind: 'rvgAnaesthetistRate' }
  | { kind: 'rvgContractRate'; unitRate: number }
  | { kind: 'rvgDiscount'; discountPct: number }
  | { kind: 'fixed' }
  | { kind: 'open' }

export type ContractStatus = 'active' | 'disabled'
/** The two system roles (AR-58 5.5): the one No contract · RVG, and every open-price fallback. */
export type SystemRole = 'noContractRvg' | 'openPriceFallback'

/**
 * The fields the office may change on a system Contract (AR-58 validation
 * 14): its name and AA code. Phase 19a adds the invoice description. The one
 * list; the save guard and the editor both read it.
 */
export const SYSTEM_CONTRACT_EDITABLE_FIELDS = ['name', 'aaCode'] as const satisfies readonly (keyof Contract)[]
export type BillsTo = 'holder' | 'payer'

export interface Contract {
  id: ContractId
  /** AR-58 `aaCode`: AA's own unique code (OQ-66, US-04.1.4), from `nextAaCode`; the office may edit it, still unique. */
  aaCode: string
  /** AR-58 `holderReference`: the holder's own code for the item; searchable, not unique (A23). */
  holderReference?: string
  /** AR-58 `name`: what lists and the picker show. */
  name: string
  /** AR-58 `holderId`: the Party that holds it; fixed after creation. */
  holderId: PartyId
  /**
   * AR-58 `billsTo`: its holder, or the payer on the Booking (D2, US-04.2.1).
   * Stored here; Phase 21 acts on it. Until then the billing route still
   * decides the counterparty and no billing path reads it.
   */
  billsTo: BillsTo
  /** AR-58 `linkedSurgeonIds`: surgeons whose Lists it is offered on (OQ-105: individual surgeons, never rooms). */
  linkedSurgeonIds: SurgeonId[]
  /** AR-58 `linkedAnaesthetistId`: at most one, for an anaesthetist's own price list. */
  linkedAnaesthetistId?: AnaesthetistId
  /** AR-58 `prepaid`: fixed for the Contract's life (D4, OQ-25). Phase 27 acts on it. */
  prepaid: boolean
  /** AR-58 `anaesthetistMayOverridePrice`: only on an RVG pricing kind (D50 extended, OQ-96, OQ-117). Phase 24 acts on it. */
  anaesthetistMayOverridePrice: boolean
  /** AR-58 `pricing`: the kind is fixed after creation (A36). */
  pricing: ContractPricing
  /** AR-58 `status`: a Disabled Contract leaves the default list; a Procedure already on it keeps it and bills as normal (D81). */
  status: ContractStatus
  /**
   * AR-58 `systemRole`: a system Contract, found by role, never by name
   * (OQ-78): the one No contract · RVG, or an open-price fallback that
   * `ensureFallbacks` makes (one per invoice destination, Phase 18a). The
   * office never sets it; a system Contract changes only the fields in
   * `SYSTEM_CONTRACT_EDITABLE_FIELDS` and is never disabled.
   */
  systemRole?: SystemRole
  /**
   * AR-58 `specialtyIds` (US-04.2.16, Phase 18a): the specialties it is offered
   * for; empty means every specialty. Phase 20's filter reads it through
   * `contractFitsSpecialties`.
   */
  specialtyIds: SpecialtyId[]
  /**
   * AR-58 `fundingTagId` (US-04.2.17, Phase 18a): at most one tag from AA's list.
   * With `billsTo` it decides where the Contract sits (`destinationOf`).
   */
  fundingTagId?: FundingTagId
  /**
   * Ours, INTERIM until Phase 24: today's Method 3 gate (rate x time capture is
   * offered only under a Contract carrying it, 5th review #1). Phase 24 removes it.
   */
  permitsRateTime: boolean
}

/** The kinds priced from RVG units, the only ones that can carry the anaesthetist's override. */
export function isRvgKind(kind: PricingKind): boolean {
  return kind === 'rvgAnaesthetistRate' || kind === 'rvgContractRate' || kind === 'rvgDiscount'
}

/** The kinds the office can choose for a new Contract: never open price (A3). */
export const CHOOSABLE_PRICING_KINDS: readonly PricingKind[] = ['rvgAnaesthetistRate', 'rvgContractRate', 'rvgDiscount', 'fixed']

/** A40 and D23: a Contract held by AA or an anaesthetist, or a prepaid one, always bills the payer. */
export function billsPayerOnly(holderKind: PartyKind | undefined, prepaid: boolean): boolean {
  return prepaid || holderKind === 'aa' || holderKind === 'anaesthetist'
}

/** A38: a hospital-held Contract links no surgeon or anaesthetist; every other holder may (and some must, A39). */
export function takesLinks(holderKind: PartyKind | undefined): boolean {
  return holderKind !== undefined && holderKind !== 'hospital'
}

/** The one built-in (RV-06, OQ-78): exactly one Contract carries the role. */
export function noContractRvg(contracts: Readonly<Record<string, Contract>>): Contract {
  const found = Object.values(contracts).filter((c) => c.systemRole === 'noContractRvg')
  if (found.length !== 1) throw new Error(`Expected exactly one No contract · RVG, found ${found.length}`)
  return found[0]!
}

// ---------------------------------------------------------------------------
// The AA code (US-04.1.4, OQ-66)
// ---------------------------------------------------------------------------

/**
 * The next AA code for a holder's code prefix: `<prefix>-<nnn>`, the next free
 * number for that prefix over every Contract (nothing is deleted, so nothing
 * is reused). The one generator; Phase 18a may add a tag segment.
 */
export function nextAaCode(prefix: string, existingCodes: Iterable<string>): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`)
  let max = 0
  for (const code of existingCodes) {
    // Compared as uniqueness compares them, so an edited "CES- 002" still counts.
    const m = pattern.exec(normaliseAaCode(code))
    if (m !== null) max = Math.max(max, Number(m[1]))
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

// ---------------------------------------------------------------------------
// Save guards (AR-58 5.10 items 1, 3 to 6 and 8 to 14)
// ---------------------------------------------------------------------------

export type ContractRefusalCode =
  | 'nameRequired'
  | 'aaCodeRequired'
  | 'aaCodeTaken'
  | 'holderMissing'
  | 'holderFixed'
  | 'rateAboveZero'
  | 'discountRange'
  | 'openNotChosen'
  | 'systemRoleNotChosen'
  | 'prepaidBillsPayer'
  | 'prepaidNotRvg'
  | 'overrideOnlyRvg'
  | 'holderBillsPayer'
  | 'holderBillingDetails'
  | 'noLinksOnHospital'
  | 'linkRequired'
  | 'linkUnknown'
  | 'prepaidFixed'
  | 'pricingKindFixed'
  | 'systemFixed'
  | 'systemNeverDisabled'
  | 'specialtyUnknown'
  | 'fundingTagUnknown'

export const CONTRACT_REFUSAL_MESSAGES: Record<ContractRefusalCode, string> = {
  nameRequired: 'A Contract needs a name.',
  aaCodeRequired: 'A Contract needs an AA code.',
  aaCodeTaken: 'Another Contract already has this AA code.',
  holderMissing: 'Choose the Party that holds this Contract.',
  holderFixed: "A Contract's holder cannot change once it is created.",
  rateAboveZero: 'The rate must be above zero.',
  discountRange: 'The discount must be above 0% and below 100%.',
  openNotChosen: 'Open price is only for the system fallbacks; choose another pricing kind.',
  prepaidBillsPayer: 'A prepaid Contract always bills the payer.',
  prepaidNotRvg: 'A prepaid Contract cannot be priced from RVG units; use a fixed price.',
  overrideOnlyRvg: 'Only a Contract priced from RVG units can let the anaesthetist override its price.',
  holderBillsPayer: 'A Contract held by AA or an anaesthetist always bills the payer.',
  holderBillingDetails: "The holder needs a billing name and delivery details before a Contract can bill it. Add them in Parties.",
  noLinksOnHospital: "A hospital's Contract is offered on that hospital's Lists, so it links no surgeon or anaesthetist.",
  linkRequired: 'A Contract held by a surgeon, surgeon group or anaesthetist needs at least one linked surgeon or anaesthetist.',
  linkUnknown: 'A linked surgeon or anaesthetist could not be found.',
  prepaidFixed: 'Prepaid is set when the Contract is created and cannot change.',
  pricingKindFixed: 'The pricing kind is set when the Contract is created and cannot change.',
  systemRoleNotChosen: 'Only the system makes No contract · RVG and the Fixed price Contracts.',
  systemFixed: 'Only the name and AA code of a system Contract can change.',
  systemNeverDisabled: 'A system Contract is always available and cannot be disabled.',
  specialtyUnknown: 'A specialty on this Contract is not on the list.',
  fundingTagUnknown: 'That funding tag is not on the list.',
}

export interface ContractRefusal {
  code: ContractRefusalCode
  message: string
}

const refusal = (code: ContractRefusalCode): ContractRefusal => ({ code, message: CONTRACT_REFUSAL_MESSAGES[code] })

export interface ContractRefusalContext {
  /** The Contract as stored before this save; absent on create. */
  prev?: Contract
  parties: Readonly<Record<PartyId, Party>>
  /** Every Contract, for the AA code's uniqueness. */
  contracts: Readonly<Record<ContractId, Contract>>
  surgeonIds: ReadonlySet<SurgeonId>
  anaesthetistIds: ReadonlySet<AnaesthetistId>
  /** AA's specialties and funding tags (validation 9, Phase 18a). */
  specialtyIds: ReadonlySet<SpecialtyId>
  fundingTagIds: ReadonlySet<FundingTagId>
}

/**
 * The first save guard a Contract breaks, or null. The only rule source: the
 * store applies it on every create, edit, disable and enable, so a raw patch
 * can never change `prepaid`, the pricing kind or the holder after creation.
 */
export function contractRefusal(next: Contract, ctx: ContractRefusalContext): ContractRefusal | null {
  const prev = ctx.prev

  // 14: a system Contract changes only the allowed fields, and is never disabled.
  const system = prev?.systemRole !== undefined
  if (system) {
    if (next.status !== 'active') return refusal('systemNeverDisabled')
    if (JSON.stringify(sortKeys(withoutEditable(next))) !== JSON.stringify(sortKeys(withoutEditable(prev)))) return refusal('systemFixed')
  } else if (next.systemRole !== undefined) {
    return refusal('systemRoleNotChosen')
  }

  if (next.name.trim() === '') return refusal('nameRequired')
  // 1: the AA code is unique.
  if (next.aaCode.trim() === '') return refusal('aaCodeRequired')
  const code = normaliseAaCode(next.aaCode)
  if (Object.values(ctx.contracts).some((c) => c.id !== next.id && normaliseAaCode(c.aaCode) === code)) {
    return refusal('aaCodeTaken')
  }
  // Nothing else on a system Contract can have changed, so its other rules hold as made.
  if (system) return null

  // 13: holder, prepaid and pricing kind are fixed after creation.
  if (prev !== undefined) {
    if (prev.holderId !== next.holderId) return refusal('holderFixed')
    if (prev.prepaid !== next.prepaid) return refusal('prepaidFixed')
    if (prev.pricing.kind !== next.pricing.kind) return refusal('pricingKindFixed')
  }

  // 8: the holder exists.
  const holder = ctx.parties[next.holderId]
  if (holder === undefined) return refusal('holderMissing')

  // 6: open price exists only on the system fallbacks; the office never chooses it.
  if (next.pricing.kind === 'open') return refusal('openNotChosen')
  // 9: its specialties and tag are on AA's lists.
  if (next.specialtyIds.some((id) => !ctx.specialtyIds.has(id))) return refusal('specialtyUnknown')
  if (next.fundingTagId !== undefined && !ctx.fundingTagIds.has(next.fundingTagId)) return refusal('fundingTagUnknown')
  // 3: the rate above zero, the discount between 0 and 100.
  if (next.pricing.kind === 'rvgContractRate' && !(next.pricing.unitRate > 0)) return refusal('rateAboveZero')
  if (next.pricing.kind === 'rvgDiscount' && !(next.pricing.discountPct > 0 && next.pricing.discountPct < 100)) {
    return refusal('discountRange')
  }

  // 4: prepaid bills the payer (D23, OQ-73 at Confirm) and is never priced from RVG units.
  if (next.prepaid && isRvgKind(next.pricing.kind)) return refusal('prepaidNotRvg')
  if (next.prepaid && next.billsTo !== 'payer') return refusal('prepaidBillsPayer')
  // 5: the override exists only on RVG kinds (so never on a fixed price or a prepaid Contract).
  if (next.anaesthetistMayOverridePrice && !isRvgKind(next.pricing.kind)) return refusal('overrideOnlyRvg')

  // 10: AA and anaesthetist holders bill the payer (A40).
  if (billsPayerOnly(holder.kind, false) && next.billsTo !== 'payer') return refusal('holderBillsPayer')
  // 8: a billed holder has its billing details (A43).
  if (next.billsTo === 'holder' && billingDetailsRefusal(holder) !== null) return refusal('holderBillingDetails')

  // 9, 11, 12: links.
  const linked = next.linkedSurgeonIds.length + (next.linkedAnaesthetistId !== undefined ? 1 : 0)
  if (
    next.linkedSurgeonIds.some((id) => !ctx.surgeonIds.has(id)) ||
    (next.linkedAnaesthetistId !== undefined && !ctx.anaesthetistIds.has(next.linkedAnaesthetistId))
  ) {
    return refusal('linkUnknown')
  }
  if (!takesLinks(holder.kind) && linked > 0) return refusal('noLinksOnHospital')
  if ((holder.kind === 'surgeon' || holder.kind === 'surgeonGroup' || holder.kind === 'anaesthetist') && linked === 0) {
    return refusal('linkRequired')
  }
  return null
}

function withoutEditable(c: Contract): Record<string, unknown> {
  const rest: Record<string, unknown> = { ...c }
  for (const k of SYSTEM_CONTRACT_EDITABLE_FIELDS) delete rest[k]
  return rest
}

function sortKeys(o: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(o)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)),
  )
}

/** AA codes compare without case or spaces. */
export function normaliseAaCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase()
}

// ---------------------------------------------------------------------------
// Search (US-04.1.2 filters, US-04.1.4 finding by code)
// ---------------------------------------------------------------------------

export type ContractStatusFilter = 'active' | 'disabled' | 'all'

export interface ContractFilters {
  /** Active by default (US-04.1.2). */
  status?: ContractStatusFilter
  holderId?: PartyId
  /** Only Contracts carrying this funding tag (Phase 18a), fallbacks included. */
  fundingTagId?: FundingTagId
}

const squash = (s: string): string => s.replace(/\s+/g, '').toLowerCase()

/**
 * True when the query is in the Contract's name, holder reference code or AA
 * code, ignoring case and spaces. 19a adds the invoice description and the
 * default RVG code.
 */
export function contractMatchesQuery(contract: Contract, query: string): boolean {
  const q = squash(query)
  if (q === '') return true
  return [contract.name, contract.holderReference ?? '', contract.aaCode].some((field) => squash(field).includes(q))
}

/**
 * The Contract list: the query and filters applied, No contract · RVG first,
 * then by holder (AA first, then the holder's name), each holder's open-price
 * fallbacks after its own Contracts, then AA code.
 */
export function contractSearch(
  query: string,
  { contracts, parties, filters = {} }: { contracts: Readonly<Record<string, Contract>>; parties: Readonly<Record<string, Party>>; filters?: ContractFilters },
): Contract[] {
  const status = filters.status ?? 'active'
  const holderRank = (c: Contract): string => {
    const holder = parties[c.holderId]
    return holder?.kind === 'aa' ? '0' : `1${holder?.name ?? c.holderId}`
  }
  return Object.values(contracts)
    .filter((c) => status === 'all' || c.status === status)
    .filter((c) => filters.holderId === undefined || c.holderId === filters.holderId)
    .filter((c) => filters.fundingTagId === undefined || c.fundingTagId === filters.fundingTagId)
    .filter((c) => contractMatchesQuery(c, query))
    .sort(
      (a, b) =>
        Number(b.systemRole === 'noContractRvg') - Number(a.systemRole === 'noContractRvg') ||
        holderRank(a).localeCompare(holderRank(b)) ||
        // A holder's open-price fallbacks after its own Contracts.
        Number(a.systemRole === 'openPriceFallback') - Number(b.systemRole === 'openPriceFallback') ||
        a.aaCode.localeCompare(b.aaCode),
    )
}

// ---------------------------------------------------------------------------
// Where a Contract is offered (US-04.2.1; A38, A39)
// ---------------------------------------------------------------------------

/**
 * Whether a Contract is offered on a Booking's List: a hospital-held Contract
 * only on its hospital's Lists; a linked Contract on its surgeons' or its
 * anaesthetist's; an unlinked AA, insurer or funder Contract everywhere.
 * Specialties are 18a's. Phase 20's candidates call it; nothing here does.
 */
export function linkFits(
  contract: Contract,
  holder: Party | undefined,
  at: { hospitalId?: HospitalId; surgeonId?: SurgeonId; anaesthetistId?: AnaesthetistId },
): boolean {
  if (holder === undefined) return false
  if (holder.kind === 'hospital') return holder.hospitalId !== undefined && holder.hospitalId === at.hospitalId
  const linked = contract.linkedSurgeonIds.length > 0 || contract.linkedAnaesthetistId !== undefined
  if (!linked) return holder.kind === 'aa' || holder.kind === 'insurer' || holder.kind === 'funder'
  return (
    (at.surgeonId !== undefined && contract.linkedSurgeonIds.includes(at.surgeonId)) ||
    (at.anaesthetistId !== undefined && contract.linkedAnaesthetistId === at.anaesthetistId)
  )
}

// ---------------------------------------------------------------------------
// Interim bridges to today's billing route
// ---------------------------------------------------------------------------

/**
 * INTERIM until Phase 20: with nothing stored on the hospital or insurer
 * route, a Procedure bills under that Party's plain RVG Contract (RVG at the
 * anaesthetist's rate, not a system Contract, no links), the first Active one
 * by AA code, else a Disabled one (a Disabled Contract still bills, D81).
 * Phase 20's step rail replaces the route and this lookup.
 */
export function interimRouteContract(
  contracts: Readonly<Record<string, Contract>>,
  partyId: PartyId | undefined,
): Contract | undefined {
  if (partyId === undefined) return undefined
  return Object.values(contracts)
    .filter(
      (c) =>
        c.holderId === partyId &&
        c.systemRole === undefined &&
        c.pricing.kind === 'rvgAnaesthetistRate' &&
        c.linkedSurgeonIds.length === 0 &&
        c.linkedAnaesthetistId === undefined,
    )
    .sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active') || a.aaCode.localeCompare(b.aaCode))[0]
}

/** The sentence when the route's Party has no plain RVG Contract (INTERIM until Phase 20): the resolver's and the validator's. */
export function noRouteContractMessage(partyName: string): string {
  return `No Contract is chosen and ${partyName} has no plain RVG Contract to bill under. Choose a Contract in the office billing setup.`
}

/** The interim of Phase 19a's "no range in force": one sentence, the resolver's and the validator's. */
export function noPriceInForceMessage(contractName: string): string {
  return `No price in force for this procedure under ${contractName}.`
}

/**
 * True when a primary (not additional) Procedure is on a fixed-price Contract
 * with no interim price row for it, or any Procedure is on an open-price one. An additional procedure keeps the
 * 2026-07-22 fallback to time units; the fee calculator is unchanged.
 */
export function noPriceInForce(
  contract: Contract,
  procedure: Procedure,
  q: { procedureOrdinal: number; prices: readonly ContractPrice[]; surgeonId?: string },
): boolean {
  // An open-price Contract has no price of its own (catch-up Phase 18a): until
  // Phase 20 types an amount on the Procedure, nothing bills one silently.
  if (contract.pricing.kind === 'open') return true
  if (contract.pricing.kind !== 'fixed' || procedure.isAdditional) return false
  return (
    matchContractPrice(q.prices, {
      contractId: contract.id,
      ...(procedure.rvgGroupId !== undefined ? { rvgGroupId: procedure.rvgGroupId } : {}),
      ...(q.surgeonId !== undefined ? { surgeonId: q.surgeonId } : {}),
      procedureOrdinal: q.procedureOrdinal,
    }) === undefined
  )
}

// ---------------------------------------------------------------------------
// Fixed-price rows (INTERIM until Phase 19a's price ranges)
// ---------------------------------------------------------------------------

export interface ContractPriceQuery {
  contractId: string
  rvgGroupId?: string
  surgeonId?: string
  /** 1-based position of the procedure on its Booking. */
  procedureOrdinal?: number
}

/**
 * Most-specific-match-wins: a price row matches when every key IT specifies
 * equals the query's value (an unspecified key on the row matches anything);
 * among matches, the row specifying the most keys wins; ties resolve to the
 * first in input order. Returns undefined when nothing matches: the fee then
 * falls back to the BTM path (Decisions log 2026-07-22).
 */
export function matchContractPrice(
  prices: readonly ContractPrice[],
  query: ContractPriceQuery,
): ContractPrice | undefined {
  let best: ContractPrice | undefined
  let bestSpecificity = -1

  for (const price of prices) {
    if (price.contractId !== query.contractId) continue

    let specificity = 0
    if (price.rvgGroupId !== undefined) {
      if (price.rvgGroupId !== query.rvgGroupId) continue
      specificity++
    }
    if (price.surgeonId !== undefined) {
      if (price.surgeonId !== query.surgeonId) continue
      specificity++
    }
    if (price.procedureOrdinal !== undefined) {
      if (price.procedureOrdinal !== query.procedureOrdinal) continue
      specificity++
    }

    if (specificity > bestSpecificity) {
      best = price
      bestSpecificity = specificity
    }
  }

  return best
}
