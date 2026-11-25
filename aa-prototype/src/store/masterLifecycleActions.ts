/**
 * Retire and reinstate (catch-up Phase 42; US-13.4.1): hospitals, surgeons
 * and AA's own modifiers are retired with a stated reason when
 * nothing upcoming depends on them, never deleted, and reinstated by the
 * office. Each is one audited `mutate()` commit (`<kind>.retire`,
 * `<kind>.reinstate`). The blockers are `retireBlockers`' sentences
 * (`domain/masterLifecycle.ts`), from facts gathered here.
 *
 * Also here: the edit of an AA modifier (19b's handoff), the rename that
 * follows through to a linked Party, and the one refusal every write path
 * uses for a retired hospital or surgeon (`retiredRefusal`), which lets an
 * unchanged value through so an old List at a retired hospital still saves.
 */

import type { Party } from '../domain/types'
import type { Modifier } from '../domain/billing/modifiers'
import { isBackdropList } from '../domain/conflicts'
import { isRetired, retireBlockers, type RetireFacts, type RetireKind } from '../domain/masterLifecycle'
import { mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

const OFFICE_ONLY: Record<RetireKind, string> = {
  hospital: 'Only the office can retire a hospital.',
  surgeon: 'Only the office can retire a surgeon.',
  aaModifier: "Only the office can retire AA's own modifiers.",
}

const NOT_FOUND: Record<RetireKind, string> = {
  hospital: 'Hospital not found.',
  surgeon: 'Surgeon not found.',
  aaModifier: 'Modifier not found.',
}

/** The entity type and audit prefix of each kind (an AA modifier audits as `modifier`). */
const ENTITY: Record<RetireKind, string> = { hospital: 'hospital', surgeon: 'surgeon', aaModifier: 'modifier' }

/** The audit action codes, written out so the label check can find them (an AA modifier audits as `modifier`). */
const RETIRE_ACTION: Record<RetireKind, { action: string }> = {
  hospital: { action: 'hospital.retire' },
  surgeon: { action: 'surgeon.retire' },
  aaModifier: { action: 'modifier.retire' },
}
const REINSTATE_ACTION: Record<RetireKind, { action: string }> = {
  hospital: { action: 'hospital.reinstate' },
  surgeon: { action: 'surgeon.reinstate' },
  aaModifier: { action: 'modifier.reinstate' },
}

type Masters = AppState['masters']
type Record_ = { id: string; name?: string; code?: string; retiredAtISO?: string; retiredReason?: string }

function recordOf(masters: Masters, kind: RetireKind, id: string): Record_ | undefined {
  switch (kind) {
    case 'hospital':
      return masters.hospitals[id]
    case 'surgeon':
      return masters.surgeons[id]
    case 'aaModifier':
      return masters.modifiers[id]
  }
}

function nameOf(kind: RetireKind, record: Record_): string {
  return kind === 'aaModifier' ? (record.code ?? record.id) : (record.name ?? record.id)
}

/** What depends on a record, for `retireBlockers` (and the edit sheet's warning list). */
export function retireFactsFor(state: Pick<AppState, 'masters' | 'schedule' | 'clock'>, kind: RetireKind, id: string): RetireFacts | null {
  const record = recordOf(state.masters, kind, id)
  if (record === undefined) return null
  const name = nameOf(kind, record)
  const today = state.clock.todayISO
  if (kind === 'aaModifier') return { name }
  const field = kind === 'hospital' ? 'hospitalId' : 'surgeonId'
  let upcomingLists = 0
  let upcomingDraftLists = 0
  for (const l of Object.values(state.schedule.lists)) {
    if (l[field] !== id || l.dateISO < today || l.removedAtISO !== undefined || l.state === 'AUTHORISED' || isBackdropList(l)) continue
    if (l.state === 'DRAFT') upcomingDraftLists += 1
    else upcomingLists += 1
  }
  const activeRecurringBookings = Object.values(state.masters.recurringBookings).filter(
    (r) => r[field] === id && r.retiredAtISO === undefined && (r.effectiveToISO === undefined || r.effectiveToISO >= today),
  ).length
  const facts: RetireFacts = { name, upcomingLists, upcomingDraftLists, activeRecurringBookings }
  if (kind === 'hospital') {
    if (state.masters.hospitals[id]?.locationType === 'aaRooms') return { name, builtIn: true }
    const party = Object.values(state.masters.parties).find((p) => p.kind === 'hospital' && p.hospitalId === id)
    if (party !== undefined) {
      const count = Object.values(state.masters.contracts).filter((c) => c.holderId === party.id && c.status === 'active').length
      if (count > 0) facts.partyActiveContracts = { partyName: party.name, count }
    }
  } else {
    // An Active Contract this surgeon is the last unretired link of (no anaesthetist linked): retiring them would
    // leave it linked only to retired surgeons, which the step rail stops offering (`linkedOnlyToRetiredSurgeons`).
    facts.soleLinkContracts = Object.values(state.masters.contracts).filter(
      (c) =>
        c.status === 'active' &&
        c.linkedAnaesthetistId === undefined &&
        c.linkedSurgeonIds.includes(id) &&
        c.linkedSurgeonIds.every((s) => s === id || isRetired(state.masters.surgeons[s])),
    ).length
  }
  return facts
}

function write(masters: Masters, kind: RetireKind, id: string, next: Record_): Masters {
  switch (kind) {
    case 'hospital':
      return { ...masters, hospitals: { ...masters.hospitals, [id]: next as Masters['hospitals'][string] } }
    case 'surgeon':
      return { ...masters, surgeons: { ...masters.surgeons, [id]: next as Masters['surgeons'][string] } }
    case 'aaModifier':
      return { ...masters, modifiers: { ...masters.modifiers, [id]: next as Modifier } }
  }
}

/**
 * Retire a hospital, surgeon or AA modifier with a reason. Refused for
 * any actor but the office, an unknown or already retired record, a blank
 * reason, an RVG-table modifier, and while anything upcoming depends on it
 * (`inUse`, the blockers' sentences joined). Audited `<kind>.retire`.
 */
export function retireMaster(api: AppStoreApi, actor: Actor, kind: RetireKind, id: string, reason: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY[kind])
  const state = api.getState()
  const record = recordOf(state.masters, kind, id)
  if (record === undefined) return refuse('notFound', NOT_FOUND[kind])
  if (kind === 'aaModifier' && (record as Modifier).source !== 'aa') {
    return refuse('rvgModifier', 'RVG modifiers are as printed and cannot be retired.')
  }
  if (isRetired(record)) return refuse('alreadyRetired', `${nameOf(kind, record)} is already retired.`)
  const why = reason.trim()
  if (why === '') return refuse('reasonRequired', 'Say why it is being retired.')
  const blockers = retireBlockers(kind, retireFactsFor(state, kind, id)!)
  if (blockers.length > 0) return refuse('inUse', blockers.join(' '), { blockers })
  const today = state.clock.todayISO
  mutate(
    api,
    actor,
    { entityType: ENTITY[kind], entityId: id, action: RETIRE_ACTION[kind].action, after: { reason: why, retiredOn: today }, stampBookingId: null },
    (s) => ({ masters: write(s.masters, kind, id, { ...record, retiredAtISO: today, retiredReason: why }) }),
  )
  return ok(undefined)
}

/** Bring a retired record back. Audited `<kind>.reinstate` with the reason it was retired for. */
export function reinstateMaster(api: AppStoreApi, actor: Actor, kind: RetireKind, id: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY[kind].replace('retire', 'reinstate'))
  const state = api.getState()
  const record = recordOf(state.masters, kind, id)
  if (record === undefined) return refuse('notFound', NOT_FOUND[kind])
  if (!isRetired(record)) return refuse('notRetired', `${nameOf(kind, record)} is not retired.`)
  const { retiredAtISO, retiredReason, ...rest } = record
  mutate(
    api,
    actor,
    {
      entityType: ENTITY[kind],
      entityId: id,
      action: REINSTATE_ACTION[kind].action,
      before: { reason: retiredReason ?? '', retiredOn: retiredAtISO },
      stampBookingId: null,
    },
    (s) => ({ masters: write(s.masters, kind, id, rest) }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// AA's own modifiers (19b's handoff)
// ---------------------------------------------------------------------------

export interface AaModifierPatch {
  factor: string
  /** A whole number of 0 or more. */
  units: number
}

/**
 * Edit one of AA's own modifiers: the factor and units, never the code (claims
 * keep it). The RVG table's rows are as printed and refused. An ACTIVE
 * Procedure's M total follows the edit (prices are derived); a locked one
 * keeps its snapshot. Audited `modifier.update` with before and after.
 */
export function editAaModifier(api: AppStoreApi, actor: Actor, id: string, patch: AaModifierPatch): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', "Only the office can change AA's own modifiers.")
  const state = api.getState()
  const prev = state.masters.modifiers[id]
  if (prev === undefined) return refuse('notFound', 'Modifier not found.')
  if (prev.source !== 'aa') return refuse('rvgModifier', 'RVG modifiers are as printed and cannot be changed.')
  const factor = patch.factor.trim().replace(/\s+/g, ' ')
  if (factor === '') return refuse('factorRequired', 'Describe the modifying factor.')
  if (!Number.isInteger(patch.units) || patch.units < 0) return refuse('unitsInvalid', 'Units must be a whole number of 0 or more.')
  if (factor === prev.factor && patch.units === prev.units) return ok(undefined)
  const next: Modifier = { ...prev, factor, units: patch.units, unitsAsPrinted: String(patch.units) }
  mutate(
    api,
    actor,
    {
      entityType: 'modifier',
      entityId: id,
      action: 'modifier.update',
      before: { code: prev.code, factor: prev.factor, units: prev.units },
      after: { code: prev.code, factor, units: patch.units },
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, modifiers: { ...s.masters.modifiers, [id]: next } } }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Renames follow through, and retired references
// ---------------------------------------------------------------------------

/**
 * The Party a renamed hospital or surgeon carries along (US-13.4.1
 * "change once, reflected everywhere"): its linked Party (a hospital's by
 * `hospitalId`; a surgeon's by kind) while the Party's short name
 * still equals the old name. A Party the office renamed by hand is left alone.
 * Returns the renamed Party and its `party.update` meta, or null.
 */
export function partyRenameFollowing(
  masters: Pick<Masters, 'parties'>,
  link: { kind: 'hospital'; hospitalId: string } | { kind: 'surgeon' },
  oldName: string,
  newName: string,
): { party: Party; meta: MutationMeta } | null {
  if (oldName === newName) return null
  const party = Object.values(masters.parties).find(
    (p) => p.kind === link.kind && p.name === oldName && (link.kind !== 'hospital' || p.hospitalId === link.hospitalId),
  )
  if (party === undefined) return null
  return {
    party: { ...party, name: newName },
    meta: { entityType: 'party', entityId: party.id, action: 'party.update', before: { name: oldName }, after: { name: newName }, stampBookingId: null },
  }
}

/**
 * The one refusal for a retired hospital or surgeon on a write path ("St
 * George's is retired."), or null. An unchanged value passes, so editing an
 * old List at a retired hospital still saves.
 */
export function retiredRefusal(
  masters: Pick<Masters, 'hospitals' | 'surgeons'>,
  next: { hospitalId?: string | undefined; surgeonId?: string | undefined; surgeonIds?: readonly string[] },
  prev?: { hospitalId?: string | undefined; surgeonId?: string | undefined; surgeonIds?: readonly string[] },
): Outcome<never> | null {
  const h = next.hospitalId !== undefined ? masters.hospitals[next.hospitalId] : undefined
  if (h !== undefined && isRetired(h) && prev?.hospitalId !== next.hospitalId) return refuse('retired', `${h.name} is retired.`)
  const surgeonIds = [...(next.surgeonId !== undefined ? [next.surgeonId] : []), ...(next.surgeonIds ?? [])]
  const kept = new Set([...(prev?.surgeonId !== undefined ? [prev.surgeonId] : []), ...(prev?.surgeonIds ?? [])])
  for (const id of surgeonIds) {
    const s = masters.surgeons[id]
    if (s !== undefined && isRetired(s) && !kept.has(id)) return refuse('retired', `${s.name} is retired.`)
  }
  return null
}
