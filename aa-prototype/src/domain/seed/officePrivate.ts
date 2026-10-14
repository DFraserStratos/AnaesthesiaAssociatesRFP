/**
 * The seeded office-private slice (catch-up Phase 17; OQ-43, D44, US-01.3.6).
 * PRIVATE TO THE OFFICE: read only by the Admin app and the store's office
 * write paths (`src/apps/officePrivacy.test.ts`). Fixed timestamps, never the
 * clock. Chosen against the canvas (seed tests prove it):
 *
 * - Ms A. Reid with Dr Priya Sharma, not preferred, surgeon side: the canvas
 *   never pairs them, so no seeded List collides; S2 Beat 2's surgeon picker
 *   shows Reid apart, and Dr Chen's Tue 21 PM Christchurch Eye Surgery List
 *   (Reid's) shows Sharma apart in Reassign list.
 * - Dr Rawiri Hughes with Ms A. Reid, not preferred, anaesthetist side, ENDED:
 *   Reid's profile shows both sides and the history; Hughes stays clear.
 * - Mr J. Whitford with Dr Priya Sharma, preferred, surgeon side: S2 Beat 3's
 *   reassign (Dr Rutherford's Wed 22 AM, Whitford's) shows Sharma's pill.
 * - Dr Tom Ngata with Ms H. Cameron, preferred, anaesthetist side, so both
 *   kinds show both sides.
 * - Dr Hannah Ropata with Ms G. Lim, not preferred, anaesthetist side
 *   (catch-up Phase 32): the privacy case. Ropata is free on Mon 27 Jul PM
 *   and is offered, like any colleague, when Dr Souter hands on her St
 *   George's List with Ms Lim (US-01.4.5: no warning, nothing revealed).
 *
 * Tiers: the five directors in Tier 1 (the 2026-10-07 meeting), a spread
 * below, and Ropata, Whitaker and Ngatai left with no entry at the Tier 4
 * default. The Wed 22 AM free candidates span every tier.
 */

import type { OfficePrivateSlice, PairingPreference, PriorityTier } from '../types'
import { ANAE, SURG } from './cast'

const OFFICE = 'Kirsty W.'

export const PAIRING_PREFERENCES: readonly PairingPreference[] = [
  {
    id: 'PP-001',
    kind: 'NOT_PREFERRED',
    raisedBy: 'SURGEON',
    anaesthetistId: ANAE.sharma,
    surgeonId: SURG.reid,
    reason: "Surgeon's preference",
    addedAtISO: '2026-03-10T10:00:00',
    addedBy: OFFICE,
  },
  {
    id: 'PP-002',
    kind: 'NOT_PREFERRED',
    raisedBy: 'ANAESTHETIST',
    anaesthetistId: ANAE.hughes,
    surgeonId: SURG.reid,
    reason: 'Asked after a difficult cataract list',
    addedAtISO: '2025-11-03T09:30:00',
    addedBy: OFFICE,
    endedAtISO: '2026-05-12T14:15:00',
    endedBy: OFFICE,
    endReason: "Resolved with the surgeon's rooms",
  },
  {
    id: 'PP-003',
    kind: 'PREFERRED',
    raisedBy: 'SURGEON',
    anaesthetistId: ANAE.sharma,
    surgeonId: SURG.whitford,
    reason: 'Asks for Dr Sharma on long eye lists',
    addedAtISO: '2026-02-18T11:20:00',
    addedBy: OFFICE,
  },
  {
    id: 'PP-004',
    kind: 'PREFERRED',
    raisedBy: 'ANAESTHETIST',
    anaesthetistId: ANAE.ngata,
    surgeonId: SURG.cameron,
    reason: 'Works well together on gynaecology lists',
    addedAtISO: '2026-04-07T15:45:00',
    addedBy: OFFICE,
  },
  // Catch-up Phase 32: the privacy case for an anaesthetist's own move
  // (US-01.4.5). Dr Ropata is free on Mon 27 Jul PM, so she is one of the
  // colleagues Dr Souter can hand her St George's List with Ms Lim on to, and
  // she is offered like any other, with no warning. The canvas never pairs
  // them. A pairing seed entry only: no List changed (Phase 17's rule).
  {
    id: 'PP-005',
    kind: 'NOT_PREFERRED',
    raisedBy: 'ANAESTHETIST',
    anaesthetistId: ANAE.ropata,
    surgeonId: SURG.lim,
    reason: 'Prefers not to do long plastics lists',
    addedAtISO: '2026-06-02T09:10:00',
    addedBy: OFFICE,
  },
] as const

export const PRIORITY_TIERS: Readonly<Record<string, PriorityTier>> = {
  [ANAE.souter]: 1,
  [ANAE.rutherford]: 1,
  [ANAE.morrison]: 1,
  [ANAE.delaney]: 1,
  [ANAE.strand]: 1,
  [ANAE.sharma]: 2,
  [ANAE.chen]: 2,
  [ANAE.fitzgerald]: 2,
  [ANAE.ngata]: 3,
  [ANAE.beaumont]: 3,
  [ANAE.hughes]: 3,
}

export function buildOfficePrivate(): OfficePrivateSlice {
  return {
    pairingPreferences: Object.fromEntries(PAIRING_PREFERENCES.map((p) => [p.id, { ...p }])),
    priorityTiers: { ...PRIORITY_TIERS },
  }
}
