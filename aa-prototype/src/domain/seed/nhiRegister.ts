/**
 * The demo's synthetic NHI register (catch-up Phase 40a; US-14.4.1). It
 * stands for the national register behind the Digital Services Hub, so it is
 * external data: built once from the seed by `buildNhiRegister`, never put in
 * the store, persisted or touched by reset. `nhiRegister()` is the only
 * accessor.
 */

import { buildNhiRegister, type NhiRegister, type NhiRegisterPerson, type NhiRegisterUpdate } from '../nhiRegister'
import { buildPatients } from './patients'
import { SEED } from './index'

/**
 * What the register knows that AA's record does not yet. Fiona Gray
 * (`PAT.gray`, PT0018) took her married name and moved: the duplicate risk
 * of a new name for one person (the 1 October 2026 meeting, point 23).
 */
export const NHI_REGISTER_UPDATES: Readonly<Record<string, NhiRegisterUpdate>> = {
  ZAM1098: {
    name: 'Fiona Tamihana',
    postalAddress: { line1: '5 Kowhai Lane', suburb: 'Halswell', city: 'Christchurch', postcode: '8025' },
  },
  // Kevin Doherty (`PAT_REVIEW.contactMissing`) has no address on AA's record:
  // the register's is an enrichment ("Will be added" on a refresh).
  ZAQ4425: {
    postalAddress: { line1: '41 Harewood Road', suburb: 'Papanui', city: 'Christchurch', postcode: '8053' },
  },
}

/** Named people on the register who are not AA patients (the demo script's). */
export const NHI_REGISTER_ONLY: readonly Omit<NhiRegisterPerson, 'format'>[] = [
  { nhi: 'ZBR4417', name: 'Mereana Tipene', dobISO: '1981-07-13', ethnicityCode: '21111' },
  { nhi: 'ZBT2253', name: 'Lucas Brennan', dobISO: '1994-12-19', ethnicityCode: '11111' },
  { nhi: 'ZBX41AL', name: 'Ana Fifita', dobISO: '1978-04-07', ethnicityCode: '33111' },
  // S2's phone-advice person, exactly as Phase 01's canned lookup had her.
  { nhi: 'DEM1239', name: 'Demo Patient', dobISO: '1990-05-07', phone: '021 555 0190', ethnicityCode: '11111' },
]

/** Generated people who are not AA patients yet. */
export const NHI_REGISTER_POOL_COUNT = 240

/** The script's "valid, but no one on the register" example. */
export const NHI_NOT_ON_REGISTER = 'ZBW6638'

/**
 * NHIs the pool never takes: the script's not-on-the-register example, and
 * the valid NHIs of the intake fixtures (33's hospital downloads, 34's PDF
 * lists, the matching and office stand-in demos) that no seeded patient
 * holds, so those rows keep the outcomes their phases scripted.
 */
export const NHI_REGISTER_RESERVED: ReadonlySet<string> = new Set([
  NHI_NOT_ON_REGISTER,
  'ACA31FM',
  'TFP7896',
  'ZQA1008',
  'ZQA1024',
  'ZQA1377',
  'ZQA1741',
  'ZQA2110',
  'ZQA2489',
  'ZQA3019',
  'ZQA4333',
  'ZQA4708',
  'ZQA5445',
  'ZQB1003',
  'ZQC1009',
  'ZQD1004',
  'ZQE4017',
  'ZQE4025',
  'ZQE4033',
])

let memo: NhiRegister | undefined

/** The register, built once from the seed. */
export function nhiRegister(): NhiRegister {
  memo ??= buildNhiRegister({
    seed: SEED,
    seededPatients: buildPatients(SEED),
    registerOnly: NHI_REGISTER_ONLY,
    updates: NHI_REGISTER_UPDATES,
    poolCount: NHI_REGISTER_POOL_COUNT,
    reserved: NHI_REGISTER_RESERVED,
  })
  return memo
}
