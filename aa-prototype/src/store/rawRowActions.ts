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

import type { RawImportRow } from '../domain/types'
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

/** Whether the row needs resolving: open, and unmatched, waiting for its NHI or blocked by a flag. */
export function rawRowEligible(state: Pick<AppState, 'intake' | 'schedule' | 'masters'>, rowId: string): boolean {
  const row = state.intake.rows[rowId]
  if (row === undefined || row.status !== 'open') return false
  const a = assessImportRow(state as AppState, rowId)
  return a !== undefined && (a.queue === 'unmatched' || a.waitingForNhi || a.flags.length > 0)
}

/**
 * The row the harness entry acts on: the selected row, else the oldest open row
 * that needs resolving (the row panel covers the harness bar, so the entry
 * also works with the panel closed; catch-up Phase 43).
 */
export function rawRowTarget(state: Pick<AppState, 'intake' | 'schedule' | 'masters'>, selectedRowId: string | undefined): string | undefined {
  if (selectedRowId !== undefined && state.intake.rows[selectedRowId] !== undefined) return selectedRowId
  return Object.values(state.intake.rows)
    .filter((r) => rawRowEligible(state, r.id))
    .sort((a, b) => a.receivedAtISO.localeCompare(b.receivedAtISO) || a.id.localeCompare(b.id))[0]?.id
}

/** Why the raw row cannot be viewed now (row-level only; the role is checked on the view). */
export function rawRowRefusal(state: Pick<AppState, 'intake' | 'schedule' | 'masters'>, rowId: string | undefined): string | null {
  if (rowId === undefined || state.intake.rows[rowId] === undefined) return 'No hospital row needs resolving'
  return rawRowEligible(state, rowId) ? null : RAW_ROW_NOT_ELIGIBLE
}

export function viewRawImportRow(api: AppStoreApi, actor: Actor, rowId: string, reason: string): Outcome<RawImportRow> {
  const state = api.getState()
  const row = state.intake.rows[rowId]
  if (row === undefined) return refuse('notFound', 'Import row not found.')
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
