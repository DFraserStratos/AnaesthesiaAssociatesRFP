/**
 * The Paid by sheet's one Save (catch-up Phase 22a; US-11.2.2, US-08.2.3):
 * who pays, the offer to the other Procedures, and the split, saved together.
 * Nothing new is decided here: the payer is written by `setProcedurePayer`
 * (the one payer writer) and the split by `setProcedureSplit`. Both run
 * first on a scratch copy of the state, so a refusal from either writes
 * nothing; then both run on the store, each with its own audit.
 *
 * The split's "Payer" share means the Procedure's payer: when the payer
 * changes (a new `BP####` id, or the patient), a share billed to the old
 * payer is re-pointed to the new one, on this Procedure and on each offered
 * Procedure the change applied to, so a split never bills someone who has
 * left the Procedure.
 */

import { autoSendPrepayments } from './prepaymentActions'
import { createStore } from 'zustand/vanilla'
import type { CounterpartyRef, FeeSplit } from '../domain/types'
import { payerCounterparty } from '../domain/billing/whoIsBilled'
import { ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppStore, AppStoreApi } from './appStore'
import { setProcedurePayer, type PayerInput } from './payerActions'
import { setProcedureSplit, type FeeSplitInput, type SplitShareInput } from './splitActions'

export interface PaidByChange {
  /** The payer as typed, and the offered Procedures left ticked; omitted when the sheet changes no payer. */
  payer?: { input: PayerInput; alsoApplyTo: readonly string[] }
  /** The split as typed, `null` to remove it, omitted to leave it. */
  split?: FeeSplitInput | FeeSplit | null
}

/** A throwaway store over a copy of the state, for a dry run (never persisted, never seen). */
function scratchOf(api: AppStoreApi): AppStoreApi {
  const state = api.getState()
  return createStore<AppStore>()(() => ({ ...state }))
}

const sameRef = (a: CounterpartyRef, b: CounterpartyRef): boolean => a.kind === b.kind && a.id === b.id

function repoint(shares: readonly SplitShareInput[], from: CounterpartyRef, to: CounterpartyRef): SplitShareInput[] {
  return shares.map((s) => ('party' in s && s.person === undefined && sameRef(s.party, from) ? { ...s, party: to } : s))
}

function run(api: AppStoreApi, actor: Actor, procedureId: string, change: PaidByChange): Outcome {
  const start = api.getState()
  const before = start.schedule.procedures[procedureId]
  const booking = before !== undefined ? start.schedule.bookings[before.bookingId] : undefined
  if (before === undefined || booking === undefined) return refuse('notFound', 'Procedure not found.')
  const oldRef = payerCounterparty(before, booking.patientId)

  if (change.payer !== undefined) {
    const written = setProcedurePayer(api, actor, procedureId, change.payer.input, change.payer.alsoApplyTo)
    if (!written.ok) return written
  }
  const after = api.getState().schedule.procedures[procedureId] ?? before
  const newRef = payerCounterparty(after, booking.patientId)
  const moved = !sameRef(oldRef, newRef)
  const billsOld = (shares: readonly SplitShareInput[]): boolean => shares.some((s) => 'party' in s && s.person === undefined && sameRef(s.party, oldRef))

  // The split as typed; or, when only the payer changed, the split it held if a share billed the old payer.
  const split = change.split !== undefined ? change.split : moved && before.split !== undefined && billsOld(before.split.shares) ? before.split : undefined
  if (split !== undefined) {
    const shares = split === null ? null : { shares: moved ? repoint(split.shares, oldRef, newRef) : [...split.shares] }
    const written = setProcedureSplit(api, actor, booking.id, procedureId, shares)
    if (!written.ok) return written
  }
  // The offered Procedures the change applied to: a share of theirs billed to the old payer follows the new one too.
  if (moved && change.payer !== undefined) {
    for (const id of change.payer.alsoApplyTo) {
      const other = api.getState().schedule.procedures[id]
      if (other?.split === undefined || !billsOld(other.split.shares)) continue
      const written = setProcedureSplit(api, actor, booking.id, id, { shares: repoint(other.split.shares, oldRef, newRef) })
      if (!written.ok) return written
    }
  }
  return ok(undefined)
}

/**
 * Save the Paid by sheet: refused as a whole when the payer or the split is
 * refused (the first refusal's words), else both written.
 */
export function savePaidBy(api: AppStoreApi, actor: Actor, procedureId: string, change: PaidByChange): Outcome {
  const dry = run(scratchOf(api), actor, procedureId, change)
  if (!dry.ok) return dry
  const out = run(api, actor, procedureId, change)
  // With prepayment approval off, a group this makes ready is sent now (catch-up Phase 27).
  const bookingId = api.getState().schedule.procedures[procedureId]?.bookingId
  if (out.ok && bookingId !== undefined) autoSendPrepayments(api, bookingId)
  return out
}
