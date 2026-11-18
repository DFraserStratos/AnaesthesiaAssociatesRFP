/**
 * The matching screen's selectors (catch-up Phase 33; US-02.1.2 to US-02.1.4).
 * `matchingView` builds the plain view the pure matcher reads
 * (`domain/intake/matching.ts`); components derive from stable records with
 * `useMemo`, never a fresh object per render.
 */

import type { Booking, ImportBatch, ImportRow, List, Patient, Procedure } from '../domain/types'
import {
  matchingQueue,
  suggestDecision,
  type MatchingBooking,
  type MatchingCounts,
  type MatchingList,
  type MatchingSlot,
  type MatchingView,
  type RowAssessment,
  sourceTextChannelFor,
} from '../domain/intake/matching'
import { contractInvoiceDescriptionFor, refreshedInvoiceDescriptionFor, type ProcedureStackView } from '../domain/billing/procedureStack'

const PREVIEW_ID = 'preview'
import { inDisplayOrder } from '../domain/billing/multiProcedure'
import { isOpenSlot } from '../domain/slotStatus'
import type { AppState } from './appStore'
import { procedureStackViewFor } from './selectors'

type ViewState = Pick<AppState, 'masters' | 'schedule' | 'intake'>

/** The plain view the matcher reads: live Lists, every Booking with its patient and Procedures, the open sessions. */
export function matchingView(state: ViewState): MatchingView {
  const { masters, schedule } = state
  const proceduresByBooking = new Map<string, Procedure[]>()
  for (const p of Object.values(schedule.procedures)) {
    const list = proceduresByBooking.get(p.bookingId)
    if (list === undefined) proceduresByBooking.set(p.bookingId, [p])
    else list.push(p)
  }
  const lists: Record<string, MatchingList> = {}
  const slotsWithList = new Set<string>()
  for (const l of Object.values(schedule.lists)) {
    if (l.removedAtISO !== undefined) continue
    if (l.state !== 'DRAFT') slotsWithList.add(l.slotId)
    lists[l.id] = {
      id: l.id,
      hospitalId: l.hospitalId,
      dateISO: l.dateISO,
      session: l.session,
      state: l.state,
      ...(l.surgeonId !== undefined && l.surgeonId !== null ? { surgeonId: l.surgeonId } : {}),
      ...(l.state !== 'DRAFT' ? { anaesthetistId: l.anaesthetistId, slotId: l.slotId } : {}),
    }
  }
  const bookings: Record<string, MatchingBooking> = {}
  for (const b of Object.values(schedule.bookings)) {
    if (lists[b.listId] === undefined) continue
    const patient = masters.patients[b.patientId]
    const procedures = inDisplayOrder([...(proceduresByBooking.get(b.id) ?? [])].sort((a, c) => a.id.localeCompare(c.id)))
    bookings[b.id] = {
      id: b.id,
      listId: b.listId,
      patient: {
        name: patient?.name ?? 'Unknown patient',
        ...(patient?.nhi !== undefined ? { nhi: patient.nhi } : {}),
        ...(patient?.dobISO !== undefined && patient.dobISO !== '' ? { dobISO: patient.dobISO } : {}),
      },
      ...(b.scheduledTime !== undefined ? { scheduledTime: b.scheduledTime } : {}),
      ...(b.notes !== undefined ? { notes: b.notes } : {}),
      cancelled: b.cancellation !== undefined,
      ...(b.funderPartyId !== undefined ? { funderPartyId: b.funderPartyId } : {}),
      ...(b.insuranceApprovalNumber !== undefined ? { insuranceApprovalNumber: b.insuranceApprovalNumber } : {}),
      procedures: procedures.map((p) => ({
        id: p.id,
        isPrimary: p.isPrimary,
        procedureText: p.procedureText,
        invoiceDescription: p.invoiceDescription,
        contractInvoiceDescription: contractInvoiceDescriptionFor(p, masters.contracts),
      })),
    }
  }
  const openSlots: MatchingSlot[] = []
  for (const slot of Object.values(schedule.slots)) {
    if (slotsWithList.has(slot.id)) continue
    if (masters.anaesthetists[slot.anaesthetistId]?.active === false) continue
    if (!isOpenSlot(slot, undefined, masters.slotStatuses)) continue
    openSlots.push({ id: slot.id, anaesthetistId: slot.anaesthetistId, dateISO: slot.dateISO, session: slot.session })
  }
  const named = <T extends { name: string }>(rec: Readonly<Record<string, T>>) =>
    Object.fromEntries(Object.entries(rec).map(([id, v]) => [id, { name: v.name }]))
  return {
    bookings,
    lists,
    openSlots,
    surgeons: Object.fromEntries(
      Object.values(masters.surgeons).map((s) => [s.id, { id: s.id, name: s.name, ...(s.hpiId !== undefined ? { hpiId: s.hpiId } : {}) }]),
    ),
    hospitals: Object.fromEntries(Object.values(masters.hospitals).map((h) => [h.id, { id: h.id, name: h.name }])),
    anaesthetists: named(masters.anaesthetists),
    parties: named(masters.parties),
    rows: Object.values(state.intake.rows),
  }
}

/** One row's assessment against the current state (the store's decision guard reads it too). */
export function assessImportRow(state: ViewState, rowId: string): RowAssessment | undefined {
  const row = state.intake.rows[rowId]
  return row === undefined ? undefined : suggestDecision(matchingView(state), row)
}

export type MatchingFilter = 'open' | 'unmatched' | 'decided'

export interface ImportRowView {
  row: ImportRow
  batch: ImportBatch | undefined
  /** Absent for a decided row. */
  assessment?: RowAssessment
}

/**
 * The table's rows for a filter: Open (ready first, then unmatched, each
 * oldest first), Unmatched (the unmatched queue, rows waiting for an NHI
 * included) and Decided (applied and rejected, newest first).
 */
export function importRowViews(state: ViewState, filter: MatchingFilter, view: MatchingView = matchingView(state)): ImportRowView[] {
  const rows = Object.values(state.intake.rows)
  const batchOf = (r: ImportRow) => state.intake.batches[r.batchId]
  if (filter === 'decided') {
    return rows
      .filter((r) => r.status !== 'open')
      .sort((a, b) => (b.decidedAtISO ?? '').localeCompare(a.decidedAtISO ?? '') || b.id.localeCompare(a.id))
      .map((row) => ({ row, batch: batchOf(row) }))
  }
  const { assessments } = matchingQueue(view, rows)
  return assessments
    .filter((a) => filter === 'open' || a.queue === 'unmatched')
    .map((assessment) => {
      const row = state.intake.rows[assessment.rowId]!
      return { row, batch: batchOf(row), assessment }
    })
}

export function matchingCounts(state: ViewState, view: MatchingView = matchingView(state)): MatchingCounts {
  return matchingQueue(view, Object.values(state.intake.rows)).counts
}

/** Open rows: the side-nav badge (amber). */
export function matchingAttentionCount(state: Pick<AppState, 'intake'>): number {
  return Object.values(state.intake.rows).filter((r) => r.status === 'open').length
}

/**
 * Each Procedure as Phase 20a's shared view (US-03.1.9) for a row's panel: the
 * matched Booking's current stack; for a New row a preview built from a draft
 * Procedure held in memory (never stored) with the row's text and the office's
 * picks, through the same `procedureStackView`.
 */
export function rowStackViews(
  state: Pick<AppState, 'masters' | 'schedule' | 'intake' | 'billing'>,
  rowId: string,
  picks: { rvgGroupId?: string; contractId?: string } = {},
  assessment: RowAssessment | undefined = assessImportRow(state, rowId),
): ProcedureStackView[] {
  const row = state.intake.rows[rowId]
  if (row === undefined || assessment === undefined) return []
  if (assessment.match !== undefined) {
    const procedures = inDisplayOrder(
      Object.values(state.schedule.procedures)
        .filter((p) => p.bookingId === assessment.match!.bookingId)
        .sort((a, b) => a.id.localeCompare(b.id)),
    )
    return procedures.flatMap((p) => {
      const v = procedureStackViewFor(state, p.id, 'office')
      return v === undefined ? [] : [v]
    })
  }
  // A New row: a draft Booking and Procedure held in memory (never stored), read through 20a's one selector.
  const fields = assessment.fields
  const text = fields.procedure?.text
  const hospitalName = state.masters.hospitals[fields.hospitalId]?.name
  const draft: Procedure = {
    id: PREVIEW_ID,
    bookingId: PREVIEW_ID,
    payer: { kind: 'patient' },
    procedureText:
      text !== undefined && text.trim() !== ''
        ? { text, source: sourceTextChannelFor(row.channel), receivedAtISO: row.receivedAtISO, ...(hospitalName !== undefined ? { from: hospitalName } : {}) }
        : null,
    invoiceDescription: null,
    isPrimary: true,
    modifierClaims: [],
    removedModifierIds: [],
    ...(picks.rvgGroupId !== undefined ? { rvgGroupId: picks.rvgGroupId } : {}),
    ...(picks.contractId !== undefined ? { governingContractId: picks.contractId } : {}),
  }
  draft.invoiceDescription = refreshedInvoiceDescriptionFor(draft, state.masters.contracts)
  const anyList = state.schedule.lists[assessment.targetListId ?? ''] ?? Object.values(state.schedule.lists)[0]
  if (anyList === undefined) return []
  const previewList = { ...anyList, id: PREVIEW_ID, dateISO: fields.dateISO, hospitalId: fields.hospitalId } as List
  const preview = procedureStackViewFor(
    {
      masters: {
        ...state.masters,
        patients: { ...state.masters.patients, [PREVIEW_ID]: { hiddenInternalId: PREVIEW_ID, name: fields.patient.name } as Patient },
      },
      schedule: {
        procedures: { ...state.schedule.procedures, [PREVIEW_ID]: draft },
        bookings: { ...state.schedule.bookings, [PREVIEW_ID]: { id: PREVIEW_ID, listId: PREVIEW_ID, patientId: PREVIEW_ID, completed: false } as Booking },
        lists: { ...state.schedule.lists, [PREVIEW_ID]: previewList },
      },
    },
    PREVIEW_ID,
    'office',
  )
  return preview === undefined ? [] : [preview]
}
