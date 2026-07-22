/**
 * Seed contracts — the five hospital default Type 1s and nib's default Type 1
 * (the protected "always holds" invariant), the specific Type 2s and the
 * surgeon-held Type 3 price list, the COS externally held ACC contract, and
 * the billable-party-held individual-arrangement contract (the Method 3 gate).
 *
 * demo values within RFP-stated ranges — not sourced from an NZSA schedule.
 */

import type { Contract, ContractPrice } from '../types'
import { HOSP, INS, ORG, SURG } from './cast'
import { BP } from './patients'

export const CONTRACT = {
  stgDefault: 'CT-STG-D1',
  sxDefault: 'CT-SX-D1',
  forteDefault: 'CT-FORTE-D1',
  cesDefault: 'CT-CES-D1',
  cphDefault: 'CT-CPH-D1',
  nibDefault: 'CT-NIB-D1',
  sxap: 'CT-SXAP',
  healthNz: 'CT-HNZ',
  stgAcc: 'CT-STG-ACC',
  doyleBariatric: 'CT-DOYLE-BAR',
  cosAcc: 'CT-COS-ACC',
  ariaHourly: 'CT-ARIA-HOURLY',
} as const

const ORGANISATION_SCOPE = { kind: 'organisation' } as const

function defaultType1(id: string, name: string, holderType: Contract['holderType'], holderId: string): Contract {
  return {
    id,
    name,
    type: 1,
    holderType,
    holderId,
    scope: ORGANISATION_SCOPE,
    permitsIndividualArrangement: false,
    isDefault: true,
    effectiveFromISO: '2020-01-01',
  }
}

export const CONTRACTS: readonly Contract[] = [
  // The protected defaults: every hospital and every direct-billing insurer
  // ALWAYS holds one (RFP; 3rd review #9). AIA Health does not bill direct,
  // so it holds none.
  defaultType1(CONTRACT.stgDefault, "St George's standard units (default Type 1)", 'hospital', HOSP.stg),
  defaultType1(CONTRACT.sxDefault, 'Southern Cross standard units (default Type 1)', 'hospital', HOSP.sx),
  defaultType1(CONTRACT.forteDefault, 'Forte Health standard units (default Type 1)', 'hospital', HOSP.forte),
  defaultType1(CONTRACT.cesDefault, 'Christchurch Eye Surgery standard units (default Type 1)', 'hospital', HOSP.ces),
  defaultType1(CONTRACT.cphDefault, 'Christchurch Public standard units (default Type 1)', 'hospital', HOSP.cph),
  defaultType1(CONTRACT.nibDefault, 'nib standard units (default Type 1)', 'insurer', INS.nib),
  {
    // The SXAP agreed rate is $26.50 (decision: keeps the design day fees
    // exact to the cent while exercising specific-beats-default selection).
    id: CONTRACT.sxap,
    name: 'Southern Cross Affiliated Provider (Type 2)',
    type: 2,
    holderType: 'hospital',
    holderId: HOSP.sx,
    scope: ORGANISATION_SCOPE,
    permitsIndividualArrangement: false,
    isDefault: false,
    effectiveFromISO: '2024-07-01',
    type2Detail: { basis: 'agreedUnitRate', unitRate: 26.5 },
  },
  {
    id: CONTRACT.healthNz,
    name: 'Health NZ agreed rate (Type 2)',
    type: 2,
    holderType: 'hospital',
    holderId: HOSP.cph,
    scope: ORGANISATION_SCOPE,
    permitsIndividualArrangement: false,
    isDefault: false,
    effectiveFromISO: '2023-07-01',
    type2Detail: { basis: 'agreedUnitRate', unitRate: 23 },
  },
  {
    id: CONTRACT.stgAcc,
    name: "ACC elective services via St George's (Type 2)",
    type: 2,
    holderType: 'hospital',
    holderId: HOSP.stg,
    scope: ORGANISATION_SCOPE,
    permitsIndividualArrangement: false,
    isDefault: false,
    effectiveFromISO: '2024-01-01',
    type2Detail: { basis: 'agreedUnitRate', unitRate: 25 },
  },
  {
    id: CONTRACT.doyleBariatric,
    name: 'Bariatric fixed prices, Mr P. Doyle (Type 3)',
    type: 3,
    holderType: 'surgeon',
    holderId: SURG.doyle,
    scope: ORGANISATION_SCOPE,
    permitsIndividualArrangement: false,
    isDefault: false,
    effectiveFromISO: '2025-01-01',
  },
  {
    // The RFP's "held externally instead" group case: no default fallback
    // exists for a non-hospital, non-direct-insurer holder.
    id: CONTRACT.cosAcc,
    name: 'ACC orthopaedic services, Canterbury Orthopaedic Surgeons (Type 2)',
    type: 2,
    holderType: 'organisation',
    holderId: ORG.cos,
    scope: ORGANISATION_SCOPE,
    permitsIndividualArrangement: false,
    isDefault: false,
    effectiveFromISO: '2024-04-01',
    type2Detail: { basis: 'agreedUnitRate', unitRate: 24 },
  },
  {
    // The Method 3 gate: a billable-party-held contract that explicitly
    // permits an individually arranged (hourly rate) structure. The holder is
    // the Aria clinic BillableParty seeded in patients.ts.
    id: CONTRACT.ariaHourly,
    name: 'Aria Skin and Laser Clinic, individually arranged hourly rate',
    type: 2,
    holderType: 'billableParty',
    holderId: BP.ariaClinic,
    scope: ORGANISATION_SCOPE,
    permitsIndividualArrangement: true,
    isDefault: false,
    effectiveFromISO: '2025-06-01',
    type2Detail: { basis: 'agreedUnitRate', unitRate: 26.5 },
  },
] as const

/**
 * Type 3 price list for the Doyle bariatric contract, including the
 * second-procedure ordinal rule (most specific match wins).
 */
export const CONTRACT_PRICES: readonly ContractPrice[] = [
  { id: 'CP-BAR-1', contractId: CONTRACT.doyleBariatric, rvgBaseCode: '20880', price: 2800 },
  { id: 'CP-BAR-2', contractId: CONTRACT.doyleBariatric, rvgBaseCode: '20882', price: 2400 },
  // Concurrent hernia repair as the SECOND procedure of a bariatric case.
  { id: 'CP-BAR-3', contractId: CONTRACT.doyleBariatric, rvgBaseCode: '49120', procedureOrdinal: 2, price: 950 },
] as const
