/**
 * Pairing preferences and priority tiers (catch-up Phase 17; US-13.6.3,
 * US-13.6.4, US-01.3.5, US-01.3.6, DM-54). One rule, one place: every
 * grouping, tier ordering, within-tier shuffle, filter and warning the office
 * sees when it pairs a surgeon with an anaesthetist comes from here, so the
 * Admin pickers, the store's acknowledgement, Phase 28's availability finder
 * and Phase 31's Draft List assignment all agree.
 *
 * PRIVATE TO THE OFFICE (OQ-43, D44). Only the Admin app and the store's
 * office write paths may import this module; `src/apps/officePrivacy.test.ts`
 * fails if a mobile, web, PWA, shell, demo or (non-audit) shared file does.
 * An anaesthetist's own hand-on of a List never calls it (US-01.4.5).
 *
 * The names are OQ-102's, still open: built as owner decision D36's default
 * ("Not preferred", "Preferred", Tier 1 to Tier 4 with Tier 4 the default).
 * Every user-facing kind, tier and side word builds from PAIRING_LABELS and
 * TIER_LABELS below, so AA's names are one edit.
 */

import { mulberry32 } from './rng'
import { hashStringToSeed } from './seed/slotHash'
import { compareBySurname } from './surgeons'
import type {
  Anaesthetist,
  AnaesthetistId,
  PairingKind,
  PairingPreference,
  PairingSide,
  PriorityTier,
  Surgeon,
  SurgeonId,
} from './types'

// ---------------------------------------------------------------------------
// The one label set (OQ-102, D36)
// ---------------------------------------------------------------------------

export const PAIRING_LABELS = {
  /** Section title on both profiles. */
  section: 'Pairing preferences',
  /** One entry, in sentence case (audit labels: "Pairing preference added"). */
  entry: 'Pairing preference',
  kind: { NOT_PREFERRED: 'Not preferred', PREFERRED: 'Preferred' } as Record<PairingKind, string>,
  side: { SURGEON: 'Surgeon', ANAESTHETIST: 'Anaesthetist' } as Record<PairingSide, string>,
  /** The verb phrase of the side sentence, per kind. */
  verb: { NOT_PREFERRED: 'prefers not to work with', PREFERRED: 'prefers to work with' } as Record<PairingKind, string>,
  /** The picker's separate group: "Not preferred with Dr Sharma". */
  notPreferredWith: (name: string): string => `Not preferred with ${name}`,
  /** Option suffix in a native select: "Ms A. Reid · not preferred". */
  optionSuffix: (kind: PairingKind): string => ` · ${PAIRING_LABELS.kind[kind].toLowerCase()}`,
  /** The warning when both sides have an active not-preferred entry. */
  bothAsked: (anaesthetistName: string, surgeonName: string): string =>
    `${anaesthetistName} and ${surgeonName} have each asked not to be paired.`,
} as const

export const TIER_VALUES: readonly PriorityTier[] = [1, 2, 3, 4] as const

export const TIER_LABELS: Record<PriorityTier, string> = {
  1: 'Tier 1',
  2: 'Tier 2',
  3: 'Tier 3',
  4: 'Tier 4',
}

/** True while OQ-102 is open: the tier control shows one mist line saying so. */
export const TIER_NAMES_PROVISIONAL = true

/** An anaesthetist with no tier entry, a new one included, sits here (US-01.3.6 "Default"). */
export const DEFAULT_PRIORITY_TIER: PriorityTier = 4

export function tierLabel(tier: PriorityTier): string {
  return TIER_LABELS[tier]
}

export function isPriorityTier(value: unknown): value is PriorityTier {
  return value === 1 || value === 2 || value === 3 || value === 4
}

export function tierFor(tiers: Readonly<Record<AnaesthetistId, PriorityTier>>, anaesthetistId: AnaesthetistId): PriorityTier {
  return tiers[anaesthetistId] ?? DEFAULT_PRIORITY_TIER
}

/**
 * The side sentence, the one place either direction is worded:
 * "Ms A. Reid prefers not to work with Dr Priya Sharma" (surgeon asked) or
 * "Dr Priya Sharma prefers not to work with Ms A. Reid" (anaesthetist asked).
 */
export function pairingSentence(kind: PairingKind, side: PairingSide, anaesthetistName: string, surgeonName: string): string {
  const [asker, other] = side === 'SURGEON' ? [surgeonName, anaesthetistName] : [anaesthetistName, surgeonName]
  return `${asker} ${PAIRING_LABELS.verb[kind]} ${other}`
}

/** Audit codes that only office histories may show (the privacy test checks no anaesthetist history reaches them). */
export const OFFICE_PRIVATE_AUDIT_ACTIONS: ReadonlySet<string> = new Set([
  'pairing.add',
  'pairing.end',
  'anaesthetist.tierSet',
  'list.pairingAcknowledged',
  'permanentList.pairingAcknowledged',
])

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

export type PairingEntries = Readonly<Record<string, PairingPreference>> | readonly PairingPreference[]

function listOf(entries: PairingEntries): readonly PairingPreference[] {
  return Array.isArray(entries) ? (entries as readonly PairingPreference[]) : Object.values(entries)
}

export function isActivePairing(entry: PairingPreference): boolean {
  return entry.endedAtISO === undefined
}

const KIND_ORDER: Record<PairingKind, number> = { NOT_PREFERRED: 0, PREFERRED: 1 }
const SIDE_ORDER: Record<PairingSide, number> = { SURGEON: 0, ANAESTHETIST: 1 }

/** Stable order: not preferred first, surgeon side first, then oldest first. */
export function comparePairings(a: PairingPreference, b: PairingPreference): number {
  return (
    KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
    SIDE_ORDER[a.raisedBy] - SIDE_ORDER[b.raisedBy] ||
    a.addedAtISO.localeCompare(b.addedAtISO) ||
    a.id.localeCompare(b.id)
  )
}

export function activePairings(entries: PairingEntries): PairingPreference[] {
  return listOf(entries).filter(isActivePairing).sort(comparePairings)
}

/** The active entries for one pair, any kind, either side, in a stable order. */
export function pairingsFor(entries: PairingEntries, anaesthetistId: AnaesthetistId, surgeonId: SurgeonId): PairingPreference[] {
  return listOf(entries)
    .filter((e) => isActivePairing(e) && e.anaesthetistId === anaesthetistId && e.surgeonId === surgeonId)
    .sort(comparePairings)
}

export type PairingStatus = PairingKind | 'NONE'

/** Not preferred on either side wins over preferred on the other. */
export function pairingStatus(entries: PairingEntries, anaesthetistId: AnaesthetistId, surgeonId: SurgeonId): PairingStatus {
  const active = pairingsFor(entries, anaesthetistId, surgeonId)
  if (active.some((e) => e.kind === 'NOT_PREFERRED')) return 'NOT_PREFERRED'
  if (active.some((e) => e.kind === 'PREFERRED')) return 'PREFERRED'
  return 'NONE'
}

/** The active not-preferred entry ids for a pair: what an office write path records when it goes ahead anyway. */
export function notPreferredEntryIds(
  entries: PairingEntries,
  anaesthetistId: AnaesthetistId | undefined,
  surgeonId: SurgeonId | null | undefined,
): string[] {
  if (anaesthetistId === undefined || anaesthetistId === '' || surgeonId === undefined || surgeonId === null || surgeonId === '') return []
  return pairingsFor(entries, anaesthetistId, surgeonId)
    .filter((e) => e.kind === 'NOT_PREFERRED')
    .map((e) => e.id)
}

/**
 * What an office write path records, in the same commit, when it goes ahead
 * with a not-preferred pairing (`list.pairingAcknowledged`,
 * `permanentList.pairingAcknowledged`). Null when the pair has no active
 * not-preferred entry (a preferred pairing records nothing). The caller
 * decides whether the pairing actually changed and whether the actor is the
 * office; an anaesthetist's own write never calls this (US-01.4.5).
 */
export function pairingAcknowledgement(
  entries: PairingEntries,
  anaesthetistId: AnaesthetistId | undefined,
  surgeonId: SurgeonId | null | undefined,
): { anaesthetistId: AnaesthetistId; surgeonId: SurgeonId; pairingPreferenceIds: string[] } | null {
  const ids = notPreferredEntryIds(entries, anaesthetistId, surgeonId)
  if (ids.length === 0 || anaesthetistId === undefined || surgeonId === undefined || surgeonId === null) return null
  return { anaesthetistId, surgeonId, pairingPreferenceIds: ids }
}

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

export interface SurgeonOption {
  surgeon: Surgeon
  preferred: boolean
}

/**
 * Surgeons for an anaesthetist's session (US-01.3.5 first picker bullet):
 * those with an active not-preferred entry with this anaesthetist, either
 * side, in their own group; preferred ones marked. Each group by surname.
 * With no anaesthetist, everyone is clear.
 */
export function groupSurgeonsForAnaesthetist(input: {
  surgeons: Readonly<Record<string, Surgeon>> | readonly Surgeon[]
  entries: PairingEntries
  anaesthetistId: AnaesthetistId | undefined
}): { clear: SurgeonOption[]; notPreferred: SurgeonOption[] } {
  const surgeons = Array.isArray(input.surgeons) ? (input.surgeons as readonly Surgeon[]) : Object.values(input.surgeons)
  const sorted = [...surgeons].sort(compareBySurname)
  const clear: SurgeonOption[] = []
  const notPreferred: SurgeonOption[] = []
  for (const surgeon of sorted) {
    const status = input.anaesthetistId === undefined || input.anaesthetistId === '' ? 'NONE' : pairingStatus(input.entries, input.anaesthetistId, surgeon.id)
    if (status === 'NOT_PREFERRED') notPreferred.push({ surgeon, preferred: false })
    else clear.push({ surgeon, preferred: status === 'PREFERRED' })
  }
  return { clear, notPreferred }
}

export interface RankedCandidate {
  anaesthetistId: AnaesthetistId
  tier: PriorityTier
  preferred: boolean
  notPreferredEntries: PairingPreference[]
}

/**
 * Candidate anaesthetists for a List's surgeon (US-01.3.5 second bullet,
 * US-01.3.6). Not-preferred candidates (either side) go to their own group;
 * each group is ordered by tier, Tier 1 first, and shuffled within a tier by
 * a seeded shuffle keyed on `requestKey` (never Math.random, never the
 * clock: the same key replays the same order). Preferred pairings are marked,
 * not lifted (the room never said they should change the order). With no
 * surgeon, everyone is clear. `tierFilter` narrows both groups.
 */
export function rankAnaesthetistCandidates(input: {
  candidates: readonly AnaesthetistId[]
  entries: PairingEntries
  tiers: Readonly<Record<AnaesthetistId, PriorityTier>>
  surgeonId: SurgeonId | undefined | null
  requestKey: string
  tierFilter?: ReadonlySet<PriorityTier> | null
}): { clear: RankedCandidate[]; notPreferred: RankedCandidate[] } {
  // Shuffle from a canonical (sorted, de-duplicated) order so the result
  // depends on the key alone, never on the caller's input order.
  const ids = [...new Set(input.candidates)].sort()
  const rng = mulberry32(hashStringToSeed(input.requestKey))
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const swap = ids[i] as string
    ids[i] = ids[j] as string
    ids[j] = swap
  }
  const ranked = ids
    .map((anaesthetistId): RankedCandidate => {
      const tier = tierFor(input.tiers, anaesthetistId)
      if (input.surgeonId === undefined || input.surgeonId === null || input.surgeonId === '') {
        return { anaesthetistId, tier, preferred: false, notPreferredEntries: [] }
      }
      const active = pairingsFor(input.entries, anaesthetistId, input.surgeonId)
      const notPreferredEntries = active.filter((e) => e.kind === 'NOT_PREFERRED')
      return {
        anaesthetistId,
        tier,
        preferred: notPreferredEntries.length === 0 && active.some((e) => e.kind === 'PREFERRED'),
        notPreferredEntries,
      }
    })
    // Array.prototype.sort is stable, so the shuffle survives within a tier.
    .sort((a, b) => a.tier - b.tier)
    .filter((c) => input.tierFilter === undefined || input.tierFilter === null || input.tierFilter.has(c.tier))
  return {
    clear: ranked.filter((c) => c.notPreferredEntries.length === 0),
    notPreferred: ranked.filter((c) => c.notPreferredEntries.length > 0),
  }
}

// ---------------------------------------------------------------------------
// The warning
// ---------------------------------------------------------------------------

export interface NotPreferredWarning {
  anaesthetistName: string
  surgeonName: string
  entries: { entryId: string; raisedBy: PairingSide; reason?: string }[]
  /** Names both people and the side, e.g. "Ms A. Reid prefers not to work with Dr Priya Sharma." */
  message: string
}

/**
 * The soft warning before the office saves a not-preferred pairing
 * (US-01.3.5 "Warned"; US-13.6.3 "Warns admin, never blocks"). Null when the
 * pair has no active not-preferred entry, or an id is missing or unknown. A
 * preferred pairing never warns.
 */
export function notPreferredWarning(
  masters: { anaesthetists: Readonly<Record<string, Anaesthetist>>; surgeons: Readonly<Record<string, Surgeon>> },
  entries: PairingEntries,
  anaesthetistId: AnaesthetistId | undefined | null,
  surgeonId: SurgeonId | undefined | null,
): NotPreferredWarning | null {
  if (anaesthetistId === undefined || anaesthetistId === null || anaesthetistId === '') return null
  if (surgeonId === undefined || surgeonId === null || surgeonId === '') return null
  const anaesthetist = masters.anaesthetists[anaesthetistId]
  const surgeon = masters.surgeons[surgeonId]
  if (anaesthetist === undefined || surgeon === undefined) return null
  const found = pairingsFor(entries, anaesthetistId, surgeonId).filter((e) => e.kind === 'NOT_PREFERRED')
  if (found.length === 0) return null
  const sides = new Set(found.map((e) => e.raisedBy))
  const first = found[0] as PairingPreference
  const message =
    sides.size > 1
      ? PAIRING_LABELS.bothAsked(anaesthetist.name, surgeon.name)
      : `${pairingSentence('NOT_PREFERRED', first.raisedBy, anaesthetist.name, surgeon.name)}.`
  return {
    anaesthetistName: anaesthetist.name,
    surgeonName: surgeon.name,
    entries: found.map((e) => (e.reason !== undefined ? { entryId: e.id, raisedBy: e.raisedBy, reason: e.reason } : { entryId: e.id, raisedBy: e.raisedBy })),
    message,
  }
}
