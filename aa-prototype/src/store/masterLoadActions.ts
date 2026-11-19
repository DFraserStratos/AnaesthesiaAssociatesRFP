/**
 * The seed load (catch-up Phase 42; US-13.4.3 AC1 and AC2, DM-38): the
 * developer's one-off load of AA's controlled spreadsheets, as the demo's
 * Seed load view and triggers act it (`SEED_LOAD_ACTOR`). The office keeps
 * master data by hand; nothing here is an office action.
 *
 * - **Stage** checks a sheet against the masters as they stand and keeps the
 *   result (`masterLoads.loads`). It never writes `masters`. Staging a sheet
 *   discards any earlier staged load of the same sheet, so each sheet shows
 *   one live result.
 * - **Commit** re-checks against the masters now (a row gone stale since
 *   staging turns rejected with its new reason) and folds exactly the valid
 *   rows through each master's own create planner in row order, in ONE
 *   `mutate()`: one create meta per record, the manual create's action name,
 *   with `{ loadId, rowNumber }`, plus one `masterLoad.commit` summary.
 *   Nothing loads partially: a planner refusing mid-fold aborts the commit.
 * - **Discard** drops a staged load.
 *
 * The same sheets after a Reset give identical records: ids are allocated
 * from the counters, deterministically.
 */

import { parseCsv, type ParsedCsv } from '../domain/masterLoad/csv'
import { validateSheet } from '../domain/masterLoad/validate'
import { LOAD_ORDER, type LoadEntity, type MasterLoad, type MasterLoadSource, type RowResult } from '../domain/masterLoad/types'
import type { AppState, AppStoreApi } from './appStore'
import { applyPlan, type PlanSlices } from './masterPlanners'
import { specFor } from './masterLoadSpecs'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import { reconcileConflictsInPatch } from './conflictReconcile'

/** The working copy a check folds rows into: the planner slices plus what planners read beside them. */
export type WorkState = AppState

export interface SheetResult {
  header: string[]
  headerErrors: string[]
  rows: RowResult[]
  /** The working state with this sheet's valid rows folded in. */
  work: WorkState
  /** The metas and record ids the valid rows made, in row order. */
  metas: MutationMeta[]
  recordIds: string[]
}

/**
 * Check one sheet against a working state: the domain engine for the static
 * checks, then each master's own planner over the working copy. Pure.
 */
export function checkSheet(entity: LoadEntity, parsed: ParsedCsv, work: WorkState, actor: Actor, loadId: string): SheetResult {
  const spec = specFor(entity)
  const before = work.masters
  let current = work
  const metas: MutationMeta[] = []
  const recordIds: string[] = []
  const check = validateSheet(spec, parsed, {
    masters: before,
    working: () => current.masters,
    ctx: { todayISO: work.clock.todayISO },
    tryCreate: (fields, rowNumber) => {
      const plan = spec.plan(current, actor, fields, { loadId, rowNumber })
      if (!plan.ok) return plan.message
      current = applyPlan(current, plan.value)
      metas.push(...plan.value.metas)
      recordIds.push(plan.value.id)
      return null
    },
  })
  return { header: parsed.header, headerErrors: check.headerErrors, rows: check.rows, work: current, metas, recordIds }
}

function counts(rows: readonly RowResult[]): { rows: number; valid: number; rejected: number } {
  const valid = rows.filter((r) => r.status === 'valid').length
  return { rows: rows.length, valid, rejected: rows.length - valid }
}

const SEED_ONLY = 'Only the developer seed load (an office-shaped actor) can load master data.'

/** A staged load with its rows' parsed fields dropped (they are re-derived at commit). */
function stored(rows: readonly RowResult[]): RowResult[] {
  return rows.map(({ fields: _f, ...r }) => r)
}

/**
 * Check a sheet and keep the result as a staged load. Never writes master
 * data. Refused for any actor but an office-shaped one, an unknown sheet and
 * an empty one. Audited `masterLoad.stage` with the counts.
 */
export function stageMasterLoad(
  api: AppStoreApi,
  actor: Actor,
  input: { entity: LoadEntity; csvText: string; source: MasterLoadSource; goLiveBatchId?: string },
): Outcome<{ loadId: string; rows: number; valid: number; rejected: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', SEED_ONLY)
  if (!LOAD_ORDER.includes(input.entity)) return refuse('unknownEntity', 'That is not one of the seed load sheets.')
  const state = api.getState()
  const parsed = parseCsv(input.csvText)
  if (parsed.header.length === 0 || parsed.rows.length === 0) return refuse('emptySheet', 'The sheet has no rows to check.')
  const alloc = allocateId(state.counters, 'masterLoad')
  const result = checkSheet(input.entity, parsed, state, actor, alloc.id)
  const load: MasterLoad = {
    id: alloc.id,
    entity: input.entity,
    source: input.source,
    header: result.header,
    headerErrors: result.headerErrors,
    rows: stored(result.rows),
    status: 'staged',
    stagedAtISO: clockISO(state.clock),
    stagedBy: actor.who,
    ...(input.goLiveBatchId !== undefined ? { goLiveBatchId: input.goLiveBatchId } : {}),
  }
  const c = counts(result.rows)
  // One live result per sheet: an earlier staged load of this sheet (outside a go-live batch) is discarded.
  const superseded = Object.values(state.masterLoads.loads).filter(
    (l) => l.status === 'staged' && l.entity === input.entity && l.goLiveBatchId === undefined && input.goLiveBatchId === undefined,
  )
  const source = input.source.kind === 'sample' ? input.source.sampleId : input.source.fileName
  const metas: MutationMeta[] = [
    ...superseded.map((l) => ({ entityType: 'masterLoad', entityId: l.id, action: 'masterLoad.discard', after: { entity: l.entity, reason: 'superseded' }, stampBookingId: null })),
    { entityType: 'masterLoad', entityId: alloc.id, action: 'masterLoad.stage', after: { entity: input.entity, ...c, source }, stampBookingId: null },
  ]
  mutate(api, actor, metas, (s) => {
    const loads = { ...s.masterLoads.loads }
    for (const l of superseded) loads[l.id] = { ...l, status: 'discarded' }
    loads[load.id] = load
    return { masterLoads: { ...s.masterLoads, loads }, counters: alloc.counters }
  })
  return ok({ loadId: alloc.id, ...c })
}

/** The sheet a staged load was checked from, its spreadsheet row numbers kept (a commit re-checks it). */
export function parsedOfLoad(load: Pick<MasterLoad, 'header' | 'rows'>): ParsedCsv {
  return { header: load.header, rows: load.rows.map((r) => ({ rowNumber: r.rowNumber, cells: r.cells })) }
}

export interface CommitResult {
  loaded: number
  rejected: number
  recordIds: string[]
  /** Lists a calendar load flagged or cleared; fallbacks the Contracts made. */
  flagged: number
  resolved: number
  fallbacks: number
}

/**
 * Load a staged sheet's valid rows. Re-checks first; then one `mutate()`
 * folds every still-valid row through its planner. Refused: `notFound`,
 * `notStaged`, `nothingToLoad` (no valid row left), a non-office actor.
 */
export function commitMasterLoad(api: AppStoreApi, actor: Actor, loadId: string): Outcome<CommitResult> {
  if (actor.role !== 'office') return refuse('officeOnly', SEED_ONLY)
  const state = api.getState()
  const load = state.masterLoads.loads[loadId]
  if (load === undefined) return refuse('notFound', 'That load was not found.')
  if (load.status !== 'staged') return refuse('notStaged', load.status === 'loaded' ? 'That sheet is already loaded.' : 'That load was discarded.')
  if (load.goLiveBatchId !== undefined) return refuse('goLiveSheet', 'This sheet is part of the go-live load: load or discard the go-live load.')
  // A row rejected when it was checked stays rejected: only the rows shown valid are re-checked and loaded.
  const parsed = parsedOfLoad(load)
  const wasValid = new Set(load.rows.filter((r) => r.status === 'valid').map((r) => r.rowNumber))
  const fresh = checkSheet(load.entity, { header: parsed.header, rows: parsed.rows.filter((r) => wasValid.has(r.rowNumber)) }, state, actor, loadId)
  const rows = [...fresh.rows, ...load.rows.filter((r) => !wasValid.has(r.rowNumber))].sort((a, b) => a.rowNumber - b.rowNumber)
  const c = counts(rows)
  if (c.valid === 0) {
    // Keep the re-checked reasons on the staged load, so the panel says why nothing loads.
    mutate(
      api,
      actor,
      { entityType: 'masterLoad', entityId: loadId, action: 'masterLoad.recheck', after: { entity: load.entity, ...c }, stampBookingId: null },
      (s) => ({ masterLoads: { ...s.masterLoads, loads: { ...s.masterLoads.loads, [loadId]: { ...load, rows: stored(rows) } } } }),
    )
    return refuse('nothingToLoad', 'No row in this sheet can be loaded.')
  }
  return commitFolded(api, actor, [{ load, result: fresh, rows }])
}

/**
 * The one commit for one or more re-checked sheets (a single load, or a
 * go-live batch's sheets in pack order). Every sheet's folded state is the
 * next one's start, so the last working state holds them all.
 */
export function commitFolded(
  api: AppStoreApi,
  actor: Actor,
  sheets: readonly { load: MasterLoad; result: SheetResult; rows: RowResult[] }[],
  extraMetas: readonly MutationMeta[] = [],
  extraPatch: (s: AppState) => Partial<Pick<AppState, 'masterLoads'>> = () => ({}),
): Outcome<CommitResult> {
  const state = api.getState()
  const last = sheets[sheets.length - 1]!.result.work
  const recordIds = sheets.flatMap((s) => s.result.recordIds)
  const createMetas = sheets.flatMap((s) => s.result.metas)
  const fallbacks = createMetas.filter((m) => m.action === 'contract.fallbackCreate').length
  const loadedAtISO = clockISO(state.clock)
  const summary: MutationMeta[] = sheets.map(({ load, rows, result }) => ({
    entityType: 'masterLoad',
    entityId: load.id,
    action: 'masterLoad.commit',
    after: { entity: load.entity, ...counts(rows), loadedRecords: result.recordIds.length },
    stampBookingId: null,
  }))
  const next: PlanSlices = { masters: last.masters, counters: last.counters, schedule: last.schedule }
  // What the commit does beyond its rows (Lists a calendar flags or clears), worked out from the same reconcile
  // `mutate()` runs, so the stored summary and the commit agree.
  const preview = reconcileConflictsInPatch(state, next, clockISO(state.clock)).result
  const flagged = preview.conflictsRaised.length
  const resolved = preview.conflictsResolved.length
  mutate(api, actor, [...createMetas, ...summary, ...extraMetas], (s) => {
    const loads = { ...s.masterLoads.loads }
    for (const { load, result: r, rows } of sheets) {
      loads[load.id] = { ...load, rows: stored(rows), status: 'loaded', loadedAtISO, loadedRecordIds: r.recordIds, loadedSummary: { flagged, resolved, fallbacks } }
    }
    const extra = extraPatch(s)
    return { ...next, masterLoads: { ...s.masterLoads, ...extra.masterLoads, loads: { ...(extra.masterLoads?.loads ?? {}), ...loads } } }
  })
  const loaded = sheets.reduce((n, s) => n + counts(s.rows).valid, 0)
  const rejected = sheets.reduce((n, s) => n + counts(s.rows).rejected, 0)
  return ok({ loaded, rejected, recordIds, flagged, resolved, fallbacks })
}

/** Drop a staged load. Audited `masterLoad.discard`. */
export function discardMasterLoad(api: AppStoreApi, actor: Actor, loadId: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', SEED_ONLY)
  const load = api.getState().masterLoads.loads[loadId]
  if (load === undefined) return refuse('notFound', 'That load was not found.')
  if (load.status !== 'staged') return refuse('notStaged', 'Only a staged sheet can be discarded.')
  if (load.goLiveBatchId !== undefined) return refuse('goLiveSheet', 'This sheet is part of the go-live load: load or discard the go-live load.')
  mutate(
    api,
    actor,
    { entityType: 'masterLoad', entityId: loadId, action: 'masterLoad.discard', after: { entity: load.entity }, stampBookingId: null },
    (s) => ({ masterLoads: { ...s.masterLoads, loads: { ...s.masterLoads.loads, [loadId]: { ...load, status: 'discarded' } } } }),
  )
  return ok(undefined)
}

/** The live staged load of a sheet outside any go-live batch, if one is waiting. */
export function stagedLoadFor(state: Pick<AppState, 'masterLoads'>, entity: LoadEntity): MasterLoad | undefined {
  return Object.values(state.masterLoads.loads).find((l) => l.status === 'staged' && l.entity === entity && l.goLiveBatchId === undefined)
}
