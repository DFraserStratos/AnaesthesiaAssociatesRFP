/**
 * Placing and settling stubs (catch-up Phase 33a; DM-58). Split from
 * `stubActions.ts` so `matchingActions` and `draftListActions` can call it
 * without an import cycle.
 *
 * - `placeStubsForRows`: called by `stageImportRows` after its commit, from
 *   any source (a hospital file today, a rooms' PDF row from Phase 34; there
 *   is no sync, D52), audited `stub.place`.
 * - `placeStubsOnList`: the same, onto one named List (Intake placing a new
 *   List, build plan Phase 70), inside the placement's change set.
 * - `settleStubForRow`: the one place a stub's status changes, inside
 *   `decideImportRow`'s commit (`stub.resolve`, `stub.remove`) and a Draft
 *   List's removal or re-dating (through `stubsOffDraftList`).
 *
 * A stub is never a Booking: nothing here writes `schedule`.
 */

import type { ImportDecision, Stub } from '../domain/types'
import { stubFor } from '../domain/intake/stubs'
import { rowWaitsForNhi } from '../domain/intake/arrivals'
import { allocateId, clockISO, mutate, type Actor, type MutationMeta } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { assessImportRow } from './matchingSelectors'

// ---------------------------------------------------------------------------
// Place
// ---------------------------------------------------------------------------

/**
 * Place a stub for each of these rows that waits for an NHI and has a List to
 * land on (not AUTHORISED), in one commit. A row that already has a standing
 * stub gets no second one. The List's Bookings are added as usual elsewhere.
 */
export function placeStubsForRows(api: AppStoreApi, actor: Actor, rowIds: readonly string[]): string[] {
  const state = api.getState()
  const standingFor = new Set(Object.values(state.intake.stubs).filter((s) => s.status === 'standing').map((s) => s.importRowId))
  const atISO = clockISO(state.clock)
  const drafts: Array<Omit<Stub, 'id'>> = []
  for (const rowId of rowIds) {
    const row = state.intake.rows[rowId]
    if (row === undefined || row.status !== 'open' || standingFor.has(rowId)) continue
    const assessment = assessImportRow(state, rowId)
    if (assessment === undefined || !assessment.waitingForNhi) continue
    const list = assessment.targetListId !== undefined ? state.schedule.lists[assessment.targetListId] : undefined
    const label = state.intake.batches[row.batchId]?.label ?? 'Imported file'
    const draft = stubFor(row, list !== undefined && list.removedAtISO === undefined ? { id: list.id, state: list.state } : undefined, label, atISO)
    if (draft !== undefined) drafts.push(draft)
  }
  return writeStubs(api, actor, drafts)
}

/**
 * Place a stub on one named List for each of these rows that waits for an NHI
 * (build plan Phase 70, US-02.6.1): the List a new List's placement made or
 * chose, not the matcher's target. One commit, audited `stub.place` as
 * `placeStubsForRows` is. A row with a standing stub gets no second one; no
 * stub lands on an AUTHORISED or removed List. Returns the stub ids.
 */
export function placeStubsOnList(api: AppStoreApi, actor: Actor, listId: string, rowIds: readonly string[]): string[] {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined || list.removedAtISO !== undefined || list.state === 'AUTHORISED') return []
  const standingFor = new Set(Object.values(state.intake.stubs).filter((s) => s.status === 'standing').map((s) => s.importRowId))
  const atISO = clockISO(state.clock)
  const drafts: Array<Omit<Stub, 'id'>> = []
  for (const rowId of rowIds) {
    const row = state.intake.rows[rowId]
    if (row === undefined || !rowWaitsForNhi(row) || standingFor.has(rowId)) continue
    const label = state.intake.batches[row.batchId]?.label ?? 'Imported file'
    const draft = stubFor(row, { id: list.id, state: list.state }, label, atISO)
    if (draft !== undefined) drafts.push(draft)
  }
  return writeStubs(api, actor, drafts)
}

/** One commit placing these stubs, each audited `stub.place`; their ids. */
function writeStubs(api: AppStoreApi, actor: Actor, drafts: ReadonlyArray<Omit<Stub, 'id'>>): string[] {
  if (drafts.length === 0) return []
  const ids: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    const added: Record<string, Stub> = {}
    for (const d of drafts) {
      const alloc = allocateId(counters, 'stub')
      counters = alloc.counters
      ids.push(alloc.id)
      added[alloc.id] = { ...d, id: alloc.id }
      metas.push({
        entityType: 'stub',
        entityId: alloc.id,
        action: 'stub.place',
        after: { listId: d.listId, importRowId: d.importRowId, reason: d.reason, patient: d.asReceived.patientName },
        stampBookingId: null,
      })
    }
    return { intake: { ...s.intake, stubs: { ...s.intake.stubs, ...added } }, counters }
  })
  return ids
}

// ---------------------------------------------------------------------------
// Settle: the one place a stub's status changes
// ---------------------------------------------------------------------------

export type StubOutcome =
  | { kind: 'resolved'; bookingId: string }
  | { kind: 'removed'; why: 'rowRejected' | 'rowLeftOut' | 'draftListRemoved' | 'draftListRedated'; reason?: string }

/**
 * Settle the standing stub of a row (if any) inside a caller's commit: returns
 * the next stubs map and the audit meta to push, or undefined when the row has
 * no standing stub. Pure over its inputs; the caller's `mutate` writes it.
 */
export function settleStubForRow(
  stubs: Readonly<Record<string, Stub>>,
  rowId: string,
  outcome: StubOutcome,
  atISO: string,
  who: string,
): { stubs: Record<string, Stub>; meta: MutationMeta } | undefined {
  const stub = Object.values(stubs).find((s) => s.importRowId === rowId && s.status === 'standing')
  if (stub === undefined) return undefined
  const next: Stub =
    outcome.kind === 'resolved'
      ? { ...stub, status: 'resolved', bookingId: outcome.bookingId, settledAtISO: atISO, settledBy: who }
      : { ...stub, status: 'removed', settledAtISO: atISO, settledBy: who }
  const meta: MutationMeta =
    outcome.kind === 'resolved'
      ? { entityType: 'stub', entityId: stub.id, action: 'stub.resolve', before: { status: 'standing' }, after: { status: 'resolved', bookingId: outcome.bookingId, listId: stub.listId }, stampBookingId: null }
      : {
          entityType: 'stub',
          entityId: stub.id,
          action: 'stub.remove',
          before: { status: 'standing' },
          after: { status: 'removed', why: outcome.why, listId: stub.listId, ...(outcome.reason !== undefined ? { reason: outcome.reason } : {}) },
          stampBookingId: null,
        }
  return { stubs: { ...stubs, [stub.id]: next }, meta }
}

/** The stub outcome a row decision implies: reject or leave out removes, any create or match resolves. */
export function stubOutcomeForDecision(decision: ImportDecision): StubOutcome {
  if (decision.kind === 'reject') return { kind: 'removed', why: 'rowRejected', reason: decision.reason }
  if (decision.kind === 'leftOut') return { kind: 'removed', why: 'rowLeftOut', ...(decision.reason !== undefined ? { reason: decision.reason } : {}) }
  return { kind: 'resolved', bookingId: decision.bookingId }
}

/**
 * A Draft List removed or re-dated takes its standing stubs off (our reading);
 * their rows keep waiting. For the caller's recipe: the next stubs map and
 * the metas, or undefined when the List holds none.
 */
export function stubsOffDraftList(
  state: Pick<AppState, 'intake'>,
  listId: string,
  why: 'draftListRemoved' | 'draftListRedated',
  atISO: string,
  who: string,
): { stubs: Record<string, Stub>; metas: MutationMeta[] } | undefined {
  let stubs: Record<string, Stub> = { ...state.intake.stubs }
  const metas: MutationMeta[] = []
  for (const s of Object.values(state.intake.stubs)) {
    if (s.listId !== listId || s.status !== 'standing') continue
    const settled = settleStubForRow(stubs, s.importRowId, { kind: 'removed', why }, atISO, who)
    if (settled === undefined) continue
    stubs = settled.stubs
    metas.push(settled.meta)
  }
  return metas.length === 0 ? undefined : { stubs, metas }
}
