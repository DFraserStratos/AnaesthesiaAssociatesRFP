/**
 * The seed load's shapes (catch-up Phase 42; US-13.4.3, DM-38): the
 * developer's one-off load of AA's controlled spreadsheets, saved as CSV.
 *
 * A spec maps a sheet's columns onto the fields a master's own create action
 * takes, and its row check calls that master's own validators: no spec
 * declares a second shape or a second rule. One Contract is one row and one
 * price range is one row; there are no lines, versions or row groups.
 */

/** Every sheet the load takes, in US-13.4.3's list plus the two calendars. */
export type LoadEntity =
  | 'specialties'
  | 'fundingTags'
  | 'hospitals'
  | 'hospitalHolidays'
  | 'publicHolidays'
  | 'surgeons'
  | 'anaesthetists'
  | 'rvgGroups'
  | 'modifiers'
  | 'parties'
  | 'contracts'
  | 'priceRanges'

/** The order sheets load in: anything a row names loads before it (a Party before its Contracts). */
export const LOAD_ORDER: readonly LoadEntity[] = [
  'specialties',
  'surgeons',
  'anaesthetists',
  'hospitals',
  'hospitalHolidays',
  'publicHolidays',
  'rvgGroups',
  'modifiers',
  'parties',
  'fundingTags',
  'contracts',
  'priceRanges',
]

export type MasterLoadId = string
export type GoLiveBatchId = string

/** One spreadsheet row's outcome. `notes` are a valid row's "to complete" remarks (D89). */
export interface RowResult<F = unknown> {
  /** The spreadsheet row, the header being row 1. */
  rowNumber: number
  cells: string[]
  status: 'valid' | 'rejected'
  /** Every reason, not only the first, word for word the manual refusal. */
  reasons: string[]
  notes: string[]
  /** The row's key within the sheet (duplicates are rejected). */
  key: string
  /** The parsed fields, for a valid row. */
  fields?: F
}

export type MasterLoadSource = { kind: 'sample'; sampleId: string } | { kind: 'file'; fileName: string }

/** One checked sheet: staged until loaded or discarded. A work item, not master data. */
export interface MasterLoad {
  id: MasterLoadId
  entity: LoadEntity
  source: MasterLoadSource
  header: string[]
  /** A missing required column rejects the whole sheet, and no row is valid. */
  headerErrors: string[]
  rows: RowResult[]
  status: 'staged' | 'loaded' | 'discarded'
  stagedAtISO: string
  stagedBy: string
  loadedAtISO?: string
  loadedRecordIds?: string[]
  /** What the load did beyond its rows: Lists flagged or cleared, fallbacks made. */
  loadedSummary?: { flagged: number; resolved: number; fallbacks: number }
  goLiveBatchId?: GoLiveBatchId
}

/** A Solutions Plus operation name on the go-live list and AA's decision on it (US-13.4.2). */
export interface GoLiveCandidate {
  scanRow: number
  name: string
  /** Shown struck through, never read into anything that loads. */
  spUnits: number | null
  decision: 'approved' | 'notApproved' | 'junk'
  reason?: string
}

/** The go-live load: the Solutions Plus names beside the controlled sheets, staged together. */
export interface GoLiveBatch {
  id: GoLiveBatchId
  candidates: GoLiveCandidate[]
  /** One staged load per controlled sheet, in pack order. */
  loadIds: MasterLoadId[]
  status: 'staged' | 'loaded' | 'discarded'
  stagedAtISO: string
  stagedBy: string
  loadedAtISO?: string
  /** The commit's counts, for the result line. */
  loadedCounts?: { bySheet: Partial<Record<LoadEntity, number>>; notLoaded: number; priceRanges: number }
}

/** The top-level slice: loads are work items, kept apart from `masters`. */
export interface MasterLoadsSlice {
  loads: Record<MasterLoadId, MasterLoad>
  goLive: GoLiveBatch | null
}

export function emptyMasterLoadsSlice(): MasterLoadsSlice {
  return { loads: {}, goLive: null }
}

/** One column of a sheet's template. */
export interface LoadColumn {
  key: string
  header: string
  required: boolean
  hint?: string
}

/**
 * What a row check reads beyond the cells. A row may name a record an earlier
 * row or sheet of the same load made (a surgeon a specialty, a Contract its
 * Party, a price range its Contract): the check resolves names against a
 * working copy of the masters with those records folded in, so no list of
 * pending keys is needed.
 */
export interface LoadContext {
  /** The demo clock's today (an anaesthetist's start date, the backdated range). */
  todayISO: string
}

/** A sheet's spec: its columns, its row check and its key. */
export interface LoaderSpec<F = unknown, M = unknown> {
  entity: LoadEntity
  /** "Hospitals", for the Seed load list. */
  label: string
  columns: readonly LoadColumn[]
  /** One line under the sheet on the Seed load view, when it has one. */
  hint?: string
  /** The key columns the result table shows beside Row. */
  keyColumns: readonly string[]
  /** Parse and check one row against the masters: fields, or every reason it is refused. */
  parseRow(cells: Readonly<Record<string, string>>, masters: M, ctx: LoadContext): { fields: F; notes?: string[] } | { reasons: string[] }
  keyOf(fields: F): string
  /** Whether the record is already in master data (a load adds and never overwrites). */
  existing(fields: F, masters: M): boolean
}
