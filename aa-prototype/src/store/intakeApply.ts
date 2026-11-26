/**
 * Updates to a List AA holds (build plan Phase 69; US-02.1.2, US-02.1.3, US-02.2.3, DM-13, DM-17, D118, D125). The
 * update and cancellation benches decide a whole arriving List here, always through 68's one decision path
 * (`decideArrivingLists`), never a second one:
 *
 * - `applyArrivingList`: each open row applied (ticked by default) or left out. An applied row takes the matcher's
 *   suggestion as it stands (a match with its `fieldsApplied`, a new Booking on the held List with no picks, so no
 *   Contract), a removal is confirmed (the Booking cancelled, kept visible), and a row carrying a waiting patient's NHI
 *   turns that patient's stub into the Booking (DM-17). All or nothing: one change set, or nothing written.
 * - `rejectArrivingList`: every open row rejected with the reason; no Booking, List or stub changes.
 * - `decideCancellation`: a hospital's cancellation applied (the Booking cancelled, kept visible) or rejected.
 * - `applyBlockers` and `stubCandidates`: pure reads, so the bench shows what the store will refuse.
 *
 * Rows waiting for an NHI are never decided here: they stay open for Needs NHI.
 */

import type { ImportRow, IncomingFieldKey, Stub } from '../domain/types'
import { isBlankText } from '../domain/billing/procedureStack'
import { rowWaitsForNhi, type ArrivalItem } from '../domain/intake/arrivals'
import { effectiveIncoming, normaliseName, validNhiOf } from '../domain/intake/matching'
import type { StubMatch } from '../domain/intake/stubMatch'
import { stubsOnList } from '../domain/intake/stubs'
import type { AppState, AppStoreApi } from './appStore'
import { decideArrivingLists, type DecideResult, type RowDecision } from './intakeDecide'
import { arrivalByKey } from './intakeSelectors'
import { LIST_LOCKED_MESSAGE, WORDING_OR_CODE_MESSAGE, correctImportRow } from './matchingActions'
import { assessImportRow } from './matchingSelectors'
import { ok, refuse, transaction, withChangeSet, type Actor, type Outcome } from './mutate'

type ApplyState = Pick<AppState, 'masters' | 'schedule' | 'intake'>

/** A row's choice on the update bench: applied (ticked, the default), with the stub its NHI resolves when two fit; or left out. */
export type RowChoice = { kind: 'apply'; stubId?: string } | { kind: 'leaveOut' }

export const UNKNOWN_ARRIVAL_MESSAGE = 'This arrival is no longer at Intake.'
export const NOT_AN_UPDATE_MESSAGE = 'This arrival is not an update to a List AA holds.'
export const NOT_A_CANCELLATION_MESSAGE = 'This arrival is not a cancellation.'
export const REJECT_REASON_REQUIRED_MESSAGE = 'Give a reason to reject this List.'
export const CHOOSE_STUB_MESSAGE = 'Choose which waiting patient this NHI belongs to.'
export const WAITS_FOR_NHI_MESSAGE = 'Waits for its NHI'
export const NO_TARGET_MESSAGE = 'No Booking or List to apply this to'
export const BOOKING_CANCELLED_MESSAGE = 'This Booking is cancelled.'
export const STUB_NOT_RESOLVED_MESSAGE = "The NHI did not bring this row to its waiting patient's Booking. Check it again."
const OFFICE_ONLY_MESSAGE = 'Only the AA office decides arriving Lists.'

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

function openRowsOf(state: ApplyState, item: ArrivalItem): ImportRow[] {
  return item.openRowIds.flatMap((id) => {
    const row = state.intake.rows[id]
    return row !== undefined && row.status === 'open' ? [row] : []
  })
}

function listLocked(state: ApplyState, listId: string | undefined): boolean {
  return listId !== undefined && state.schedule.lists[listId]?.state === 'AUTHORISED'
}

function hasWording(row: ImportRow): boolean {
  const text = effectiveIncoming(row).procedure?.text
  return text !== undefined && !isBlankText(text)
}

/** Every standing stub one row could resolve: `stubMatchFor`'s rule, every fitting stub, as `stubsOnList` orders them. */
function stubsForRow(state: ApplyState, row: ImportRow): StubMatch[] {
  if (row.removalOfBookingId !== undefined || rowWaitsForNhi(row)) return []
  const fields = effectiveIncoming(row)
  const nhi = validNhiOf(fields)
  const dob = fields.patient.dobISO
  if (nhi === undefined || dob === undefined || dob === '') return []
  const name = normaliseName(fields.patient.name)
  if (name === '') return []
  const a = assessImportRow(state, row.id)
  if (a === undefined) return []
  const listIds = [a.targetListId, a.match?.listId].filter((id, i, all): id is string => id !== undefined && all.indexOf(id) === i)
  const out: StubMatch[] = []
  for (const listId of listIds) {
    for (const stub of stubsOnList(state.intake.stubs, listId)) {
      if (stub.importRowId === row.id || out.some((m) => m.stubId === stub.id)) continue
      const waiting = state.intake.rows[stub.importRowId]
      if (waiting === undefined) continue
      const wf = effectiveIncoming(waiting)
      if (normaliseName(wf.patient.name) === name && wf.patient.dobISO === dob) out.push({ stubId: stub.id, waitingRowId: waiting.id, nhi })
    }
  }
  return out
}

/** Why the waiting row behind a stub cannot become the Booking, or undefined. */
function stubBlocker(state: ApplyState, match: StubMatch): string | undefined {
  const stub: Stub | undefined = state.intake.stubs[match.stubId]
  if (listLocked(state, stub?.listId)) return LIST_LOCKED_MESSAGE
  const waiting = state.intake.rows[match.waitingRowId]
  if (waiting !== undefined && !hasWording(waiting)) return WORDING_OR_CODE_MESSAGE
  return undefined
}

/** What applying one open row means. */
type RowPlan =
  | { kind: 'waiting' }
  | { kind: 'blocked'; reason: string }
  | { kind: 'decide'; decision: RowDecision }
  | { kind: 'stub'; candidates: StubMatch[] }

function planRow(state: ApplyState, item: ArrivalItem, row: ImportRow): RowPlan {
  if (row.removalOfBookingId !== undefined) {
    const booking = state.schedule.bookings[row.removalOfBookingId]
    if (listLocked(state, booking?.listId)) return { kind: 'blocked', reason: LIST_LOCKED_MESSAGE }
    return { kind: 'decide', decision: { rowId: row.id, kind: 'confirmRemoval' } }
  }
  if (rowWaitsForNhi(row)) return { kind: 'waiting' }
  if (listLocked(state, item.heldListId)) return { kind: 'blocked', reason: LIST_LOCKED_MESSAGE }
  const candidates = stubsForRow(state, row)
  if (candidates.length > 0) {
    const reasons = candidates.map((c) => stubBlocker(state, c))
    if (reasons.every((r) => r !== undefined)) return { kind: 'blocked', reason: reasons[0]! }
    return { kind: 'stub', candidates }
  }
  const a = assessImportRow(state, row.id)
  const s = a?.suggestion
  if (a === undefined || s === undefined) return { kind: 'blocked', reason: a?.unmatchedReason ?? NO_TARGET_MESSAGE }
  if (s.kind === 'reject') return { kind: 'blocked', reason: a.match?.cancelled === true ? BOOKING_CANCELLED_MESSAGE : s.reason }
  if (s.kind === 'match') {
    if (listLocked(state, a.match?.listId)) return { kind: 'blocked', reason: LIST_LOCKED_MESSAGE }
    const fieldsApplied: readonly IncomingFieldKey[] = s.changeType === 'noChange' ? [] : s.fieldsApplied
    return { kind: 'decide', decision: { rowId: row.id, kind: 'apply', input: { kind: 'match', bookingId: s.bookingId, fieldsApplied } } }
  }
  if (listLocked(state, s.listId)) return { kind: 'blocked', reason: LIST_LOCKED_MESSAGE }
  if (!hasWording(row)) return { kind: 'blocked', reason: WORDING_OR_CODE_MESSAGE }
  return { kind: 'decide', decision: { rowId: row.id, kind: 'apply', input: { kind: 'createBooking', listId: s.listId } } }
}

/**
 * Per open row of an arrival, why it cannot apply (the store's own refusals, so the bench and the store say the
 * same): the List authorised and locked, an added row with no wording, a cancelled Booking, a row waiting for its NHI,
 * or no Booking or List to apply it to. A row absent from the result can apply. Pure on state.
 */
export function applyBlockers(state: ApplyState, arrivalKey: string): Record<string, string> {
  const item = arrivalByKey(state, arrivalKey)
  if (item === undefined) return {}
  const out: Record<string, string> = {}
  for (const row of openRowsOf(state, item)) {
    const plan = planRow(state, item, row)
    if (plan.kind === 'waiting') out[row.id] = WAITS_FOR_NHI_MESSAGE
    else if (plan.kind === 'blocked') out[row.id] = plan.reason
  }
  return out
}

/**
 * Per open row of an arrival, every standing stub its NHI could resolve (DM-17): a stub on the List the row lands on
 * whose waiting row names the same patient (name and date of birth), the row carrying a valid NHI. Two or more mean the
 * office chooses which. Rows with none are absent. Pure on state.
 */
export function stubCandidates(state: ApplyState, arrivalKey: string): Record<string, StubMatch[]> {
  const item = arrivalByKey(state, arrivalKey)
  if (item === undefined) return {}
  const out: Record<string, StubMatch[]> = {}
  for (const row of openRowsOf(state, item)) {
    const found = stubsForRow(state, row)
    if (found.length > 0) out[row.id] = found
  }
  return out
}

// ---------------------------------------------------------------------------
// Decide
// ---------------------------------------------------------------------------

function emptyResult(): DecideResult {
  return { changeSetId: null, applied: [], leftOut: [], rejected: [], removed: [], placedListIds: [] }
}

function mergeInto(into: DecideResult, from: DecideResult): void {
  into.applied.push(...from.applied)
  into.leftOut.push(...from.leftOut)
  into.rejected.push(...from.rejected)
  into.removed.push(...from.removed)
  into.placedListIds.push(...from.placedListIds)
}

/** One List's decisions as one change set, all or nothing; the change set id read from the first entry written. */
function inOneChangeSet(api: AppStoreApi, run: (result: DecideResult) => Outcome<undefined>): Outcome<DecideResult> {
  const auditBefore = api.getState().audit.length
  const result = emptyResult()
  const outcome = withChangeSet(api, 'match', () => transaction(api, () => run(result)))
  if (!outcome.ok) return outcome
  result.changeSetId = api.getState().audit[auditBefore]?.changeSetId ?? null
  return ok(result)
}

function itemOfKind(api: AppStoreApi, actor: Actor, arrivalKey: string, kinds: readonly ArrivalItem['kind'][], wrongKind: string): Outcome<ArrivalItem> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY_MESSAGE)
  const item = arrivalByKey(api.getState(), arrivalKey)
  if (item === undefined) return refuse('notFound', UNKNOWN_ARRIVAL_MESSAGE)
  if (!kinds.includes(item.kind)) return refuse('wrongKind', wrongKind)
  return ok(item)
}

function applyItem(api: AppStoreApi, actor: Actor, item: ArrivalItem, choices: Readonly<Record<string, RowChoice>>): Outcome<DecideResult> {
  const state = api.getState()
  const decisions: RowDecision[] = []
  const stubRows: { rowId: string; match: StubMatch }[] = []
  for (const row of openRowsOf(state, item)) {
    const plan = planRow(state, item, row)
    if (plan.kind === 'waiting') continue
    const choice = choices[row.id] ?? { kind: 'apply' }
    if (choice.kind === 'leaveOut') {
      decisions.push({ rowId: row.id, kind: 'leaveOut' })
      continue
    }
    if (plan.kind === 'blocked') return refuse('cannotApply', `${effectiveIncoming(row).patient.name}: ${plan.reason}`)
    if (plan.kind === 'decide') {
      decisions.push(plan.decision)
      continue
    }
    const chosen = choice.stubId !== undefined ? plan.candidates.find((c) => c.stubId === choice.stubId) : plan.candidates.length === 1 ? plan.candidates[0] : undefined
    if (chosen === undefined) return refuse('chooseStub', CHOOSE_STUB_MESSAGE)
    const blocked = stubBlocker(state, chosen)
    if (blocked !== undefined) return refuse('cannotApply', `${effectiveIncoming(row).patient.name}: ${blocked}`)
    stubRows.push({ rowId: row.id, match: chosen })
  }
  if (decisions.length === 0 && stubRows.length === 0) return refuse('nothingToDecide', 'Nothing on this List can be decided yet.')

  return inOneChangeSet(api, (result) => {
    const first: RowDecision[] = []
    if (stubRows.length > 0) {
      // DM-17 (1) and (2): each waiting row takes the arriving NHI and is decided onto its stub's List; the decision
      // settles the stub through `settleStubForRow` (never `resolveStub`, never a second settle).
      for (const { match } of stubRows) {
        const corrected = correctImportRow(api, actor, match.waitingRowId, { nhi: match.nhi })
        if (!corrected.ok) return corrected
      }
      const waiting = stubRows.map(({ match }): RowDecision => {
        const listId = api.getState().intake.stubs[match.stubId]!.listId
        return { rowId: match.waitingRowId, kind: 'apply', input: { kind: 'createBooking', listId } }
      })
      const made = decideArrivingLists(api, actor, [{ rows: waiting }])
      if (!made.ok) return made
      mergeInto(result, made.value)
      // (3) Each arriving row, re-assessed, applied onto the Booking just made, with its other differences.
      const now = api.getState()
      for (const { rowId, match } of stubRows) {
        const d = now.intake.rows[match.waitingRowId]?.decision
        const bookingId = d !== undefined && d.kind !== 'reject' && d.kind !== 'leftOut' ? d.bookingId : undefined
        const s = assessImportRow(now, rowId)?.suggestion
        if (bookingId === undefined || s?.kind !== 'match' || s.bookingId !== bookingId) return refuse('stubNotResolved', STUB_NOT_RESOLVED_MESSAGE)
        first.push({ rowId, kind: 'apply', input: { kind: 'match', bookingId, fieldsApplied: s.changeType === 'noChange' ? [] : s.fieldsApplied } })
      }
    }
    // (4) The List's other rows (after the arriving rows), in one more call.
    const rest = decideArrivingLists(api, actor, [{ rows: [...first, ...decisions] }])
    if (!rest.ok) return rest
    mergeInto(result, rest.value)
    return ok(undefined)
  })
}

/**
 * Apply an update to a List AA holds (US-02.1.2, D118): every open row not waiting for an NHI is applied (a row
 * missing from `choices` is applied) or left out. One change set, or nothing written when any applied row refuses.
 */
export function applyArrivingList(api: AppStoreApi, actor: Actor, arrivalKey: string, choices: Readonly<Record<string, RowChoice>>): Outcome<DecideResult> {
  const item = itemOfKind(api, actor, arrivalKey, ['update'], NOT_AN_UPDATE_MESSAGE)
  if (!item.ok) return item
  return applyItem(api, actor, item.value, choices)
}

function rejectItem(api: AppStoreApi, actor: Actor, item: ArrivalItem, reason: string): Outcome<DecideResult> {
  const why = reason.trim()
  if (why === '') return refuse('reasonRequired', REJECT_REASON_REQUIRED_MESSAGE)
  const rows = openRowsOf(api.getState(), item)
    .filter((r) => !rowWaitsForNhi(r))
    .map((r): RowDecision => ({ rowId: r.id, kind: 'reject', reason: why }))
  return inOneChangeSet(api, (result) => {
    const done = decideArrivingLists(api, actor, [{ rows }])
    if (!done.ok) return done
    mergeInto(result, done.value)
    return ok(undefined)
  })
}

/** Reject an update with a reason: every open row not waiting for an NHI rejected; no Booking, List or stub changes. */
export function rejectArrivingList(api: AppStoreApi, actor: Actor, arrivalKey: string, reason: string): Outcome<DecideResult> {
  const item = itemOfKind(api, actor, arrivalKey, ['update'], NOT_AN_UPDATE_MESSAGE)
  if (!item.ok) return item
  return rejectItem(api, actor, item.value, reason)
}

/**
 * A hospital's cancellation of a Booking AA holds: `apply` cancels the Booking through today's cancel (kept visible,
 * marked cancelled); `reject` needs a reason and changes nothing on the schedule.
 */
export function decideCancellation(api: AppStoreApi, actor: Actor, arrivalKey: string, choice: 'apply' | 'reject', reason?: string): Outcome<DecideResult> {
  const item = itemOfKind(api, actor, arrivalKey, ['cancellation'], NOT_A_CANCELLATION_MESSAGE)
  if (!item.ok) return item
  return choice === 'reject' ? rejectItem(api, actor, item.value, reason ?? '') : applyItem(api, actor, item.value, {})
}
