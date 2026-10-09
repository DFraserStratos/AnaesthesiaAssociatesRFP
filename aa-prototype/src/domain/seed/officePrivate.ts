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
