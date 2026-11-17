/**
 * The multi-procedure rule (catch-up Phase 23; FT-05.3, US-05.3.1, US-03.2.1,
 * US-03.2.2, DM-15, RV-08; AR-58 5.9). The one place the rule lives: which
 * Procedure is the primary, the order Procedures are listed in, which
 * Procedures take part, where base units go and how a Booking's modifier
 * units are shared. Pure; `bookingFee.ts` runs it for a whole Booking and
 * `fee.ts` prices each Procedure from its allocation.
 *
 * The rule, as AA confirmed it on 19 October (OQ-90 answered, D26): the one
 * system-wide rule, with no switch, no per-Contract rule and no "price each
 * Procedure alone" branch. Since 5 November (US-05.3.1, A19) it adjusts only
 * Procedures priced from RVG units:
 *   - base units on the primary only (none on an additional Procedure);
 *   - time units on every Procedure, from its own start and finish times;
 *   - the Booking's modifier units, recorded once on the primary, all on the
 *     primary while they total 4 or fewer; above 4, split equally across the
 *     RVG-priced Procedures (whichever Contracts they are on), the remainder
 *     to the primary (OQ-15 answered: 7 over 3 is 3 / 2 / 2).
 * A Procedure on a fixed or open price keeps its price, takes no share and
 * loses none (US-05.2.5).
 */

import type { Procedure, ProcedureId } from '../types'

/** Modifier units above this total split across the RVG-priced Procedures (OQ-15, OQ-90 answered). */
export const MODIFIER_SPLIT_THRESHOLD = 4

/** The Booking's primary Procedure; the store guarantees exactly one, and the engine refuses anything else. */
export type PrimaryResult =
  | { kind: 'ok'; primary: Procedure }
  | { kind: 'noPrimary' }
  | { kind: 'severalPrimaries'; ids: ProcedureId[] }

export function primaryOf(procedures: readonly Pick<Procedure, 'id' | 'isPrimary'>[]): PrimaryResult {
  const primaries = procedures.filter((p) => p.isPrimary)
  if (primaries.length === 0) return { kind: 'noPrimary' }
  if (primaries.length > 1) return { kind: 'severalPrimaries', ids: primaries.map((p) => p.id) }
  return { kind: 'ok', primary: primaries[0] as Procedure }
}

/**
 * The order every list of a Booking's Procedures uses (US-03.2.2 note): the
 * primary first, then the rest in Booking order. "Procedure 1" is always the
 * primary. `procedures` is in Booking order.
 */
export function inDisplayOrder<P extends Pick<Procedure, 'isPrimary'>>(procedures: readonly P[]): P[] {
  return [...procedures.filter((p) => p.isPrimary), ...procedures.filter((p) => !p.isPrimary)]
}

/** One Procedure's place in the rule: the selector capture and the store read to decide what is editable. */
export interface ProcedureRole {
  role: 'primary' | 'additional'
  /** Base units are recorded (and, when it is RVG-priced, charged) here: the primary only. */
  baseCharged: boolean
  /** The Booking's modifiers are recorded here: the primary only. */
  modifiersRecorded: boolean
}

export function procedureRole(procedure: Pick<Procedure, 'isPrimary'>): ProcedureRole {
  return procedure.isPrimary
    ? { role: 'primary', baseCharged: true, modifiersRecorded: true }
    : { role: 'additional', baseCharged: false, modifiersRecorded: false }
}

/**
 * The Procedures that take part in the modifier split: every RVG-priced
 * Procedure (priced from units: No contract · RVG, or a Contract with a rate
 * or discount), the primary among them when it is one. A Procedure on a fixed
 * or open price takes no share and loses none, whatever its position
 * (US-05.3.1, A19). If AA later has fixed-price Procedures share too, this is
 * the one function to change. Booking order is kept.
 */
export function participantsOf<P extends Pick<Procedure, 'id'>>(procedures: readonly P[], isRvgPriced: (procedure: P) => boolean): P[] {
  return procedures.filter((p) => isRvgPriced(p))
}

/**
 * The Procedure that carries the Booking's base units: the marked primary,
 * whatever its pricing. When the primary is on a fixed or open price its base
 * units are not billed, so no base units are billed on any Procedure.
 */
export function baseOn<P extends Pick<Procedure, 'id' | 'isPrimary'>>(procedures: readonly P[]): P | undefined {
  // PROVISIONAL (OQ-132, D78): base units stay on the marked primary even when
  // it is on a fixed or open price, so none is billed. The other answers ("the
  // first RVG-priced Procedure takes them", "mark another primary") change
  // this function and its tests only.
  return procedures.find((p) => p.isPrimary)
}

/**
 * Share `total` modifier units across `participantIds` (Booking order).
 * At `MODIFIER_SPLIT_THRESHOLD` or fewer, all on the primary and 0 on the
 * rest (billed nowhere when the primary is not a participant: logged beside
 * OQ-132). Above it, each participant gets `floor(total / n)` and the
 * primary also gets the remainder; when the primary is not a participant, the
 * remainder goes to the first participant in Booking order (our reading). A
 * single participant takes everything. The shares always sum to the total
 * across the participants and the primary.
 */
export function allocateModifierUnits(total: number, participantIds: readonly ProcedureId[], primaryId: ProcedureId): Record<ProcedureId, number> {
  const shares: Record<ProcedureId, number> = {}
  for (const id of participantIds) shares[id] = 0
  if (total <= MODIFIER_SPLIT_THRESHOLD || participantIds.length === 0) {
    shares[primaryId] = total
    return shares
  }
  const n = participantIds.length
  const each = Math.floor(total / n)
  const remainder = total - each * n
  for (const id of participantIds) shares[id] = each
  const remainderTo = participantIds.includes(primaryId) ? primaryId : (participantIds[0] as ProcedureId)
  shares[remainderTo] = (shares[remainderTo] ?? 0) + remainder
  return shares
}

/** One Procedure's allocation under the rule; `fee.ts` prices it from this. */
export interface ProcedureAllocation {
  role: 'primary' | 'additional'
  /** Priced from RVG units (takes part in the split). */
  rvgPriced: boolean
  /** Base units are charged on this Procedure: the one `baseOn` returns, when it is RVG-priced. */
  baseCharged: boolean
  /** This Procedure's share of the Booking's modifier units (charged only when it is RVG-priced). */
  modifierShare: number
  /** The Booking's modifier units, recorded on the primary. */
  bookingModifierUnits: number
  /** How many Procedures the modifiers were split across; 1 when nothing was split. */
  splitAcross: number
  /** The participants' shares in display order (the primary's first when it takes part), when split; else empty. */
  splitShares: number[]
}

/** The allocation of a single Procedure Booking (and of one priced alone in a test): everything on it. */
export function soleAllocation(rvgPriced: boolean, bookingModifierUnits: number): ProcedureAllocation {
  return { role: 'primary', rvgPriced, baseCharged: rvgPriced, modifierShare: bookingModifierUnits, bookingModifierUnits, splitAcross: 1, splitShares: [] }
}

/**
 * Allocate a whole Booking: `procedures` in Booking order with exactly one
 * primary (the caller checks `primaryOf` first), `isRvgPriced` from each
 * Procedure's pricing kind alone (a typed price or an override never changes
 * who takes part), and the Booking's modifier total from the primary.
 */
export function allocateBooking<P extends Pick<Procedure, 'id' | 'isPrimary'>>(
  procedures: readonly P[],
  isRvgPriced: (procedure: P) => boolean,
  bookingModifierUnits: number,
): Record<ProcedureId, ProcedureAllocation> {
  const primary = procedures.find((p) => p.isPrimary)
  const primaryId = primary?.id ?? ''
  const base = baseOn(procedures)
  const participants = participantsOf(procedures, isRvgPriced).map((p) => p.id)
  const shares = allocateModifierUnits(bookingModifierUnits, participants, primaryId)
  const split = bookingModifierUnits > MODIFIER_SPLIT_THRESHOLD && participants.length > 1
  const splitShares = split ? inDisplayOrder(participantsOf(procedures, isRvgPriced)).map((p) => shares[p.id] ?? 0) : []
  const out: Record<ProcedureId, ProcedureAllocation> = {}
  for (const p of procedures) {
    const rvgPriced = isRvgPriced(p)
    out[p.id] = {
      role: p.isPrimary ? 'primary' : 'additional',
      rvgPriced,
      baseCharged: rvgPriced && base?.id === p.id,
      modifierShare: shares[p.id] ?? 0,
      bookingModifierUnits,
      splitAcross: split ? participants.length : 1,
      splitShares,
    }
  }
  return out
}

/**
 * A Booking-total row's note (catch-up Phase 23): "Primary · B + T + M 3 of 7",
 * "Additional · T + M 2 of 7", "Additional · T" (no share), or "Primary ·
 * fixed price" / "Additional · fixed price" (the Contract's price; units for
 * reference). No label for the rule itself: it is the system's one rule.
 */
export function allocationNote(allocation: ProcedureAllocation): string {
  const role = allocation.role === 'primary' ? 'Primary' : 'Additional'
  if (!allocation.rvgPriced) return `${role} · fixed price`
  const of = allocation.splitAcross > 1 ? ` of ${allocation.bookingModifierUnits}` : ''
  const m = allocation.modifierShare > 0 ? ` + M ${allocation.modifierShare}${of}` : ''
  return allocation.role === 'primary' ? `${role} · B + T${m}` : `${role} · T${m}`
}
