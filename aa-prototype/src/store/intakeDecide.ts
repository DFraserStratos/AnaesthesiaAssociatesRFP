/**
 * The one List-level decision path (build plan Phase 68; D118, US-02.1.2, DM-11). Every Intake bench decides an
 * arriving List through `decideArrivingLists`: one or more Lists in ONE change set, each row applied (today's
 * per-row `DecisionInput`, picks included), left out (decided, changing nothing: its own kind, never a reject),
 * rejected with a reason, or a removal confirmed (the Booking cancelled through today's cancel and its guards, kept
 * visible, marked cancelled). A List may carry a placement (a free Slot, an existing List or a Draft List): the first
 * placed row makes the List, the rest join it, each through today's per-row decision. Phase 69's `intakeApply.ts`,
 * 70's `intakePlace.ts` and 71's `intakeBulk.ts` only map their bench to this; none builds a second path.
 *
 * Refuses as a whole: a refusal on any row rolls every write back. Office only; the ingest never comes here.
 */

import type { OfficePicks } from '../domain/types'
import { decideImportRow, recordRowDecision, type DecisionInput } from './matchingActions'
import { ok, refuse, transaction, withChangeSet, type Actor, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

/** How a placed List lands (US-02.1.2, DM-19): in a free Slot, on a List AA holds, or as a Draft List. */
export type ListPlacement =
  | { kind: 'slot'; slotId: string; surgeonId?: string }
  | { kind: 'list'; listId: string }
  | { kind: 'draft'; surgeonId?: string }

/** One row's decision. `place` takes the List's placement; `apply` is today's per-row decision input. */
export type RowDecision =
  | { rowId: string; kind: 'apply'; input: Exclude<DecisionInput, { kind: 'reject' }> }
  | { rowId: string; kind: 'place'; picks?: OfficePicks }
  | { rowId: string; kind: 'leaveOut'; reason?: string }
  | { rowId: string; kind: 'reject'; reason: string }
  | { rowId: string; kind: 'confirmRemoval' }

/** One arriving List's decision: its rows, and the placement its `place` rows take. */
export interface ListDecision {
  rows: readonly RowDecision[]
  placement?: ListPlacement
}

export interface DecideResult {
  /** The change set every write joined (null when nothing was written, e.g. an empty decision). */
  changeSetId: string | null
  applied: string[]
  leftOut: string[]
  rejected: string[]
  removed: string[]
  /** Each placed List's id, in decision order (the List a Slot or Draft placement made, or the List placed on). */
  placedListIds: string[]
}

export const NOTHING_TO_DECIDE_MESSAGE = 'Choose what to do with at least one row.'
export const PLACEMENT_REQUIRED_MESSAGE = 'Choose where this List goes first.'
export const NOT_A_REMOVAL_MESSAGE = 'This row is not a removal.'

function prefixed<T>(rowId: string, out: Outcome<T>): Outcome<T> {
  if (out.ok) return out
  return { ...out, message: `Row ${rowId}: ${out.message}` }
}

/** The per-row input a `place` row takes: the first makes the List, the rest go on the List it made. */
function placedInput(placement: ListPlacement, madeListId: string | undefined, picks: OfficePicks | undefined): DecisionInput {
  const withPicks = picks !== undefined ? { picks } : {}
  if (madeListId !== undefined) return { kind: 'createBooking', listId: madeListId, ...withPicks }
  switch (placement.kind) {
    case 'slot':
      return { kind: 'createList', slotId: placement.slotId, ...(placement.surgeonId !== undefined ? { surgeonId: placement.surgeonId } : {}), ...withPicks }
    case 'list':
      return { kind: 'createBooking', listId: placement.listId, ...withPicks }
    case 'draft':
      return { kind: 'createDraft', ...(placement.surgeonId !== undefined ? { surgeonId: placement.surgeonId } : {}), ...withPicks }
  }
}

function decideOneList(api: AppStoreApi, actor: Actor, decision: ListDecision, result: DecideResult): Outcome<undefined> {
  let madeListId: string | undefined
  for (const row of decision.rows) {
    switch (row.kind) {
      case 'leaveOut': {
        const reason = row.reason?.trim()
        const done = recordRowDecision(api, actor, row.rowId, { kind: 'leftOut', ...(reason !== undefined && reason !== '' ? { reason } : {}) })
        if (!done.ok) return prefixed(row.rowId, done)
        result.leftOut.push(row.rowId)
        break
      }
      case 'reject': {
        const done = decideImportRow(api, actor, row.rowId, { kind: 'reject', reason: row.reason })
        if (!done.ok) return prefixed(row.rowId, done)
        result.rejected.push(row.rowId)
        break
      }
      case 'confirmRemoval': {
        const bookingId = api.getState().intake.rows[row.rowId]?.removalOfBookingId
        if (bookingId === undefined) return refuse('notARemoval', `Row ${row.rowId}: ${NOT_A_REMOVAL_MESSAGE}`)
        const done = decideImportRow(api, actor, row.rowId, { kind: 'match', bookingId, fieldsApplied: [] })
        if (!done.ok) return prefixed(row.rowId, done)
        result.removed.push(row.rowId)
        break
      }
      case 'apply': {
        const done = decideImportRow(api, actor, row.rowId, row.input)
        if (!done.ok) return prefixed(row.rowId, done)
        result.applied.push(row.rowId)
        break
      }
      case 'place': {
        if (decision.placement === undefined) return refuse('placementRequired', PLACEMENT_REQUIRED_MESSAGE)
        const done = decideImportRow(api, actor, row.rowId, placedInput(decision.placement, madeListId, row.picks))
        if (!done.ok) return prefixed(row.rowId, done)
        if (madeListId === undefined) {
          madeListId = done.value.listId ?? (decision.placement.kind === 'list' ? decision.placement.listId : undefined)
          if (madeListId !== undefined) result.placedListIds.push(madeListId)
        }
        result.applied.push(row.rowId)
        break
      }
    }
  }
  return ok(undefined)
}

/**
 * Decide one or more arriving Lists as one change set (D118). Each List's rows are decided in the order given
 * (the caller puts a placement's rows first-made-first). Returns the change set id and the rows per outcome.
 */
export function decideArrivingLists(api: AppStoreApi, actor: Actor, decisions: readonly ListDecision[]): Outcome<DecideResult> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the AA office decides arriving Lists.')
  if (decisions.every((d) => d.rows.length === 0)) return refuse('nothingToDecide', NOTHING_TO_DECIDE_MESSAGE)
  const auditBefore = api.getState().audit.length
  const result: DecideResult = { changeSetId: null, applied: [], leftOut: [], rejected: [], removed: [], placedListIds: [] }
  const outcome = withChangeSet(api, 'match', () =>
    transaction(api, () => {
      for (const decision of decisions) {
        const done = decideOneList(api, actor, decision, result)
        if (!done.ok) return done
      }
      return ok(undefined)
    }),
  )
  if (!outcome.ok) return outcome
  result.changeSetId = api.getState().audit[auditBefore]?.changeSetId ?? null
  return ok(result)
}
