/**
 * Surgeon master helpers (catch-up Phase 17; FT-13.6, US-13.6.2, US-13.4.1;
 * catch-up Phase 17b: no surgeons' rooms). Pure, no React. The surgeon's
 * contacts and the one office email helper are in `surgeonContacts.ts`.
 *
 * The HPI CPN (OQ-52): for an individual practitioner the HPI number and the
 * CPN are one identifier, the Health Provider Index Common Person Number, the
 * surgeon's unique index (the practitioner's equivalent of a patient's NHI,
 * but never the NHI). This prototype checks only its shape, two digits then
 * four letters (`12ABCD`); the check character and a register lookup are
 * Phase 40a's.
 */

import type { Anaesthetist, Surgeon, SurgeonGroup, SurgeonId } from './types'

/** Surname order for people named with a title and initials ("Ms A. Reid" sorts as "reid"). */
export function compareBySurname(a: { name: string }, b: { name: string }): number {
  const key = (name: string) => {
    const parts = name.trim().split(/\s+/)
    return (parts[parts.length - 1] ?? name).toLowerCase()
  }
  return key(a.name).localeCompare(key(b.name)) || a.name.localeCompare(b.name)
}

/** The groups a surgeon belongs to, by name. */
export function groupsForSurgeon(groups: Readonly<Record<string, SurgeonGroup>>, surgeonId: SurgeonId): SurgeonGroup[] {
  return Object.values(groups)
    .filter((g) => g.memberSurgeonIds.includes(surgeonId))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** A deliberately loose `something@something.tld` check, shared by surgeon contacts and hospitals. */
export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Trim and upper-case: how every HPI CPN is stored. */
export function normaliseHpiCpn(value: string): string {
  return value.trim().toUpperCase()
}

/** The refusal for a malformed HPI CPN, surgeon or anaesthetist (one wording, store and form alike). */
export const HPI_CPN_INVALID = 'That HPI CPN does not look right. It is two digits then four letters, for example 12ABCD.'

/** How a surgeon with no HPI CPN reads, wherever it is shown (catch-up Phase 17b; OQ-129, D76). */
export const NO_HPI_CPN = 'No HPI CPN yet'

/**
 * Whether a surgeon must hold an HPI CPN to be saved (catch-up Phase 17b). The
 * one place this rule lives. OQ-143 part 1 is open; its default (D89, our
 * reading of OQ-129's answer) is never: admin staff fill the number in later,
 * and a surgeon is saved and booked without one, with no warning. A different
 * answer changes this predicate and the edit sheet's "(optional)" label; one
 * that depends on the surgeon's Bookings ("required before the first Booking")
 * also gives it the surgeon and the state to read.
 * The anaesthetist's HPI CPN is separate and stays mandatory (catch-up Phase 26,
 * `checkAnaesthetistHpiCpn` in `store/mastersActions.ts`).
 */
export function surgeonHpiCpnRequired(): boolean {
  return false
}

/** Two digits then four letters (after normalising), e.g. `12ABCD`. */
export function isPlausibleHpiCpn(value: string): boolean {
  return /^\d{2}[A-Z]{4}$/.test(normaliseHpiCpn(value))
}

/**
 * Who already holds this HPI CPN, surgeon or anaesthetist (the identifier is
 * unique across practitioners whichever record is saved first). Pass the
 * record being edited as `exclude` so it never clashes with itself. Blank
 * never clashes.
 */
export function hpiCpnHolder(
  masters: { surgeons: Readonly<Record<string, Surgeon>>; anaesthetists: Readonly<Record<string, Anaesthetist>> },
  value: string,
  exclude?: { surgeonId?: string; anaesthetistId?: string },
): { kind: 'surgeon' | 'anaesthetist'; id: string; name: string } | null {
  const cpn = normaliseHpiCpn(value)
  if (cpn === '') return null
  for (const s of Object.values(masters.surgeons)) {
    if (s.id !== exclude?.surgeonId && normaliseHpiCpn(s.hpiId ?? '') === cpn) return { kind: 'surgeon', id: s.id, name: s.name }
  }
  for (const a of Object.values(masters.anaesthetists)) {
    if (a.registrationNumber !== exclude?.anaesthetistId && normaliseHpiCpn(a.hpiId) === cpn) {
      return { kind: 'anaesthetist', id: a.registrationNumber, name: a.name }
    }
  }
  return null
}
