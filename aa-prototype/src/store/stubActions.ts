/**
 * Stubs on a List: the office's one resolve path (catch-up Phase 33a;
 * FT-02.6, US-02.6.3, DM-58, D66). `resolveStub` serves Matching's Add NHI
 * and Reject, the PWA stand-in and Phase 40's waiting view. It composes 33's
 * `correctImportRow` and `decideImportRow`; there is no second create path,
 * and the stub's status changes only through `settleStubForRow`
 * (`stubSettle.ts`) inside `decideImportRow`'s commit.
 */

import type { ImportRow } from '../domain/types'
import { validateNhi } from '../domain/nhi'
import { ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { assessImportRow } from './matchingSelectors'
import { correctImportRow, decideImportRow, type DecisionInput } from './matchingActions'

export { placeStubsForRows, settleStubForRow, stubOutcomeForDecision, stubsOffDraftList, type StubOutcome } from './stubSettle'

// ---------------------------------------------------------------------------
// Resolve: the office's one path
// ---------------------------------------------------------------------------

export type ResolveStubInput = { kind: 'addNhi'; nhi: string } | { kind: 'reject'; reason: string }

export type ResolveStubResult =
  /** The Booking took the stub's place. */
  | { kind: 'resolved'; bookingId: string; listId: string }
  /** The row was rejected and the stub removed. */
  | { kind: 'removed' }
  /**
   * The NHI is on the row, but the office must decide it on Matching (the stub stands until then):
   * the matcher suggests another List, the NHI matches a Booking with differences to review, or the
   * create is refused (no wording, a locked List). `reason` says why, in the office's words.
   */
  | { kind: 'needsDecision'; reason: string }

/**
 * Resolve a stub from intake (US-02.6.3). Add NHI corrects the row (validated
 * on entry); then, when the matcher's suggestion is a new Booking on the
 * stub's List, or a match there with nothing to review, it is applied with no
 * picks: the Booking lands on that List with no Contract ("Needs an invoice
 * destination"). Otherwise the NHI stays on the row and the office decides on
 * Matching (`needsDecision`), so Add NHI never dead-ends and never applies a
 * stale row's fields unreviewed. An invalid NHI, a non-office actor or a
 * settled stub is refused and changes nothing. Reject rejects the row.
 */
export function resolveStub(api: AppStoreApi, actor: Actor, stubId: string, input: ResolveStubInput): Outcome<ResolveStubResult> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the AA office resolves a stub.')
  const state = api.getState()
  const stub = state.intake.stubs[stubId]
  if (stub === undefined) return refuse('notFound', 'Stub not found.')
  if (stub.status !== 'standing') return refuse('stubSettled', 'This stub has already been resolved.')
  const row: ImportRow | undefined = state.intake.rows[stub.importRowId]
  if (row === undefined) return refuse('notFound', 'Row not found.')

  if (input.kind === 'reject') {
    const decided = decideImportRow(api, actor, row.id, { kind: 'reject', reason: input.reason })
    if (!decided.ok) return decided
    return ok({ kind: 'removed' })
  }

  const v = validateNhi(input.nhi)
  if (!v.valid) return refuse('invalidNhi', v.reason ?? 'That NHI is not valid.')
  const corrected = correctImportRow(api, actor, row.id, { nhi: v.normalised })
  if (!corrected.ok) return corrected
  const suggestion = assessImportRow(api.getState(), row.id)?.suggestion
  let decision: DecisionInput | undefined
  let reason = 'The NHI is added. Choose a decision for this row; the stub stands until you do.'
  if (suggestion?.kind === 'createBooking' && suggestion.listId === stub.listId) {
    decision = { kind: 'createBooking', listId: suggestion.listId }
  } else if (suggestion?.kind === 'match' && api.getState().schedule.bookings[suggestion.bookingId]?.listId === stub.listId) {
    if (suggestion.fieldsApplied.length === 0) decision = { kind: 'match', bookingId: suggestion.bookingId, fieldsApplied: [] }
    else reason = 'The NHI is added and matches a Booking on this List. Review the differences and decide; the stub stands until you do.'
  }
  if (decision === undefined) return ok({ kind: 'needsDecision', reason })
  // A refused decision (no wording, a locked List) keeps the NHI: the office decides on Matching.
  const decided = decideImportRow(api, actor, row.id, decision)
  if (!decided.ok) return ok({ kind: 'needsDecision', reason: `The NHI is added. ${decided.message}` })
  return ok({ kind: 'resolved', bookingId: decided.value.bookingId!, listId: stub.listId })
}
