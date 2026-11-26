/**
 * The restricted raw hospital row (catch-up Phase 43; US-15.0.6, US-13.5.1,
 * US-13.5.2; US-14.5.1's rule applied to the in-scope failure surface).
 *
 * The working view on Matching shows only the mapped fields. What else the
 * hospital sent is held on the row (`raw`) and shown only to the office, only
 * while the row needs resolving, only with a reason, and masked by
 * `RAW_ROW_MASKING`. Every view writes one audit entry with the reason and the
 * number of columns shown, never a value; a refused attempt by any other role
 * is audited too (the way Phase 14 audits a failed sign-in). Nothing about a
 * view is stored on the row: each view is a fresh request.
 */

import type { ImportBatch, RawImportRow } from '../domain/types'
import type { MaskRule } from '../domain/privacy/mask'
import { redactNhis } from '../domain/privacy/nhiDetect'
import { maskRawRow, RAW_ROW_MASKING } from '../domain/privacy/mask'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { assessImportRow } from './matchingSelectors'

export const RAW_ROW_NOT_ELIGIBLE = 'Raw rows are available only while a row needs resolving'
export const RAW_ROW_OFFICE_ONLY = 'Only office staff can view a raw hospital row'
export const RAW_ROW_REASON_REQUIRED = 'Give a reason to view the raw row'

/** The quick reasons the sheet offers. */
export const RAW_ROW_REASONS = ['Find why this row did not match', 'Check what the hospital sent', 'Hospital asked us to confirm a value'] as const

type RawState = Pick<AppState, 'intake' | 'schedule' | 'masters'>
type Column = { name: string; value: string }

/** The held feed message's batch for an id, if the id names one (a batch with `heldReason` and `messageId`). */
function heldBatchOf(state: RawState, id: string): ImportBatch | undefined {
  const batch = state.intake.batches[id]
  return batch !== undefined && batch.heldReason !== undefined && batch.messageId !== undefined ? batch : undefined
}

/** A held message's raw text, from its dead-letter message (absent when the state carries no integrations). */
export function heldMessageRaw(state: RawState, batchId: string): string | undefined {
  const batch = heldBatchOf(state, batchId)
  if (batch === undefined) return undefined
  const messages = (state as Partial<Pick<AppState, 'integrations'>>).integrations?.messages
  const raw = messages?.[batch.messageId!]?.raw
  return raw !== undefined && raw.trim() !== '' ? raw : undefined
}

/** A held message the office can still view raw: held, not dismissed, its raw text kept. */
function heldEligible(state: RawState, batchId: string): boolean {
  const batch = heldBatchOf(state, batchId)
  return batch !== undefined && batch.dismissed === undefined && heldMessageRaw(state, batchId) !== undefined
}

/**
 * A message's raw text as columns, deterministic: HL7 v2 one column per segment (`MSH`, `SCH`, a repeat `AIP 2`),
 * the PID segment one column per field (`PID-7`); FHIR JSON one column per leaf (`participant[0].actor.display`);
 * anything else one `Message` column.
 */
export function rawMessageColumns(raw: string): RawImportRow {
  const text = raw.trim()
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const columns: Column[] = []
      flatten(JSON.parse(text) as unknown, '', columns)
      return { columns }
    } catch {
      // Not JSON after all: falls through to the plain shapes.
    }
  }
  const lines = text.split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l !== '')
  if (lines.length > 0 && /^[A-Z][A-Z0-9]{2}\|/.test(lines[0]!)) {
    const seen: Record<string, number> = {}
    const columns: Column[] = []
    for (const line of lines) {
      const seg = line.slice(0, 3)
      seen[seg] = (seen[seg] ?? 0) + 1
      if (seg === 'PID') {
        line.split('|').slice(1).forEach((value, i) => { if (value !== '') columns.push({ name: `PID-${i + 1}`, value }) })
        continue
      }
      columns.push({ name: seen[seg]! > 1 ? `${seg} ${seen[seg]}` : seg, value: line.slice(4) })
    }
    return { columns }
  }
  return { columns: [{ name: 'Message', value: text }] }
}

function flatten(value: unknown, path: string, out: Column[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, `${path}[${i}]`, out))
    return
  }
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) flatten(v, path === '' ? k : `${path}.${k}`, out)
    return
  }
  out.push({ name: path === '' ? 'Message' : path, value: value === null || value === undefined ? '' : String(value) })
}

/** Identifying leaves in a message, by key, to the `RAW_ROW_MASKING` rule of the column they stand for. */
const MESSAGE_LEAF_RULES: Readonly<Record<string, MaskRule>> = {
  birthDate: 'yearOnly',
  'PID-7': 'yearOnly',
  'PID-11': 'suburbOnly',
  'PID-13': 'lastThree',
  'PID-14': 'lastThree',
}

/** `RAW_ROW_MASKING` extended to a message's own column names (the same rules, never looser). */
function messageMasking(columns: RawImportRow['columns']): Readonly<Record<string, MaskRule>> {
  const policy: Record<string, MaskRule> = { ...RAW_ROW_MASKING }
  for (const { name } of columns) {
    const leaf = name.replace(/\[\d+\]/g, '').split('.').at(-1)!
    const rule = MESSAGE_LEAF_RULES[name] ?? MESSAGE_LEAF_RULES[leaf]
    if (rule !== undefined) policy[name] = rule
    else if (/^(telecom|phone)/i.test(name) || /\.telecom\b/.test(name)) policy[name] = 'lastThree'
    else if (/(^|\.)address\b/.test(name)) policy[name] = 'suburbOnly'
  }
  return policy
}

/** Whether the row needs resolving: open, and unmatched, waiting for its NHI or blocked by a flag. A held message's batch: held and undismissed. */
export function rawRowEligible(state: RawState, rowId: string): boolean {
  if (state.intake.rows[rowId] === undefined && heldBatchOf(state, rowId) !== undefined) return heldEligible(state, rowId)
  const row = state.intake.rows[rowId]
  if (row === undefined || row.status !== 'open') return false
  const a = assessImportRow(state as AppState, rowId)
  return a !== undefined && (a.queue === 'unmatched' || a.waitingForNhi || a.flags.length > 0)
}

/**
 * The row the harness entry acts on: the selected row, else the oldest open row
 * that needs resolving (the row panel covers the harness bar, so the entry
 * also works with the panel closed; catch-up Phase 43). With no such row, the
 * oldest held message (Phase 71), so the entry also works on Sources.
 */
export function rawRowTarget(state: RawState, selectedRowId: string | undefined): string | undefined {
  if (selectedRowId !== undefined && (state.intake.rows[selectedRowId] !== undefined || heldBatchOf(state, selectedRowId) !== undefined)) return selectedRowId
  const oldest = <T extends { id: string; receivedAtISO: string }>(items: T[]) =>
    items.sort((a, b) => a.receivedAtISO.localeCompare(b.receivedAtISO) || a.id.localeCompare(b.id))[0]?.id
  return (
    oldest(Object.values(state.intake.rows).filter((r) => rawRowEligible(state, r.id))) ??
    oldest(Object.values(state.intake.batches).filter((b) => heldEligible(state, b.id)))
  )
}

/** Why the raw row cannot be viewed now (row-level only; the role is checked on the view). */
export function rawRowRefusal(state: RawState, rowId: string | undefined): string | null {
  if (rowId === undefined || (state.intake.rows[rowId] === undefined && heldBatchOf(state, rowId) === undefined)) return 'No hospital row needs resolving'
  return rawRowEligible(state, rowId) ? null : RAW_ROW_NOT_ELIGIBLE
}

export function viewRawImportRow(api: AppStoreApi, actor: Actor, rowId: string, reason: string): Outcome<RawImportRow> {
  const state = api.getState()
  const row = state.intake.rows[rowId]
  if (row === undefined) return heldBatchOf(state, rowId) !== undefined ? viewHeldMessage(api, actor, rowId, reason) : refuse('notFound', 'Import row not found.')
  // The role first (review fix): every attempt by another role is refused and audited, whatever the row or reason.
  if (actor.role !== 'office') {
    mutate(api, actor, { entityType: 'importRow', entityId: rowId, action: 'importRow.rawViewDenied', after: { role: actor.role, source: actor.source }, stampBookingId: null }, () => ({}))
    return refuse('officeOnly', RAW_ROW_OFFICE_ONLY)
  }
  if (!rawRowEligible(state, rowId)) return refuse('notEligible', RAW_ROW_NOT_ELIGIBLE)
  // The reason is kept; an NHI typed into it is not (review fix).
  const why = redactNhis(reason.trim())
  if (why === '') return refuse('reasonRequired', RAW_ROW_REASON_REQUIRED)
  // Never rebuilt at view time: a row holds the columns it was staged with, or none to show.
  if (row.raw === undefined) return refuse('noRawRow', 'This row holds no raw payload.')
  const masked = maskRawRow(row.raw, RAW_ROW_MASKING)
  mutate(api, actor, { entityType: 'importRow', entityId: rowId, action: 'importRow.rawViewed', after: { reason: why, columnsShown: masked.columns.length }, stampBookingId: null }, () => ({}))
  return ok(masked)
}

/** `viewRawImportRow` for a held message: the same checks in the same order, the same codes, entity `importBatch`. */
function viewHeldMessage(api: AppStoreApi, actor: Actor, batchId: string, reason: string): Outcome<RawImportRow> {
  if (actor.role !== 'office') {
    mutate(api, actor, { entityType: 'importBatch', entityId: batchId, action: 'importRow.rawViewDenied', after: { role: actor.role, source: actor.source }, stampBookingId: null }, () => ({}))
    return refuse('officeOnly', RAW_ROW_OFFICE_ONLY)
  }
  const state = api.getState()
  const batch = heldBatchOf(state, batchId)!
  if (batch.dismissed !== undefined) return refuse('notEligible', RAW_ROW_NOT_ELIGIBLE)
  const why = redactNhis(reason.trim())
  if (why === '') return refuse('reasonRequired', RAW_ROW_REASON_REQUIRED)
  const raw = heldMessageRaw(state, batchId)
  if (raw === undefined) return refuse('noRawRow', 'This message holds no raw payload.')
  const columns = rawMessageColumns(raw)
  const masked = maskRawRow(columns, messageMasking(columns.columns))
  mutate(api, actor, { entityType: 'importBatch', entityId: batchId, action: 'importRow.rawViewed', after: { reason: why, columnsShown: masked.columns.length }, stampBookingId: null }, () => ({}))
  return ok(masked)
}

export interface RawViews {
  count: number
  last?: { who: string; atISO: string }
}

/** How often the row's raw view was opened, and the last viewer and time, from the audit. */
export function rawViewsFor(state: Pick<AppState, 'audit'>, rowId: string): RawViews {
  let count = 0
  let last: RawViews['last']
  for (const e of state.audit) {
    if (e.entityId !== rowId || e.action !== 'importRow.rawViewed') continue
    count += 1
    if (last === undefined || e.atISO >= last.atISO) last = { who: e.who, atISO: e.atISO }
  }
  return { count, ...(last !== undefined ? { last } : {}) }
}
