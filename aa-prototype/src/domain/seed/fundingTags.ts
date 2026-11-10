/**
 * Seed funding tags (catch-up Phase 18a; US-13.4.5; AR-58 2.6 and 8.2), in
 * step-rail order: SXAP, HNZ, ACC, each naming its funder Party (our reading
 * A25): Southern Cross Health Society, Health NZ, ACC. Fixed ids.
 */

import type { FundingTag } from '../types'
import { PARTY } from './parties'

export const TAG = {
  sxap: 'TAG-SXAP',
  hnz: 'TAG-HNZ',
  acc: 'TAG-ACC',
} as const

export const FUNDING_TAGS: readonly FundingTag[] = [
  { id: TAG.sxap, code: 'SXAP', order: 1, funderPartyId: PARTY.schs },
  { id: TAG.hnz, code: 'HNZ', order: 2, funderPartyId: PARTY.healthNz },
  { id: TAG.acc, code: 'ACC', order: 3, funderPartyId: PARTY.acc },
]
