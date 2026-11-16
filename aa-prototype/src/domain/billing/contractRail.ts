/**
 * The step rail (catch-up Phase 20; US-04.3.8, US-04.3.9, US-04.3.2, US-04.3.3,
 * US-03.4.1, FT-03.4): the one decision that prices a Procedure. Every rule
 * about choosing a Procedure's Contract lives here, behind the types the UI
 * reads; the `ContractRail` component draws it and nothing else knows the step
 * order.
 *
 * References: the contract model proposal, AR-58 sections 5.1 to 5.4 and 6
 * (candidates for a List L415-431, the step rail L433-479, the open-price
 * fallbacks L481-502); the flat ERD, AR-61#invoice-destination (where a
 * Contract's invoice goes, worked out from its own settings, never stored);
 * and Ben's invoice decision tree, AR-62.
 *
 *   1. "Where does the invoice go?" Patient, the List's hospital, or Special,
 *      each with its count. A Contract that bills the payer is Patient; one
 *      that bills a hospital holder and carries a funding tag is that
 *      hospital; anything else is Special (18a's `destinationOf`).
 *   2. Then narrow it down: under Patient "Payment type" (Standard, then
 *      Prepaid; never Prepaid for the anaesthetist), under the hospital its
 *      funding tags in AA's list order, under Special the Contracts' holders.
 *   3. The Contract, typed to search over the candidates only. No contract ·
 *      RVG is pinned first under Patient › Standard and never searched away;
 *      no RVG kind is ever under Prepaid. "Other price" picks the
 *      destination's open-price fallback, its amount typed on the Procedure.
 *
 * A step with one answer fills itself in; a step with no rows fills in the
 * fallback. Until a Contract is chosen the answers so far ride on the
 * Procedure (`railAnswers`).
 *
 * Candidates (US-04.3.2): Active; held by the List's hospital, or linked to
 * its surgeon or anaesthetist, or unlinked and held by AA, an insurer or a
 * funder (18's `linkFits`, A38, A39); specialties overlapping the List
 * surgeon's or none (18a, A10); a fixed price with a range in force on the
 * List's date (19a, A9). Insurance never narrows (D28). No "show all".
 */

import type { AnaesthetistId, ContractId, HospitalId, Procedure, RailAnswers, SurgeonId } from '../types'
import type { Specialty } from '../specialties'
import { contractFitsSpecialties } from '../specialties'
import { contractMatchesQuery, isRvgKind, linkFits, noContractRvg, type Contract } from './contracts'
import { destinationKey, destinationOf, findFallback, findRvgFallback, type InvoiceDestination } from './fallbacks'
import { fundingTagForFunder, fundingTagsInOrder, type FundingTag, type FundingTagId } from './fundingTags'
import type { Party, PartyId } from './parties'
import { rangeInForce } from './priceRanges'
import { fillFromContract } from './startingValues'
import type { RvgGroup, RvgGroupId } from './rvgGroups'

export { destinationOf, destinationKey, type InvoiceDestination }

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** The masters the rail reads. */
export interface RailMasters {
  contracts: Readonly<Record<ContractId, Contract>>
  parties: Readonly<Record<PartyId, Party>>
  fundingTags: Readonly<Record<FundingTagId, FundingTag>>
  rvgGroups: Readonly<Record<RvgGroupId, RvgGroup>>
  surgeons: Readonly<Record<SurgeonId, { specialtyIds: readonly Specialty['id'][] }>>
}

/** The List a Procedure sits on: its date, billing hospital, surgeon and anaesthetist. */
export interface RailContext {
  listDateISO: string
  /** The List's billing hospital (`listHospitalFor`: AA rooms is never a holder). */
  hospitalId?: HospitalId
  surgeonId?: SurgeonId
  anaesthetistId?: AnaesthetistId
  /**
   * The Booking's insurer or funder (catch-up Phase 21, US-04.3.10): read only
   * by `suggestedPathFor`, which marks one path "Suggested". It never changes
   * the candidates, their order or which step fills itself in.
   */
  funderPartyId?: PartyId
}

/** Who is on the rail: the office, or the anaesthetist on their own List (FT-03.4). */
export type RailActor = 'office' | 'anaesthetist'

// ---------------------------------------------------------------------------
// Candidates (US-04.3.2)
// ---------------------------------------------------------------------------

/** The List's hospital as a Party, if it holds any. */
export function listHospitalParty(parties: RailMasters['parties'], hospitalId: HospitalId | undefined): Party | undefined {
  if (hospitalId === undefined) return undefined
  return Object.values(parties).find((p) => p.kind === 'hospital' && p.hospitalId === hospitalId)
}

/**
 * Every rule but the search: the one predicate the store's guard and every step share.
 * `anyStatus` switches the status test off (catch-up Phase 21a's review flag
 * "Contract not offered on this List": a Disabled Contract already on a
 * Procedure fits by its other rules and raises no flag, D81, OQ-135).
 */
export function isContractCandidate(masters: RailMasters, ctx: RailContext, contract: Contract, opts: { anyStatus?: boolean } = {}): boolean {
  if (opts.anyStatus !== true && contract.status !== 'active') return false
  // No contract · RVG is pinned, and the fallbacks are reached only through
  // "Other price": neither is ever a row (US-04.3.3, US-04.3.9).
  if (contract.systemRole !== undefined) return false
  if (!linkFits(contract, masters.parties[contract.holderId], ctx)) return false
  const surgeonSpecialties = ctx.surgeonId !== undefined ? (masters.surgeons[ctx.surgeonId]?.specialtyIds ?? []) : []
  if (!contractFitsSpecialties(contract.specialtyIds, surgeonSpecialties)) return false
  if (contract.pricing.kind === 'fixed' && rangeInForce(contract, ctx.listDateISO) === null) return false
  return true
}

/** The holder's name for ordering: AA first, then by name. */
function holderRank(parties: RailMasters['parties'], c: Contract): string {
  const holder = parties[c.holderId]
  return holder?.kind === 'aa' ? '0' : `1${holder?.name ?? c.holderId}`
}

function byRailOrder(parties: RailMasters['parties']) {
  return (a: Contract, b: Contract): number =>
    holderRank(parties, a).localeCompare(holderRank(parties, b)) || a.name.localeCompare(b.name) || a.aaCode.localeCompare(b.aaCode)
}

/**
 * The Contracts offered on a List (US-04.3.2), in a fixed order: by holder (AA
 * first), then name, then AA code. With a query, one search over the name,
 * holder reference code, invoice description, AA code and default RVG code
 * (18's matcher), over the candidates only, never the catalogue.
 */
export function contractCandidatesFor(masters: RailMasters, ctx: RailContext, opts: { query?: string } = {}): Contract[] {
  const query = opts.query ?? ''
  return Object.values(masters.contracts)
    .filter((c) => isContractCandidate(masters, ctx, c))
    .filter((c) => contractMatchesQuery(c, query, masters.rvgGroups))
    .sort(byRailOrder(masters.parties))
}

// ---------------------------------------------------------------------------
// Destinations and their fallbacks (US-04.3.9)
// ---------------------------------------------------------------------------

/** The destination a full set of answers names, or undefined while step 2 is open. */
export function destinationForAnswers(
  masters: RailMasters,
  ctx: RailContext,
  answers: RailAnswers | undefined,
): InvoiceDestination | undefined {
  if (answers?.narrow === undefined) return undefined
  switch (answers.destination) {
    case 'patient':
      return { kind: 'patient', prepaid: answers.narrow === 'prepaid' }
    case 'hospital': {
      const hospital = listHospitalParty(masters.parties, ctx.hospitalId)
      return hospital === undefined ? undefined : { kind: 'hospital', holderPartyId: hospital.id, fundingTagId: answers.narrow }
    }
    case 'special':
      return { kind: 'special', holderPartyId: answers.narrow }
  }
}

/** The destination's open-price fallback (18a): No contract · Fixed price, Prepaid · Fixed price, a hospital's tag or a Special holder's. */
export function openPriceFallbackFor(masters: RailMasters, destination: InvoiceDestination): Contract | undefined {
  return findFallback(masters.contracts, destination, masters.parties)
}

/**
 * Who may type the amount on a fallback (US-04.3.9, A37): the office on any;
 * the anaesthetist only on No contract · Fixed price, so a hospital or insurer
 * is never billed a figure the anaesthetist typed.
 */
export function mayTypeEnteredPrice(actor: RailActor, contract: Contract, parties: RailMasters['parties']): boolean {
  if (contract.pricing.kind !== 'open') return false
  if (actor === 'office') return true
  const d = destinationOf(contract, parties)
  return d.kind === 'patient' && !d.prepaid
}

// ---------------------------------------------------------------------------
// The rail
// ---------------------------------------------------------------------------

export interface RailOption {
  value: string
  label: string
  hint?: string
  /** How many Contracts this answer holds for this List (No contract · RVG counted under Patient › Standard). */
  count: number
  /** Whether it can be chosen. A hospital tag with no Contract still can (its step fills in the fallback); Prepaid with none cannot, nor ever for the anaesthetist. */
  selectable: boolean
  /** The path the Booking's funder suggests (catch-up Phase 21, US-04.3.10): a mark only, never a filter or an answer. */
  suggested?: true
}

export interface RailStep {
  options: RailOption[]
  /** The answer in force (given, or filled in). */
  answer?: string
  /** True when the step had one answer and filled itself in ("Only option"). */
  autoFilled: boolean
}

export interface RailRow {
  contract: Contract
  pinned: boolean
}

export interface ContractStep {
  /** Every row the answers and query leave, No contract · RVG first where pinned. */
  rows: RailRow[]
  /** The rows to draw: at most `RAIL_ROW_LIMIT`. */
  shown: RailRow[]
  /** The destination's open-price fallback, reached only through "Other price". */
  otherPrice?: { contract: Contract; mayTypeAmount: boolean }
  /**
   * The destination's RVG backstop (owner review, 2026-11-16): No contract ·
   * RVG under Patient › Standard (also its pinned row), the hospital tag's or
   * Special holder's `rvgFallback`, none under Prepaid. With `otherPrice` it
   * makes the "No contract" heading every Contract list starts with.
   */
  rvgBackstop?: Contract
  /**
   * What the step fills in by itself: its one row, or the fallback when no
   * Contract is left to choose (A7). The person still confirms it.
   */
  autoPick?: { contractId: ContractId; viaOtherPrice: boolean }
}

export interface ContractRailView {
  destination: RailStep
  /** Step 2, once step 1 has an answer. Its title follows the destination. */
  narrow?: RailStep & { title: string }
  /** Step 3, once step 2 has an answer. */
  contract?: ContractStep
  /** The answers in force, including those filled in: what `setRailAnswers` stores. */
  answers?: RailAnswers
  /** The path the Booking's funder suggests, if any (catch-up Phase 21, US-04.3.10): a mark only. */
  suggested?: RailAnswers
}

export const RAIL_ROW_LIMIT = 50

/** Step 2's title for a destination. */
export function narrowTitle(destination: RailAnswers['destination']): string {
  switch (destination) {
    case 'patient':
      return 'Payment type'
    case 'hospital':
      return 'Funding tag'
    case 'special':
      return 'Holder'
  }
}

export const DESTINATION_LABEL: Record<RailAnswers['destination'], string> = {
  patient: 'Patient',
  hospital: 'Hospital',
  special: 'Special',
}

/** The candidates under one destination, split for step 2. */
function grouped(masters: RailMasters, ctx: RailContext, actor: RailActor, query: string) {
  const all = contractCandidatesFor(masters, ctx, { query })
  const standard: Contract[] = []
  const prepaid: Contract[] = []
  const hospitalByTag = new Map<FundingTagId, Contract[]>()
  const specialByHolder = new Map<PartyId, Contract[]>()
  for (const c of all) {
    const d = destinationOf(c, masters.parties)
    if (d.kind === 'patient') {
      // No RVG kind under Prepaid (US-04.3.8), and never Prepaid for the anaesthetist (A17).
      if (d.prepaid) {
        if (actor === 'office' && !isRvgKind(c.pricing.kind)) prepaid.push(c)
      } else standard.push(c)
    } else if (d.kind === 'hospital') {
      hospitalByTag.set(d.fundingTagId, [...(hospitalByTag.get(d.fundingTagId) ?? []), c])
    } else {
      specialByHolder.set(d.holderPartyId, [...(specialByHolder.get(d.holderPartyId) ?? []), c])
    }
  }
  return { standard, prepaid, hospitalByTag, specialByHolder }
}

/**
 * The funding tags the List's hospital is offered under: those of its Active,
 * tagged Contracts, whatever the specialty filter or the date leaves (A6), in
 * AA's list order. Empty: the hospital is not offered.
 */
export function hospitalTagsFor(masters: RailMasters, ctx: RailContext): FundingTag[] {
  const hospital = listHospitalParty(masters.parties, ctx.hospitalId)
  if (hospital === undefined) return []
  const held = new Set<FundingTagId>()
  for (const c of Object.values(masters.contracts)) {
    if (c.status !== 'active' || c.systemRole !== undefined || c.holderId !== hospital.id || c.fundingTagId === undefined) continue
    held.add(c.fundingTagId)
  }
  return fundingTagsInOrder(masters.fundingTags).filter((t) => held.has(t.id))
}

function step(options: RailOption[], given: string | undefined, live: (o: RailOption) => boolean): RailStep {
  if (given !== undefined && options.some((o) => o.value === given)) return { options, answer: given, autoFilled: false }
  const candidates = options.filter(live)
  if (candidates.length === 1) return { options, answer: candidates[0]!.value, autoFilled: true }
  return { options, autoFilled: false }
}

/**
 * The path the Booking's funder suggests (catch-up Phase 21; US-04.3.10,
 * Donald's D7; AR-58's `suggested(B, L)`, near L687-691). Our readings, kept
 * here and logged: the order of the tests, and Patient › Standard for a
 * Booking with no funder (self-funded).
 *
 * 1. No funder: Patient › Standard.
 * 2. The funder holds a Contract offered on this List: Special › that holder
 *    (NIB with nib's Contract).
 * 3. Otherwise the List's hospital under the funding tag that names the funder
 *    (`fundingTagForFunder`: Southern Cross Health Society suggests SXAP).
 * 4. Else nothing.
 *
 * A mark only: the candidates, their order and every path's Contracts are the
 * same with or without it, and nothing is pre-selected.
 */
export function suggestedPathFor(masters: RailMasters, ctx: RailContext): RailAnswers | undefined {
  if (ctx.funderPartyId === undefined) return { destination: 'patient', narrow: 'standard' }
  const funder = ctx.funderPartyId
  // The whole List's candidates, as the office sees them (a mark is the same for everyone).
  const all = grouped(masters, ctx, 'office', '')
  if ((all.specialByHolder.get(funder)?.length ?? 0) > 0) return { destination: 'special', narrow: funder }
  const tag = fundingTagForFunder(masters.fundingTags, funder)
  if (tag !== undefined && hospitalTagsFor(masters, ctx).some((t) => t.id === tag.id)) return { destination: 'hospital', narrow: tag.id }
  return undefined
}

/**
 * The rail at the answers so far (US-04.3.8): each step's options with their
 * counts, the answer in force and whether it filled itself in, step 3's rows
 * and "Other price". Pure and deterministic; the office and the anaesthetist
 * see the same rail at the same point, bar Prepaid and who types an amount.
 */
export function contractRailFor(
  masters: RailMasters,
  ctx: RailContext,
  given: RailAnswers | undefined,
  opts: { query?: string; actor: RailActor },
): ContractRailView {
  const query = opts.query ?? ''
  // Counts are the whole List's, whatever is typed at step 3.
  const all = grouped(masters, ctx, opts.actor, '')
  const ncr = noContractRvg(masters.contracts)
  const hospital = listHospitalParty(masters.parties, ctx.hospitalId)
  const hospitalTags = hospitalTagsFor(masters, ctx)
  const hospitalCount = [...all.hospitalByTag.values()].reduce((n, cs) => n + cs.length, 0)
  const specialCount = [...all.specialByHolder.values()].reduce((n, cs) => n + cs.length, 0)

  const destinationOptions: RailOption[] = [
    { value: 'patient', label: 'Patient', hint: 'The patient, or whoever pays for them', count: all.standard.length + 1 + all.prepaid.length, selectable: true },
  ]
  if (hospital !== undefined && hospitalTags.length > 0) {
    destinationOptions.push({
      value: 'hospital',
      label: hospital.name,
      hint: `This List's hospital, under ${hospitalTags.map((t) => t.code).join(', ')}`,
      count: hospitalCount,
      selectable: true,
    })
  }
  destinationOptions.push({ value: 'special', label: 'Special', hint: 'An insurer, a funder or a surgeon who is billed', count: specialCount, selectable: specialCount > 0 })
  // Live: Patient always (No contract · RVG); the hospital whenever offered (its fallback fills an emptied tag); Special when it holds any.
  const destination = step(destinationOptions, given?.destination, (o) => o.selectable)
  // The funder's one "Suggested" path (US-04.3.10), marked after every answer is worked out.
  const suggested = suggestedPathFor(masters, ctx)
  for (const o of destinationOptions) if (suggested?.destination === o.value) o.suggested = true
  const view: ContractRailView = { destination, ...(suggested !== undefined ? { suggested } : {}) }
  if (destination.answer === undefined) return view
  const dest = destination.answer as RailAnswers['destination']

  let narrowOptions: RailOption[]
  let live: (o: RailOption) => boolean
  if (dest === 'patient') {
    // Payment type always asks (Donald, 16 November): Standard first, the normal pathway, then Prepaid,
    // shown even when it holds nothing. The anaesthetist sees Prepaid but cannot choose it (A17).
    const prepaidCount = opts.actor === 'office' ? all.prepaid.length : grouped(masters, ctx, 'office', '').prepaid.length
    narrowOptions = [
      { value: 'standard', label: 'Standard', hint: 'Invoiced after the procedure', count: all.standard.length + 1, selectable: true },
      opts.actor === 'office'
        ? { value: 'prepaid', label: 'Prepaid', hint: 'Invoiced before the procedure', count: prepaidCount, selectable: prepaidCount > 0 }
        : { value: 'prepaid', label: 'Prepaid', hint: 'Set by the office', count: prepaidCount, selectable: false },
    ]
    live = () => false
  } else if (dest === 'hospital') {
    narrowOptions = hospitalTags.map((t) => ({ value: t.id, label: t.code, count: all.hospitalByTag.get(t.id)?.length ?? 0, selectable: true }))
    live = () => true
  } else {
    narrowOptions = [...all.specialByHolder.entries()]
      .map(([holderId, cs]) => ({ value: holderId, label: masters.parties[holderId]?.name ?? holderId, count: cs.length, selectable: true }))
      .sort((a, b) => a.label.localeCompare(b.label))
    live = () => true
  }
  for (const o of narrowOptions) if (suggested?.destination === dest && suggested.narrow === o.value) o.suggested = true
  const narrow = step(narrowOptions, given?.destination === dest ? given.narrow : undefined, live)
  view.narrow = { ...narrow, title: narrowTitle(dest) }
  view.answers = narrow.answer !== undefined ? { destination: dest, narrow: narrow.answer } : { destination: dest }
  if (narrow.answer === undefined) return view

  const searched = grouped(masters, ctx, opts.actor, query)
  let found: Contract[]
  if (dest === 'patient') found = narrow.answer === 'prepaid' ? searched.prepaid : searched.standard
  else if (dest === 'hospital') found = searched.hospitalByTag.get(narrow.answer) ?? []
  else found = searched.specialByHolder.get(narrow.answer) ?? []
  const pinned = dest === 'patient' && narrow.answer === 'standard'
  const rows: RailRow[] = [...(pinned ? [{ contract: ncr, pinned: true }] : []), ...found.map((contract) => ({ contract, pinned: false }))]

  const fallbackDest = destinationForAnswers(masters, ctx, view.answers)
  const fallback = fallbackDest !== undefined ? openPriceFallbackFor(masters, fallbackDest) : undefined
  const contractStep: ContractStep = { rows, shown: rows.slice(0, RAIL_ROW_LIMIT) }
  if (fallback !== undefined) {
    contractStep.otherPrice = { contract: fallback, mayTypeAmount: mayTypeEnteredPrice(opts.actor, fallback, masters.parties) }
  }
  const rvgBackstop = fallbackDest !== undefined ? findRvgFallback(masters.contracts, fallbackDest, masters.parties) : undefined
  if (rvgBackstop !== undefined && rvgBackstop.status === 'active') contractStep.rvgBackstop = rvgBackstop
  if (query === '') {
    // One row fills itself in; none fills in the fallback (A7).
    if (rows.length === 1) contractStep.autoPick = { contractId: rows[0]!.contract.id, viaOtherPrice: false }
    else if (rows.length === 0 && fallback !== undefined) contractStep.autoPick = { contractId: fallback.id, viaOtherPrice: true }
  }
  view.contract = contractStep
  return view
}

/**
 * The answers that lead to a Contract, so "Change" and an added Procedure
 * open with every step answered. Worked out from the Contract alone.
 */
export function railAnswersFor(masters: Pick<RailMasters, 'contracts' | 'parties'>, contractId: ContractId): RailAnswers | undefined {
  const contract = masters.contracts[contractId]
  if (contract === undefined) return undefined
  const d = destinationOf(contract, masters.parties)
  switch (d.kind) {
    case 'patient':
      return { destination: 'patient', narrow: d.prepaid ? 'prepaid' : 'standard' }
    case 'hospital':
      return { destination: 'hospital', narrow: d.fundingTagId }
    case 'special':
      return { destination: 'special', narrow: d.holderPartyId }
  }
}

/** "Patient › Standard", "St George's › ACC", "Special › nib": the answers so far, in words. */
export function railAnswersText(
  masters: Pick<RailMasters, 'parties' | 'fundingTags'>,
  ctx: Pick<RailContext, 'hospitalId'>,
  answers: RailAnswers | undefined,
): string {
  if (answers === undefined) return 'Not started'
  let first: string = DESTINATION_LABEL[answers.destination]
  if (answers.destination === 'hospital') first = listHospitalParty(masters.parties, ctx.hospitalId)?.name ?? 'Hospital'
  if (answers.narrow === undefined) return first
  let second = answers.narrow
  if (answers.destination === 'patient') second = answers.narrow === 'prepaid' ? 'Prepaid' : 'Standard'
  else if (answers.destination === 'hospital') second = masters.fundingTags[answers.narrow]?.code ?? answers.narrow
  else second = masters.parties[answers.narrow]?.name ?? answers.narrow
  return `${first} › ${second}`
}

// ---------------------------------------------------------------------------
// The change and its limits (US-03.4.1, FT-03.4)
// ---------------------------------------------------------------------------

/**
 * The Procedure fields a Contract change writes (US-03.4.1, A15): the new
 * Contract; a typed price cleared (the fallback amount and today's price
 * override), unless an amount is given with an open-price fallback; the
 * answers so far and the interim holder billing cleared; the RVG code filled
 * from the new Contract's default only when empty. Recorded RVG code, units,
 * times and modifiers are kept: the store's row-change rule (19, 19b) applies
 * to a filled code as to any other pick.
 */
export function applyContractChange(
  masters: Pick<RailMasters, 'contracts' | 'rvgGroups'>,
  procedure: Pick<Procedure, 'rvgGroupId'>,
  nextContractId: ContractId,
  opts: { enteredPrice?: number } = {},
): Partial<Procedure> {
  const next = masters.contracts[nextContractId]
  const patch: Partial<Procedure> = {
    governingContractId: nextContractId,
    railAnswers: undefined,
    priceOverride: undefined,
    enteredPrice: next?.pricing.kind === 'open' ? opts.enteredPrice : undefined,
  }
  const fill = fillFromContract(procedure, next, masters.rvgGroups)
  if (fill !== null) patch.rvgGroupId = fill.rvgGroupId
  return patch
}

// `rvgCodeToFill` lives in `rvgDetail.ts` (catch-up Phase 21a): the pricing-kind rule has one home.

export const PREPAID_OFFICE_ONLY_MESSAGE = 'Only the office changes a prepaid Contract.'
export const OFFICE_TYPES_AMOUNT_MESSAGE = 'The office types this amount.'
export const NOT_A_CANDIDATE_MESSAGE = 'That Contract does not apply to this Booking.'

/**
 * The anaesthetist's limits on a Contract change (A17, A37): never onto or off
 * a prepaid Contract, and an amount typed only on No contract · Fixed price.
 * The office has none here (the edit window is 38a's `editRefusal`).
 */
export function contractChangeRefusal(
  actor: RailActor,
  masters: Pick<RailMasters, 'contracts' | 'parties'>,
  current: ContractId | undefined,
  next: ContractId,
  opts: { enteredPrice?: number } = {},
): { code: 'prepaidOfficeOnly' | 'officeTypesAmount'; message: string } | null {
  if (actor === 'office') return null
  const was = current !== undefined ? masters.contracts[current] : undefined
  const will = masters.contracts[next]
  if (was?.prepaid === true || will?.prepaid === true) return { code: 'prepaidOfficeOnly', message: PREPAID_OFFICE_ONLY_MESSAGE }
  if (opts.enteredPrice !== undefined && will !== undefined && !mayTypeEnteredPrice(actor, will, masters.parties)) {
    return { code: 'officeTypesAmount', message: OFFICE_TYPES_AMOUNT_MESSAGE }
  }
  return null
}

/**
 * Whether a Contract may be stored on a Procedure on this List (the store's
 * guard): a candidate, No contract · RVG, or an open-price fallback of a
 * destination this List offers.
 */
export function contractAllowedOn(masters: RailMasters, ctx: RailContext, contractId: ContractId, opts: { anyStatus?: boolean } = {}): boolean {
  const contract = masters.contracts[contractId]
  if (contract === undefined) return false
  if (contract.systemRole === 'noContractRvg') return true
  if (contract.systemRole === 'openPriceFallback' || contract.systemRole === 'rvgFallback') {
    const d = destinationOf(contract, masters.parties)
    if (d.kind === 'patient') return true
    if (d.kind === 'hospital') return hospitalTagsFor(masters, ctx).some((t) => t.id === d.fundingTagId) && listHospitalParty(masters.parties, ctx.hospitalId)?.id === d.holderPartyId
    // A Special holder's fallback once one of its Contracts is on offer (A4).
    return contractCandidatesFor(masters, ctx).some((c) => {
      const cd = destinationOf(c, masters.parties)
      return cd.kind === 'special' && cd.holderPartyId === d.holderPartyId
    })
  }
  return isContractCandidate(masters, ctx, contract, opts)
}
