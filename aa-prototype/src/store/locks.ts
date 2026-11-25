/**
 * The store's side of the pricing snapshot (catch-up Phase 25; US-04.3.5,
 * US-08.4.4, DM-08). The snapshot itself is `domain/billing/lock.ts`'s; this
 * module only assembles its live inputs once (at authorise, and for the
 * seed), finds a Booking's lock, the Procedures locked against a Contract,
 * and regenerates an invoice from its recipe. Nothing here prices.
 */

import type { AppState } from './appStore'
import type { Booking, BookingId, ContractId, Invoice, InvoiceId, ProcedureId } from '../domain/types'
import {
  buildBookingLock,
  compareInvoice,
  invoiceDraftsFromLock,
  lockedContractIds,
  lockViewFor,
  migratedLockFromInvoices,
  partyKeyOf,
  type BookingLock,
  type InvoiceBuildContext,
  type InvoiceComparison,
  type LockView,
} from '../domain/billing/lock'
import { gstOn, supplierFor } from '../domain/billing/invoicePresentation'
import { bundledEventsOf, eventLineView, isPricedKind, withEventLine } from './eventKindActions'
import { formatMoney, roundToCents } from '../domain/billing/money'
import { priceFreeFormInvoice } from '../domain/billing/additionalInvoice'
import { eventLines } from '../domain/billing/procedureEvent'
import type { HeldPrices } from '../domain/billing/procedurePrice'
export { authorisedPricesFromLock } from '../domain/billing/lock'
import { listHospitalFor } from '../domain/listPairing'
import { billingContextForBooking, counterpartyName, prepaidHeldFor, proceduresForBooking } from './selectors'

/** Who takes a seeded lock (the office, as the seed's authorise). */
export const SEED_LOCK_TAKER = 'AA office'

/** The run's live inputs for one Booking, assembled once (the same the run assembled before the lock). */
export function invoiceBuildContextFor(state: AppState, booking: Booking): InvoiceBuildContext | undefined {
  const list = state.schedule.lists[booking.listId]
  const ctx = billingContextForBooking(state, booking)
  if (list === undefined || ctx === undefined) return undefined
  // A prepaid Procedure whose prepayment is raised is left off the final invoice (catch-up Phase 27; D57).
  const leftOff = prepaidHeldFor(state, booking.id)
  const surgeonName = list.surgeonId !== undefined ? state.masters.surgeons[list.surgeonId]?.name : undefined
  return {
    ...ctx,
    listDateISO: list.dateISO,
    patientId: booking.patientId,
    ...(surgeonName !== undefined ? { surgeonName } : {}),
    ...listHospitalFor(list, state.masters.hospitals),
    ...(Object.keys(leftOff).length > 0 ? { prepaidLeftOff: leftOff } : {}),
  }
}

/** Take the lock for one Booking from live data (authorise, and the seed's non-history Lists). */
export function takeLockFor(state: AppState, booking: Booking, takenBy: string, takenAtISO: string): BookingLock | undefined {
  const ctx = invoiceBuildContextFor(state, booking)
  if (ctx === undefined) return undefined
  return buildBookingLock({
    booking,
    procedures: proceduresForBooking(state, booking.id),
    ctx,
    takenAtISO,
    takenBy,
    partyName: (ref) => counterpartyName(state, ref, booking.id),
  })
}

export interface LockedAgainst {
  bookingId: BookingId
  listId: string
  patientName: string
  procedureIds: ProcedureId[]
  invoiceIds: InvoiceId[]
  takenAtISO: string
  origin: BookingLock['origin']
  /** The locked price of its Procedures on this Contract, ex GST (build plan Phase 45: the page's "On this Contract"). */
  lockedPrice: number
}

/** The Bookings whose Procedures are locked against a Contract (the History tab), newest lock first. */
export function lockedAgainstContract(state: Pick<AppState, 'billing'>, contractId: ContractId): LockedAgainst[] {
  const out: LockedAgainst[] = []
  for (const lock of Object.values(state.billing.locks)) {
    if (lock.state !== 'locked' || !lockedContractIds(lock).includes(contractId)) continue
    out.push({
      bookingId: lock.bookingId,
      listId: lock.listId,
      patientName: lock.patient.name,
      procedureIds: lock.procedures.filter((s) => s.contract?.id === contractId).map((s) => s.procedureId),
      invoiceIds: Object.values(state.billing.invoices)
        .filter((i) => i.bookingId === lock.bookingId && i.kind === 'standard')
        .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
        .map((i) => i.id),
      takenAtISO: lock.takenAtISO,
      origin: lock.origin,
      lockedPrice: roundToCents(lock.procedures.filter((s) => s.contract?.id === contractId).reduce((sum, s) => sum + s.price, 0)),
    })
  }
  return out.sort((a, b) => b.takenAtISO.localeCompare(a.takenAtISO) || a.bookingId.localeCompare(b.bookingId))
}

export type RegenerateResult =
  | { ok: true; comparison: InvoiceComparison; lineCount: number; total: number; view: LockView }
  | { ok: false; reason: string }

/** "Regenerated from locked data: identical (4 lines, total $396.18)", or the count of differences: the rail and the bar say the same. */
export function regenerateSummary(result: RegenerateResult): string {
  if (!result.ok) return result.reason
  const lines = `${result.lineCount} ${result.lineCount === 1 ? 'line' : 'lines'}`
  return result.comparison.identical
    ? `Regenerated from locked data: identical (${lines}, total ${formatMoney(result.total)})`
    : `Regenerated from locked data: ${result.comparison.differences.length} ${result.comparison.differences.length === 1 ? 'difference' : 'differences'} (${result.comparison.differences.map((d) => d.field).join(', ')})`
}

/** The reasons Regenerate is not offered (the trigger's disabled state). */
export const REGENERATE_PREPAYMENT_REASON = 'Raised at setup, before the lock'
export const REGENERATE_AA_FEE_REASON = 'Not priced from a Procedure'
export const REGENERATE_NO_LOCK_REASON = 'This invoice has no locked record'

/** Why an invoice cannot be regenerated, or null when it can. */
export function regenerateRefusal(state: Pick<AppState, 'billing'>, invoiceId: InvoiceId): string | null {
  if (state.billing.aaFeeInvoices[invoiceId] !== undefined) return REGENERATE_AA_FEE_REASON
  const invoice = state.billing.invoices[invoiceId]
  if (invoice === undefined) return 'Invoice not found'
  if (invoice.kind === 'prePayment') return REGENERATE_PREPAYMENT_REASON
  // An additional invoice regenerates from its event's lines (catch-up Phase 38b), not the lock.
  if (invoice.kind === 'additional') return invoice.eventId !== undefined ? null : 'This additional invoice has no event to regenerate from'
  const lock = state.billing.locks[invoice.bookingId]
  if (lock === undefined || lock.state !== 'locked') return REGENERATE_NO_LOCK_REASON
  return null
}

/**
 * Regenerate an invoice from its recipe (US-08.4.4): its Booking's lock,
 * drafted again, the draft for the same party compared with what is stored.
 * Read-only: never writes, never reads a master, never rebuilds data as at a
 * date. A pre-payment or AA fee invoice has no lock: a reason instead.
 */
export function regenerateInvoiceFromLock(state: Pick<AppState, 'billing'> & Partial<Pick<AppState, 'schedule'>>, invoiceId: InvoiceId): RegenerateResult {
  const refusal = regenerateRefusal(state, invoiceId)
  if (refusal !== null) return { ok: false, reason: refusal }
  const invoice = state.billing.invoices[invoiceId]!
  if (invoice.kind === 'additional') return regenerateAdditionalInvoice(state, invoice, state.billing.locks[invoice.bookingId])
  const lock = state.billing.locks[invoice.bookingId]!
  const drafts = invoiceDraftsFromLock(lock)
  if (drafts.kind === 'exception') return { ok: false, reason: drafts.message }
  const key = partyKeyOf(invoice.counterparty)
  const locked = drafts.invoices.find((d) => partyKeyOf(d.counterparty) === key)
  if (locked === undefined) return { ok: false, reason: 'The locked record bills no invoice to this party' }
  // Catch-up Phase 39b: the run's event lines, each from its event's frozen pricing (never the lock), in the run's order.
  const schedule = state.schedule
  const draft =
    schedule !== undefined
      ? bundledEventsOf({ schedule }, invoiceId).reduce((d, e) => {
          const line = eventLineView(e)
          return line !== undefined ? withEventLine(d, line) : d
        }, locked)
      : locked
  const lines = Object.values(state.billing.invoiceLines)
    .filter((l) => l.invoiceId === invoiceId)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
  const comparison = compareInvoice(invoice, lines, draft, lock.payee)
  return { ok: true, comparison, lineCount: draft.lines.length, total: draft.total, view: lockViewFor(lock) }
}

/**
 * Regenerate an additional invoice (catch-up Phase 38b): its recipe is its
 * event's free-form lines, re-priced through `priceFreeFormInvoice`, never the
 * Booking's lock (which the event never touches). Compares the lines and
 * totals with what is stored. Read-only.
 */
function regenerateAdditionalInvoice(state: Pick<AppState, 'billing'> & Partial<Pick<AppState, 'schedule'>>, invoice: Invoice, lock: BookingLock | undefined): RegenerateResult {
  const event = invoice.eventId !== undefined ? state.schedule?.procedureEvents[invoice.eventId] : undefined
  if (event === undefined) return { ok: false, reason: 'This additional invoice has no event to regenerate from' }
  // Catch-up Phase 39b: an event invoice's one line, from the event's frozen pricing.
  const eventLine = isPricedKind(event.kind) ? eventLineView(event) : undefined
  if (isPricedKind(event.kind) && eventLine === undefined) return { ok: false, reason: 'This event has no frozen price to regenerate from' }
  const priced =
    eventLine !== undefined
      ? (() => {
          const subtotal = roundToCents(eventLine.amount)
          const gst = gstOn(subtotal)
          return { kind: 'priced' as const, lines: [{ description: eventLine.description, quantity: 1, unitAmount: eventLine.amount, amount: eventLine.amount }], subtotal, gst, total: roundToCents(subtotal + gst) }
        })()
      : priceFreeFormInvoice(eventLines(event))
  if (priced.kind === 'refused') return { ok: false, reason: priced.message }
  const stored = Object.values(state.billing.invoiceLines)
    .filter((l) => l.invoiceId === invoice.id)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
  const differences: InvoiceComparison['differences'] = []
  const money = (n: number) => formatMoney(n)
  for (const [field, a, b] of [
    ['subtotal', invoice.subtotal, priced.subtotal],
    ['gst', invoice.gst, priced.gst],
    ['total', invoice.total, priced.total],
  ] as const) {
    if (Math.round(a * 100) !== Math.round(b * 100)) differences.push({ field, stored: money(a), regenerated: money(b) })
  }
  const lineText = (d: string, q: number | undefined, amount: number) => `${d}, ${q ?? 1} x, ${money(amount)}`
  const max = Math.max(stored.length, priced.lines.length)
  for (let i = 0; i < max; i++) {
    const s1 = stored[i]
    const r1 = priced.lines[i]
    const sText = s1 !== undefined ? lineText(s1.description, s1.quantity, s1.amount) : 'none'
    const rText = r1 !== undefined ? lineText(r1.description, r1.quantity, r1.amount) : 'none'
    if (sText !== rText) differences.push({ field: `line ${i + 1}`, stored: sText, regenerated: rText })
  }
  if (lock === undefined) return { ok: false, reason: REGENERATE_NO_LOCK_REASON }
  return { ok: true, comparison: { identical: differences.length === 0, differences }, lineCount: priced.lines.length, total: priced.total, view: lockViewFor(lock) }
}

// ---------------------------------------------------------------------------
// The seed's locks
// ---------------------------------------------------------------------------

/** The amount a Procedure's standard invoices carry (the seed's history price). */
function invoicedAmounts(invoices: readonly Invoice[], state: Pick<AppState, 'billing'>): Record<ProcedureId, number> {
  const ids = new Set(invoices.map((i) => i.id))
  const out: Record<ProcedureId, number> = {}
  for (const line of Object.values(state.billing.invoiceLines)) {
    if (!ids.has(line.invoiceId) || line.procedureId === undefined) continue
    out[line.procedureId] = roundToCents((out[line.procedureId] ?? 0) + line.amount)
  }
  return out
}

/**
 * Every AUTHORISED List in the seed locked (work item 6): a Booking whose
 * invoices were loaded by hand (the history backdrop) gets a `migrated` lock
 * frozen from those invoices; any other goes through `buildBookingLock`.
 * The seed's ledger pairs carry the same payee (the List's anaesthetist).
 */
export function seedLocks(state: AppState): Pick<AppState['billing'], 'locks'> {
  const locks: Record<BookingId, BookingLock> = {}
  for (const list of Object.values(state.schedule.lists)) {
    if (list.state !== 'AUTHORISED' || list.anaesthetistId === undefined) continue
    const anaesthetist = state.masters.anaesthetists[list.anaesthetistId]
    if (anaesthetist === undefined) continue
    const takenAtISO = list.billedAtISO ?? `${list.dateISO}T17:00:00`
    for (const booking of Object.values(state.schedule.bookings)) {
      if (booking.listId !== list.id || booking.cancellation !== undefined) continue
      const invoices = Object.values(state.billing.invoices).filter((i) => i.bookingId === booking.id && i.kind === 'standard')
      const live = isHistoryList(list.id) ? undefined : takeLockFor(state, booking, SEED_LOCK_TAKER, takenAtISO)
      // The history backdrop's invoices were loaded by hand (stored totals): migrated from them.
      let lock: BookingLock | undefined = live
      if (isHistoryList(list.id) && invoices.length > 0) {
        const amounts = invoicedAmounts(invoices, state)
        const ctx = invoiceBuildContextFor(state, booking)
        const held: Record<ProcedureId, HeldPrices> = {}
        for (const [pid, amount] of Object.entries(amounts)) held[pid] = { ...(ctx?.held?.[pid] ?? {}), authorised: amount }
        const displayFrom =
          ctx !== undefined
            ? buildBookingLock({ booking, procedures: proceduresForBooking(state, booking.id), ctx: { ...ctx, held }, takenAtISO, takenBy: SEED_LOCK_TAKER, partyName: (ref) => counterpartyName(state, ref, booking.id) })
            : undefined
        lock = migratedLockFromInvoices({
          bookingId: booking.id,
          listId: list.id,
          pricingDateISO: list.dateISO,
          takenAtISO,
          payee: { anaesthetistId: anaesthetist.registrationNumber, name: anaesthetist.name, supplier: supplierFor(anaesthetist) },
          patient: { name: state.masters.patients[booking.patientId]?.name ?? '' },
          invoices,
          lines: Object.values(state.billing.invoiceLines),
          ...(displayFrom !== undefined ? { displayFrom } : {}),
        })
      }
      if (lock === undefined) continue
      locks[booking.id] = lock
    }
  }
  return { locks }
}

/** The history backdrop's Lists (`seed/history.ts`). */
function isHistoryList(listId: string): boolean {
  return listId.startsWith('L-HIST')
}
