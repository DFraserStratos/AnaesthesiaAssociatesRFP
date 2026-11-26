/**
 * Intake's bulk decisions (build plan Phase 71; US-02.1.6, US-02.1.7, D118, D125, DM-21).
 *
 * - **Confirm unchanged**: every List of an arrival that matches what AA holds with no difference, confirmed by one
 *   click as ONE change set through 68's one decision path (`decideArrivingLists`), each open row decided as "matches,
 *   nothing to change". It changes no List, Booking or Slot. Re-checked at the click: a List that gained a difference
 *   since it was shown is skipped and named. Never run by an ingest or a demo action: unchanged Lists wait for a person.
 * - **Dismiss a held message**: a hospital message that could not become a List, dismissed with a reason, one audited
 *   change set setting only the arrival's `dismissed`. It then leaves To decide and reads as decided.
 *
 * Office only, both.
 */

import { useMemo } from 'react'
import { arrivalItems, assessArrivalRow, rowWaitsForNhi, type ArrivalIntake, type ArrivalItem } from '../domain/intake/arrivals'
import { unchangedLists } from '../domain/intake/unchanged'
import { redactNhis } from '../domain/privacy/nhiDetect'
import type { ImportRow } from '../domain/types'
import { useAppStore, type AppState, type AppStoreApi } from './appStore'
import { decideArrivingLists, type ListDecision } from './intakeDecide'
import { matchingView } from './matchingSelectors'
import { clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'

export const CONFIRM_UNCHANGED_OFFICE_ONLY = 'Only the AA office confirms unchanged Lists.'
export const NOTHING_TO_CONFIRM_MESSAGE = 'No List in this arrival is waiting to be confirmed unchanged.'
export const DISMISS_OFFICE_ONLY = 'Only the AA office dismisses a held message.'
export const DISMISS_REASON_REQUIRED = 'Give a reason to dismiss this message.'
export const DISMISS_NOT_FOUND = 'This message is no longer in Intake.'
export const DISMISS_NOT_HELD = 'Only a held hospital message can be dismissed here.'
export const DISMISS_ALREADY = 'This message has already been dismissed.'

type BulkState = Pick<AppState, 'masters' | 'schedule' | 'intake'>

/**
 * Every feed item of one arrival, read through 68's read model over that arrival alone (an item's kind and state
 * read only the matcher's view and the arrival's own rows, so this equals the arrival's slice of the whole feed). It
 * does not go through `intakeSelectors` so the bench stays renderable where a test mocks those selectors.
 */
function itemsOfBatch(state: BulkState, batchId: string): ArrivalItem[] {
  const batch = state.intake.batches[batchId]
  if (batch === undefined) return []
  const rows: Record<string, ImportRow> = {}
  for (const row of Object.values(state.intake.rows)) if (row.batchId === batchId) rows[row.id] = row
  const intake: ArrivalIntake = { batches: { [batchId]: batch }, rows, pdfLists: state.intake.pdfLists }
  const anaesthetists = Object.fromEntries(
    Object.entries(state.masters.anaesthetists).map(([id, a]) => [id, { name: a.name, ...(a.hpiId !== undefined ? { hpiId: a.hpiId } : {}) }]),
  )
  return arrivalItems(matchingView(state), intake, { dataQualityNhis: new Set(), anaesthetists })
}

/** The open rows of an unchanged List a confirm decides (rows waiting for an NHI are under Needs NHI, not here). */
function confirmableRows(state: BulkState, item: ArrivalItem): ImportRow[] {
  return item.openRowIds.flatMap((id) => {
    const row = state.intake.rows[id]
    return row !== undefined && !rowWaitsForNhi(row) ? [row] : []
  })
}

/**
 * The undecided Lists of one arrival that match exactly (through `unchanged.ts`), in feed order, each with at least
 * one open row a confirm decides.
 */
export function unchangedListsOfBatch(state: BulkState, batchId: string): ArrivalItem[] {
  return unchangedLists(itemsOfBatch(state, batchId)).filter((i) => confirmableRows(state, i).length > 0)
}

const NO_LISTS: ArrivalItem[] = []

/** The arrival's unchanged Lists, stable across renders while the store's slices are unchanged. */
export function useUnchangedListsOf(batchId: string | undefined): ArrivalItem[] {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  return useMemo(() => (batchId === undefined ? NO_LISTS : unchangedListsOfBatch({ masters, schedule, intake }, batchId)), [masters, schedule, intake, batchId])
}

export interface ConfirmUnchangedResult {
  /** The one change set every confirmed row joined. */
  changeSetId: string | null
  /** The arrival keys of the Lists confirmed. */
  confirmed: string[]
  /** The titles of Lists that were offered but gained a difference since (left for their own bench). */
  skipped: string[]
}

/**
 * Confirm an arrival's unchanged Lists together (US-02.1.6, D118): one call to `decideArrivingLists`, one List
 * decision per List, each open row "matches, nothing to change" against the matcher's Booking. `expectedKeys` is what
 * the bench showed: only those are confirmed, and any of them no longer unchanged is skipped and named.
 */
export function confirmUnchangedLists(api: AppStoreApi, actor: Actor, batchId: string, expectedKeys?: readonly string[]): Outcome<ConfirmUnchangedResult> {
  if (actor.role !== 'office') return refuse('officeOnly', CONFIRM_UNCHANGED_OFFICE_ONLY)
  const state = api.getState()
  const view = matchingView(state)
  const all = itemsOfBatch(state, batchId)
  const titleOf = new Map(all.map((i) => [i.key, i.title]))
  const expected = expectedKeys !== undefined ? new Set(expectedKeys) : undefined

  const decisions: ListDecision[] = []
  const confirmed: string[] = []
  const stillUnchanged = new Set<string>()
  for (const item of unchangedListsOfBatch(state, batchId)) {
    if (expected !== undefined && !expected.has(item.key)) continue
    const rows = confirmableRows(state, item)
    const decided = rows.flatMap((row) => {
      const a = assessArrivalRow(view, row)
      return a.changeType === 'noChange' && a.match !== undefined ? [{ rowId: row.id, bookingId: a.match.bookingId }] : []
    })
    // Re-checked at the click: every open row must still match its Booking with nothing to change.
    if (decided.length !== rows.length) continue
    stillUnchanged.add(item.key)
    confirmed.push(item.key)
    decisions.push({ rows: decided.map((d) => ({ rowId: d.rowId, kind: 'apply', input: { kind: 'match', bookingId: d.bookingId, fieldsApplied: [] } })) })
  }
  const skipped = expectedKeys !== undefined ? expectedKeys.filter((k) => !stillUnchanged.has(k)).map((k) => titleOf.get(k) ?? k) : []

  if (decisions.length === 0) return refuse('nothingToConfirm', NOTHING_TO_CONFIRM_MESSAGE, skipped.length > 0 ? { skipped } : undefined)
  const out = decideArrivingLists(api, actor, decisions)
  if (!out.ok) return out
  return ok({ changeSetId: out.value.changeSetId, confirmed, skipped })
}

/**
 * Dismiss a held hospital message with a reason (US-02.1.7, D125): one audited change set setting only the arrival's
 * `dismissed` (who, when, the reason with any NHI redacted). The message leaves To decide and shows under Decided.
 */
export function dismissHeldMessage(api: AppStoreApi, actor: Actor, batchId: string, reason: string): Outcome<{ changeSetId: string | null }> {
  if (actor.role !== 'office') return refuse('officeOnly', DISMISS_OFFICE_ONLY)
  const why = redactNhis(reason.trim())
  if (why === '') return refuse('reasonRequired', DISMISS_REASON_REQUIRED)
  const batch = api.getState().intake.batches[batchId]
  if (batch === undefined) return refuse('notFound', DISMISS_NOT_FOUND)
  if (batch.heldReason === undefined) return refuse('notHeld', DISMISS_NOT_HELD)
  if (batch.dismissed !== undefined) return refuse('alreadyDismissed', DISMISS_ALREADY)
  const metas: MutationMeta[] = []
  const done = mutate(
    api,
    actor,
    metas,
    (s) => {
      const current = s.intake.batches[batchId]!
      const dismissed = { by: actor.who, atISO: clockISO(s.clock), reason: why }
      metas.push({
        entityType: 'importBatch',
        entityId: batchId,
        action: 'importBatch.dismissed',
        after: { reason: why, ...(current.messageId !== undefined ? { messageId: current.messageId } : {}) },
        stampBookingId: null,
      })
      return { intake: { ...s.intake, batches: { ...s.intake.batches, [batchId]: { ...current, dismissed } } } }
    },
    { changeSet: 'match' },
  )
  return ok({ changeSetId: done.changeSetId })
}
