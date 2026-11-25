/**
 * Seed Contracts in the flat shape (catch-up Phase 18; DM-07, AR-58 2.2 and
 * 8.2). Every Contract keeps its id, so no `governingContractId` moves, and
 * every seeded fee and counterparty is unchanged (the parity fixture,
 * `store/__parity__/phase-18-baseline.json`).
 *
 * - No contract · RVG (RV-06, OQ-78): held by AA, billing the payer, RVG at
 *   the anaesthetist's rate, the override on (A18), the one system Contract.
 * - The old protected default Type 1s are their holders' plain RVG Contracts.
 * - The old agreed rates are RVG at the Contract's rate.
 * - Every fixed price is a Contract of its own with dated price ranges
 *   (catch-up Phase 19a, `pricedItems.ts`): Doyle's "Gastric bypass" keeps
 *   this id and DOYLE-001 ($2,800, then $2,950 from 28 Jul 2026); his sleeve
 *   gastrectomy, the CES schedule items, Merivale's combinations and Dr
 *   Souter's prepaid price list follow it. They bill the payer where their
 *   holder is a surgeon, group or anaesthetist (Doyle's bariatric Booking
 *   included since catch-up Phase 21, when the interim holder flag went).
 * - COS ACC fixed fees has one range from 1 Aug 2026, after the billing-failure
 *   demo's Thu 16 Jul List, so that Booking still "Needs a price".
 *
 * AA codes come from `nextAaCode` in seed order, `<codePrefix>-<nnn>`; No
 * contract · RVG is `AA-RVG` (AR-58 8.2). Demo values within RFP-stated ranges.
 *
 * Specialties and funding tags (catch-up Phase 18a; US-04.2.16, US-04.2.17):
 * SXAP on the Southern Cross Affiliated Provider, HNZ on Health NZ's agreed
 * rate, ACC on St George's ACC and both COS ACC Contracts (COS fixed fees
 * too, our reading, so the billing-failure demo's Procedure keeps its ACC
 * marker). The plain RVG Contracts carry no tag, so they sit under Special.
 * Specialties only on Doyle's bariatric Contract (General surgery, his own),
 * so every seeded Procedure's Contract still fits its List's surgeon. Then
 * `ensureFallbacks` adds one open-price fallback per invoice destination,
 * ids derived from the destination key.
 */

import type { Contract, ContractEventFee, ContractPricing } from '../types'
import { nextAaCode } from '../billing/contracts'
import { ensureFallbacks, seedFallbackId } from '../billing/fallbacks'
import { HOSP, SURG } from './cast'
import { FUNDING_TAGS, TAG } from './fundingTags'
import { PARTIES, PARTY } from './parties'
import { SPC } from './specialties'
import { RVG_GROUP } from './rvgGroups'
import { BEAUMONT_RHINOPLASTY, PRICED_ITEMS, fixed } from './pricedItems'

export const CONTRACT = {
  noContractRvg: 'CT-NO-CONTRACT',
  stgRvg: 'CT-STG-D1',
  sxRvg: 'CT-SX-D1',
  forteRvg: 'CT-FORTE-D1',
  cesRvg: 'CT-CES-D1',
  cphRvg: 'CT-CPH-D1',
  nibRvg: 'CT-NIB-D1',
  sxap: 'CT-SXAP',
  healthNz: 'CT-HNZ',
  stgAcc: 'CT-STG-ACC',
  doyleBariatric: 'CT-DOYLE-BAR',
  cosAcc: 'CT-COS-ACC',
  // The id is kept from the hourly-rate days (catch-up Phase 24); the Contract is RVG at its own rate.
  ariaContractRate: 'CT-ARIA-HOURLY',
  // Catch-up Phase 24: Forte Health RVG less 10% (a demo Contract), the seed's one discount Contract.
  forteDiscount: 'CT-FORTE-DISC',
  unisports: 'CT-UNISPORTS',
  cosFixed: 'CT-COS-FIXED',
  // Catch-up Phase 25a: Christchurch Eye Surgery's old rate, Disabled on Fri 10 Jul 2026 (the seeded Disabled Contract flag).
  cesOldRate: 'CT-CES-2025',
} as const

/**
 * Each hospital's plain RVG Contract (catch-up Phase 20): what the retired
 * hospital route billed under when nothing was stored, so the seed writes it
 * onto those Procedures and no fee moves.
 */
export const PLAIN_RVG_CONTRACT_BY_HOSPITAL: Readonly<Record<string, string>> = {
  [HOSP.stg]: CONTRACT.stgRvg,
  [HOSP.sx]: CONTRACT.sxRvg,
  [HOSP.forte]: CONTRACT.forteRvg,
  [HOSP.ces]: CONTRACT.cesRvg,
  [HOSP.cph]: CONTRACT.cphRvg,
}

/** Canterbury Orthopaedic Surgeons' surgeons, linked on its Contracts (a group is a Party; DM-08). */
const COS_SURGEONS = [SURG.hale]

interface SeedContract {
  id: string
  name: string
  holderId: string
  billsTo: Contract['billsTo']
  pricing: ContractPricing
  holderReference?: string
  invoiceDescription?: string
  defaultRvgGroupId?: string
  linkedAnaesthetistId?: string
  prepaid?: boolean
  linkedSurgeonIds?: string[]
  anaesthetistMayOverridePrice?: boolean
  systemRole?: 'noContractRvg'
  aaCode?: string
  fundingTagId?: string
  specialtyIds?: string[]
  /** Active unless named (catch-up Phase 25a: the one seeded Disabled Contract, its disable in the seeded audit). */
  status?: Contract['status']
}

const RVG: ContractPricing = { kind: 'rvgAnaesthetistRate' }
const rate = (unitRate: number): ContractPricing => ({ kind: 'rvgContractRate', unitRate })

const SEED: readonly SeedContract[] = [
  { id: CONTRACT.noContractRvg, name: 'No contract · RVG', holderId: PARTY.aa, billsTo: 'payer', pricing: RVG, anaesthetistMayOverridePrice: true, systemRole: 'noContractRvg', aaCode: 'AA-RVG' },
  // The hospitals' and nib's plain RVG Contracts (formerly the protected default Type 1s).
  // The holder reference codes on St George's and nib's billed Contracts are SYNTHETIC (catch-up Phase 22): printed on their invoices (US-04.2.18).
  { id: CONTRACT.stgRvg, name: "St George's RVG", holderId: PARTY.stg, billsTo: 'holder', pricing: RVG, holderReference: 'SGANAES01' },
  { id: CONTRACT.sxRvg, name: 'Southern Cross RVG', holderId: PARTY.sx, billsTo: 'holder', pricing: RVG },
  // The anaesthetist may override its price (catch-up Phase 24: the one hospital RVG Contract seeded with the setting on).
  { id: CONTRACT.forteRvg, name: 'Forte Health RVG', holderId: PARTY.forte, billsTo: 'holder', pricing: RVG, anaesthetistMayOverridePrice: true },
  { id: CONTRACT.cesRvg, name: 'Christchurch Eye Surgery RVG', holderId: PARTY.ces, billsTo: 'holder', pricing: RVG },
  { id: CONTRACT.cphRvg, name: 'Christchurch Public RVG', holderId: PARTY.cph, billsTo: 'holder', pricing: RVG },
  { id: CONTRACT.nibRvg, name: 'nib RVG', holderId: PARTY.nib, billsTo: 'holder', pricing: RVG, holderReference: 'NIBAN2026' },
  // RVG at the Contract's rate. SXAP is $26.50 (Decisions log 2026-07-23).
  { id: CONTRACT.sxap, name: 'Southern Cross Affiliated Provider', holderId: PARTY.sx, billsTo: 'holder', pricing: rate(26.5), fundingTagId: TAG.sxap },
  { id: CONTRACT.healthNz, name: 'Health NZ agreed rate', holderId: PARTY.cph, billsTo: 'holder', pricing: rate(23), fundingTagId: TAG.hnz },
  { id: CONTRACT.stgAcc, name: "ACC elective services via St George's", holderId: PARTY.stg, billsTo: 'holder', pricing: rate(25), fundingTagId: TAG.acc },
  // Doyle's gastric bypass: his old $2,800 row and the upcoming $2,950 as ranges; bills the
  // Procedure's payer (catch-up Phases 21 and 22a). His sleeve gastrectomy is in pricedItems.ts.
  { id: CONTRACT.doyleBariatric, name: 'Gastric bypass', invoiceDescription: 'Gastric bypass, laparoscopic', holderId: PARTY.doyle, billsTo: 'payer', pricing: fixed(['2025-01-01', 2800], ['2026-12-01', 2950]), defaultRvgGroupId: RVG_GROUP.aaGastricBypass, linkedSurgeonIds: [SURG.doyle], specialtyIds: [SPC.generalSurgery] },
  { id: CONTRACT.cosAcc, name: 'ACC orthopaedic services, Canterbury Orthopaedic Surgeons', holderId: PARTY.cos, billsTo: 'holder', pricing: rate(24), linkedSurgeonIds: COS_SURGEONS, fundingTagId: TAG.acc },
  // RVG at the Contract's rate, $26.50 (catch-up Phase 24, RV-03: the hourly rate x time line and its gate
  // are gone), the override off; linked to the surgeons on its seeded Bookings (Ms G. Lim, Mr C. Okafor; logged).
  { id: CONTRACT.ariaContractRate, name: 'Aria Skin and Laser Clinic', holderId: PARTY.aria, billsTo: 'holder', pricing: rate(26.5), linkedSurgeonIds: [SURG.lim, SURG.okafor] },
  // AR-58 8.3: undated rvgContractRate 93.47; linked to an orthopaedic surgeon
  // (Mr T. Hale; logged). No Procedure is on it: S5 Beat 4 edits its rate in place.
  { id: CONTRACT.unisports, name: 'Unisports Ortho', holderId: PARTY.unisports, billsTo: 'holder', pricing: rate(93.47), linkedSurgeonIds: [SURG.hale] },
  // Its one range starts 1 Aug 2026 (demo figure), after the billing-failure demo's Thu 16 Jul
  // List, so Losa Tuilagi's Procedure, pointed at it, still "Needs a price" (Phase 20's "not offered").
  { id: CONTRACT.cosFixed, name: 'COS ACC fixed fees', holderId: PARTY.cos, billsTo: 'holder', pricing: fixed(['2026-12-05', 1250]), linkedSurgeonIds: COS_SURGEONS, fundingTagId: TAG.acc },
  // Catch-up Phase 19a: the priced items (one fixed-price Contract per item).
  ...PRICED_ITEMS,
  // Catch-up Phase 24 (demo values): Forte Health at standard RVG less 10%, the override off; last, so no AA code moves.
  { id: CONTRACT.forteDiscount, name: 'Forte Health RVG less 10%', holderId: PARTY.forte, billsTo: 'holder', pricing: { kind: 'rvgDiscount', discountPct: 10 } },
  // Catch-up Phase 25a (demo values): Christchurch Eye Surgery's old rate, Disabled on Fri 10 Jul 2026 by the office
  // (`seed/disabledContractBooking.ts` writes the audit entry); one later Procedure still on it is flagged at review. Last, so no AA code moves.
  { id: CONTRACT.cesOldRate, name: 'Christchurch Eye Surgery 2025 rate', holderId: PARTY.ces, billsTo: 'holder', pricing: rate(25), status: 'disabled' },
  // Catch-up Phase 41 (US-06.5.3; demo-plausible $1,350): Dr Beaumont's prepaid Rhinoplasty, the rebook's replacement price. Last, so no AA code moves.
  BEAUMONT_RHINOPLASTY,
]

function buildContracts(): Contract[] {
  const prefixOf = new Map(PARTIES.map((p) => [p.id, p.codePrefix]))
  const codes: string[] = []
  return SEED.map((c) => {
    const prefix = prefixOf.get(c.holderId)
    if (prefix === undefined) throw new Error(`seed Contract ${c.id} names no Party ${c.holderId}`)
    const aaCode = c.aaCode ?? nextAaCode(prefix, codes)
    codes.push(aaCode)
    return {
      id: c.id,
      aaCode,
      ...(c.holderReference !== undefined ? { holderReference: c.holderReference } : {}),
      invoiceDescription: c.invoiceDescription ?? null,
      defaultRvgGroupId: c.defaultRvgGroupId ?? null,
      name: c.name,
      holderId: c.holderId,
      billsTo: c.billsTo,
      linkedSurgeonIds: c.linkedSurgeonIds ?? [],
      ...(c.linkedAnaesthetistId !== undefined ? { linkedAnaesthetistId: c.linkedAnaesthetistId } : {}),
      prepaid: c.prepaid ?? false,
      anaesthetistMayOverridePrice: c.anaesthetistMayOverridePrice ?? false,
      pricing: c.pricing,
      status: c.status ?? 'active',
      ...(c.systemRole !== undefined ? { systemRole: c.systemRole } : {}),
      specialtyIds: c.specialtyIds ?? [],
      ...(c.fundingTagId !== undefined ? { fundingTagId: c.fundingTagId } : {}),
    }
  })
}

/** The seeded Contracts, then one open-price fallback per invoice destination they imply. */
function withFallbacks(contracts: readonly Contract[]): Contract[] {
  const { contracts: all } = ensureFallbacks(
    Object.fromEntries(contracts.map((c) => [c.id, c])),
    Object.fromEntries(PARTIES.map((p) => [p.id, p])),
    Object.fromEntries(FUNDING_TAGS.map((t) => [t.id, t])),
    (_d, key, kind) => seedFallbackId(key, kind),
  )
  return Object.values(all)
}

export const CONTRACTS: readonly Contract[] = withFallbacks(buildContracts())

/**
 * The Contract event fees (catch-up Phase 39b; US-03.7.2, OQ-12): one, on St
 * George's ACC, a labelled demo price. A Contract event fee replaces a recorded
 * time for its type of event; it never moves a Procedure's price, so every
 * seeded Procedure on `CT-STG-ACC` prices as before. No ACC pre-op Contract
 * (US-05.5.2): the CS250, CS260 and CS70 presets are constants.
 */
export const CONTRACT_EVENT_FEES: readonly ContractEventFee[] = [
  { id: 'CEF001', contractId: CONTRACT.stgAcc, eventType: 'painConsult', holderCode: 'STGACC-PAIN', holderDescription: 'Acute pain review, fixed fee', fixedPrice: 120 },
]

/** The next `CEF` number after the seeded fees. */
export const SEED_NEXT_CONTRACT_EVENT_FEE = CONTRACT_EVENT_FEES.length + 1
