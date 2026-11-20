/**
 * The go-live load (catch-up Phase 42; US-13.4.2 AC1 and AC2, US-13.4.3): a
 * clean cut from Solutions Plus. The demo stages the Solutions Plus names
 * beside AA's decisions and the controlled spreadsheets (`GO_LIVE_PACK`),
 * each sheet a staged `MasterLoad` checked in pack order over one working copy
 * (a Party before its Contracts, a Contract before its further price ranges).
 * AA approves or un-approves names (the Admin app's actor: AA's decision);
 * "Load approved data" folds every sheet's valid rows through the masters' own
 * planners in ONE `mutate()`. A Contracts row whose name AA has not approved,
 * or that is junk, is rejected, and so is any price range naming it: nothing
 * comes across because it exists in Solutions Plus, and Solutions Plus units
 * are never read.
 *
 * Stage, commit and discard act as `SEED_LOAD_ACTOR` (the developer's step).
 */

import { parseCsv, type ParsedCsv } from '../domain/masterLoad/csv'
import { blockedByDecision, evaluateGoLive, GO_LIVE_PACK, INVOICE_DESCRIPTION_HEADER, NOT_APPROVED_FOR_GO_LIVE, type GoLiveOutcome } from '../domain/masterLoad/goLive'
import { goLiveCandidates, normaliseOperationName } from '../domain/masterLoad/solutionsPlus'
import type { GoLiveBatch, GoLiveCandidate, LoadEntity, MasterLoad, RowResult } from '../domain/masterLoad/types'
import type { AppState, AppStoreApi } from './appStore'
import { checkSheet, commitFolded, parsedOfLoad, type CommitResult, type SheetResult, type WorkState } from './masterLoadActions'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'

/** Check one pack sheet; a Contracts row held back by AA's decision on its name is rejected before its rules run. */
function checkPackSheet(entity: LoadEntity, parsed: ParsedCsv, work: WorkState, actor: Actor, loadId: string, candidates: readonly GoLiveCandidate[]): SheetResult {
  if (entity !== 'contracts') return checkSheet(entity, parsed, work, actor, loadId)
  const col = parsed.header.indexOf(INVOICE_DESCRIPTION_HEADER)
  const blocked = col < 0 ? [] : parsed.rows.filter((r) => blockedByDecision(candidates, r.cells[col] ?? ''))
  const rest: ParsedCsv = { header: parsed.header, rows: parsed.rows.filter((r) => !blocked.includes(r)) }
  const result = checkSheet(entity, rest, work, actor, loadId)
  const held: RowResult[] = blocked.map((r) => ({ rowNumber: r.rowNumber, cells: r.cells, status: 'rejected', reasons: [NOT_APPROVED_FOR_GO_LIVE], notes: [], key: '' }))
  return { ...result, rows: [...result.rows, ...held].sort((a, b) => a.rowNumber - b.rowNumber) }
}

/** Every pack sheet checked in order over one working copy. */
function checkPack(
  state: AppState,
  actor: Actor,
  sheets: readonly { entity: LoadEntity; loadId: string; parsed: ParsedCsv }[],
  candidates: readonly GoLiveCandidate[],
): SheetResult[] {
  let work: WorkState = state
  const out: SheetResult[] = []
  for (const s of sheets) {
    const r = checkPackSheet(s.entity, s.parsed, work, actor, s.loadId, candidates)
    out.push(r)
    work = r.work
  }
  return out
}

/** The invoice descriptions Contracts already carry, folded (a name one already has needs nothing). */
function descriptionsInMaster(state: Pick<AppState, 'masters'>): Set<string> {
  return new Set(
    Object.values(state.masters.contracts)
      .map((c) => c.invoiceDescription ?? '')
      .filter((d) => d !== '')
      .map(normaliseOperationName),
  )
}

/** The batch's loads in pack order. */
function batchLoads(state: Pick<AppState, 'masterLoads'>, batch: GoLiveBatch): MasterLoad[] {
  return batch.loadIds.map((id) => state.masterLoads.loads[id]).filter((l): l is MasterLoad => l !== undefined)
}

/** Each candidate's outcome against the batch as staged now (the view's Result column). */
export function goLiveOutcomes(state: Pick<AppState, 'masterLoads' | 'masters'>): Map<number, GoLiveOutcome> {
  const batch = state.masterLoads.goLive
  if (batch === null) return new Map()
  const contracts = batchLoads(state, batch).find((l) => l.entity === 'contracts')
  return evaluateGoLive(batch.candidates, contracts, descriptionsInMaster(state))
}

/** AA's decision on a name, as audit action codes written out for the label check. */
const APPROVE = { action: 'goLive.approve' }
const UNAPPROVE = { action: 'goLive.unapprove' }

const STAGED_ALREADY ='A go-live load is already waiting; load or discard it first.'

/**
 * Prepare the go-live load: the candidates with AA's recorded decisions and
 * one staged load per controlled sheet. Refused while a batch is staged.
 * Audited `goLive.stage`.
 */
export function stageGoLiveLoad(api: AppStoreApi, actor: Actor): Outcome<{ batchId: string; candidates: number; junk: number; notApproved: number; sheets: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the developer seed load can prepare the go-live load.')
  const state = api.getState()
  if (state.masterLoads.goLive?.status === 'staged') return refuse('alreadyStaged', STAGED_ALREADY)
  let counters = state.counters
  const batchAlloc = allocateId(counters, 'goLiveBatch')
  counters = batchAlloc.counters
  const sheets = GO_LIVE_PACK.map((p) => {
    const alloc = allocateId(counters, 'masterLoad')
    counters = alloc.counters
    return { entity: p.entity, loadId: alloc.id, parsed: parseCsv(p.csv), fileName: p.fileName }
  })
  const candidates = goLiveCandidates()
  const results = checkPack(state, actor, sheets, candidates)
  const atISO = clockISO(state.clock)
  const loads: MasterLoad[] = sheets.map((s, i) => ({
    id: s.loadId,
    entity: s.entity,
    source: { kind: 'sample', sampleId: s.fileName },
    header: results[i]!.header,
    headerErrors: results[i]!.headerErrors,
    rows: results[i]!.rows.map(({ fields: _f, ...r }) => r),
    status: 'staged',
    stagedAtISO: atISO,
    stagedBy: actor.who,
    goLiveBatchId: batchAlloc.id,
  }))
  const batch: GoLiveBatch = { id: batchAlloc.id, candidates, loadIds: loads.map((l) => l.id), status: 'staged', stagedAtISO: atISO, stagedBy: actor.who }
  const junk = candidates.filter((c) => c.decision === 'junk').length
  const notApproved = candidates.filter((c) => c.decision === 'notApproved').length
  mutate(
    api,
    actor,
    {
      entityType: 'goLiveBatch',
      entityId: batch.id,
      action: 'goLive.stage',
      after: { candidates: candidates.length, junk, notApproved, sheets: loads.length },
      stampBookingId: null,
    },
    (s) => ({
      masterLoads: { loads: { ...s.masterLoads.loads, ...Object.fromEntries(loads.map((l) => [l.id, l])) }, goLive: batch },
      counters,
    }),
  )
  return ok({ batchId: batch.id, candidates: candidates.length, junk, notApproved, sheets: loads.length })
}

/** Re-check every sheet of the staged batch against the masters now, with these candidates. */
function recheck(state: AppState, actor: Actor, batch: GoLiveBatch, candidates: readonly GoLiveCandidate[]): { loads: MasterLoad[]; results: SheetResult[] } {
  const loads = batchLoads(state, batch)
  const results = checkPack(
    state,
    actor,
    loads.map((l) => ({ entity: l.entity, loadId: l.id, parsed: parsedOfLoad(l) })),
    candidates,
  )
  return { loads, results }
}

/**
 * AA approves or un-approves a name (AA's decision: the Admin app's actor).
 * Junk is excluded and cannot be approved. The Contracts sheet is re-checked
 * at once, so the outcomes follow. Audited `goLive.approve` or
 * `goLive.unapprove`.
 */
export function setGoLiveApproval(api: AppStoreApi, actor: Actor, scanRow: number, approved: boolean, reason?: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can record AA’s decision on a name.')
  const state = api.getState()
  const batch = state.masterLoads.goLive
  if (batch === null || batch.status !== 'staged') return refuse('notStaged', 'No go-live load is waiting.')
  const candidate = batch.candidates.find((c) => c.scanRow === scanRow)
  if (candidate === undefined) return refuse('notFound', 'That scan row is not on the list.')
  if (candidate.decision === 'junk') return refuse('junk', 'Junk is excluded and cannot be approved.')
  const decision = approved ? 'approved' : 'notApproved'
  if (candidate.decision === decision) return ok(undefined)
  const why = reason?.trim() ?? ''
  const nextCandidate: GoLiveCandidate = approved
    ? { scanRow: candidate.scanRow, name: candidate.name, spUnits: candidate.spUnits, decision: 'approved' }
    : { ...candidate, decision: 'notApproved', reason: why !== '' ? why : 'Not approved by AA' }
  const candidates = batch.candidates.map((c) => (c.scanRow === scanRow ? nextCandidate : c))
  const { loads, results } = recheck(state, actor, batch, candidates)
  mutate(
    api,
    actor,
    {
      entityType: 'goLiveBatch',
      entityId: batch.id,
      action: (approved ? APPROVE : UNAPPROVE).action,
      after: { scanRow, name: candidate.name, ...(nextCandidate.reason !== undefined ? { reason: nextCandidate.reason } : {}) },
      stampBookingId: null,
    },
    (s) => {
      const nextLoads = { ...s.masterLoads.loads }
      loads.forEach((l, i) => {
        nextLoads[l.id] = { ...l, rows: results[i]!.rows.map(({ fields: _f, ...r }) => r) }
      })
      return { masterLoads: { loads: nextLoads, goLive: { ...batch, candidates } } }
    },
  )
  return ok(undefined)
}

export interface GoLiveCommitResult extends CommitResult {
  bySheet: Partial<Record<LoadEntity, number>>
  priceRanges: number
  notLoaded: number
}

/**
 * "Load approved data": re-check every sheet, then one `mutate()` folds every
 * sheet's valid rows in pack order. A Contract row (and any price range naming
 * it) loads only when its name is approved or it is an AA addition. Audited
 * `goLive.commit` with the counts.
 */
export function commitGoLiveLoad(api: AppStoreApi, actor: Actor): Outcome<GoLiveCommitResult> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the developer seed load can load the go-live data.')
  const state = api.getState()
  const batch = state.masterLoads.goLive
  if (batch === null || batch.status !== 'staged') return refuse('notStaged', 'No go-live load is waiting.')
  const { loads, results } = recheck(state, actor, batch, batch.candidates)
  const bySheet: Partial<Record<LoadEntity, number>> = {}
  loads.forEach((l, i) => {
    bySheet[l.entity] = results[i]!.rows.filter((r) => r.status === 'valid').length
  })
  const total = Object.values(bySheet).reduce((n, v) => n + (v ?? 0), 0)
  if (total === 0) return refuse('nothingToLoad', 'No row in the go-live load can be loaded.')
  const outcomes = evaluateGoLive(
    batch.candidates,
    { header: loads.find((l) => l.entity === 'contracts')?.header ?? [], rows: results[loads.findIndex((l) => l.entity === 'contracts')]?.rows ?? [] },
    descriptionsInMaster(state),
  )
  const notLoaded = [...outcomes.values()].filter((o) => o.kind !== 'loads').length
  const firstRanges = results[loads.findIndex((l) => l.entity === 'contracts')]?.rows.filter((r) => r.status === 'valid' && (r.fields as { pricing?: { kind: string } } | undefined)?.pricing?.kind === 'fixed').length ?? 0
  const priceRanges = firstRanges + (bySheet.priceRanges ?? 0)
  const counts = { bySheet, notLoaded, priceRanges }
  const loadedAtISO = clockISO(state.clock)
  const extra: MutationMeta[] = [{ entityType: 'goLiveBatch', entityId: batch.id, action: 'goLive.commit', after: { ...bySheet, priceRanges, solutionsPlusNotLoaded: notLoaded }, stampBookingId: null }]
  const committed = commitFolded(
    api,
    actor,
    loads.map((load, i) => ({ load, result: results[i]!, rows: results[i]!.rows })),
    extra,
    () => ({ masterLoads: { loads: {}, goLive: { ...batch, status: 'loaded', loadedAtISO, loadedCounts: counts } } }),
  )
  if (!committed.ok) return committed
  return ok({ ...committed.value, ...counts })
}

/** Drop the staged batch and its sheets. Audited `goLive.discard`. */
export function discardGoLiveLoad(api: AppStoreApi, actor: Actor): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the developer seed load can discard the go-live load.')
  const state = api.getState()
  const batch = state.masterLoads.goLive
  if (batch === null || batch.status !== 'staged') return refuse('notStaged', 'No go-live load is waiting.')
  mutate(
    api,
    actor,
    { entityType: 'goLiveBatch', entityId: batch.id, action: 'goLive.discard', stampBookingId: null },
    (s) => {
      const loads = { ...s.masterLoads.loads }
      for (const id of batch.loadIds) {
        const l = loads[id]
        if (l !== undefined) loads[id] = { ...l, status: 'discarded' }
      }
      return { masterLoads: { loads, goLive: null } }
    },
  )
  return ok(undefined)
}
