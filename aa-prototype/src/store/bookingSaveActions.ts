/**
 * The office's explicit save (catch-up Phase 35; US-02.3.2, US-02.3.1,
 * DM-35, RV-28).
 *
 * The Admin Booking detail edits a draft (`shared/booking/draft/`). Save
 * hands this module the snapshot the draft started from and the one it holds
 * now; `saveBookingChanges` works out the office's own changes
 * (`diffSnapshots`) and applies each one onto the real Booking as it is at
 * Save time, in ONE audited commit under one change set:
 *
 * - every audit `before` is read from the real state, so the record is true
 *   even if something else wrote in between; a field already holding the
 *   office's value is skipped, and fields the office did not touch are left
 *   alone. There is no row version, merge or clash check: concurrent edits
 *   are Future Work (US-02.5.6, OQ-07), so saves simply apply in order.
 * - ids the draft allocated for new Procedures and billing lines are
 *   re-allocated from the real counters, and references rewritten.
 * - the existing guards are re-run on the candidate state (the NHI, the
 *   Contract still a candidate, the typed price's rights, a split that
 *   resolves, one primary Procedure, a non-blank invoice description), and
 *   the text as received is never changed (20a, US-02.5.7).
 * - the derived follow-on (27's prepayment send, `autoSendPrepayments`) runs
 *   once on the real store after the commit, never inside the draft.
 *
 * Anaesthetists never call this: their edits stay immediate (DM-35).
 */

import { diffSnapshots, sameValue, snapshotBooking, type BookingSnapshot, type FieldChange } from '../domain/changeSets'
import type { AuditEntry, BillingLine, Booking, ChangeSetId, Procedure } from '../domain/types'
import { validateNhi } from '../domain/nhi'
import { resolveSplit } from '../domain/billing/splitShare'
import { isBlankText } from '../domain/billing/procedureStack'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'
import { contractPickRefusal } from './contractSelectionActions'
import { priceChangeRefusal } from './pricingActions'
import { procedureFeeNow } from './splitActions'
import { autoSendPrepayments } from './prepaymentActions'
import { INVOICE_DESCRIPTION_BLANK_MESSAGE } from './procedureTextActions'

export const SAVE_OFFICE_ONLY_MESSAGE = 'Only the AA office saves Booking changes this way.'
export const SAVE_NO_CHANGES_MESSAGE = 'There are no changes to save.'
export const RECEIVED_TEXT_MESSAGE = 'The text as received cannot be changed.'
export const SAVE_NHI_REQUIRED_MESSAGE = 'The NHI is required.'

/** One field a save changed, as the `booking.save` header lists it. */
export interface FieldRef {
  entityType: FieldChange['entityType']
  entityId: string
  field: string
}

export interface BookingDraftChanges {
  base: BookingSnapshot
  next: BookingSnapshot
  /**
   * The draft's own audit entries, oldest first (optional). They name the
   * action each field was changed by (`procedure.contract`, `procedure.payer`,
   * ...), so the saved entries keep the codes the rest of the app reads.
   */
  draftAudit?: readonly AuditEntry[]
}

const DEFAULT_UPDATE_ACTION: Record<FieldChange['entityType'], string> = {
  booking: 'booking.update',
  procedure: 'procedure.update',
  billingLine: 'billingLine.update',
  patient: 'patient.update',
}

const ROUTING_KEYS = new Set(['bookingId'])

/** `entityType:entityId:field` to the last draft action that wrote it. */
function attributionOf(draftAudit: readonly AuditEntry[] | undefined): Map<string, string> {
  const out = new Map<string, string>()
  for (const e of draftAudit ?? []) {
    const keys = new Set<string>()
    for (const v of [e.before, e.after]) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) for (const k of Object.keys(v)) if (!ROUTING_KEYS.has(k)) keys.add(k)
    }
    for (const k of keys) out.set(`${e.entityType}:${e.entityId}:${k}`, e.action)
  }
  return out
}

function setField<T extends object>(entity: T, field: string, value: unknown): T {
  const out = { ...entity } as Record<string, unknown>
  if (value === undefined) delete out[field]
  else out[field] = value
  return out as T
}

/** Why a save cannot go ahead because the Booking changed under the draft (the lifecycle, not concurrency). */
function blockedReason(state: AppState, base: BookingSnapshot): string | null {
  const real = state.schedule.bookings[base.booking.id]
  if (real === undefined) return 'This Booking no longer exists. Nothing was saved.'
  if (real.cancellation !== undefined && base.booking.cancellation === undefined) {
    return `This Booking was cancelled${real.cancellation.atISO !== undefined ? ` at ${real.cancellation.atISO.slice(11, 16)}` : ''} while you were editing. Nothing was saved.`
  }
  if (real.listId !== base.booking.listId) return 'This Booking was moved to another List while you were editing. Nothing was saved.'
  const list = state.schedule.lists[real.listId]
  if (list?.state === 'AUTHORISED') return 'This List was authorised while you were editing, so its Bookings are locked. Nothing was saved.'
  return null
}

/**
 * Save the office's drafted changes to a Booking as one change set. Refusals
 * are data and write nothing.
 */
export function saveBookingChanges(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  draft: BookingDraftChanges,
): Outcome<{ changeSetId: ChangeSetId; changes: FieldChange[] }> {
  const state = api.getState()
  if (actor.role !== 'office') return refuse('officeOnly', SAVE_OFFICE_ONLY_MESSAGE)
  const found = getBooking(state, bookingId)
  if (found === undefined || draft.base.booking.id !== bookingId) return refuse('notFound', 'Booking not found.')
  const blocked = blockedReason(state, draft.base)
  if (blocked !== null) return refuse('blocked', blocked)
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights

  const changes = diffSnapshots(draft.base, draft.next)
  if (changes.length === 0) return refuse('noChanges', SAVE_NO_CHANGES_MESSAGE)
  if (changes.some((c) => c.kind === 'rewrite')) return refuse('receivedText', `${RECEIVED_TEXT_MESSAGE} Nothing was saved.`)

  // --- Remap the ids the draft allocated, against the real counters. ---
  let counters = state.counters
  const idMap = new Map<string, string>()
  for (const c of changes) {
    if (c.kind !== 'create' || (c.entityType !== 'procedure' && c.entityType !== 'billingLine')) continue
    const allocated = allocateId(counters, c.entityType)
    counters = allocated.counters
    idMap.set(c.entityId, allocated.id)
  }
  const realId = (id: string) => idMap.get(id) ?? id

  // --- The candidate: the admin's changes applied onto the real state. ---
  let procedures = state.schedule.procedures
  let billingLines = state.schedule.billingLines
  let booking = found.booking
  let patients = state.masters.patients
  const applied: FieldChange[] = []
  for (const c of changes) {
    const id = realId(c.entityId)
    if (c.entityType === 'booking') {
      const current = (booking as unknown as Record<string, unknown>)[c.field]
      if (sameValue(current, c.after)) continue
      applied.push({ ...c, before: current })
      booking = setField(booking, c.field, c.after)
    } else if (c.entityType === 'patient') {
      const patient = patients[c.entityId]
      if (patient === undefined) continue
      const current = (patient as unknown as Record<string, unknown>)[c.field]
      if (sameValue(current, c.after)) continue
      applied.push({ ...c, before: current })
      patients = { ...patients, [c.entityId]: setField(patient, c.field, c.after) }
    } else if (c.entityType === 'procedure') {
      if (c.kind === 'create') {
        const created = { ...(c.after as Procedure), id }
        procedures = { ...procedures, [id]: created }
        applied.push({ ...c, entityId: id, after: created })
      } else if (c.kind === 'remove') {
        const current = procedures[id]
        if (current === undefined) continue
        const { [id]: _gone, ...rest } = procedures
        procedures = rest
        applied.push({ ...c, before: current })
      } else {
        const current = procedures[id]
        if (current === undefined) continue
        const value = (current as unknown as Record<string, unknown>)[c.field]
        if (sameValue(value, c.after)) continue
        applied.push({ ...c, before: value })
        procedures = { ...procedures, [id]: setField(current, c.field, c.after) }
      }
    } else {
      if (c.kind === 'create') {
        const line = c.after as BillingLine
        const created = { ...line, id, procedureId: realId(line.procedureId) }
        billingLines = { ...billingLines, [id]: created }
        applied.push({ ...c, entityId: id, after: created })
      } else if (c.kind === 'remove') {
        const current = billingLines[id]
        if (current === undefined) continue
        const { [id]: _gone, ...rest } = billingLines
        billingLines = rest
        applied.push({ ...c, before: current })
      } else {
        const current = billingLines[id]
        if (current === undefined) continue
        const value = (current as unknown as Record<string, unknown>)[c.field]
        if (sameValue(value, c.after)) continue
        applied.push({ ...c, before: value })
        billingLines = { ...billingLines, [id]: setField(current, c.field, c.after) }
      }
    }
  }
  if (applied.length === 0) return refuse('noChanges', SAVE_NO_CHANGES_MESSAGE)

  const candidate: AppState = {
    ...state,
    counters,
    masters: { ...state.masters, patients },
    schedule: { ...state.schedule, bookings: { ...state.schedule.bookings, [bookingId]: booking }, procedures, billingLines },
  }

  // --- Re-check the invariants on the candidate, through the existing guards. ---
  const refusal = candidateRefusal(state, candidate, actor, bookingId, applied)
  if (refusal !== null) return refusal

  // --- One commit, one change set. ---
  const attribution = attributionOf(draft.draftAudit)
  const fields: FieldRef[] = applied.map((c) => ({ entityType: c.entityType, entityId: c.entityId, field: c.field }))
  const metas: MutationMeta[] = [
    { entityType: 'booking', entityId: bookingId, action: 'booking.save', after: { kind: 'save', fields }, stampBookingId: bookingId },
    ...metasFor(applied, attribution, (pid) => procedures[pid]?.bookingId ?? state.schedule.procedures[pid]?.bookingId ?? bookingId, bookingId),
  ]
  const result = mutate(
    api,
    actor,
    metas,
    () => ({ counters: candidate.counters, masters: candidate.masters, schedule: candidate.schedule }),
    { changeSet: 'save' },
  )

  // --- The derived follow-on, once, on the real store (27; never on a move, D20). ---
  if (applied.some((c) => c.entityType === 'procedure' || c.entityType === 'billingLine')) autoSendPrepayments(api, bookingId)

  return ok({ changeSetId: result.changeSetId!, changes: applied })
}

/** The first guard the candidate fails, or null. */
function candidateRefusal(real: AppState, candidate: AppState, actor: Actor, bookingId: string, applied: FieldChange[]): Outcome<never> | null {
  const list = candidate.schedule.lists[candidate.schedule.bookings[bookingId]!.listId]!
  for (const c of applied) {
    if (c.entityType === 'patient' && c.field === 'nhi') {
      const nhi = typeof c.after === 'string' ? c.after : ''
      if (nhi.trim() === '') return refuse('nhiRequired', SAVE_NHI_REQUIRED_MESSAGE)
      const v = validateNhi(nhi)
      if (!v.valid) return refuse('nhiInvalid', v.reason ?? 'That NHI is not valid.')
    }
    if (c.entityType !== 'procedure') continue
    const procedure = candidate.schedule.procedures[c.entityId]
    if (c.field === 'governingContractId' && typeof c.after === 'string') {
      const refused = contractPickRefusal(candidate, actor, list, real.schedule.procedures[c.entityId], c.after)
      if (refused !== null) return refused
    }
    if (c.field === 'enteredPrice') {
      const refused = priceChangeRefusal(candidate, actor, c.entityId)
      if (refused !== null) return refused
    }
    if (c.field === 'split' && procedure?.split !== undefined) {
      const fee = procedureFeeNow(candidate, c.entityId)
      if (fee === undefined || fee.total <= 0) return refuse('noFee', 'This procedure has no fee to split yet.')
      const resolved = resolveSplit(fee.total, procedure.split.shares)
      if (!resolved.ok) return refuse('splitInvalid', resolved.reason)
    }
    if (c.field === 'invoiceDescription') {
      const text = (c.after as { text?: string } | null | undefined)?.text
      if (c.after !== null && (text === undefined || isBlankText(text))) return refuse('invoiceDescriptionBlank', INVOICE_DESCRIPTION_BLANK_MESSAGE)
    }
  }
  const own = Object.values(candidate.schedule.procedures).filter((p) => p.bookingId === bookingId)
  if (own.length > 0 && own.filter((p) => p.isPrimary).length !== 1) return refuse('primary', 'A Booking needs exactly one primary procedure.')
  return null
}

/**
 * The saved entries: one per changed entity and action code, keyed by field
 * like the codes' own entries (a Procedure's carry its `bookingId`). A
 * changed invoice description keeps 20a's text shape.
 */
function metasFor(applied: FieldChange[], attribution: Map<string, string>, bookingOf: (procedureId: string) => string, bookingId: string): MutationMeta[] {
  const metas: MutationMeta[] = []
  const grouped = new Map<string, MutationMeta & { before: Record<string, unknown>; after: Record<string, unknown> }>()
  for (const c of applied) {
    const routing = c.entityType === 'procedure' ? { bookingId: bookingOf(c.entityId) } : {}
    const stamp = c.entityType === 'patient' ? { stampBookingId: bookingId } : {}
    if (c.kind === 'create') {
      metas.push({ entityType: c.entityType, entityId: c.entityId, action: c.entityType === 'billingLine' ? 'billingLine.add' : `${c.entityType}.create`, after: c.after, ...stamp })
      continue
    }
    if (c.kind === 'remove') {
      metas.push({ entityType: c.entityType, entityId: c.entityId, action: `${c.entityType}.remove`, before: c.before, ...(c.entityType === 'procedure' ? { stampBookingId: bookingId } : {}) })
      continue
    }
    const action = attribution.get(`${c.entityType}:${c.entityId}:${c.field}`) ?? DEFAULT_UPDATE_ACTION[c.entityType]
    if (c.field === 'invoiceDescription' && action === 'procedure.invoiceDescription.set') {
      metas.push({
        entityType: 'procedure',
        entityId: c.entityId,
        action,
        before: { ...routing, invoiceDescription: (c.before as { text?: string } | null)?.text ?? null },
        after: { ...routing, invoiceDescription: (c.after as { text?: string } | null)?.text ?? null },
      })
      continue
    }
    const key = `${c.entityType}:${c.entityId}:${action}`
    let meta = grouped.get(key)
    if (meta === undefined) {
      meta = { entityType: c.entityType, entityId: c.entityId, action, before: { ...routing }, after: { ...routing }, ...stamp }
      grouped.set(key, meta)
      metas.push(meta)
    }
    if (c.before !== undefined) meta.before[c.field] = c.before
    if (c.after !== undefined) meta.after[c.field] = c.after
  }
  return metas
}

/**
 * A save that does not come from the Admin draft (the S5 jump, the PWA's
 * office stand-in): the patches applied to a copy of the Booking as it is
 * now, saved through `saveBookingChanges`, so nobody hand-builds snapshots.
 */
export function saveBookingPatch(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  patch: { booking?: Partial<Booking>; procedures?: Record<string, Partial<Procedure>> },
): Outcome<{ changeSetId: ChangeSetId; changes: FieldChange[] }> {
  const base = snapshotBooking(api.getState(), bookingId)
  if (base === undefined) return refuse('notFound', 'Booking not found.')
  const procedures = { ...base.procedures }
  for (const [pid, p] of Object.entries(patch.procedures ?? {})) {
    const current = procedures[pid]
    if (current === undefined) return refuse('notFound', 'That procedure is not on this Booking.')
    procedures[pid] = { ...current, ...p }
  }
  const next: BookingSnapshot = { ...base, booking: { ...base.booking, ...(patch.booking ?? {}) }, procedures }
  return saveBookingChanges(api, actor, bookingId, { base, next })
}
