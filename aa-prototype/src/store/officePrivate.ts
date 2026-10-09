/**
 * Office-private store actions and selectors (catch-up Phase 17; OQ-43, D44,
 * US-13.6.3, US-13.6.4, US-01.3.6, DM-54): pairing preferences and priority
 * tiers.
 *
 * PRIVATE TO THE OFFICE. This module is deliberately NOT re-exported from the
 * `src/store` barrel (the PWA imports the barrel); the Admin app imports it by
 * path. `src/apps/officePrivacy.test.ts` fails if a mobile, web, PWA, shell,
 * demo or (non-audit) shared file names it, or if the PWA's import closure
 * reaches it. Every action is office-only.
 */

import type { AnaesthetistId, PairingKind, PairingPreference, PairingSide, PriorityTier, SurgeonId } from '../domain/types'
import {
  DEFAULT_PRIORITY_TIER,
  PAIRING_LABELS,
  comparePairings,
  isPriorityTier,
  pairingsFor,
  tierFor,
  tierLabel,
} from '../domain/pairingPreferences'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

const KINDS: readonly PairingKind[] = ['NOT_PREFERRED', 'PREFERRED']
const SIDES: readonly PairingSide[] = ['SURGEON', 'ANAESTHETIST']

export interface NewPairingFields {
  kind: PairingKind
  raisedBy: PairingSide
  anaesthetistId: AnaesthetistId
  surgeonId: SurgeonId
  reason?: string
}

/**
 * Record a pairing preference (either kind, either side). Refuses an unknown
 * kind, side, anaesthetist or surgeon; an active entry for the same pair on
 * the same side and of the same kind (a duplicate); and one of the other kind
 * on the same side (a contradiction: end it first). The other side of a pair
 * may be added, so both sides can be active. Re-adding after an end creates a
 * new entry. Audited `pairing.add`.
 */
export function addPairingPreference(api: AppStoreApi, actor: Actor, fields: NewPairingFields): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can record a pairing preference.')
  if (!KINDS.includes(fields.kind)) return refuse('invalidKind', 'Choose Not preferred or Preferred.')
  if (!SIDES.includes(fields.raisedBy)) return refuse('invalidSide', 'Choose which side asked.')
  const state = api.getState()
  const anaesthetist = state.masters.anaesthetists[fields.anaesthetistId]
  if (anaesthetist === undefined) return refuse('notFound', 'Anaesthetist not found.')
  const surgeon = state.masters.surgeons[fields.surgeonId]
  if (surgeon === undefined) return refuse('notFound', 'Surgeon not found.')

  const sameSide = pairingsFor(state.officePrivate.pairingPreferences, fields.anaesthetistId, fields.surgeonId).filter(
    (e) => e.raisedBy === fields.raisedBy,
  )
  const asker = fields.raisedBy === 'SURGEON' ? surgeon.name : anaesthetist.name
  const other = fields.raisedBy === 'SURGEON' ? anaesthetist.name : surgeon.name
  const duplicate = sameSide.find((e) => e.kind === fields.kind)
  if (duplicate !== undefined) {
    return refuse('duplicatePairing', `${asker} already has a ${PAIRING_LABELS.kind[fields.kind]} entry with ${other}.`)
  }
  const contradiction = sameSide.find((e) => e.kind !== fields.kind)
  if (contradiction !== undefined) {
    return refuse(
      'contradictoryPairing',
      `${asker} already has a ${PAIRING_LABELS.kind[contradiction.kind]} entry with ${other}. End it first.`,
    )
  }

  const reason = fields.reason?.trim() ?? ''
  const metas: MutationMeta[] = []
  let id = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'pairingPreference')
    id = alloc.id
    const entry: PairingPreference = {
      id,
      kind: fields.kind,
      raisedBy: fields.raisedBy,
      anaesthetistId: fields.anaesthetistId,
      surgeonId: fields.surgeonId,
      addedAtISO: clockISO(s.clock),
      addedBy: actor.who,
      ...(reason !== '' ? { reason } : {}),
    }
    metas.push({
      entityType: 'pairingPreference',
      entityId: id,
      action: 'pairing.add',
      after: {
        kind: entry.kind,
        raisedBy: entry.raisedBy,
        anaesthetistId: entry.anaesthetistId,
        surgeonId: entry.surgeonId,
        ...(reason !== '' ? { reason } : {}),
      },
      stampBookingId: null,
    })
    return {
      officePrivate: { ...s.officePrivate, pairingPreferences: { ...s.officePrivate.pairingPreferences, [id]: entry } },
      counters: alloc.counters,
    }
  })
  return ok({ id })
}

/** End a pairing preference. The record is kept (history); a second end is refused. Audited `pairing.end`. */
export function endPairingPreference(api: AppStoreApi, actor: Actor, entryId: string, endReason?: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can end a pairing preference.')
  const state = api.getState()
  const existing = state.officePrivate.pairingPreferences[entryId]
  if (existing === undefined) return refuse('notFound', 'Pairing preference not found.')
  if (existing.endedAtISO !== undefined) return refuse('alreadyEnded', 'That pairing preference has already been ended.')
  const reason = endReason?.trim() ?? ''
  const at = clockISO(state.clock)
  const next: PairingPreference = { ...existing, endedAtISO: at, endedBy: actor.who, ...(reason !== '' ? { endReason: reason } : {}) }
  mutate(
    api,
    actor,
    {
      entityType: 'pairingPreference',
      entityId: entryId,
      action: 'pairing.end',
      before: { endedAtISO: '' },
      after: { endedAtISO: at, endedBy: actor.who, ...(reason !== '' ? { endReason: reason } : {}) },
      stampBookingId: null,
    },
    (s) => ({
      officePrivate: { ...s.officePrivate, pairingPreferences: { ...s.officePrivate.pairingPreferences, [entryId]: next } },
    }),
  )
  return ok(undefined)
}

/**
 * Set an anaesthetist's priority tier (US-01.3.6). Setting the default tier
 * removes the entry, so "no entry" and "Tier 4" are one state. Audited
 * `anaesthetist.tierSet` on the anaesthetist entity, before and after.
 */
export function setPriorityTier(api: AppStoreApi, actor: Actor, anaesthetistId: AnaesthetistId, tier: PriorityTier): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can set a priority tier.')
  if (!isPriorityTier(tier)) return refuse('invalidTier', 'Choose a tier from 1 to 4.')
  const state = api.getState()
  if (state.masters.anaesthetists[anaesthetistId] === undefined) return refuse('notFound', 'Anaesthetist not found.')
  const before = tierFor(state.officePrivate.priorityTiers, anaesthetistId)
  if (before === tier) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'anaesthetist',
      entityId: anaesthetistId,
      action: 'anaesthetist.tierSet',
      before: { tier: before },
      after: { tier },
      stampBookingId: null,
    },
    (s) => {
      const priorityTiers = { ...s.officePrivate.priorityTiers }
      if (tier === DEFAULT_PRIORITY_TIER) delete priorityTiers[anaesthetistId]
      else priorityTiers[anaesthetistId] = tier
      return { officePrivate: { ...s.officePrivate, priorityTiers } }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Selectors (Admin only)
// ---------------------------------------------------------------------------

export function selectPairingPreferences(s: AppState): AppState['officePrivate']['pairingPreferences'] {
  return s.officePrivate.pairingPreferences
}

/** Every entry (active and ended) for a surgeon, in a stable order. */
export function selectPairingsForSurgeon(s: AppState, surgeonId: SurgeonId): PairingPreference[] {
  return Object.values(s.officePrivate.pairingPreferences)
    .filter((e) => e.surgeonId === surgeonId)
    .sort(comparePairings)
}

/** Every entry (active and ended) for an anaesthetist, in a stable order. */
export function selectPairingsForAnaesthetist(s: AppState, anaesthetistId: AnaesthetistId): PairingPreference[] {
  return Object.values(s.officePrivate.pairingPreferences)
    .filter((e) => e.anaesthetistId === anaesthetistId)
    .sort(comparePairings)
}

export function selectPriorityTiers(s: AppState): AppState['officePrivate']['priorityTiers'] {
  return s.officePrivate.priorityTiers
}

/** The anaesthetist's tier, the default when there is no entry. */
export function selectPriorityTier(s: AppState, anaesthetistId: AnaesthetistId): PriorityTier {
  return tierFor(s.officePrivate.priorityTiers, anaesthetistId)
}

/** The tier's display label (from the one label set). */
export function priorityTierLabel(s: AppState, anaesthetistId: AnaesthetistId): string {
  return tierLabel(selectPriorityTier(s, anaesthetistId))
}
