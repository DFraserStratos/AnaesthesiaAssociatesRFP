/**
 * The pairing rule (catch-up Phase 31; US-01.3.1, FT-01.3, EP-01, FT-07.1).
 * Pure: no React, no store, no clock reads.
 *
 * Every List, Draft Lists included, has exactly one hospital (or AA rooms) and
 * one surgeon; every ACTIVE, SUBMITTED or AUTHORISED List also has its
 * anaesthetist and its Slot (day and session). `pairingIssues` is the ONE
 * implementation of US-01.3.1: every store write path calls it and nothing
 * checks the pairing inline. Not to be confused with Phase 17's
 * `pairingPreferences.ts` (who prefers to work with whom); neither imports the
 * other.
 */

import type { Hospital, List } from './types'

export interface PairingInput {
  hospitalId?: string | null
  surgeonId?: string | null
}

export interface PairingMasters {
  hospitals: Readonly<Record<string, unknown>>
  surgeons: Readonly<Record<string, unknown>>
}

export type PairingIssueCode = 'hospitalRequired' | 'surgeonRequired' | 'hospitalUnknown' | 'surgeonUnknown'

export interface PairingIssue {
  code: PairingIssueCode
  message: string
}

const blank = (v: string | null | undefined): boolean => v === undefined || v === null || v.trim() === ''

/**
 * What is missing or wrong in a List's pairing, in plain words (US-01.3.1).
 * Empty when the pairing is complete. The hospital comes first, as the hospital
 * booking always comes first (OQ-44).
 */
export function pairingIssues(input: PairingInput, masters: PairingMasters): PairingIssue[] {
  const issues: PairingIssue[] = []
  if (blank(input.hospitalId)) issues.push({ code: 'hospitalRequired', message: 'Choose the hospital.' })
  else if (masters.hospitals[input.hospitalId!] === undefined) {
    issues.push({ code: 'hospitalUnknown', message: 'That hospital is not in the master data.' })
  }
  if (blank(input.surgeonId)) issues.push({ code: 'surgeonRequired', message: 'Choose the surgeon.' })
  else if (masters.surgeons[input.surgeonId!] === undefined) {
    issues.push({ code: 'surgeonUnknown', message: 'That surgeon is not in the master data.' })
  }
  return issues
}

/**
 * FT-07.1: a List is ACTIVE exactly when it has all five of its pairing, an
 * anaesthetist and its Slot (day and session), a surgeon and a hospital. The
 * store-wide invariant test reads this.
 */
export function isActivePairing(list: Pick<List, 'dateISO' | 'session' | 'hospitalId' | 'surgeonId' | 'anaesthetistId' | 'slotId'>): boolean {
  return (
    !blank(list.anaesthetistId) &&
    !blank(list.slotId) &&
    !blank(list.dateISO) &&
    (list.session === 'AM' || list.session === 'PM') &&
    !blank(list.hospitalId) &&
    !blank(list.surgeonId)
  )
}

/** True when the location is AA's own rooms (the pre-op clinic), not a hospital. */
export function isAaRooms(hospitalId: string | undefined, hospitals: Readonly<Record<string, Pick<Hospital, 'locationType'>>>): boolean {
  return hospitalId !== undefined && hospitals[hospitalId]?.locationType === 'aaRooms'
}

/**
 * The hospital a List's billing and Contract resolution may read (catch-up
 * Phase 31). AA rooms is a location, never a Contract holder, a hospital feed or
 * a sync target, so a List held there resolves exactly as one with no hospital
 * did before the location existed: no fee, Contract or source moves.
 */
export function billingHospitalId(
  hospitalId: string | undefined,
  hospitals: Readonly<Record<string, Pick<Hospital, 'locationType'>>>,
): string | undefined {
  return isAaRooms(hospitalId, hospitals) ? undefined : hospitalId
}

/** `billingHospitalId` as the billing contexts spread it: `{ listHospitalId }`, or nothing at AA rooms. */
export function listHospitalFor(
  list: { hospitalId: string },
  hospitals: Readonly<Record<string, Pick<Hospital, 'locationType'>>>,
): { listHospitalId?: string } {
  const id = billingHospitalId(list.hospitalId, hospitals)
  return id === undefined ? {} : { listHospitalId: id }
}
