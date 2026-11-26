/**
 * Arrivals: what the Intake feed shows (build plan Phase 68; US-02.1.4, FT-02.1, DM-11, D117, D125). Pure: it
 * reads the intake records and the matcher's view, never the store.
 *
 * An arrival (`ImportBatch`) is made by its source. Its rows are grouped into **arriving Lists**: the rows of one
 * arrival that share hospital, day, session and surgeon as sent. Each arriving List is one feed item with a kind
 * (an update to a List AA holds, a new List, a cancellation, Lists that match exactly). An arrival with no rows is
 * one item of its own (a PDF that cannot be read, a held message). Each row waiting for an NHI is also its own item
 * (`needsNhi`), and its List carries the Needs NHI flag while it is undecided.
 *
 * The feed groups items: a hospital file holding two or more Lists is a heading over them; a PDF is one List; the
 * rows waiting for an NHI gather in a "Waiting" group at the foot of To decide.
 */

import type { ChangeType, ImportBatch, ImportRow, IncomingBookingFields, Session, SurgeonPdfList } from '../types'
import {
  effectiveIncoming,
  hasNhi,
  listsAtKey,
  normaliseName,
  resolveSurgeon,
  sessionLabel,
  suggestDecision,
  validNhiOf,
  type MatchingView,
  type RowAssessment,
} from './matching'
import { titledSurname } from '../names'
import { normaliseHpiCpn } from '../surgeons'
import { validateEthnicityCode } from '../nzhis'
import { unsureValues } from './pdfRead'

// ---------------------------------------------------------------------------
// The contract (fixed by Phase 68; Wave 7 reads it, never edits it)
// ---------------------------------------------------------------------------

/** The kinds of arrival the feed shows and the Workbench dispatches on (D117): one bench each. */
export type ArrivalKind = 'update' | 'newList' | 'cancellation' | 'unreadable' | 'matchesExactly' | 'held' | 'needsNhi'

export const ARRIVAL_KINDS: readonly ArrivalKind[] = ['update', 'newList', 'cancellation', 'unreadable', 'matchesExactly', 'held', 'needsNhi']

/** The kind in words, as the feed and the Workbench show it. */
export const ARRIVAL_KIND_LABELS: Record<ArrivalKind, string> = {
  update: 'Update',
  newList: 'New List',
  cancellation: 'Cancellation',
  unreadable: 'Cannot be read',
  matchesExactly: 'Matches exactly',
  held: 'Held message',
  needsNhi: 'Needs NHI',
}

/** Where an arrival came from, as a mark on the item (never a tab): a hospital's feed, or the rooms' PDF. */
export type ArrivalSourceMark =
  | { kind: 'hospital'; hospitalId: string; label: string }
  | { kind: 'rooms'; label: string; senderEmail?: string; byHand?: boolean }

/** A flag on an item, each with a count: rows waiting for an NHI, read values to check, data quality, removals. */
export type ArrivalFlag = 'needsNhi' | 'toCheck' | 'dataQuality' | 'removals'

export const ARRIVAL_FLAG_LABELS: Record<ArrivalFlag, string> = {
  needsNhi: 'Needs NHI',
  toCheck: 'Values to check',
  dataQuality: 'Data quality',
  removals: 'Removals',
}

/** What one row of an arriving List would do (from its decision once decided, else from the matcher). */
export type RowChange = 'added' | 'changed' | 'cancelled' | 'unchanged' | 'removed' | 'waiting'

export interface ArrivalCounts {
  /** Every row of the item. */
  rows: number
  /** Rows not yet decided. */
  open: number
  added: number
  changed: number
  cancelled: number
  unchanged: number
  removed: number
  /** Open rows waiting for an NHI. */
  waitingNhi: number
}

/** One feed item. `key` is stable (from the arrival id and the four keys as sent), never parsed by a reader. */
export interface ArrivalItem {
  key: string
  kind: ArrivalKind
  batchId: string
  /** The item's rows (an arriving List's every row, waiting ones included; a `needsNhi` item's one row; none for unreadable or held). */
  rowIds: string[]
  openRowIds: string[]
  hospitalId: string
  dateISO?: string
  session?: Session
  /** The surgeon as sent, and resolved to the master when it resolves. */
  surgeonName?: string
  surgeonId?: string
  /** The anaesthetist the sender named, resolved to the master (DM-19). */
  namedAnaesthetistId?: string
  /** The List AA holds that this arrival updates, cancels from or matches (absent for a new List). */
  heldListId?: string
  source: ArrivalSourceMark
  receivedAtISO: string
  /** The item's title line: "Mr Okafor · St George's · Wed 25 Nov AM" (a held or unreadable item: its file or message). */
  title: string
  counts: ArrivalCounts
  /** Each raised flag with its count; absent flags are not raised. */
  flags: Partial<Record<ArrivalFlag, number>>
  /** Every row decided (or, for an unreadable PDF or held message, dismissed). */
  decided: boolean
  /** Why an unreadable PDF or a held message could not become a List. */
  reason?: string
}

/** A group in the feed: a hospital file's heading over its Lists, one item alone, or the rows waiting for an NHI. */
export interface ArrivalGroup {
  key: string
  kind: 'file' | 'single' | 'waiting'
  /** A file's heading: its label, source and when it arrived, and how many Lists it holds. */
  heading?: { label: string; source: ArrivalSourceMark; receivedAtISO: string; listCount: number }
  items: ArrivalItem[]
}

/** The feed's filters (D125), kept in the URL by `intakePaths.ts`. To decide is the default. */
export type FeedFilter =
  | { kind: 'toDecide' }
  | { kind: 'needsNhi' }
  | { kind: 'roomsPdfs' }
  | { kind: 'hospital'; hospitalId: string }
  | { kind: 'decided' }

/** What the read model reads: the intake records (structural, so the domain never imports the store). */
export interface ArrivalIntake {
  batches: Readonly<Record<string, ImportBatch>>
  rows: Readonly<Record<string, ImportRow>>
  pdfLists: Readonly<Record<string, SurgeonPdfList>>
}

/** The extra facts the store hands in: patients flagged for data quality (by NHI), and the anaesthetists to resolve a named one. */
export interface ArrivalExtras {
  dataQualityNhis: ReadonlySet<string>
  anaesthetists: Readonly<Record<string, { name: string; hpiId?: string }>>
}

/** The row fields the arriving-List key is built from (as sent, never the office's corrections). */
export type ArrivingListKeyFields = Pick<IncomingBookingFields, 'hospitalId' | 'dateISO' | 'session' | 'surgeon'>

// ---------------------------------------------------------------------------
// One row
// ---------------------------------------------------------------------------

const SESSION_ORDER: Record<Session, number> = { AM: 0, PM: 1, OOH: 2 }

const CHANGE_OF: Record<ChangeType, RowChange> = { new: 'added', modification: 'changed', cancellation: 'cancelled', noChange: 'unchanged' }

/** The surgeon part of the key: the HPI CPN, else the name lower-cased with every other character run a hyphen, else `none`. */
function surgeonSlug(surgeon: IncomingBookingFields['surgeon']): string {
  const cpn = surgeon?.hpiId?.trim() ?? ''
  if (cpn !== '') return cpn
  const name = (surgeon?.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return name !== '' ? name : 'none'
}

/**
 * The arriving List's key: the arrival and the four keys as sent (never the office's corrections), so a row keeps its
 * item whatever is corrected. Stable across reloads; readers never parse it.
 */
export function arrivingListKey(batchId: string, fields: ArrivingListKeyFields): string {
  return `${batchId}~${fields.dateISO}~${fields.session}~${fields.hospitalId}~${surgeonSlug(fields.surgeon)}`
}

/**
 * A row waiting for an NHI: open, not a removal, and no NHI sent after corrections (the matcher's `waitingForNhi`: an
 * NHI that is not valid is not waiting). Reads the row alone, so the badge needs only the intake slice.
 */
export function rowWaitsForNhi(row: Pick<ImportRow, 'incoming' | 'corrections' | 'status'> & { removalOfBookingId?: string }): boolean {
  return row.status === 'open' && row.removalOfBookingId === undefined && !hasNhi(effectiveIncoming(row))
}

/**
 * The matcher's assessment of a row, cached per view and row record (both are replaced, never edited, when they
 * change; `suggestDecision` is pure), so the feed, the counts and the List's rows assess each row once.
 */
const assessed = new WeakMap<MatchingView, WeakMap<ImportRow, RowAssessment>>()
export function assessArrivalRow(view: MatchingView, row: ImportRow): RowAssessment {
  let byRow = assessed.get(view)
  if (byRow === undefined) {
    byRow = new WeakMap()
    assessed.set(view, byRow)
  }
  const hit = byRow.get(row)
  if (hit !== undefined) return hit
  const a = suggestDecision(view, row)
  byRow.set(row, a)
  return a
}

/** What a row would do, or did: its decision once decided, else the matcher's reading. */
export function rowChangeOf(view: MatchingView, row: ImportRow): RowChange {
  if (row.removalOfBookingId !== undefined) return 'removed'
  if (rowWaitsForNhi(row)) return 'waiting'
  const d = row.decision
  if (d !== undefined) {
    if (d.kind === 'match') return CHANGE_OF[d.changeType]
    if (d.kind === 'createBooking' || d.kind === 'createList' || d.kind === 'createDraft') return 'added'
  }
  const a = assessArrivalRow(view, row)
  return a.waitingForNhi ? 'waiting' : CHANGE_OF[a.changeType]
}

/** A row's data quality: its patient (by the effective NHI) is flagged, or its ethnicity code (corrected first) fails the check. */
export function rowHasDataQualityIssue(row: Pick<ImportRow, 'incoming' | 'corrections'>, dataQualityNhis: ReadonlySet<string>): boolean {
  const nhi = validNhiOf(effectiveIncoming(row))
  if (nhi !== undefined && dataQualityNhis.has(nhi)) return true
  const code = row.corrections?.ethnicityCode ?? row.incoming.patient.ethnicityCode
  return code !== undefined && code.trim() !== '' && validateEthnicityCode(code).verdict !== 'valid'
}

/** The rooms' PDF an arrival came with, if any. */
function pdfListOf(intake: ArrivalIntake, batchId: string): SurgeonPdfList | undefined {
  const id = intake.batches[batchId]?.pdfListId
  return id === undefined ? undefined : intake.pdfLists[id]
}

/** The unsure read values of the PDF row a row came from (0 for a hospital row). */
export function rowUnsureValueCount(intake: ArrivalIntake, row: Pick<ImportRow, 'batchId' | 'pdfRowId'>): number {
  if (row.pdfRowId === undefined) return 0
  const pdfRow = pdfListOf(intake, row.batchId)?.rows.find((r) => r.id === row.pdfRowId)
  return unsureValues(pdfRow?.read).length
}

/** A row's own flags: waiting for an NHI, values to check, data quality, an open removal. */
export function rowArrivalFlags(intake: ArrivalIntake, extras: Pick<ArrivalExtras, 'dataQualityNhis'>, row: ImportRow, change: RowChange): ArrivalFlag[] {
  const flags: ArrivalFlag[] = []
  if (change === 'waiting' && row.status === 'open') flags.push('needsNhi')
  if (rowUnsureValueCount(intake, row) > 0) flags.push('toCheck')
  if (rowHasDataQualityIssue(row, extras.dataQualityNhis)) flags.push('dataQuality')
  if (row.removalOfBookingId !== undefined && row.status === 'open') flags.push('removals')
  return flags
}

/** The counts over rows with their changes (one source for the feed item and the List's rows). */
export function arrivalCounts(reads: readonly { row: Pick<ImportRow, 'status'>; change: RowChange }[]): ArrivalCounts {
  const counts: ArrivalCounts = { rows: reads.length, open: 0, added: 0, changed: 0, cancelled: 0, unchanged: 0, removed: 0, waitingNhi: 0 }
  for (const { row, change } of reads) {
    if (row.status === 'open') counts.open += 1
    if (change === 'waiting') {
      if (row.status === 'open') counts.waitingNhi += 1
    } else counts[change] += 1
  }
  return counts
}

/** Rows in a List's order: by time as sent or corrected (untimed last), then patient name, then id. */
export function arrivalRowOrder(a: ImportRow, b: ImportRow): number {
  const fa = effectiveIncoming(a)
  const fb = effectiveIncoming(b)
  return (
    (fa.scheduledTime ?? '99:99').localeCompare(fb.scheduledTime ?? '99:99') ||
    fa.patient.name.localeCompare(fb.patient.name) ||
    a.id.localeCompare(b.id)
  )
}

/** The anaesthetist the sender named, resolved to the master (DM-19): by HPI CPN first, else one exact name without the title. */
export function resolveNamedAnaesthetist(
  anaesthetists: ArrivalExtras['anaesthetists'],
  fields: Pick<IncomingBookingFields, 'anaesthetist'>,
): string | undefined {
  const sent = fields.anaesthetist
  if (sent === undefined) return undefined
  const entries = Object.entries(anaesthetists).sort(([a], [b]) => a.localeCompare(b))
  const cpn = sent.hpiId?.trim() ?? ''
  if (cpn !== '') {
    const hit = entries.find(([, a]) => a.hpiId !== undefined && normaliseHpiCpn(a.hpiId) === normaliseHpiCpn(cpn))
    if (hit !== undefined) return hit[0]
  }
  const wanted = normaliseName(sent.name)
  if (wanted === '') return undefined
  const byName = entries.filter(([, a]) => normaliseName(a.name) === wanted)
  return byName.length === 1 ? byName[0]![0] : undefined
}

/** Where an arrival came from, as its mark. */
export function arrivalSourceMark(batch: Pick<ImportBatch, 'arrivalSource'>, hospitals: MatchingView['hospitals']): ArrivalSourceMark {
  const src = batch.arrivalSource
  switch (src.kind) {
    case 'hospitalFeed':
      return { kind: 'hospital', hospitalId: src.hospitalId, label: hospitals[src.hospitalId]?.name ?? src.hospitalId }
    case 'mailbox':
      return { kind: 'rooms', label: 'Rooms PDF', senderEmail: src.senderEmail }
    case 'byHand':
      return { kind: 'rooms', label: 'Rooms PDF', senderEmail: src.senderEmail, byHand: true }
  }
}

// ---------------------------------------------------------------------------
// The feed's items
// ---------------------------------------------------------------------------

const NO_COUNTS: ArrivalCounts = { rows: 0, open: 0, added: 0, changed: 0, cancelled: 0, unchanged: 0, removed: 0, waitingNhi: 0 }

/** The List a row belongs to on AA's side: its decision's List, its removal's Booking's List, else the matcher's match. */
function heldListOfRow(view: MatchingView, row: ImportRow): string | undefined {
  const live = (id: string | undefined) => (id !== undefined && view.lists[id] !== undefined ? id : undefined)
  const d = row.decision
  if (d !== undefined) {
    if (d.kind === 'match') return live(d.listId ?? view.bookings[d.bookingId]?.listId)
    if (d.kind === 'createBooking' || d.kind === 'createList' || d.kind === 'createDraft') return live(d.listId)
  }
  if (row.removalOfBookingId !== undefined) return live(view.bookings[row.removalOfBookingId]?.listId)
  if (rowWaitsForNhi(row)) return undefined
  return live(assessArrivalRow(view, row).match?.listId)
}

function surgeonTitle(view: MatchingView, surgeonId: string | undefined, fields: IncomingBookingFields): string {
  const name = surgeonId !== undefined ? view.surgeons[surgeonId]?.name : fields.surgeon?.name
  return name !== undefined && name.trim() !== '' ? titledSurname(name) : 'Surgeon not named'
}

const isCreate = (d: ImportRow['decision']) => d?.kind === 'createBooking' || d?.kind === 'createList' || d?.kind === 'createDraft'
const makesList = (d: ImportRow['decision']) => d?.kind === 'createList' || d?.kind === 'createDraft'

/** One arriving List's item, then an item for each of its rows waiting for an NHI. */
function listItems(view: MatchingView, intake: ArrivalIntake, extras: ArrivalExtras, batch: ImportBatch, key: string, rows: ImportRow[]): ArrivalItem[] {
  const first = rows[0]!
  const fields = first.incoming
  const surgeonId = resolveSurgeon(view, first)
  const reads = rows.map((row) => ({ row, change: rowChangeOf(view, row) }))
  const counts = arrivalCounts(reads)
  const nonWaiting = reads.filter((r) => r.change !== 'waiting')

  let heldListId: string | undefined
  for (const r of reads) {
    heldListId = heldListOfRow(view, r.row)
    if (heldListId !== undefined) break
  }
  // An unrecognised surgeon never borrows another surgeon's List at the same hospital and session.
  if (heldListId === undefined && surgeonId !== undefined) heldListId = listsAtKey(view, fields, surgeonId)[0]?.id

  // A List this arrival made (its rows decided onto a List or Draft List it created) stays a new List under Decided.
  const madeHere = nonWaiting.length > 0 && nonWaiting.every((r) => isCreate(r.row.decision)) && nonWaiting.some((r) => makesList(r.row.decision))
  let kind: ArrivalKind
  if (nonWaiting.length > 0 && nonWaiting.every((r) => r.row.incoming.hospitalStatus === 'cancelled' && r.row.removalOfBookingId === undefined)) kind = 'cancellation'
  else if (heldListId === undefined || madeHere) kind = 'newList'
  else if (nonWaiting.length > 0 && nonWaiting.every((r) => r.change === 'unchanged')) kind = 'matchesExactly'
  else kind = 'update'

  const flags: Partial<Record<ArrivalFlag, number>> = {}
  if (counts.waitingNhi > 0) flags.needsNhi = counts.waitingNhi
  const pdf = pdfListOf(intake, batch.id)
  if (pdf !== undefined) {
    const pdfRowIds = new Set(rows.flatMap((r) => (r.pdfRowId !== undefined ? [r.pdfRowId] : [])))
    const toCheck = pdf.rows.filter((r) => pdfRowIds.has(r.id)).reduce((n, r) => n + unsureValues(r.read).length, 0) + unsureValues(pdf.headerRead).length
    if (toCheck > 0) flags.toCheck = toCheck
  }
  const dataQuality = rows.filter((r) => rowHasDataQualityIssue(r, extras.dataQualityNhis)).length
  if (dataQuality > 0) flags.dataQuality = dataQuality
  const removals = rows.filter((r) => r.removalOfBookingId !== undefined && r.status === 'open').length
  if (removals > 0) flags.removals = removals

  const hospital = view.hospitals[fields.hospitalId]?.name ?? fields.hospitalId
  const when = sessionLabel(fields.dateISO, fields.session)
  const named = rows.find((r) => r.incoming.anaesthetist !== undefined)
  const namedAnaesthetistId = named !== undefined ? resolveNamedAnaesthetist(extras.anaesthetists, named.incoming) : undefined
  const base = {
    batchId: batch.id,
    hospitalId: fields.hospitalId,
    dateISO: fields.dateISO,
    session: fields.session,
    ...(fields.surgeon !== undefined ? { surgeonName: fields.surgeon.name } : {}),
    ...(surgeonId !== undefined ? { surgeonId } : {}),
    ...(namedAnaesthetistId !== undefined ? { namedAnaesthetistId } : {}),
    ...(heldListId !== undefined ? { heldListId } : {}),
    source: arrivalSourceMark(batch, view.hospitals),
    receivedAtISO: batch.receivedAtISO,
  }
  const openRowIds = rows.filter((r) => r.status === 'open').map((r) => r.id)
  const item: ArrivalItem = {
    ...base,
    key,
    kind,
    rowIds: rows.map((r) => r.id),
    openRowIds,
    title: `${surgeonTitle(view, surgeonId, fields)} · ${hospital} · ${when}`,
    counts,
    flags,
    decided: openRowIds.length === 0,
  }
  const waiting: ArrivalItem[] = reads
    .filter((r) => r.change === 'waiting' && r.row.status === 'open')
    .map(({ row }) => ({
      ...base,
      key: `nhi~${row.id}`,
      kind: 'needsNhi',
      rowIds: [row.id],
      openRowIds: [row.id],
      title: `${effectiveIncoming(row).patient.name} · ${hospital} · ${when}`,
      counts: { ...NO_COUNTS, rows: 1, open: 1, waitingNhi: 1 },
      flags: { needsNhi: 1 },
      decided: false,
    }))
  return [item, ...waiting]
}

/** An arrival with no rows: an unreadable PDF or a held message, one item until dismissed. */
function emptyArrivalItem(view: MatchingView, batch: ImportBatch, kind: 'unreadable' | 'held', reason: string): ArrivalItem {
  return {
    key: batch.id,
    kind,
    batchId: batch.id,
    rowIds: [],
    openRowIds: [],
    hospitalId: batch.hospitalId,
    source: arrivalSourceMark(batch, view.hospitals),
    receivedAtISO: batch.receivedAtISO,
    title: batch.file?.name ?? batch.label,
    counts: { ...NO_COUNTS },
    flags: {},
    decided: batch.dismissed !== undefined,
    reason,
  }
}

/**
 * Every feed item, newest arrival first (then by arrival id), and within an arrival by day, session and surgeon: each
 * arriving List followed by its rows waiting for an NHI; an unreadable PDF or a held message as one item.
 */
export function arrivalItems(view: MatchingView, intake: ArrivalIntake, extras: ArrivalExtras): ArrivalItem[] {
  const rowsByBatch = new Map<string, ImportRow[]>()
  for (const row of Object.values(intake.rows)) {
    const list = rowsByBatch.get(row.batchId)
    if (list === undefined) rowsByBatch.set(row.batchId, [row])
    else list.push(row)
  }
  const batches = Object.values(intake.batches).sort((a, b) => b.receivedAtISO.localeCompare(a.receivedAtISO) || a.id.localeCompare(b.id))
  const out: ArrivalItem[] = []
  for (const batch of batches) {
    const rows = rowsByBatch.get(batch.id) ?? []
    if (rows.length === 0) {
      if (batch.unreadableReason !== undefined) out.push(emptyArrivalItem(view, batch, 'unreadable', batch.unreadableReason))
      else if (batch.heldReason !== undefined) out.push(emptyArrivalItem(view, batch, 'held', batch.heldReason))
      continue
    }
    const groups = new Map<string, ImportRow[]>()
    for (const row of rows) {
      const key = arrivingListKey(batch.id, row.incoming)
      const group = groups.get(key)
      if (group === undefined) groups.set(key, [row])
      else group.push(row)
    }
    const ordered = [...groups.entries()]
      .map(([key, group]) => ({ key, rows: group.sort(arrivalRowOrder) }))
      .sort((a, b) => {
        const fa = a.rows[0]!.incoming
        const fb = b.rows[0]!.incoming
        return (
          fa.dateISO.localeCompare(fb.dateISO) ||
          SESSION_ORDER[fa.session] - SESSION_ORDER[fb.session] ||
          (fa.surgeon?.name ?? '').toLowerCase().localeCompare((fb.surgeon?.name ?? '').toLowerCase()) ||
          a.key.localeCompare(b.key)
        )
      })
    for (const g of ordered) out.push(...listItems(view, intake, extras, batch, g.key, g.rows))
  }
  return out
}

// ---------------------------------------------------------------------------
// Filters, search and groups
// ---------------------------------------------------------------------------

/** Shown under To decide: undecided, and an arrival with no rows, a row waiting for an NHI, or an open row that is not waiting. */
function toDecideVisible(item: ArrivalItem): boolean {
  if (item.decided) return false
  if (item.kind === 'unreadable' || item.kind === 'held' || item.kind === 'needsNhi') return true
  return item.counts.open > item.counts.waitingNhi
}

/** Whether a filter shows the item (D125). */
export function matchesFeedFilter(item: ArrivalItem, filter: FeedFilter): boolean {
  switch (filter.kind) {
    case 'toDecide':
      return toDecideVisible(item)
    case 'needsNhi':
      return item.kind === 'needsNhi'
    case 'roomsPdfs':
      return toDecideVisible(item) && item.kind !== 'needsNhi' && item.source.kind === 'rooms'
    case 'hospital':
      return toDecideVisible(item) && item.kind !== 'needsNhi' && item.source.kind === 'hospital' && item.source.hospitalId === filter.hospitalId
    case 'decided':
      return item.decided && item.kind !== 'needsNhi'
  }
}

/** The search box: the title, surgeon, source, arrival label and the rows' patient names and NHIs, any case. Empty matches all. */
export function matchesFeedSearch(item: ArrivalItem, q: string, intake: Pick<ArrivalIntake, 'batches' | 'rows'>): boolean {
  const needle = q.trim().toLowerCase()
  if (needle === '') return true
  const hay: string[] = [item.title, item.surgeonName ?? '', item.source.label, intake.batches[item.batchId]?.label ?? '']
  for (const id of item.rowIds) {
    const row = intake.rows[id]
    if (row === undefined) continue
    const f = effectiveIncoming(row)
    hay.push(f.patient.name, f.patient.nhi ?? '', row.incoming.patient.name, row.incoming.patient.nhi ?? '')
  }
  return hay.some((h) => h.toLowerCase().includes(needle))
}

/**
 * The feed's groups for a filter and search, in feed order: a hospital arrival showing two or more Lists is a file
 * heading over them; under To decide the rows waiting for an NHI gather in one Waiting group at the foot; everything
 * else stands alone.
 */
export function feedGroups(items: readonly ArrivalItem[], filter: FeedFilter, q: string, intake: Pick<ArrivalIntake, 'batches' | 'rows'>): ArrivalGroup[] {
  const shown = items.filter((i) => matchesFeedFilter(i, filter) && matchesFeedSearch(i, q, intake))
  const gather = filter.kind === 'toDecide'
  const waiting = gather ? shown.filter((i) => i.kind === 'needsNhi') : []
  const rest = gather ? shown.filter((i) => i.kind !== 'needsNhi') : shown
  const groups: ArrivalGroup[] = []
  let i = 0
  while (i < rest.length) {
    const item = rest[i]!
    if (item.source.kind === 'hospital' && item.kind !== 'needsNhi') {
      let j = i + 1
      while (j < rest.length && rest[j]!.batchId === item.batchId && rest[j]!.kind !== 'needsNhi') j += 1
      if (j - i >= 2) {
        groups.push({
          key: `file~${item.batchId}`,
          kind: 'file',
          heading: { label: intake.batches[item.batchId]?.label ?? item.source.label, source: item.source, receivedAtISO: item.receivedAtISO, listCount: j - i },
          items: rest.slice(i, j),
        })
        i = j
        continue
      }
    }
    groups.push({ key: item.key, kind: 'single', items: [item] })
    i += 1
  }
  if (waiting.length > 0) groups.push({ key: 'waiting', kind: 'waiting', items: waiting })
  return groups
}

/** How many items each filter shows; `byHospital` keys every hospital that has any item. */
export function feedFilterCounts(items: readonly ArrivalItem[]): {
  toDecide: number
  needsNhi: number
  roomsPdfs: number
  decided: number
  byHospital: Record<string, number>
} {
  const count = (filter: FeedFilter) => items.filter((i) => matchesFeedFilter(i, filter)).length
  const hospitalIds = [...new Set(items.flatMap((i) => (i.source.kind === 'hospital' ? [i.source.hospitalId] : [])))].sort((a, b) => a.localeCompare(b))
  const byHospital: Record<string, number> = {}
  for (const hospitalId of hospitalIds) byHospital[hospitalId] = count({ kind: 'hospital', hospitalId })
  return { toDecide: count({ kind: 'toDecide' }), needsNhi: count({ kind: 'needsNhi' }), roomsPdfs: count({ kind: 'roomsPdfs' }), decided: count({ kind: 'decided' }), byHospital }
}
