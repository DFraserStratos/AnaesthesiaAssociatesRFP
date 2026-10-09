/**
 * Surgeon master helpers (catch-up Phase 17; FT-13.6, US-13.6.1, US-13.6.2,
 * US-13.4.1). Pure, no React.
 *
 * The HPI CPN (OQ-52): for an individual practitioner the HPI number and the
 * CPN are one identifier, the Health Provider Index Common Person Number, the
 * surgeon's unique index (the practitioner's equivalent of a patient's NHI,
 * but never the NHI). This prototype checks only its shape, two digits then
 * four letters (`12ABCD`); the check character and a register lookup are
 * Phase 40a's.
 */

import type { Anaesthetist, Surgeon, SurgeonGroup, SurgeonId, SurgeonRoomId } from './types'

/** Surname order for people named with a title and initials ("Ms A. Reid" sorts as "reid"). */
export function compareBySurname(a: { name: string }, b: { name: string }): number {
  const key = (name: string) => {
    const parts = name.trim().split(/\s+/)
    return (parts[parts.length - 1] ?? name).toLowerCase()
  }
  return key(a.name).localeCompare(key(b.name)) || a.name.localeCompare(b.name)
}

/** The surgeons of a room, derived from `Surgeon.roomId` (the link's one source of truth), by surname. */
export function surgeonsInRoom(surgeons: Readonly<Record<string, Surgeon>>, roomId: SurgeonRoomId): Surgeon[] {
  return Object.values(surgeons)
    .filter((s) => s.roomId === roomId)
    .sort(compareBySurname)
}

/** The groups a surgeon belongs to, by name. */
export function groupsForSurgeon(groups: Readonly<Record<string, SurgeonGroup>>, surgeonId: SurgeonId): SurgeonGroup[] {
  return Object.values(groups)
    .filter((g) => g.memberSurgeonIds.includes(surgeonId))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** A deliberately loose `something@something.tld` check, shared by rooms and hospitals. */
export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Trim and upper-case: how every HPI CPN is stored. */
export function normaliseHpiCpn(value: string): string {
  return value.trim().toUpperCase()
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
    if (s.id !== exclude?.surgeonId && normaliseHpiCpn(s.hpiId) === cpn) return { kind: 'surgeon', id: s.id, name: s.name }
  }
  for (const a of Object.values(masters.anaesthetists)) {
    if (a.registrationNumber !== exclude?.anaesthetistId && normaliseHpiCpn(a.hpiId) === cpn) {
      return { kind: 'anaesthetist', id: a.registrationNumber, name: a.name }
    }
  }
  return null
}
