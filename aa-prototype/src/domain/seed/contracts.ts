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
 * - Doyle's bariatric price list is a fixed price over the interim rows
 *   (`CONTRACT_PRICES`, until Phase 19a's price ranges). It bills the payer,
 *   though the billing route still bills Doyle until Phase 21 (logged).
 * - COS ACC fixed fees has no rows: only the billing-failure demo points a
 *   Procedure at it ("No price in force").
 *
 * AA codes come from `nextAaCode` in seed order, `<codePrefix>-<nnn>`; No
 * contract · RVG is `AA-RVG` (AR-58 8.2). Holder reference codes stay empty
 * until Phase 19a; nothing is prepaid. Demo values within RFP-stated ranges.
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

import type { Contract, ContractPrice, ContractPricing } from '../types'
import { nextAaCode } from '../billing/contracts'
import { ensureFallbacks, seedFallbackId } from '../billing/fallbacks'
import { SURG } from './cast'
import { FUNDING_TAGS, TAG } from './fundingTags'
import { PARTIES, PARTY } from './parties'
import { SPC } from './specialties'

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
  ariaHourly: 'CT-ARIA-HOURLY',
  unisports: 'CT-UNISPORTS',
  cosFixed: 'CT-COS-FIXED',
} as const

/** Canterbury Orthopaedic Surgeons' members (`SG-COS`), copied onto its Contracts' links. */
const COS_SURGEONS = [SURG.hale]

interface SeedContract {
  id: string
  name: string
  holderId: string
  billsTo: Contract['billsTo']
  pricing: ContractPricing
  linkedSurgeonIds?: string[]
  anaesthetistMayOverridePrice?: boolean
  permitsRateTime?: boolean
  systemRole?: 'noContractRvg'
  aaCode?: string
  fundingTagId?: string
  specialtyIds?: string[]
}

const RVG: ContractPricing = { kind: 'rvgAnaesthetistRate' }
const rate = (unitRate: number): ContractPricing => ({ kind: 'rvgContractRate', unitRate })

const SEED: readonly SeedContract[] = [
  { id: CONTRACT.noContractRvg, name: 'No contract · RVG', holderId: PARTY.aa, billsTo: 'payer', pricing: RVG, anaesthetistMayOverridePrice: true, systemRole: 'noContractRvg', aaCode: 'AA-RVG' },
  // The hospitals' and nib's plain RVG Contracts (formerly the protected default Type 1s).
  { id: CONTRACT.stgRvg, name: "St George's RVG", holderId: PARTY.stg, billsTo: 'holder', pricing: RVG },
  { id: CONTRACT.sxRvg, name: 'Southern Cross RVG', holderId: PARTY.sx, billsTo: 'holder', pricing: RVG },
  { id: CONTRACT.forteRvg, name: 'Forte Health RVG', holderId: PARTY.forte, billsTo: 'holder', pricing: RVG },
  { id: CONTRACT.cesRvg, name: 'Christchurch Eye Surgery RVG', holderId: PARTY.ces, billsTo: 'holder', pricing: RVG },
  { id: CONTRACT.cphRvg, name: 'Christchurch Public RVG', holderId: PARTY.cph, billsTo: 'holder', pricing: RVG },
  { id: CONTRACT.nibRvg, name: 'nib RVG', holderId: PARTY.nib, billsTo: 'holder', pricing: RVG },
  // RVG at the Contract's rate. SXAP is $26.50 (Decisions log 2026-07-23).
  { id: CONTRACT.sxap, name: 'Southern Cross Affiliated Provider', holderId: PARTY.sx, billsTo: 'holder', pricing: rate(26.5), fundingTagId: TAG.sxap },
  { id: CONTRACT.healthNz, name: 'Health NZ agreed rate', holderId: PARTY.cph, billsTo: 'holder', pricing: rate(23), fundingTagId: TAG.hnz },
  { id: CONTRACT.stgAcc, name: "ACC elective services via St George's", holderId: PARTY.stg, billsTo: 'holder', pricing: rate(25), fundingTagId: TAG.acc },
  // Fixed price over the interim rows; bills the payer (the route still bills Doyle until Phase 21).
  { id: CONTRACT.doyleBariatric, name: 'Bariatric fixed prices, Mr P. Doyle', holderId: PARTY.doyle, billsTo: 'payer', pricing: { kind: 'fixed' }, linkedSurgeonIds: [SURG.doyle], specialtyIds: [SPC.generalSurgery] },
  { id: CONTRACT.cosAcc, name: 'ACC orthopaedic services, Canterbury Orthopaedic Surgeons', holderId: PARTY.cos, billsTo: 'holder', pricing: rate(24), linkedSurgeonIds: COS_SURGEONS, fundingTagId: TAG.acc },
  // The Method 3 gate (`permitsRateTime`, INTERIM until Phase 24), linked to
  // the surgeons on its seeded Bookings (Ms G. Lim, Mr C. Okafor; logged).
  { id: CONTRACT.ariaHourly, name: 'Aria Skin and Laser Clinic hourly rate', holderId: PARTY.aria, billsTo: 'holder', pricing: rate(26.5), permitsRateTime: true, linkedSurgeonIds: [SURG.lim, SURG.okafor] },
  // AR-58 8.3: undated rvgContractRate 93.47; linked to an orthopaedic surgeon
  // (Mr T. Hale; logged). No Procedure is on it: S5 Beat 4 edits its rate in place.
  { id: CONTRACT.unisports, name: 'Unisports Ortho', holderId: PARTY.unisports, billsTo: 'holder', pricing: rate(93.47), linkedSurgeonIds: [SURG.hale] },
  // No rows: the billing-failure demo points Losa Tuilagi's Procedure at it
  // ("No price in force"). Phase 19a gives it a range starting after 16 Jul 2026.
  { id: CONTRACT.cosFixed, name: 'COS ACC fixed fees', holderId: PARTY.cos, billsTo: 'holder', pricing: { kind: 'fixed' }, linkedSurgeonIds: COS_SURGEONS, fundingTagId: TAG.acc },
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
      name: c.name,
      holderId: c.holderId,
      billsTo: c.billsTo,
      linkedSurgeonIds: c.linkedSurgeonIds ?? [],
      prepaid: false,
      anaesthetistMayOverridePrice: c.anaesthetistMayOverridePrice ?? false,
      pricing: c.pricing,
      status: 'active',
      ...(c.systemRole !== undefined ? { systemRole: c.systemRole } : {}),
      permitsRateTime: c.permitsRateTime ?? false,
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
    (_d, key) => seedFallbackId(key),
  )
  return Object.values(all)
}

export const CONTRACTS: readonly Contract[] = withFallbacks(buildContracts())

/**
 * The fixed-price rows for Doyle's bariatric Contract (INTERIM until Phase
 * 19a), including the second-procedure ordinal rule (most specific match wins).
 */
export const CONTRACT_PRICES: readonly ContractPrice[] = [
  { id: 'CP-BAR-1', contractId: CONTRACT.doyleBariatric, rvgBaseCode: '20880', price: 2800 },
  { id: 'CP-BAR-2', contractId: CONTRACT.doyleBariatric, rvgBaseCode: '20882', price: 2400 },
  // Concurrent hernia repair as the SECOND procedure of a bariatric case.
  { id: 'CP-BAR-3', contractId: CONTRACT.doyleBariatric, rvgBaseCode: '49120', procedureOrdinal: 2, price: 950 },
] as const
